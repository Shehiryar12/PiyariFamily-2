import type { OtherLanguage } from '../../Constant/ProfileSetup';
import { PROFILE_PHOTO_SLOTS } from '../../Constant/ProfileSetup';
import type { FormValue } from '../formData';
import { resolveMediaUrl } from '../mediaUrl';
import { profileStorage } from '../profileStorage';
import { userStorage } from '../userStorage';

export type ProfileApiData = {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string | null;
  gender?: string;
  bio?: string | null;
  about?: string;
  about_me?: string;
  city?: string | null;
  country?: string | null;
  country_id?: number | string | null;
  state?: string | null;
  height?: string | null;
  weight?: string | null;
  body_type?: string | null;
  complexion?: string | null;
  physical_disability?: boolean | number | string | null;
  mother_tongue?: string | null;
  other_languages?: string | string[] | null;
  marital_status?: string | null;
  community?: string | null;
  residential_status?: string | null;
  residence_status?: string | null;
  siblings?: string | null;
  family_information?: string | null;
  family_info?: string | null;
  age?: number | null;
  is_verified?: boolean;
  phone_verified?: boolean;
  location?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  profile_photo?: string | null;
  image?: string | null;
  language?: string | null;
  profile_photo_visible?: boolean;
  additional_photos_visible?: boolean;
  qualification?: string | null;
  education?: string | null;
  highest_education?: string | null;
  field_of_study?: string | null;
  university?: string | null;
  graduation_year?: string | null;
  job_title?: string | null;
  company?: string | null;
  employment_type?: string | null;
  profession?: string | null;
  monthly_income?: string | number | null;
  annual_income?: string | number | null;
  religion?: string | null;
  sect?: string | null;
  photos?: Array<Record<string, unknown> | string> | null;
  main_photo_index?: number | string | null;
  removed_photo_indexes?: number[];
  id?: number | string | null;
  profile_completed?: boolean;
  profile_step?: number | string | null;
  status?: string | null;
  referral_code?: string | null;
  reward_points?: number | string | null;
};

export type EditProfileFormData = {
  fullName: string;
  birthday: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  aboutMe: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  heightFeet: string;
  heightInches: string;
  motherTongue: string;
  otherLanguages: OtherLanguage[];
  maritalStatus: string;
  community: string;
  residenceStatus: string;
  age: number | null;
  profilePhoto: string | null;
};

export type SettingsProfileData = {
  name: string;
  meta: string;
  isVerified: boolean;
  isProfileComplete: boolean;
  profilePhoto: string | null;
  profilePictureVisible: boolean;
  additionalPhotosVisible: boolean;
};

export type PhotoVisibilityFlags = {
  profile_photo_visible?: boolean | number | string | null;
  additional_photos_visible?: boolean | number | string | null;
};

export type PhotoVisibilityResponse = {
  success?: boolean | number;
  message?: string;
  data?: PhotoVisibilityFlags;
};

export type CompleteProfileResponse = {
  success?: boolean | number;
  message?: string;
  user?: ProfileApiData;
  data?: CompleteProfileResponse | ProfileApiData;
};

export const parseVisibilityFlag = (value: unknown): boolean | undefined => {
  if (value === true || value === 1) {
    return true;
  }

  if (value === false || value === 0) {
    return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on', 'visible', 'public', 'show'].includes(normalized)) {
      return true;
    }

    if (
      [
        '0',
        'false',
        'no',
        'off',
        'hidden',
        'hide',
        'private',
        'invisible',
      ].includes(normalized)
    ) {
      return false;
    }
  }

  return undefined;
};

const pickVisibilityValue = (
  source: Record<string, unknown>,
  keys: string[],
) => {
  for (const key of keys) {
    if (key in source) {
      const parsed = parseVisibilityFlag(source[key]);
      if (parsed !== undefined) {
        return parsed;
      }
    }
  }

  return undefined;
};

const mergeVisibilityFlags = (
  profile: ProfileApiData,
  ...sources: Array<Record<string, unknown> | null | undefined>
): ProfileApiData => {
  const pictureKeys = [
    'profile_photo_visible',
    'profilePhotoVisible',
    'profile_picture_visible',
    'profilePictureVisible',
    'is_profile_photo_visible',
    'photo_visible',
    'is_photo_visible',
    'can_view_profile_photo',
    'can_view_photos',
  ];
  const additionalKeys = [
    'additional_photos_visible',
    'additionalPhotosVisible',
    'gallery_visible',
    'photos_visible',
  ];

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    const nested = [
      source,
      source.settings,
      source.visibility,
      source.photo_visibility,
      source.photos_visibility,
    ];

    for (const candidate of nested) {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        continue;
      }

      const record = candidate as Record<string, unknown>;
      const pictureVisible = pickVisibilityValue(record, pictureKeys);
      const additionalVisible = pickVisibilityValue(record, additionalKeys);

      if (pictureVisible !== undefined) {
        profile.profile_photo_visible = pictureVisible;
      }

      if (additionalVisible !== undefined) {
        profile.additional_photos_visible = additionalVisible;
      }
    }
  }

  return profile;
};

const MARITAL_STATUS_MAP: Record<string, string> = {
  single: 'Never Married',
  'never married': 'Never Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
};

const MARITAL_TO_API: Record<string, string> = {
  'Never Married': 'single',
  Single: 'single',
  Divorced: 'divorced',
  Widowed: 'widowed',
};

export const toApiMaritalStatus = (value?: string | null) => {
  const status = value?.trim();
  if (!status) {
    return '';
  }

  return MARITAL_TO_API[status] ?? status.toLowerCase();
};

export const normalizeProfileData = (source: unknown): ProfileApiData => {
  if (!source || typeof source !== 'object') {
    return {};
  }

  const obj = source as Record<string, unknown>;

  if (obj.user && typeof obj.user === 'object') {
    const fromUser = mapGetProfileFields(obj.user as Record<string, unknown>);
    const overlayMarital = [
      obj.marital_status,
      obj.maritalStatus,
      obj['marital status'],
    ].find(value => typeof value === 'string' && value.trim());
    if (typeof overlayMarital === 'string') {
      fromUser.marital_status = overlayMarital;
    }
    return withNormalizedPhotos(fromUser, obj);
  }

  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;

    if (data.user && typeof data.user === 'object') {
      const fromUser = mapGetProfileFields(data.user as Record<string, unknown>);
      const overlayMarital = [
        obj.marital_status,
        data.marital_status,
        obj.maritalStatus,
        data.maritalStatus,
        obj['marital status'],
        data['marital status'],
      ].find(value => typeof value === 'string' && value.trim());
      if (typeof overlayMarital === 'string') {
        fromUser.marital_status = overlayMarital;
      }
      return withNormalizedPhotos(fromUser, data, obj);
    }

    return withNormalizedPhotos(mapGetProfileFields(data), obj);
  }

  return withNormalizedPhotos(mapGetProfileFields(obj));
};

const photoIndexValue = (photo: unknown, fallback = -1) => {
  if (photo && typeof photo === 'object') {
    const value = (photo as Record<string, unknown>).index;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

export const mergeRemovedPhotoIndexes = (
  ...lists: Array<Array<number | string> | null | undefined>
) => {
  const indexes = new Set<number>();

  lists.forEach(list => {
    list?.forEach(value => {
      const parsed = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(parsed)) {
        indexes.add(parsed);
      }
    });
  });

  return [...indexes];
};

export const filterPhotosByRemovedIndexes = (
  photos?: ProfileApiData['photos'],
  removedIndexes?: number[] | null,
) => {
  if (!Array.isArray(photos)) {
    return photos;
  }

  if (!removedIndexes?.length) {
    return photos;
  }

  const removed = new Set(removedIndexes);

  return photos.filter((photo, position) => {
    const index = photoIndexValue(photo, position);
    return !removed.has(index);
  });
};

const pickPhotosArray = (
  ...candidates: Array<ProfileApiData['photos'] | unknown>
): ProfileApiData['photos'] | undefined => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate as ProfileApiData['photos'];
    }
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as ProfileApiData['photos'];
    }
  }

  return undefined;
};

const readPhotosFromSource = (
  source?: Record<string, unknown> | null,
): ProfileApiData['photos'] | undefined => {
  if (!source) {
    return undefined;
  }

  return pickPhotosArray(
    source.photos,
    source.profile_photos,
    source.gallery,
    source.images,
    source.media,
  );
};

const withNormalizedPhotos = (
  profile: ProfileApiData,
  ...sources: Array<Record<string, unknown> | null | undefined>
): ProfileApiData => {
  const photos = pickPhotosArray(
    profile.photos,
    ...sources.map(source => readPhotosFromSource(source)),
  );

  if (photos) {
    profile.photos = photos;
  }

  return mergeVisibilityFlags(
    profile,
    profile as Record<string, unknown>,
    ...sources,
  );
};

const mapGetProfileFields = (
  obj: Record<string, unknown>,
): ProfileApiData => {
  const profile = { ...obj } as ProfileApiData;

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = obj[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return undefined;
  };

  const name = pick('name', 'full_name', 'fullName');
  if (typeof name === 'string') {
    profile.name = name;
  }

  const birthday = pick('birthday', 'dob', 'date_of_birth', 'dateOfBirth');
  if (typeof birthday === 'string') {
    profile.birthday = birthday;
  }

  const marital = pick('marital_status', 'maritalStatus', 'marital status');
  if (typeof marital === 'string') {
    profile.marital_status = marital;
  }

  const community = pick('community', 'caste');
  if (typeof community === 'string') {
    profile.community = community;
  }

  const religion = pick('religion');
  if (typeof religion === 'string') {
    profile.religion = religion;
  }

  const siblings = pick('siblings');
  if (typeof siblings === 'string') {
    profile.siblings = siblings;
  }

  const familyInformation = pick(
    'family_information',
    'family_info',
    'familyInformation',
    'family',
  );
  if (typeof familyInformation === 'string') {
    profile.family_information = familyInformation;
    profile.family_info = familyInformation;
  }

  const gender = pick('gender');
  if (typeof gender === 'string') {
    profile.gender = gender.toLowerCase();
  }

  const qualification = pick(
    'qualification',
    'highest_education',
    'education',
  );
  if (typeof qualification === 'string') {
    profile.qualification = qualification;
    profile.highest_education = qualification;
    profile.education = qualification;
  }

  if (profile.image && !profile.profile_photo) {
    profile.profile_photo = profile.image;
  }

  if (profile.language && !profile.mother_tongue) {
    profile.mother_tongue = profile.language;
  }

  const photos = readPhotosFromSource(obj);
  if (photos) {
    profile.photos = photos;
  }

  const profilePhotoVisible = parseVisibilityFlag(
    pick('profile_photo_visible', 'profilePhotoVisible'),
  );
  if (profilePhotoVisible !== undefined) {
    profile.profile_photo_visible = profilePhotoVisible;
  }

  const additionalPhotosVisible = parseVisibilityFlag(
    pick('additional_photos_visible', 'additionalPhotosVisible'),
  );
  if (additionalPhotosVisible !== undefined) {
    profile.additional_photos_visible = additionalPhotosVisible;
  }

  const profileCompleted = parseVisibilityFlag(
    pick('profile_completed', 'is_profile_completed', 'profileCompleted'),
  );
  if (profileCompleted !== undefined) {
    profile.profile_completed = profileCompleted;
  }

  const profileStep = pick('profile_step', 'profileStep', 'step');
  if (typeof profileStep === 'number' && Number.isFinite(profileStep)) {
    profile.profile_step = profileStep;
  } else if (typeof profileStep === 'string' && profileStep.trim()) {
    const parsed = Number(profileStep);
    if (Number.isFinite(parsed)) {
      profile.profile_step = parsed;
    }
  }

  const accountStatus = pick('status', 'account_status', 'accountStatus');
  if (typeof accountStatus === 'string') {
    profile.status = accountStatus.toLowerCase();
  }

  const phoneVerified = parseVisibilityFlag(
    pick('phone_verified', 'is_phone_verified', 'phoneVerified'),
  );
  if (phoneVerified !== undefined) {
    profile.phone_verified = phoneVerified;
  }

  const profession = pick('profession', 'job_title');
  if (typeof profession === 'string') {
    profile.profession = profession;
  }

  const countryValue = pick('country', 'country_name', 'countryName');
  if (typeof countryValue === 'string') {
    profile.country = countryValue;
  } else if (countryValue && typeof countryValue === 'object') {
    const countryObj = countryValue as Record<string, unknown>;
    const countryName = countryObj.name ?? countryObj.country;
    if (typeof countryName === 'string' && countryName.trim()) {
      profile.country = countryName.trim();
    }
    const nestedId = countryObj.id ?? countryObj.country_id;
    if (nestedId !== undefined && nestedId !== null && nestedId !== '') {
      profile.country_id = nestedId as number | string;
    }
  }

  return profile;
};

const pickProfileField = <T>(
  ...values: Array<T | null | undefined>
): T | undefined => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

export const resolveProfileData = (source: unknown): ProfileApiData => {
  const fromApi = normalizeProfileData(source);
  const cached = profileStorage.get();
  const storedUser = userStorage.getUser();

  const resolved: ProfileApiData = {
    ...cached,
    ...fromApi,
    name: pickProfileField(fromApi.name, cached?.name, storedUser?.name),
    email: pickProfileField(fromApi.email, cached?.email, storedUser?.email),
    phone: pickProfileField(fromApi.phone, cached?.phone, storedUser?.phone),
    gender: pickProfileField(fromApi.gender, cached?.gender),
    birthday: pickProfileField(fromApi.birthday, cached?.birthday),
    bio: pickProfileField(fromApi.bio, cached?.bio),
    city: pickProfileField(
      typeof fromApi.city === 'string' ? fromApi.city : undefined,
      typeof cached?.city === 'string' ? cached.city : undefined,
    ),
    country: pickProfileField(
      typeof fromApi.country === 'string' ? fromApi.country : undefined,
      typeof cached?.country === 'string' ? cached.country : undefined,
    ),
    country_id: pickProfileField(fromApi.country_id, cached?.country_id),
    height: pickProfileField(fromApi.height, cached?.height),
    mother_tongue: pickProfileField(
      fromApi.mother_tongue,
      cached?.mother_tongue,
    ),
    other_languages: pickProfileField(
      fromApi.other_languages,
      cached?.other_languages,
    ),
    marital_status: pickProfileField(
      fromApi.marital_status,
      cached?.marital_status,
    ),
    religion: pickProfileField(fromApi.religion, cached?.religion),
    sect: pickProfileField(fromApi.sect, cached?.sect),
    siblings: pickProfileField(fromApi.siblings, cached?.siblings),
    family_information: pickProfileField(
      fromApi.family_information,
      fromApi.family_info,
      cached?.family_information,
      cached?.family_info,
    ),
    family_info: pickProfileField(
      fromApi.family_information,
      fromApi.family_info,
      cached?.family_information,
      cached?.family_info,
    ),
    community: pickProfileField(fromApi.community, cached?.community),
    residential_status: pickProfileField(
      fromApi.residential_status,
      cached?.residential_status,
      cached?.residence_status,
    ),
    age: pickProfileField(fromApi.age, cached?.age),
    is_verified: pickProfileField(
      fromApi.is_verified,
      cached?.is_verified,
      storedUser?.is_verified,
    ),
    profile_photo: pickProfileField(
      fromApi.profile_photo,
      cached?.profile_photo,
      fromApi.image,
    ),
    removed_photo_indexes: mergeRemovedPhotoIndexes(
      fromApi.removed_photo_indexes,
      cached?.removed_photo_indexes,
    ),
    photos: pickPhotosArray(fromApi.photos, cached?.photos),
    main_photo_index: pickProfileField(
      fromApi.main_photo_index,
      cached?.main_photo_index,
    ),
    profile_photo_visible:
      parseVisibilityFlag(fromApi.profile_photo_visible) ??
      parseVisibilityFlag(cached?.profile_photo_visible),
    additional_photos_visible:
      parseVisibilityFlag(fromApi.additional_photos_visible) ??
      parseVisibilityFlag(cached?.additional_photos_visible),
    location: pickProfileField(fromApi.location, cached?.location),
    id: pickProfileField(fromApi.id, cached?.id),
    phone_verified: pickProfileField(
      fromApi.phone_verified,
      cached?.phone_verified,
    ),
    profile_completed: pickProfileField(
      fromApi.profile_completed,
      cached?.profile_completed,
    ),
    profile_step: pickProfileField(fromApi.profile_step, cached?.profile_step),
    status: pickProfileField(fromApi.status, cached?.status),
    profession: pickProfileField(fromApi.profession, cached?.profession),
    referral_code: pickProfileField(
      fromApi.referral_code,
      cached?.referral_code,
    ),
    reward_points: pickProfileField(
      fromApi.reward_points,
      cached?.reward_points,
    ),
  };

  profileStorage.set(resolved);
  return resolved;
};

export const saveProfileCache = (source: unknown): ProfileApiData => {
  const resolved = resolveProfileData(source);
  const storedUser = userStorage.getUser();

  if (storedUser) {
    userStorage.setUser({
      ...storedUser,
      name: resolved.name ?? storedUser.name,
      email: resolved.email ?? storedUser.email,
      phone: resolved.phone ?? storedUser.phone,
      is_verified: resolved.is_verified ?? storedUser.is_verified,
    });
  }

  return resolved;
};

export const isProfileMarkedComplete = (profile?: ProfileApiData | null) => {
  if (!profile) {
    return false;
  }

  if (profile.profile_completed === true) {
    return true;
  }

  const step = Number(profile.profile_step);
  return Number.isFinite(step) && step >= 8;
};

export const mapCompleteProfile = (response?: CompleteProfileResponse | null) => {
  const profile = saveProfileCache(response);
  const message =
    typeof response?.message === 'string' ? response.message.trim() : '';
  const nested =
    response?.data && typeof response.data === 'object'
      ? (response.data as CompleteProfileResponse)
      : null;
  const nestedMessage =
    typeof nested?.message === 'string' ? nested.message.trim() : '';

  return {
    profile,
    message: message || nestedMessage,
    profileCompleted: isProfileMarkedComplete(profile),
    status: profile.status ?? null,
    user: profile,
  };
};

const MAIN_PHOTO_FIELD_KEYS = [
  'profile_photo',
  'profile_picture',
  'profile_image',
  'profilePhoto',
  'profile_photo_url',
] as const;

const PHOTO_FIELD_KEYS = [
  ...MAIN_PHOTO_FIELD_KEYS,
  'photo_url',
  'image_url',
  'thumbnail_url',
  'original_url',
  'full_url',
  'media_url',
  'file_url',
  'image',
  'photo',
  'avatar',
  'picture',
  'thumbnail',
  'url',
  'path',
  'src',
  'file',
  'filename',
] as const;

const NESTED_PHOTO_KEYS = [
  'user',
  'profile',
  'data',
  'match',
  'photos',
  'media',
  'gallery',
  'images',
  'files',
] as const;

const isEmptyPhotoValue = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  return !trimmed || trimmed === 'null' || trimmed === 'undefined';
};

const looksLikeImagePath = (value: string) => {
  if (isEmptyPhotoValue(value)) {
    return false;
  }

  if (/^data:image\//i.test(value)) {
    return true;
  }

  if (/\.(jpe?g|png|webp|gif|bmp|heic|heif)(\?|#|$)/i.test(value)) {
    return true;
  }

  return /uploads\/|storage\/|profiles\/|\/store\//i.test(value);
};

const isMainPhoto = (photo: unknown) => {
  if (!photo || typeof photo !== 'object') {
    return false;
  }

  const flag = (photo as Record<string, unknown>).is_main;
  return flag === true || flag === 1 || flag === '1';
};

const pickFromPhotosArray = (photos: unknown): string => {
  if (!Array.isArray(photos) || photos.length === 0) {
    return '';
  }

  const ordered = [...photos].sort(
    (left, right) => Number(isMainPhoto(right)) - Number(isMainPhoto(left)),
  );

  for (const photo of ordered) {
    if (typeof photo === 'string' && looksLikeImagePath(photo)) {
      return resolveMediaUrl(photo);
    }

    if (!photo || typeof photo !== 'object') {
      continue;
    }

    const obj = photo as Record<string, unknown>;
    const candidates = [
      obj.url,
      obj.image,
      obj.path,
      obj.profile_photo,
      obj.photo,
      obj.src,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && !isEmptyPhotoValue(candidate)) {
        return resolveMediaUrl(candidate.trim());
      }
    }
  }

  return '';
};

export const pickImageUrl = (item?: unknown, depth = 0): string => {
  if (item == null || depth > 5) {
    return '';
  }

  if (typeof item === 'string') {
    const trimmed = item.trim();

    if (isEmptyPhotoValue(trimmed)) {
      return '';
    }

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return pickImageUrl(JSON.parse(trimmed), depth + 1);
      } catch {
        // Keep checking the raw string below.
      }
    }

    return looksLikeImagePath(trimmed) ? resolveMediaUrl(trimmed) : '';
  }

  if (Array.isArray(item)) {
    const fromArray = pickFromPhotosArray(item);
    if (fromArray) {
      return fromArray;
    }

    for (const entry of item) {
      const url = pickImageUrl(entry, depth + 1);
      if (url) {
        return url;
      }
    }

    return '';
  }

  if (typeof item !== 'object') {
    return '';
  }

  const obj = item as Record<string, unknown>;

  for (const key of MAIN_PHOTO_FIELD_KEYS) {
    const value = obj[key];

    if (typeof value === 'string' && !isEmptyPhotoValue(value)) {
      return resolveMediaUrl(value.trim());
    }

    if (value && typeof value === 'object') {
      const url = pickImageUrl(value, depth + 1);
      if (url) {
        return url;
      }
    }
  }

  const fromPhotos = pickFromPhotosArray(obj.photos);
  if (fromPhotos) {
    return fromPhotos;
  }

  for (const key of PHOTO_FIELD_KEYS) {
    if ((MAIN_PHOTO_FIELD_KEYS as readonly string[]).includes(key)) {
      continue;
    }

    const value = obj[key];

    if (typeof value === 'string' && !isEmptyPhotoValue(value)) {
      return resolveMediaUrl(value.trim());
    }

    if (value && typeof value === 'object') {
      const url = pickImageUrl(value, depth + 1);
      if (url) {
        return url;
      }
    }
  }

  for (const key of NESTED_PHOTO_KEYS) {
    if (!(key in obj) || key === 'photos') {
      continue;
    }

    const url = pickImageUrl(obj[key], depth + 1);
    if (url) {
      return url;
    }
  }

  if (depth === 0) {
    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && looksLikeImagePath(value)) {
        return resolveMediaUrl(value.trim());
      }
    }
  }

  return '';
};

export const extractPhotoUrl = (photo: unknown): string | null =>
  pickImageUrl(photo) || null;

export const extractProfilePhotoSlots = (
  profile?: ProfileApiData | null,
  slotCount = PROFILE_PHOTO_SLOTS,
): (string | null)[] => {
  const slots = Array.from({ length: slotCount }, () => null as string | null);

  if (!profile) {
    return slots;
  }

  const photoItems = Array.isArray(profile.photos) ? profile.photos : [];
  const orderedPhotos = [...photoItems].sort(
    (left, right) => Number(isMainPhoto(right)) - Number(isMainPhoto(left)),
  );
  const urls: string[] = [];

  for (const photo of orderedPhotos) {
    const url = extractPhotoUrl(photo);
    if (url && !urls.includes(url)) {
      urls.push(url);
    }
  }

  const mainPhoto = pickImageUrl(profile) || null;
  if (mainPhoto) {
    const mainIndex = urls.indexOf(mainPhoto);
    if (mainIndex > 0) {
      urls.splice(mainIndex, 1);
      urls.unshift(mainPhoto);
    } else if (mainIndex < 0) {
      urls.unshift(mainPhoto);
    }
  }

  urls.slice(0, slotCount).forEach((url, index) => {
    slots[index] = url;
  });

  return slots;
};

const pickPhotoIndex = (photo: unknown, fallback: number): number => {
  if (photo && typeof photo === 'object') {
    const value = (photo as Record<string, unknown>).index;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

const pickPhotoPath = (photo: unknown): string | null => {
  if (!photo || typeof photo !== 'object') {
    return null;
  }

  const path = (photo as Record<string, unknown>).path;
  return typeof path === 'string' && path.trim() ? path.trim() : null;
};

export type ProfileGalleryPhoto = {
  id: string | null;
  index: number | null;
  url: string;
  path: string | null;
  isMain: boolean;
};

const urlsMatchLoose = (left?: string | null, right?: string | null) => {
  if (!left || !right) {
    return false;
  }
  const normalize = (value: string) =>
    value
      .trim()
      .replace(/\\/g, '/')
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  const a = normalize(left);
  const b = normalize(right);
  return a === b || a.endsWith(b) || b.endsWith(a);
};

export const extractProfileGalleryPhotos = (
  profile?: ProfileApiData | null,
): ProfileGalleryPhoto[] => {
  const photoItems = Array.isArray(profile?.photos) ? profile.photos : [];

  if (photoItems.length > 0) {
    const mainIndexValue = profile?.main_photo_index;
    const parsedMainIndex =
      typeof mainIndexValue === 'number'
        ? mainIndexValue
        : typeof mainIndexValue === 'string' && mainIndexValue.trim()
          ? Number(mainIndexValue)
          : NaN;
    const flaggedMainPosition = photoItems.findIndex(isMainPhoto);
    const flaggedMainIndex =
      flaggedMainPosition >= 0
        ? pickPhotoIndex(photoItems[flaggedMainPosition], flaggedMainPosition)
        : NaN;

    const profilePhotoUrl = pickImageUrl(profile?.profile_photo || profile?.image);
    const profilePhotoMatchIndex =
      profilePhotoUrl
        ? photoItems.findIndex(photo => {
            const url = extractPhotoUrl(photo);
            return Boolean(url) && urlsMatchLoose(url, profilePhotoUrl);
          })
        : -1;
    const profilePhotoMainIndex =
      profilePhotoMatchIndex >= 0
        ? pickPhotoIndex(photoItems[profilePhotoMatchIndex], profilePhotoMatchIndex)
        : NaN;

    // Prefer explicit flags, then profile_photo URL match — never default to
    // photos[0] when profile_photo points at a different image.
    const mainIndex = Number.isFinite(parsedMainIndex)
      ? parsedMainIndex
      : Number.isFinite(flaggedMainIndex)
        ? flaggedMainIndex
        : Number.isFinite(profilePhotoMainIndex)
          ? profilePhotoMainIndex
          : 0;

    return photoItems
      .map((photo, position) => {
        const url = extractPhotoUrl(photo);
        if (!url) {
          return null;
        }

        const index = pickPhotoIndex(photo, position);
        const isMain = index === mainIndex;

        return {
          id: String(index),
          index,
          url,
          path: pickPhotoPath(photo),
          isMain,
        };
      })
      .filter((photo): photo is ProfileGalleryPhoto => photo !== null)
      .filter(
        photo =>
          photo.index == null ||
          !profile?.removed_photo_indexes?.includes(photo.index),
      );
  }

  return extractProfilePhotoSlots(profile)
    .map((url, index) =>
      url
        ? {
            id: String(index),
            index,
            url,
            path: null,
            isMain: index === 0,
          }
        : null,
    )
    .filter((photo): photo is ProfileGalleryPhoto => photo !== null);
};

const formatBirthday = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const calculateAge = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
};

const parseHeight = (height?: string | null) => {
  if (!height) {
    return { feet: '', inches: '' };
  }

  const match = height.match(/(\d)\s*['']?\s*(\d{1,2})/);
  if (match) {
    return { feet: match[1], inches: match[2] };
  }

  const parts = height.split('.');
  if (parts.length === 2) {
    return { feet: parts[0], inches: parts[1] };
  }

  return { feet: '', inches: '' };
};

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const parseLanguages = (value?: string | string[] | null): OtherLanguage[] => {
  if (!value) {
    return [];
  }

  const list = Array.isArray(value)
    ? value
    : value.split(',').map(item => item.trim());

  return list.filter(Boolean) as OtherLanguage[];
};

const buildLocation = (profile: ProfileApiData) => {
  const parts = [profile.city, profile.state, profile.country].filter(Boolean);
  return parts.join(', ');
};

const mapMaritalStatus = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const key = value.toLowerCase();
  return MARITAL_STATUS_MAP[key] ?? toTitleCase(value);
};

export const mapProfileToForm = (
  profile?: ProfileApiData | null,
): EditProfileFormData => {
  const safeProfile = profile ?? {};
  const height = parseHeight(safeProfile.height);
  const gender = safeProfile.gender?.toLowerCase();

  return {
    fullName: safeProfile.name ?? '',
    birthday: safeProfile.birthday ?? '',
    dateOfBirth: formatBirthday(safeProfile.birthday),
    gender: gender === 'male' ? 'male' : 'female',
    aboutMe:
      safeProfile.bio ??
      safeProfile.about_me ??
      safeProfile.about ??
      '',
    email: safeProfile.email ?? '',
    phone: safeProfile.phone ?? '',
    city: typeof safeProfile.city === 'string' ? safeProfile.city : '',
    country: typeof safeProfile.country === 'string' ? safeProfile.country : '',
    heightFeet: height.feet,
    heightInches: height.inches,
    motherTongue: safeProfile.mother_tongue
      ? toTitleCase(safeProfile.mother_tongue)
      : '',
    otherLanguages: parseLanguages(safeProfile.other_languages),
    maritalStatus: mapMaritalStatus(safeProfile.marital_status),
    community: safeProfile.community
      ? toTitleCase(safeProfile.community)
      : '',
    residenceStatus:
      safeProfile.residential_status ?? safeProfile.residence_status
        ? toTitleCase(
            safeProfile.residential_status ?? safeProfile.residence_status ?? '',
          )
        : '',
    age: safeProfile.age ?? calculateAge(safeProfile.birthday),
    profilePhoto: pickImageUrl(safeProfile) || null,
  };
};

export const mapProfileToSettings = (
  profile?: ProfileApiData | null,
): SettingsProfileData => {
  const form = mapProfileToForm(profile);
  const location = [form.city, form.country].filter(Boolean).join(', ');
  const meta = [form.age ? String(form.age) : '', location]
    .filter(Boolean)
    .join(' · ');

  return {
    name: form.fullName,
    meta,
    isVerified: Boolean(profile?.is_verified),
    isProfileComplete: parseVisibilityFlag(profile?.profile_completed) === true,
    profilePhoto: form.profilePhoto,
    profilePictureVisible:
      parseVisibilityFlag(profile?.profile_photo_visible) ?? true,
    additionalPhotosVisible:
      parseVisibilityFlag(profile?.additional_photos_visible) ?? true,
  };
};

export const mapFormToProfilePayload = (
  form: EditProfileFormData,
): Record<string, FormValue> => {
  const payload: Record<string, FormValue> = {
    name: form.fullName.trim(),
    gender: form.gender,
  };

  const email = form.email.trim();
  if (email) {
    payload.email = email;
  }

  const phone = form.phone.trim();
  if (phone) {
    payload.phone = phone;
  }

  const bio = form.aboutMe.trim();
  if (bio) {
    payload.bio = bio;
  }

  const city = form.city.trim();
  if (city) {
    payload.city = city;
  }

  const country = form.country.trim();
  if (country) {
    payload.country = country;
  }

  if (form.motherTongue) {
    payload.mother_tongue = form.motherTongue;
  }

  payload.other_languages = [...form.otherLanguages];

  if (form.maritalStatus) {
    const marital = toApiMaritalStatus(form.maritalStatus);
    payload.marital_status = marital;
    payload['marital status'] = marital;
  }

  if (form.community) {
    payload.community = form.community;
  }

  if (form.residenceStatus) {
    payload.residential_status = form.residenceStatus.toLowerCase();
  }

  if (form.birthday) {
    payload.birthday = form.birthday;
  }

  if (form.heightFeet && form.heightInches) {
    payload.height = `${form.heightFeet}.${form.heightInches}`;
  }

  const cached = profileStorage.get();
  const siblings = cached?.siblings?.trim();
  if (siblings) {
    payload.siblings = siblings;
  }

  const familyInformation = (
    cached?.family_information ||
    cached?.family_info ||
    ''
  ).trim();
  if (familyInformation) {
    payload.family_information = familyInformation;
    payload.family_info = familyInformation;
  }

  if (bio) {
    payload.about = bio;
    payload.about_me = bio;
  }

  return payload;
};
