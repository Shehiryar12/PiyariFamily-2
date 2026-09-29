export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_verified?: boolean;
  token?: string;
};

export type AuthResponse = {
  success?: boolean | number;
  message: string;
  user?: User;
  token?: string;
  access_token?: string;
  accessToken?: string;
  account_status?: 'active' | 'inactive';
  is_deactivated?: boolean;
  requires_verification?: boolean;
  email?: string;
  data?: {
    name?: string;
    email?: string;
    phone?: string;
    user?: User;
    token?: string;
    access_token?: string;
    accessToken?: string;
  };
  resend_after_seconds?: number;
};

export type ApiResult<T> = {
  status: number;
  data: T;
};

export const isSuccessStatus = (status: number) =>
  status === 200 || status === 201 || status === 204;

export const isApiSuccess = (
  httpStatus?: number,
  success?: boolean | number | null,
) =>
  isSuccessStatus(httpStatus ?? 0) ||
  success === true ||
  success == 200;

export type MessageResponse = {
  success: boolean;
  message: string;
};

export type OtpActionResponse = MessageResponse & {
  resend_after_seconds?: number;
  resend_after?: string;
  otp_active?: boolean;
  can_request_new_otp_at?: string;
  expires_in_minutes?: number;
  expires_in_seconds?: number;
  expires_in?: string;
};

export type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  otp_active?: boolean;
  can_request_new_otp_at?: string;
  expires_in_minutes?: number;
  expires_in_seconds?: number;
  resend_after_seconds?: number;
};
