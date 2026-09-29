import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';
import { ENDPOINTS } from './endpoints';
import { toFormData, type FormValue } from './formData';
import { isOtpCooldownError } from './otpCooldown';
import { tokenStorage } from './tokenStorage';
import type { ApiErrorResponse, ApiResult } from './types';

const PUBLIC_AUTH_PATHS = [
  ENDPOINTS.AUTH.LOGIN,
  ENDPOINTS.AUTH.REGISTER,
  ENDPOINTS.AUTH.VERIFY_EMAIL_OTP,
  ENDPOINTS.AUTH.RESEND_EMAIL_OTP,
  ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.FORGOT_RESEND_OTP,
  ENDPOINTS.AUTH.VERIFY_RESET_OTP,
  ENDPOINTS.AUTH.SET_NEW_PASSWORD,
];

const OTP_COOLDOWN_PATHS = [
  ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.FORGOT_RESEND_OTP,
  ENDPOINTS.AUTH.RESEND_EMAIL_OTP,
  ENDPOINTS.VERIFY_PHONE_SEND,
];

const isOtpCooldownRequest = (url?: string) => {
  if (!url) {
    return false;
  }

  const path = url.split('?')[0];
  return OTP_COOLDOWN_PATHS.some(
    endpoint => path === endpoint || path.endsWith(endpoint),
  );
};

const isPublicAuthRequest = (url?: string) => {
  if (!url) {
    return false;
  }

  const path = url.split('?')[0];
  return PUBLIC_AUTH_PATHS.some(
    endpoint => path === endpoint || path.endsWith(endpoint),
  );
};

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(config => {
  if (isPublicAuthRequest(config.url)) {
    if (config.headers) {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }
    return config;
  }

  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const logReduxOnApiError = () => {
  try {
    const reduxStore = require('../Redux/store').store as {
      getState: () => {
        auth?: {
          user?: unknown;
          accessToken?: string | null;
        };
        profile?: {
          profile?: unknown;
          accountStatus?: unknown;
        };
        home?: {
          greeting?: unknown;
          featuredMatches?: Array<{ id?: string }>;
          suggestedMatches?: Array<{ id?: string }>;
        };
      };
    };
    const state = reduxStore.getState();

    console.log('Redux:', {
      auth: {
        user: state.auth?.user ?? null,
        isAuthenticated: Boolean(state.auth?.accessToken),
      },
      profile: state.profile?.profile ?? null,
      accountStatus: state.profile?.accountStatus ?? null,
      home: {
        greeting: state.home?.greeting ?? null,
        featuredIds: (state.home?.featuredMatches ?? []).map(item => item.id),
        suggestedIds: (state.home?.suggestedMatches ?? []).map(item => item.id),
      },
    });
  } catch {
    console.log('Redux: unavailable');
  }
};

axiosInstance.interceptors.response.use(
  response => {
    console.log('API Success:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      params: response.config.params ?? null,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (
      error.response?.status === 429 &&
      isOtpCooldownRequest(error.config?.url) &&
      isOtpCooldownError(error)
    ) {
      return {
        ...error.response,
        config: error.config,
        data: error.response.data,
        status: 429,
      };
    }

    console.log('API Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data ?? error.message,
    });
    logReduxOnApiError();

    return Promise.reject(error);
  },
);

export const apiClient = {
  postForm: <T>(
    url: string,
    data: Record<string, FormValue>,
    config?: AxiosRequestConfig,
  ): Promise<ApiResult<T>> =>
    axiosInstance
      .post<T>(url, toFormData(data), config)
      .then(response => ({
        status: response.status,
        data: response.data,
      })),

  postEmpty: <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResult<T>> =>
    axiosInstance.post<T>(url, undefined, config).then(response => ({
      status: response.status,
      data: response.data,
    })),

  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> =>
    axiosInstance.get<T>(url, config)      .then(response => ({
        status: response.status,
        data: response.data,
      })),

  postFormData: <T>(url: string, formData: FormData): Promise<ApiResult<T>> =>
    axiosInstance
      .post<T>(url, formData, {
        method: 'post',
        headers: {
          Accept: 'application/json',
        },
        transformRequest: [
          (data, headers) => {
            if (headers && typeof headers.setContentType === 'function') {
              headers.setContentType(false);
            } else if (headers && typeof headers.delete === 'function') {
              headers.delete('Content-Type');
              headers.delete('content-type');
            }
            return data;
          },
        ],
      })
      .then(response => ({
        status: response.status,
        data: response.data,
      })),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> =>
    axiosInstance.delete<T>(url, config).then(response => ({
      status: response.status,
      data: response.data,
    })),

  postJson: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResult<T>> =>
    axiosInstance
      .post<T>(url, data, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers,
        },
      })
      .then(response => ({
        status: response.status,
        data: response.data,
      })),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<T>(url, data, config).then(response => response.data),
};

export { axiosInstance };
