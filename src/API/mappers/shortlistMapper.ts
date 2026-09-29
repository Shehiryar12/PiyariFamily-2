import { ImageSourcePropType } from 'react-native';
import { Images } from '../../Assets';
import { toRemoteImageSource } from '../mediaUrl';
import { pickImageUrl } from './profileMapper';
import { resolveMatchPhotoVisibility } from './matchMapper';

export type ShortlistTab = 'i_liked' | 'liked_me';

export type ShortlistedProfile = {
  id: string;
  name: string;
  age: number;
  location: string;
  education: string;
  profession: string;
  image: ImageSourcePropType;
  isVerified?: boolean;
  pictureHidden?: boolean;
};

export type ShortlistApiItem = {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  full_name?: string;
  age?: number | string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  location?: string | null;
  highest_education?: string | null;
  qualification?: string | null;
  field_of_study?: string | null;
  education?: string | null;
  occupation?: string | null;
  profession?: string | null;
  job_title?: string | null;
  employment_type?: string | null;
  profile_photo?: string | null;
  image?: string | null;
  photo?: string | null;
  avatar?: string | null;
  photos?: Array<Record<string, unknown> | string> | null;
  gender?: string | null;
  is_verified?: boolean | number | null;
  profile_photo_visible?: boolean | number | string | null;
  additional_photos_visible?: boolean | number | string | null;
  visibility?: {
    profile_photo_visible?: boolean | number | string | null;
    additional_photos_visible?: boolean | number | string | null;
  } | null;
  user?: ShortlistApiItem;
  profile?: ShortlistApiItem;
  liked_user?: ShortlistApiItem;
  from_user?: ShortlistApiItem;
  shortlisted_user?: ShortlistApiItem;
};

export type ShortlistResponse = {
  success?: boolean | number;
  tab?: ShortlistTab;
  tab_label?: string;
  total?: number;
  profiles?: ShortlistApiItem[];
  data?: ShortlistApiItem[] | ShortlistResponse;
  users?: ShortlistApiItem[];
  results?: ShortlistApiItem[];
  shortlisted?: ShortlistApiItem[];
  liked_me?: ShortlistApiItem[];
  likedMe?: ShortlistApiItem[];
  i_liked?: ShortlistApiItem[];
  iLiked?: ShortlistApiItem[];
  liked?: ShortlistApiItem[];
  message?: string;
};

export type ShortlistInterestResponse = {
  success?: boolean | number;
  message?: string;
  shortlisted?: boolean;
  mutual_match?: boolean;
  shortlist_tab?: ShortlistTab;
};

const pickString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const normalizeItem = (item: ShortlistApiItem): ShortlistApiItem => {
  const nested =
    item.user ?? item.profile ?? item.liked_user ?? item.from_user ?? item.shortlisted_user;

  if (nested && typeof nested === 'object') {
    return { ...item, ...nested };
  }

  return item;
};

const resolveProfileImage = (
  ...items: ShortlistApiItem[]
): ImageSourcePropType => {
  const pictureHidden = items.some(
    item => resolveMatchPhotoVisibility(item).pictureVisible === false,
  );

  const gender = items
    .map(item => item.gender?.toLowerCase())
    .find(value => value === 'male' || value === 'female');
  const placeholder =
    gender === 'male' ? Images.maleProfile : Images.femaleProfile;

  if (pictureHidden) {
    return Images.hiddenProfile;
  }

  for (const item of items) {
    if (resolveMatchPhotoVisibility(item).pictureVisible === false) {
      continue;
    }

    const photo = pickImageUrl(item);
    if (photo) {
      return toRemoteImageSource(photo);
    }
  }

  return placeholder;
};

const resolveLocation = (item: ShortlistApiItem) => {
  const directLocation = pickString(item.location);

  if (directLocation) {
    return directLocation;
  }

  const city = pickString(item.city);
  const state = pickString(item.state);
  const country = pickString(item.country);

  return [city, state, country].filter(Boolean).join(', ');
};

const resolveAge = (value?: number | string | null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const resolveId = (item: ShortlistApiItem, index: number) => {
  const id = item.id ?? item.user_id;

  if (id !== undefined && id !== null && String(id).trim()) {
    return String(id);
  }

  return `shortlist-${index}`;
};

export const mapShortlistItem = (
  item: ShortlistApiItem,
  index: number,
): ShortlistedProfile => {
  const profile = normalizeItem(item);
  const pictureHidden =
    resolveMatchPhotoVisibility(profile).pictureVisible === false;

  return {
    id: resolveId(profile, index),
    name: pickString(profile.name, profile.full_name) || 'Profile',
    age: resolveAge(profile.age),
    location: resolveLocation(profile) || '-',
    education:
      pickString(
        profile.highest_education,
        profile.qualification,
        profile.field_of_study,
        profile.education,
      ) || '-',
    profession:
      pickString(profile.occupation, profile.profession, profile.job_title, profile.employment_type) ||
      '-',
    image: resolveProfileImage(item, profile),
    isVerified: Boolean(profile.is_verified),
    ...(pictureHidden ? { pictureHidden: true } : {}),
  };
};

const firstProfileArray = (
  ...lists: Array<ShortlistApiItem[] | undefined>
) => lists.find(list => Array.isArray(list)) ?? null;

export const extractShortlistProfiles = (
  response?: ShortlistResponse | null,
  tab?: ShortlistTab,
): ShortlistApiItem[] => {
  if (!response || typeof response !== 'object') {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (tab === 'liked_me') {
    const likedMe = firstProfileArray(
      response.liked_me,
      response.likedMe,
    );
    if (likedMe) {
      return likedMe;
    }
  }

  if (tab === 'i_liked') {
    const liked = firstProfileArray(
      response.i_liked,
      response.iLiked,
      response.liked,
    );
    if (liked) {
      return liked;
    }
  }

  if (Array.isArray(response.profiles)) {
    return response.profiles;
  }

  if (Array.isArray(response.users) && response.users.length) {
    return response.users;
  }

  if (Array.isArray(response.results) && response.results.length) {
    return response.results;
  }

  if (Array.isArray(response.shortlisted) && response.shortlisted.length) {
    return response.shortlisted;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && typeof response.data === 'object') {
    return extractShortlistProfiles(response.data, tab);
  }

  return [];
};

export const mapShortlistProfiles = (profiles?: ShortlistApiItem[] | null) =>
  (profiles ?? []).map(mapShortlistItem);

export const pickShortlistTotal = (
  response?: ShortlistResponse | null,
  fallback = 0,
) => {
  const total = response?.total;
  if (typeof total === 'number' && Number.isFinite(total)) {
    return total;
  }

  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    const nestedTotal = response.data.total;
    if (typeof nestedTotal === 'number' && Number.isFinite(nestedTotal)) {
      return nestedTotal;
    }
  }

  return fallback;
};
