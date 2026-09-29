import { apiClient } from '../apiClient';
import { ENDPOINTS } from '../endpoints';
import { clearSession } from '../../Redux/clearSession';
import {
  store,
  persistor,
  setAuthSession,
  clearProfile,
  setLastAccount,
} from '../../Redux';
import { accountStorage } from '../accountStorage';
import { pendingReferralStorage } from '../pendingReferralStorage';
import { normalizeReferralLink } from '../mappers/referralMapper';
import { saveProfileCache } from '../mappers/profileMapper';
import { pickPersonName } from '../../Functions/welcomeGreeting';
import {
  isApiSuccess,
  type AuthResponse,
  type MessageResponse,
  type OtpActionResponse,
} from '../types';

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignUpPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  referral_link?: string;
};

export type VerifyEmailOtpPayload = {
  email: string;
  otp: string;
};

const normalizeEmail = (email: string) => email.trim();

export type EmailPayload = {
  email: string;
  resend?: boolean;
};

export type VerifyResetOtpPayload = {
  email: string;
  otp: string;
};

export type SetNewPasswordPayload = {
  email: string;
  password: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  password: string;
};

const postAuth = async <T>(
  endpoint: string,
  payload: Record<string, string | number>,
  config?: Parameters<typeof apiClient.postForm>[2] & { skipTokenClear?: boolean },
) => {
  const { status, data } = await apiClient.postForm<T>(endpoint, payload, config);
  return { status, ...data };
};

const resolveAccountStatus = (
  response: Pick<AuthResponse, 'account_status' | 'is_deactivated'>,
) => {
  if (response.account_status === 'inactive' || response.is_deactivated) {
    return 'inactive' as const;
  }

  if (response.account_status === 'active') {
    return 'active' as const;
  }

  return 'active' as const;
};

const firstToken = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

export const pickAuthToken = (response?: AuthResponse | null) =>
  firstToken(
    response?.token,
    response?.access_token,
    response?.accessToken,
    response?.data?.token,
    response?.data?.access_token,
    response?.data?.accessToken,
    response?.user?.token,
    response?.data?.user?.token,
  );

const pickAuthUser = (response?: AuthResponse | null) =>
  response?.user || response?.data?.user || null;

const saveAuthSession = (response: AuthResponse) => {
  const token = pickAuthToken(response);
  const user = pickAuthUser(response);
  const existingUser = store.getState().auth.user;

  store.dispatch(
    setAuthSession({
      ...(user
        ? {
            user: {
              ...user,
              name:
                pickPersonName(
                  user.name,
                  existingUser?.name,
                  store.getState().profile.profile?.name,
                ) || '',
            },
          }
        : {}),
      ...(token ? { accessToken: token } : {}),
    }),
  );

  if (user) {
    const resolvedName = pickPersonName(
      user.name,
      existingUser?.name,
      store.getState().profile.profile?.name,
    );
    saveProfileCache({ ...user, ...(resolvedName ? { name: resolvedName } : {}) });
    store.dispatch(
      setLastAccount({
        name: resolvedName,
        email: user.email,
      }),
    );
  }

  accountStorage.setStatus(resolveAccountStatus(response));
  void persistor.flush();
};

const shouldSaveAuthSession = (response: AuthResponse) =>
  Boolean(pickAuthToken(response));

export const authService = {
  login: async (payload: LoginPayload) => {
    try {
      const response = await postAuth<AuthResponse>(
        ENDPOINTS.AUTH.LOGIN,
        {
          ...payload,
          email: normalizeEmail(payload.email),
        },
        { skipTokenClear: true },
      );

      if (shouldSaveAuthSession(response)) {
        saveAuthSession(response);
      }

      return response;
    } catch (error) {
      const errorData = (error as { response?: { data?: AuthResponse } })?.response
        ?.data;

      if (errorData && shouldSaveAuthSession(errorData)) {
        saveAuthSession(errorData);
      }

      throw error;
    }
  },

  register: async (payload: SignUpPayload) => {
    store.dispatch(clearProfile());

    const { referral_link: payloadReferralLink, ...rest } = payload;
    const referralLink =
      normalizeReferralLink(payloadReferralLink) ||
      (await pendingReferralStorage.get());

    console.log(
      '[Referral] POST /register referral_link',
      JSON.stringify({ referral_link: referralLink || null }, null, 2),
    );

    const response = await postAuth<AuthResponse>(ENDPOINTS.AUTH.REGISTER, {
      ...rest,
      email: normalizeEmail(payload.email),
      ...(referralLink ? { referral_link: referralLink } : {}),
    });

    console.log(
      '[Referral] POST /register response',
      JSON.stringify(
        {
          status: response.status,
          success: response.success,
          message: response.message,
          data: response.data,
        },
        null,
        2,
      ),
    );

    if (isApiSuccess(response.status, response.success)) {
      await pendingReferralStorage.clear();
    }

    return response;
  },

  verifyEmailOtp: async (payload: VerifyEmailOtpPayload) => {
    const otp = String(payload.otp).replace(/\D/g, '');
    const response = await postAuth<AuthResponse>(
      ENDPOINTS.AUTH.VERIFY_EMAIL_OTP,
      {
        email: normalizeEmail(payload.email),
        otp,
      },
    );

    if (shouldSaveAuthSession(response)) {
      saveAuthSession(response);
    }

    return response;
  },

  resendEmailOtp: (payload: EmailPayload) =>
    postAuth<OtpActionResponse>(ENDPOINTS.AUTH.RESEND_EMAIL_OTP, {
      email: normalizeEmail(payload.email),
      ...(payload.resend ? { resend: 1 } : {}),
    }),

  forgotPassword: (payload: EmailPayload & { resend?: boolean }) =>
    postAuth<OtpActionResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email: normalizeEmail(payload.email),
      ...(payload.resend ? { resend: 1 } : {}),
    }),

  forgotResendOtp: (payload: EmailPayload) =>
    postAuth<OtpActionResponse>(ENDPOINTS.AUTH.FORGOT_RESEND_OTP, {
      email: normalizeEmail(payload.email),
    }),

  verifyResetOtp: (payload: VerifyResetOtpPayload) =>
    postAuth<MessageResponse>(ENDPOINTS.AUTH.VERIFY_RESET_OTP, {
      ...payload,
      email: normalizeEmail(payload.email),
    }),

  setNewPassword: (payload: SetNewPasswordPayload) =>
    postAuth<MessageResponse>(ENDPOINTS.AUTH.SET_NEW_PASSWORD, {
      ...payload,
      email: normalizeEmail(payload.email),
    }),

  changePassword: (payload: ChangePasswordPayload) =>
    postAuth<MessageResponse>(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload),

  logout: async () => {
    try {
      const { status, data } = await apiClient.postEmpty<MessageResponse>(
        ENDPOINTS.AUTH.LOGOUT,
      );

      return { status, ...data };
    } catch (error) {
      return {
        status: 200,
        message: 'Logged out successfully',
        success: true,
      };
    } finally {
      clearSession();
    }
  },
};
