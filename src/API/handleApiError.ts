import { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (data?.message) {
      return data.message;
    }

    if (data?.errors) {
      const firstError = Object.values(data.errors)[0]?.[0];
      if (firstError) {
        return firstError;
      }
    }

    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    if (error.message === 'Network Error' && !error.response) {
      return 'Could not complete the request. Please try again.';
    }
  }

  return fallback;
};
