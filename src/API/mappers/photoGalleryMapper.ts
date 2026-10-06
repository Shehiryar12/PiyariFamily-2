import { ImageSourcePropType } from 'react-native';
import { resolveMediaUrl } from '../mediaUrl';
import { parseVisibilityFlag } from './profileMapper';

export type PhotoGalleryPhotoApi = {
  index?: number | string | null;
  url?: string | null;
  path?: string | null;
  photo?: string | null;
  image?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  is_main?: boolean | number | string | null;
};

export type PhotoGalleryResponse = {
  success?: boolean | number;
  message?: string;
  access_granted?: boolean | number | string | null;
  total_photos?: number | string | null;
  user?: {
    id?: number | string | null;
    name?: string | null;
    full_name?: string | null;
    profile_photo?: string | null;
    photo?: string | null;
    image?: string | null;
    photos?: PhotoGalleryPhotoApi[] | string[] | null;
    profile_photo_visible?: boolean | number | string | null;
    additional_photos_visible?: boolean | number | string | null;
  } | null;
  visibility?: {
    profile_photo_visible?: boolean | number | string | null;
    additional_photos_visible?: boolean | number | string | null;
    access_granted?: boolean | number | string | null;
    can_view_profile_photo?: boolean | number | string | null;
    can_view_additional_photos?: boolean | number | string | null;
  } | null;
  photos?: PhotoGalleryPhotoApi[] | null;
  data?: PhotoGalleryResponse | PhotoGalleryPhotoApi[] | null;
};

export type PhotoGalleryData = {
  userId: string;
  name: string;
  accessGranted: boolean;
  photos: ImageSourcePropType[];
  profilePictureVisible: boolean;
  additionalPhotosVisible: boolean;
  hiddenByOwner: boolean;
};

const pickString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const unwrapPayload = (
  response?: PhotoGalleryResponse | null,
): PhotoGalleryResponse | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  let current: Record<string, unknown> = { ...response };

  for (let depth = 0; depth < 3; depth += 1) {
    const nested = current.data;
    if (!isPlainObject(nested) || Array.isArray(nested)) {
      break;
    }
    current = { ...current, ...nested };
  }

  return current as PhotoGalleryResponse;
};

const toGalleryPhoto = (item: unknown): PhotoGalleryPhotoApi | null => {
  if (typeof item === 'string' && item.trim()) {
    return { url: item.trim() };
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  return item as PhotoGalleryPhotoApi;
};

const extractPhotos = (
  response?: PhotoGalleryResponse | null,
): PhotoGalleryPhotoApi[] => {
  const data = unwrapPayload(response);

  if (!data) {
    return [];
  }

  const fromList = Array.isArray(data.photos)
    ? data.photos
    : Array.isArray(data.data)
      ? data.data
      : [];
  const userPhotos = Array.isArray(data.user?.photos) ? data.user.photos : [];
  const extras: Array<PhotoGalleryPhotoApi | null> = [
    data.user?.profile_photo
      ? { url: data.user.profile_photo, is_main: true, index: -1 }
      : null,
    data.user?.photo ? { url: data.user.photo, is_main: true, index: -1 } : null,
    data.user?.image ? { url: data.user.image, is_main: true, index: -1 } : null,
  ];

  return [...fromList, ...userPhotos, ...extras]
    .map(toGalleryPhoto)
    .filter((item): item is PhotoGalleryPhotoApi => Boolean(item));
};

const isMainGalleryPhoto = (item: PhotoGalleryPhotoApi) =>
  parseVisibilityFlag(item.is_main) === true;

const filterGalleryPhotos = (
  photos: PhotoGalleryPhotoApi[],
  pictureVisible: boolean,
  additionalVisible: boolean,
) => {
  if (pictureVisible && additionalVisible) {
    return photos;
  }

  const mainIndex = photos.findIndex(isMainGalleryPhoto);
  const resolvedMain = mainIndex >= 0 ? mainIndex : 0;

  return photos.filter((_, index) => {
    const isMainPhoto = index === resolvedMain;
    return isMainPhoto ? pictureVisible : additionalVisible;
  });
};

const readFlag = (
  data: PhotoGalleryResponse | null,
  keys: string[],
): boolean | undefined => {
  if (!data) {
    return undefined;
  }

  const sources: unknown[] = [
    data,
    data.visibility,
    data.user,
    (data as { user?: { visibility?: unknown } }).user?.visibility,
  ];

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    const record = source as Record<string, unknown>;
    for (const key of keys) {
      const parsed = parseVisibilityFlag(record[key]);
      if (parsed !== undefined) {
        return parsed;
      }
    }
  }

  return undefined;
};

export const mapPhotoGallery = (
  response?: PhotoGalleryResponse | null,
  fallbackUserId = '',
  fallbackName = '',
): PhotoGalleryData => {
  const data = unwrapPayload(response);
  const picturePublic =
    readFlag(data, [
      'profile_photo_visible',
      'profilePhotoVisible',
      'profile_picture_visible',
      'profilePictureVisible',
    ]) ?? true;
  const additionalPublic =
    readFlag(data, [
      'additional_photos_visible',
      'additionalPhotosVisible',
    ]) ?? true;
  const generalGrant =
    readFlag(data, [
      'access_granted',
      'photo_access_granted',
      'has_photo_access',
      'can_view_photos',
    ]) === true;
  const profileGrant =
    generalGrant || readFlag(data, ['can_view_profile_photo']) === true;
  const additionalGrant =
    generalGrant ||
    readFlag(data, [
      'can_view_additional_photos',
      'additional_photo_access_granted',
      'has_additional_photo_access',
    ]) === true;
  const showPicture = picturePublic || profileGrant;
  const showAdditional = additionalPublic || additionalGrant;
  const rawPhotos = filterGalleryPhotos(
    extractPhotos(response),
    showPicture,
    showAdditional,
  ).sort(
    (left, right) =>
      Number(left?.index ?? 0) - Number(right?.index ?? 0),
  );
  const photos = rawPhotos
    .map(item =>
      resolveMediaUrl(
        pickString(
          item.url,
          item.path,
          item.photo,
          item.image,
          item.image_url,
          item.photo_url,
        ),
      ),
    )
    .filter(Boolean)
    .map(uri => ({ uri }));
  const hiddenByOwner = !showPicture || !showAdditional;
  const accessGranted = !hiddenByOwner;

  return {
    userId: pickString(
      data?.user?.id != null ? String(data.user.id) : '',
      fallbackUserId,
    ),
    name: pickString(data?.user?.name, data?.user?.full_name, fallbackName),
    accessGranted,
    photos,
    profilePictureVisible: showPicture,
    additionalPhotosVisible: showAdditional,
    hiddenByOwner,
  };
};
