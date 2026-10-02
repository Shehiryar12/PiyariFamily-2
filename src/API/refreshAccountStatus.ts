import { Api } from './Api';
import { AxiosError } from 'axios';
import { parseVisibilityFlag } from './mappers/profileMapper';
import { persistor, setAccountStatus, store } from '../Redux';
import type { AccountStatus } from './accountStorage';

export type AccountRefreshResult = AccountStatus | 'unauthenticated' | null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const HTTP_STATUS_CODES = new Set([200, 201, 204]);

const statusFromValue = (value: unknown): AccountStatus | null => {
  if (value === true || value === 1) {
    return 'active';
  }

  if (value === false || value === 0) {
    return 'inactive';
  }

  if (typeof value === 'number') {
    if (HTTP_STATUS_CODES.has(value) || value > 1) {
      return null;
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === 'active' ||
      normalized === 'activated' ||
      normalized === '1' ||
      normalized === 'true' ||
      normalized === 'yes'
    ) {
      return 'active';
    }

    if (
      normalized === 'inactive' ||
      normalized === 'deactivated' ||
      normalized === '0' ||
      normalized === 'false' ||
      normalized === 'no' ||
      normalized === 'disabled'
    ) {
      return 'inactive';
    }
  }

  return null;
};

const collectRecords = (raw?: unknown): Array<Record<string, unknown>> => {
  const root = asRecord(raw);
  const data = asRecord(root?.data);
  const user = asRecord(data?.user) ?? asRecord(root?.user);

  return [user, data, root].filter(Boolean) as Array<Record<string, unknown>>;
};

export const pickRemoteAccountStatus = (raw?: unknown): AccountStatus | null => {
  const sources = collectRecords(raw);

  for (const source of sources) {
    const deactivated = parseVisibilityFlag(
      source.is_deactivated ?? source.deactivated ?? source.isDeactivated,
    );
    if (deactivated === true) {
      return 'inactive';
    }
    if (deactivated === false) {
      return 'active';
    }
  }

  for (const source of sources) {
    const fromAccount = statusFromValue(
      source.account_status ?? source.accountStatus,
    );
    if (fromAccount) {
      return fromAccount;
    }
  }

  for (const source of sources) {
    if (source.status === 200 || source.status === 201) {
      continue;
    }

    const fromStatus = statusFromValue(source.status);
    if (fromStatus) {
      return fromStatus;
    }
  }

  return null;
};

export const refreshAccountStatus = async (): Promise<AccountRefreshResult> => {
  try {
    const res = await Api.getProfile();
    if (res?.status != 200) {
      return store.getState().profile.accountStatus;
    }

    const status = pickRemoteAccountStatus(res.data);
    if (!status) {
      return store.getState().profile.accountStatus;
    }

    store.dispatch(setAccountStatus(status));
    await persistor.flush();

    return status;
  } catch (error) {
    const httpStatus =
      error instanceof AxiosError ? error.response?.status : undefined;
    const message = String(
      (error instanceof AxiosError && error.response?.data
        ? (error.response.data as { message?: string }).message
        : '') ?? '',
    ).toLowerCase();

    if (httpStatus === 401 || message.includes('unauthenticated')) {
      return 'unauthenticated';
    }

    return store.getState().profile.accountStatus;
  }
};
