import { AxiosError, AxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import {
  toProfileUpdateFormData,
  toSetupPhotosFormData,
  type FormValue,
  type UploadFile,
} from './formData';
import type { ProfileApiData, PhotoVisibilityResponse, CompleteProfileResponse } from './mappers/profileMapper';
import { mapCompleteProfile } from './mappers/profileMapper';
import { isApiSuccess } from './types';
import type {
  BestMatchResponse,
  HomeMatchesResponse,
  MatchListResponse,
  MatchProfileResponse,
  MatchSearchParams,
} from './mappers/matchMapper';
import {
  type PhotoAccessAction,
  type PhotoAccessRequestsResponse,
  type PhotoAccessRespondResponse,
  type PhotoAccessUserRequestResponse,
} from './mappers/photoAccessMapper';
import type { PhotoGalleryResponse } from './mappers/photoGalleryMapper';
import type {
  ReferralHistoryResponse,
  ReferralLinkResponse,
  ReferralRedeemResponse,
  ReferralRewardsResponse,
  ReferralStatsResponse,
} from './mappers/referralMapper';
import {
  unwrapNotificationAction,
  type NotificationReadResponse,
  type NotificationsClearAllResponse,
  type NotificationsReadAllResponse,
  type NotificationsResponse,
} from './mappers/notificationMapper';
import type { CountriesResponse } from './mappers/countryMapper';
import type { SubscriptionsResponse } from './mappers/subscriptionMapper';
import type { ShortlistInterestResponse, ShortlistResponse, ShortlistTab } from './mappers/shortlistMapper';

type ProfileResponse = {
  success?: boolean;
  data?: ProfileApiData;
  message?: string;
};

type MessageResponse = {
  success?: boolean;
  message?: string;
};

const isMethodNotAllowed = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const message = String(
    (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      '',
  ).toLowerCase();

  return error.response?.status === 405 || message.includes('method not allowed');
};

const isMissingEndpoint = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const message = String(
    (error.response?.data as { message?: string } | undefined)?.message ??
      '',
  ).toLowerCase();

  return (
    error.response?.status === 404 || message.includes('endpoint not found')
  );
};

type UpdateProfileResponse = MessageResponse & {
  user?: ProfileApiData;
};

type AccountStatusResponse = {
  success?: number | boolean;
  message?: string;
  status?: number | 'active' | 'inactive';
  account_status?: 'active' | 'inactive';
  is_deactivated?: boolean;
  can_activate?: boolean;
  can_deactivate?: boolean;
  user?: ProfileApiData;
};

const isAccountStatusValue = (
  value?: AccountStatusResponse['status'] | AccountStatusResponse['account_status'],
): value is 'active' | 'inactive' =>
  value === 'active' || value === 'inactive';

const resolveUpdatedAccountStatus = (
  data: AccountStatusResponse,
  action: 'deactivate' | 'activate',
): 'active' | 'inactive' => {
  if (isAccountStatusValue(data.account_status)) {
    return data.account_status;
  }

  if (isAccountStatusValue(data.status)) {
    return data.status;
  }

  if (data.is_deactivated === true) {
    return 'inactive';
  }

  if (data.is_deactivated === false) {
    return 'active';
  }

  return action === 'deactivate' ? 'inactive' : 'active';
};

const isAccountUpdateSuccess = (
  httpStatus: number,
  data: AccountStatusResponse,
) =>
  httpStatus === 200 ||
  httpStatus === 201 ||
  data.success === true ||
  data.success == 200;

type VerifyPhoneResponse = MessageResponse & {
  user?: ProfileApiData;
};

export type ProfileFaithPayload = {
  religion: string;
  community?: string;
  sect?: string;
  mother_tongue: string;
  other_languages?: string[];
};

export const Api = {
  getCountries: () => apiClient.get<CountriesResponse>(ENDPOINTS.COUNTRIES),

  getProfile: (config?: AxiosRequestConfig & { skipTokenClear?: boolean }) =>
    apiClient.get<ProfileResponse>(ENDPOINTS.PROFILE, config),

  updateProfileCountry: async (payload: Record<string, FormValue>) => {
    const { status, data } = await apiClient.postForm<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_COUNTRY,
      payload,
    );

    return { status, ...data };
  },

  updateProfileBasicInfo: async (payload: Record<string, FormValue>) => {
    const { status, data } = await apiClient.postForm<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_BASIC_INFO,
      payload,
    );

    return { status, ...data };
  },

  updateProfileEducation: async (payload: Record<string, FormValue>) => {
    const { status, data } = await apiClient.postForm<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_EDUCATION,
      payload,
    );

    return { status, ...data };
  },

  updateProfileCareer: async (payload: Record<string, FormValue>) => {
    const { status, data } = await apiClient.postForm<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_CAREER,
      payload,
    );

    return { status, ...data };
  },

  updateProfilePhysical: async (payload: Record<string, FormValue>) => {
    const { status, data } = await apiClient.postForm<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_PHYSICAL,
      payload,
    );

    return { status, ...data };
  },

  updateProfileFaith: async (payload: ProfileFaithPayload) => {
    const { status, data } = await apiClient.postJson<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_FAITH,
      payload,
    );

    return { status, ...data };
  },

  uploadProfilePhotos: async (photos: UploadFile[], mainIndex = 0) => {
    const formData = await toSetupPhotosFormData(photos, mainIndex);
    const { status, data } = await apiClient.postFormData<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_PHOTOS,
      formData,
    );

    return { status, ...data };
  },

  completeProfile: async () => {
    let status = 0;
    let data: CompleteProfileResponse = {};

    try {
      const res = await apiClient.postEmpty<CompleteProfileResponse>(
        ENDPOINTS.PROFILE_COMPLETE,
      );
      status = res.status;
      data = res.data ?? {};
    } catch (error) {
      if (!isMethodNotAllowed(error) && !isMissingEndpoint(error)) {
        throw error;
      }

      const res = await apiClient.postForm<CompleteProfileResponse>(
        ENDPOINTS.PROFILE_COMPLETE,
        {},
      );
      status = res.status;
      data = res.data ?? {};
    }

    const mapped = mapCompleteProfile(data);

    return {
      ...data,
      ...mapped,
      status,
      accountStatus: mapped.status,
      isSuccess: isApiSuccess(status, data.success),
    };
  },

  deleteProfilePhoto: async (photo: {
    index?: number | null;
    path?: string | null;
    url?: string | null;
    remaining?: Array<{
      index: number | null;
      path: string | null;
      url: string;
      isMain: boolean;
    }>;
  }) => {
    if (photo.index == null && !photo.path && !photo.url) {
      throw new Error('Photo index is required');
    }

    const remaining = (photo.remaining ?? []).map(item => ({
      index: item.index,
      path: item.path,
      url: item.url,
      is_main: item.isMain,
    }));

    const payload: Record<string, FormValue> = {
      action: 'delete',
      keep_photos: JSON.stringify(remaining),
    };

    if (photo.index != null && Number.isFinite(photo.index)) {
      payload.index = photo.index;
    }

    if (photo.path) {
      payload.path = photo.path;
    }

    const remainingIndexes = remaining
      .map(item => item.index)
      .filter((index): index is number => index != null)
      .map(String);

    if (remainingIndexes.length) {
      payload.indexes = remainingIndexes;
    }

    const { status, data } = await apiClient.postForm<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_PHOTOS,
      payload,
    );

    return { status, ...data };
  },

  updatePhotoVisibility: async (payload: {
    profile_photo_visible: boolean;
    additional_photos_visible: boolean;
  }) => {
    const { status, data } = await apiClient.postForm<PhotoVisibilityResponse>(
      ENDPOINTS.PROFILE_PHOTO_VISIBILITY,
      {
        profile_photo_visible: payload.profile_photo_visible ? '1' : '0',
        additional_photos_visible: payload.additional_photos_visible ? '1' : '0',
        profile_photo_hidden: payload.profile_photo_visible ? '0' : '1',
        additional_photos_hidden: payload.additional_photos_visible ? '0' : '1',
        hide_profile_photo: payload.profile_photo_visible ? '0' : '1',
        hide_additional_photos: payload.additional_photos_visible ? '0' : '1',
      },
    );

    return { status, ...data };
  },

  sendVerifyPhone: async (payload: Record<string, FormValue>) => {
    const { status, data } = await apiClient.postForm<VerifyPhoneResponse>(
      ENDPOINTS.VERIFY_PHONE_SEND,
      payload,
    );

    return { status, ...data };
  },

  verifyPhone: async (payload: Record<string, FormValue>) => {
    const { status, data } = await apiClient.postForm<VerifyPhoneResponse>(
      ENDPOINTS.VERIFY_PHONE_VERIFY,
      payload,
    );

    return { status, ...data };
  },

  updateProfile: async (
    payload: Record<string, FormValue>,
    photo?: UploadFile | UploadFile[] | null,
    additionalPhotos?: UploadFile | UploadFile[] | null,
  ) => {
    const formData = await toProfileUpdateFormData(
      payload,
      photo,
      additionalPhotos,
    );

    const { status, data } = await apiClient.postFormData<UpdateProfileResponse>(
      ENDPOINTS.PROFILE_UPDATE,
      formData,
    );

    return { status, ...data };
  },

  getShortlist: (tab: ShortlistTab) =>
    apiClient.get<ShortlistResponse>(ENDPOINTS.SHORTLIST, {
      params: { tab },
    }),

  sendShortlistInterest: async (profileId: string) => {
    const { status, data } = await apiClient.postEmpty<ShortlistInterestResponse>(
      `${ENDPOINTS.SHORTLIST}/${profileId}/interest`,
    );

    return { status, ...data };
  },

  getReferralStats: () =>
    apiClient.get<ReferralStatsResponse>(ENDPOINTS.REFERRALS_STATS),

  getReferralHistory: () =>
    apiClient.get<ReferralHistoryResponse>(ENDPOINTS.REFERRALS_HISTORY),

  getReferralLink: () =>
    apiClient.get<ReferralLinkResponse>(ENDPOINTS.REFERRALS_LINK),

  getReferralRewards: () =>
    apiClient.get<ReferralRewardsResponse>(ENDPOINTS.REFERRALS_REWARDS),

  redeemReferralReward: (rewardType: string) =>
    apiClient.postForm<ReferralRedeemResponse>(ENDPOINTS.REFERRALS_REDEEM, {
      reward_type: rewardType,
    }),

  getPhotoAccessRequests: async (type?: 'incoming' | 'outgoing') => {
    return apiClient.get<PhotoAccessRequestsResponse>(
      ENDPOINTS.PHOTO_ACCESS_REQUESTS,
      type ? { params: { type } } : undefined,
    );
  },

  requestPhotoAccess: async (userId: string) => {
    const targetUserId = String(userId ?? '').trim();

    return apiClient.postForm<PhotoAccessUserRequestResponse>(
      ENDPOINTS.photoAccessUserRequest(targetUserId),
      {
        user_id: targetUserId,
      },
    );
  },

  respondToPhotoAccessRequest: async (
    requestId: string,
    action: PhotoAccessAction,
  ) => {
    const photoAccessRequestId = String(requestId ?? '').trim();
    const approved = action === 'approve';

    return apiClient.postForm<PhotoAccessRespondResponse>(
      ENDPOINTS.photoAccessRespond(photoAccessRequestId),
      {
        action: approved ? 'approve' : 'reject',
        status: approved ? 'approved' : 'rejected',
      },
    );
  },

  getProfilePhotoGallery: (userId: string) =>
    apiClient.get<PhotoGalleryResponse>(
      `${ENDPOINTS.PROFILE}/${userId}/photo-gallery`,
    ),

  getNotifications: () =>
    apiClient.get<NotificationsResponse>(ENDPOINTS.NOTIFICATIONS),

  markNotificationRead: async (notificationId: string) => {
    const { status, data } = await apiClient.postEmpty<NotificationReadResponse>(
      `${ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`,
    );

    return unwrapNotificationAction(status, data);
  },

  markAllNotificationsRead: async () => {
    const { status, data } = await apiClient.postEmpty<NotificationsReadAllResponse>(
      ENDPOINTS.NOTIFICATIONS_READ_ALL,
    );

    return unwrapNotificationAction(status, data);
  },

  clearAllNotifications: async () => {
    try {
      const { status, data } = await apiClient.delete<NotificationsClearAllResponse>(
        ENDPOINTS.NOTIFICATIONS_CLEAR_ALL,
      );

      return unwrapNotificationAction(status, data);
    } catch (error) {
      if (!isMethodNotAllowed(error)) {
        throw error;
      }

      const { status, data } = await apiClient.postEmpty<NotificationsClearAllResponse>(
        ENDPOINTS.NOTIFICATIONS_CLEAR_ALL,
      );

      return unwrapNotificationAction(status, data);
    }
  },

  getHomeMatches: () =>
    apiClient.get<HomeMatchesResponse>(ENDPOINTS.MATCHES_HOME),

  getBestMatch: () =>
    apiClient.get<BestMatchResponse>(ENDPOINTS.MATCHES_BEST),

  getMatchSearch: (params?: MatchSearchParams) =>
    apiClient.get<MatchListResponse>(ENDPOINTS.MATCHES_SEARCH, { params }),

  getMatchProfile: (profileId: string) =>
    apiClient.get<MatchProfileResponse>(`${ENDPOINTS.MATCHES}/${profileId}`),

  getSubscriptions: () =>
    apiClient.get<SubscriptionsResponse>(ENDPOINTS.SUBSCRIPTIONS),

  updateAccountStatus: async (
    action: 'deactivate' | 'activate',
    credentials?: { email: string; password: string },
  ) => {
    const payload: Record<string, string> = { action };

    if (credentials?.email) {
      payload.email = credentials.email.trim();
    }

    if (credentials?.password) {
      payload.password = credentials.password;
    }

    const { status, data } = await apiClient.postForm<AccountStatusResponse>(
      ENDPOINTS.ACCOUNT_DEACTIVATE,
      payload,
    );

    const accountStatus = resolveUpdatedAccountStatus(data, action);

    return {
      ...data,
      status,
      success: data.success,
      message: data.message,
      account_status: accountStatus,
      accountStatus,
      is_deactivated: accountStatus === 'inactive',
      isSuccess: isAccountUpdateSuccess(status, data),
    };
  },

  deleteAccount: async () => {
    const { status, data } = await apiClient.postEmpty<MessageResponse>(
      ENDPOINTS.ACCOUNT_DELETE,
    );

    return { status, ...data };
  },
};