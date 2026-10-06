import {
  pickOtpCooldownSeconds,
  pickOtpCode,
  isPhoneVerifiedPayload,
  resolveOtpResendResult,
} from './otpCooldown';

describe('OTP resend handling', () => {
  it('treats resend success as a new OTP with a 2 minute timer', () => {
    const result = resolveOtpResendResult({
      status: 200,
      success: 200,
      message: 'OTP resent to your email.',
      resend_after_seconds: 118.4,
      expires_in_seconds: 118.4,
    });

    expect(result.sent).toBe(true);
    expect(result.cooldown).toBe(true);
    expect(result.seconds).toBe(119);
    expect(result.message).toBe('OTP resent to your email.');
  });

  it('syncs the remaining 2 minute window when OTP is still active', () => {
    const result = resolveOtpResendResult({
      status: 200,
      success: false,
      message:
        'OTP has already been sent to your email. You can request a new OTP after 1 minute (s) 10 second(s).',
      otp_active: true,
      expires_in_seconds: 70.2,
      expires_in_minutes: 2,
    });

    expect(result.sent).toBe(false);
    expect(result.cooldown).toBe(true);
    expect(result.seconds).toBe(71);
    expect(result.message).toContain('already been sent');
  });

  it('locks resend for 2 minutes when backend says OTP is already sent', () => {
    const result = resolveOtpResendResult({
      status: 200,
      success: false,
      message:
        'OTP has already been sent to your email. You can request a new OTP after 2 minute(s) 0 second(s).',
      otp_active: true,
      expires_in_seconds: 120,
    });

    expect(result.sent).toBe(false);
    expect(result.cooldown).toBe(true);
    expect(result.seconds).toBe(120);
  });

  it('treats please-wait responses as cooldown, not a successful resend', () => {
    const result = resolveOtpResendResult({
      status: 200,
      success: false,
      message: 'Please wait before requesting a new OTP',
    });

    expect(result.sent).toBe(false);
    expect(result.cooldown).toBe(true);
    expect(result.seconds).toBe(120);
  });

  it('does not treat wait-until-expired as a successful resend', () => {
    const result = resolveOtpResendResult({
      status: 200,
      message: 'Please wait until the current OTP is expired',
    });

    expect(result.sent).toBe(false);
    expect(result.message).toBe(
      'Please wait until the current OTP is expired',
    );
  });

  it('treats boolean success true as a new OTP', () => {
    const result = resolveOtpResendResult({
      status: 200,
      success: true,
      message: 'OTP resent to your email.',
      resend_after_seconds: 120,
      expires_in_seconds: 120,
    });

    expect(result.sent).toBe(true);
    expect(result.seconds).toBe(120);
  });

  it('treats forgot-resend-otp success as a new 2 minute OTP', () => {
    const result = resolveOtpResendResult({
      status: 200,
      success: true,
      message: 'OTP resend successfully.',
      resend_after_seconds: 120,
    });

    expect(result.sent).toBe(true);
    expect(result.cooldown).toBe(true);
    expect(result.seconds).toBe(120);
    expect(result.message).toBe('OTP resend successfully.');
  });

  it('syncs remaining seconds when forgot-password says OTP is already sent', () => {
    const result = resolveOtpResendResult({
      status: 200,
      success: false,
      message:
        'OTP has already been sent to your email. You can request a new OTP after 14 second(s).',
      otp_active: true,
      expires_in_minutes: 1,
      expires_in_seconds: 14,
      can_request_new_otp_at: '2026-09-02T15:30:43+00:00',
    });

    expect(result.sent).toBe(false);
    expect(result.cooldown).toBe(true);
    expect(result.seconds).toBe(14);
  });

  it('caps backend cooldown values at 2 minutes', () => {
    expect(
      pickOtpCooldownSeconds({
        resend_after_seconds: 298.318188,
      }),
    ).toBe(120);
  });
});

describe('phone OTP response helpers', () => {
  it('reads a 6-digit otp from send/resend payloads', () => {
    expect(pickOtpCode({ success: 200, otp: 482913 })).toBe('482913');
    expect(
      pickOtpCode({
        success: true,
        data: { otp_code: '104455' },
      }),
    ).toBe('104455');
    expect(
      pickOtpCode({
        message: 'Your verification code is 778899',
      }),
    ).toBe('778899');
  });

  it('detects verify-phone/status as verified', () => {
    expect(
      isPhoneVerifiedPayload({
        success: true,
        phone_verified: true,
      }),
    ).toBe(true);
    expect(
      isPhoneVerifiedPayload({
        success: 200,
        data: { phone_verified: 1 },
      }),
    ).toBe(true);
    expect(isPhoneVerifiedPayload({ success: true, is_verified: true })).toBe(
      false,
    );
  });
});
