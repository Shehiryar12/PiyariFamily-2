import { AxiosError } from 'axios';
import { isSuccessStatus } from './types';

export const OTP_RESEND_COOLDOWN_SECONDS = 120;

type OtpPayload = {
  success?: boolean | number;
  message?: string;
  otp_active?: boolean;
  can_request_new_otp_at?: string;
  expires_in_seconds?: number | string;
  expires_in_minutes?: number | string;
  expires_in?: string;
  resend_after_seconds?: number | string;
  resend_after?: string;
};

const toPositiveSeconds = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.ceil(parsed);
};

const parseClockToSeconds = (value: unknown) => {
  if (typeof value !== 'string') {
    return 0;
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return 0;
  }

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0;
  }

  return minutes * 60 + seconds;
};

export const capOtpCooldownSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }

  return Math.min(Math.ceil(seconds), OTP_RESEND_COOLDOWN_SECONDS);
};

export const getHttpStatus = (source: unknown) => {
  if (source instanceof AxiosError) {
    return source.response?.status;
  }

  return (
    (source as { response?: { status?: number }; status?: number })?.response
      ?.status ?? (source as { status?: number }).status
  );
};

export const getOtpPayload = (source: unknown): OtpPayload | null => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  if (source instanceof AxiosError) {
    return (source.response?.data as OtpPayload | undefined) ?? null;
  }

  const responseData = (source as { response?: { data?: OtpPayload } }).response
    ?.data;
  if (responseData) {
    return responseData;
  }

  return source as OtpPayload;
};

const isAlreadySentMessage = (message: string) => {
  const value = message.toLowerCase();

  return (
    value.includes('already been sent') ||
    value.includes('already sent') ||
    value.includes('otp is still') ||
    value.includes('otp still active') ||
    value.includes('request a new otp') ||
    value.includes('requesting a new otp') ||
    value.includes('try again after') ||
    value.includes('wait until') ||
    value.includes('wait before') ||
    value.includes('please wait') ||
    value.includes('current otp') ||
    value.includes('until the current otp')
  );
};

export const pickOtpCooldownSeconds = (
  source: unknown,
  fallback = OTP_RESEND_COOLDOWN_SECONDS,
) => {
  const data = getOtpPayload(source);

  const fromResendAfter =
    toPositiveSeconds(data?.resend_after_seconds) ||
    parseClockToSeconds(data?.resend_after);
  if (fromResendAfter) {
    return capOtpCooldownSeconds(fromResendAfter);
  }

  const fromExpires =
    toPositiveSeconds(data?.expires_in_seconds) ||
    parseClockToSeconds(data?.expires_in);
  if (fromExpires) {
    return capOtpCooldownSeconds(fromExpires);
  }

  if (data?.can_request_new_otp_at) {
    const remaining = Math.ceil(
      (new Date(data.can_request_new_otp_at).getTime() - Date.now()) / 1000,
    );
    if (remaining > 0) {
      return capOtpCooldownSeconds(remaining);
    }
  }

  return fallback;
};

export const isOtpCooldownError = (error: unknown) => {
  const data = getOtpPayload(error);
  const message = String(data?.message ?? '');

  if (isAlreadySentMessage(message)) {
    return true;
  }

  const success = data?.success;

  if (success === true || success == 200) {
    return false;
  }

  const status = getHttpStatus(error);

  return status === 429 || (data?.otp_active === true && success === false);
};

export const getOtpCooldownMessage = (source: unknown) => {
  const seconds = pickOtpCooldownSeconds(source);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes > 0 && remainder > 0) {
    return `Please wait ${minutes} min ${remainder} sec before requesting a new code.`;
  }

  if (minutes > 0) {
    return `Please wait ${minutes} min before requesting a new code.`;
  }

  return `Please wait ${seconds} sec before requesting a new code.`;
};

export type OtpResendResult = {
  sent: boolean;
  cooldown: boolean;
  seconds: number;
  message: string;
};

export const resolveOtpResendResult = (source: unknown): OtpResendResult => {
  const data = getOtpPayload(source);
  const status = getHttpStatus(source);
  const success = data?.success;
  const stillActive = isAlreadySentMessage(String(data?.message ?? ''));
  const sent =
    !stillActive &&
    success !== false &&
    (isSuccessStatus(status ?? 0) || success === true || success == 200);

  if (sent) {
    const seconds =
      capOtpCooldownSeconds(pickOtpCooldownSeconds(source)) ||
      OTP_RESEND_COOLDOWN_SECONDS;

    return {
      sent: true,
      cooldown: true,
      seconds,
      message: data?.message || 'OTP resent to your email.',
    };
  }

  if (isOtpCooldownError(source)) {
    const seconds =
      capOtpCooldownSeconds(pickOtpCooldownSeconds(source, 0)) ||
      (data?.otp_active || stillActive ? OTP_RESEND_COOLDOWN_SECONDS : 0);

    return {
      sent: false,
      cooldown: true,
      seconds,
      message: data?.message || '',
    };
  }

  return {
    sent: false,
    cooldown: false,
    seconds: 0,
    message: data?.message || 'Failed to send code. Please try again.',
  };
};
