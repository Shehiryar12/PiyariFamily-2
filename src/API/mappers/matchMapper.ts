import { ImageSourcePropType } from 'react-native';
import { Images } from '../../Assets';
import type { BasicDetail, QuickInfo } from '../../Constant/MatchProfiles';
import { pickImageUrl, parseVisibilityFlag, toDisplayMaritalStatus } from './profileMapper';
import { toRemoteImageSource } from '../mediaUrl';
import {
  applyLocationFilterParams,
  classifyLocationQuickFilter,
} from './matchLocationFilter';

export type MatchTag = {
  icon: string;
  label: string;
};

export type FeaturedMatch = {
  id: string;
  name: string;
  age: number;
  location: string;
  image: ImageSourcePropType;
  tags: MatchTag[];
  isNew?: boolean;
  isVerified?: boolean;
  pictureHidden?: boolean;
  isLiked?: boolean;
};

export type SuggestedMatch = {
  id: string;
  name: string;
  age: number;
  location: string;
  city?: string;
  distanceKm?: number;
  isNew?: boolean;
  createdAt?: string;
  profession: string;
  image: ImageSourcePropType;
  tier: 'VIP' | 'VVIP';
  isVerified: boolean;
  pictureHidden?: boolean;
  isLiked?: boolean;
};

export type BestMatchData = {
  id: string;
  name: string;
  age: number;
  location: string;
  matchScore: number;
  image: ImageSourcePropType;
};

export type BestMatchResponse = {
  success?: number | boolean;
  match_score?: number | string | null;
  profile?: MatchApiItem | null;
  message?: string;
  data?: BestMatchResponse;
};

export type HomeMatchesData = {
  greeting: string;
  totalMatches: number;
  featuredMatches: FeaturedMatch[];
  suggestedMatches: SuggestedMatch[];
  membershipBadge: string | null;
  membershipBadges: string[];
  hasPaidPackage: boolean;
};

export type MatchApiItem = {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  full_name?: string;
  fullName?: string;
  age?: number | string | null;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  location?: string | null;
  distance?: number | string | null;
  distance_km?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  qualification?: string | null;
  highest_education?: string | null;
  field_of_study?: string | null;
  education?: string | null;
  job_title?: string | null;
  occupation?: string | null;
  profession?: string | null;
  employment_type?: string | null;
  community?: string | null;
  religion?: string | null;
  profile_photo?: string | null;
  image?: string | null;
  photo?: string | null;
  avatar?: string | null;
  photos?: Array<Record<string, unknown> | string> | null;
  profile_photo_visible?: boolean | number | string | null;
  additional_photos_visible?: boolean | number | string | null;
  visibility?: {
    profile_photo_visible?: boolean | number | string | null;
    additional_photos_visible?: boolean | number | string | null;
  } | null;
  photo_visibility?: {
    profile_photo_visible?: boolean | number | string | null;
    additional_photos_visible?: boolean | number | string | null;
  } | null;
  gender?: string | null;
  is_verified?: boolean | number | string | null;
  phone_verified?: boolean | number | string | null;
  is_phone_verified?: boolean | number | string | null;
  phone_verified_at?: string | null;
  is_new?: boolean | number | null;
  is_new_profile?: boolean | number | null;
  created_at?: string | null;
  joined_at?: string | null;
  registered_at?: string | null;
  createdAt?: string | null;
  joined_date?: string | null;
  registered_on?: string | null;
  tier?: string | null;
  plan?: string | null;
  subscription_plan?: string | null;
  bio?: string | null;
  about?: string | null;
  about_me?: string | null;
  description?: string | null;
  height?: string | null;
  marital_status?: string | null;
  mother_tongue?: string | null;
  other_languages?: string | string[] | null;
  residential_status?: string | null;
  residence_status?: string | null;
  interests?: string[] | null;
  membership_badge?: string | null;
  membershipBadge?: string | null;
  badges?: string[] | null;
  is_like?: boolean | number | string | null;
  is_liked?: boolean | number | string | null;
  liked?: boolean | number | string | null;
  user?: MatchApiItem;
  profile?: MatchApiItem;
};

export type MatchProfileResponse = MatchApiItem & {
  success?: boolean;
  message?: string;
};

export type HomeMatchesResponse = {
  success?: boolean;
  greeting?: string | null;
  membership_badge?: string | null;
  membershipBadge?: string | null;
  badges?: string[] | null;
  user?: MatchApiItem | null;
  me?: MatchApiItem | null;
  current_user?: MatchApiItem | null;
  viewer?: MatchApiItem | null;
  is_premium?: boolean | number | string | null;
  has_subscription?: boolean | number | string | null;
  is_paid?: boolean | number | string | null;
  current_plan?: unknown;
  subscription?: unknown;
  membership?: unknown;
  top_match?: MatchApiItem | null;
  featured_matches?: MatchApiItem[];
  featured?: MatchApiItem[];
  matches?: MatchApiItem[];
  suggested_matches?: MatchApiItem[];
  exact_matches?: MatchApiItem[];
  profiles?: MatchApiItem[];
  users?: MatchApiItem[];
  results?: MatchApiItem[];
  recommendations?: MatchApiItem[];
  total_matches?: number | string | null;
  message?: string;
  data?: HomeMatchesResponse | MatchApiItem[];
};

export type MatchSearchParams = {
  gender?: string;
  age_min?: number | string;
  age_max?: number | string;
  city?: string;
  country?: string;
  religion?: string;
  marital_status?: string;
  education?: string;
  profession?: string;
  name?: string;
  search?: string;
  q?: string;
  near_me?: boolean | string | number;
  same_city?: boolean | string | number;
  radius?: number | string;
  radius_km?: number | string;
  origin_city?: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  verified?: boolean | string | number;
  new_profiles?: boolean | string | number;
  height_min?: number | string;
  height_max?: number | string;
  [key: string]: string | number | boolean | undefined;
};

export type MatchFilterParams = {
  marital_status?: string;
  qualification?: string;
  city?: string;
  profession?: string;
  religion?: string;
  age_min?: number | string;
  age_max?: number | string;
  monthly_income_min?: number | string;
  monthly_income_max?: number | string;
  monthly_income?: string;
  near_me?: string | number | boolean;
  verified?: string | number | boolean;
  new_profiles?: string | number | boolean;
  [key: string]: string | number | boolean | undefined;
};

export type MatchListPagination = {
  current_page?: number | string | null;
  per_page?: number | string | null;
  total?: number | string | null;
  last_page?: number | string | null;
};

export type MatchFilterOptions = {
  cities?: unknown;
  city?: unknown;
  qualifications?: unknown;
  education?: unknown;
  educations?: unknown;
  professions?: unknown;
  religions?: unknown;
  marital_statuses?: unknown;
  maritalStatuses?: unknown;
  income_ranges?: unknown;
  incomeRanges?: unknown;
  age_min?: number | string | null;
  age_max?: number | string | null;
  [key: string]: unknown;
};

export type MatchListResponse = {
  success?: boolean | number;
  data?: MatchApiItem[];
  profiles?: MatchApiItem[];
  matches?: MatchApiItem[];
  results?: MatchApiItem[];
  users?: MatchApiItem[];
  recommendations?: MatchApiItem[];
  pagination?: MatchListPagination | null;
  filters_applied?: Record<string, string | number | null>;
  quick_filters?:
    | Record<string, string | number | boolean | null>
    | Array<string | Record<string, unknown>>;
  filter_options?: MatchFilterOptions | null;
  fallback_used?: boolean | number | string | null;
  exact_matches?: MatchApiItem[] | null;
  suggested_matches?: MatchApiItem[] | null;
  total?: number | string | null;
  message?: string;
};

const pickString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const pickNumber = (value?: number | string | null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stripEmptyMedia = (item: MatchApiItem): MatchApiItem => {
  const next = { ...item };
  const mediaKeys = [
    'photos',
    'image',
    'photo',
    'profile_photo',
    'avatar',
  ] as const;

  for (const key of mediaKeys) {
    const value = next[key];
    if (
      value == null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete next[key];
    }
  }

  return next;
};

const PICTURE_VISIBILITY_KEYS = [
  'profile_photo_visible',
  'profilePhotoVisible',
  'profile_picture_visible',
  'profilePictureVisible',
  'is_profile_photo_visible',
];
const GENERAL_ACCESS_KEYS = [
  'photo_access_granted',
  'has_photo_access',
];
const PROFILE_ACCESS_KEYS = ['can_view_profile_photo'];
const ADDITIONAL_ACCESS_KEYS = [
  'can_view_additional_photos',
  'additional_photo_access_granted',
  'has_additional_photo_access',
];
const ACCEPTED_PHOTO_ACCESS = new Set([
  'accepted',
  'approved',
  'granted',
  'allowed',
]);
const ADDITIONAL_VISIBILITY_KEYS = [
  'additional_photos_visible',
  'additionalPhotosVisible',
];
const PICTURE_HIDDEN_KEYS = [
  'profile_photo_hidden',
  'profilePhotoHidden',
  'hide_profile_photo',
  'is_profile_photo_hidden',
  'photos_hidden',
];
const ADDITIONAL_HIDDEN_KEYS = [
  'additional_photos_hidden',
  'additionalPhotosHidden',
  'hide_additional_photos',
];

const pickVisibilityFromSource = (
  source: unknown,
  keys: string[],
): boolean | undefined => {
  if (!isPlainObject(source)) {
    return undefined;
  }

  for (const key of keys) {
    const parsed = parseVisibilityFlag(source[key]);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
};

export const resolveMatchPhotoVisibility = (item?: MatchApiItem | null) => {
  if (!item) {
    return { pictureVisible: undefined, additionalVisible: undefined };
  }

  const sources: unknown[] = [
    item.visibility,
    item.photo_visibility,
    (item as { photo_privacy?: unknown }).photo_privacy,
    (item as { privacy?: unknown }).privacy,
    (item as { settings?: unknown }).settings,
    item.user?.visibility,
    item.user?.photo_visibility,
    item.profile?.visibility,
    item.profile?.photo_visibility,
    item,
    item.user,
    item.profile,
  ];

  let pictureVisible: boolean | undefined;
  let additionalVisible: boolean | undefined;

  sources.forEach(source => {
    if (pictureVisible === undefined) {
      const hidden = pickVisibilityFromSource(source, PICTURE_HIDDEN_KEYS);
      if (hidden === true) {
        pictureVisible = false;
      } else {
        pictureVisible = pickVisibilityFromSource(
          source,
          PICTURE_VISIBILITY_KEYS,
        );
      }
    }
    if (additionalVisible === undefined) {
      const hidden = pickVisibilityFromSource(source, ADDITIONAL_HIDDEN_KEYS);
      if (hidden === true) {
        additionalVisible = false;
      } else {
        additionalVisible = pickVisibilityFromSource(
          source,
          ADDITIONAL_VISIBILITY_KEYS,
        );
      }
    }
  });

  const statusGranted = (source: unknown) => {
    if (!isPlainObject(source)) {
      return false;
    }

    const status = [
      source.photo_access_status,
      source.photo_request_status,
      source.access_status,
    ].find(value => typeof value === 'string' && value.trim());

    return ACCEPTED_PHOTO_ACCESS.has(String(status ?? '').trim().toLowerCase());
  };
  const grants = (source: unknown, keys: string[]) =>
    pickVisibilityFromSource(source, keys) === true;
  const generalGrant = sources.some(
    source => grants(source, GENERAL_ACCESS_KEYS) || statusGranted(source),
  );
  const profileGrant =
    generalGrant ||
    sources.some(source => grants(source, PROFILE_ACCESS_KEYS));
  const additionalGrant =
    generalGrant ||
    sources.some(source => grants(source, ADDITIONAL_ACCESS_KEYS));

  if (profileGrant) {
    pictureVisible = true;
  }

  if (additionalGrant) {
    additionalVisible = true;
  }

  return { pictureVisible, additionalVisible };
};

const withVisibleMedia = (item: MatchApiItem): MatchApiItem => {
  const { pictureVisible, additionalVisible } = resolveMatchPhotoVisibility(item);
  const next: MatchApiItem = {
    ...item,
    ...(pictureVisible !== undefined
      ? { profile_photo_visible: pictureVisible }
      : {}),
    ...(additionalVisible !== undefined
      ? { additional_photos_visible: additionalVisible }
      : {}),
  };

  const showPicture = pictureVisible ?? true;
  const showAdditional = additionalVisible ?? true;

  if (showPicture && showAdditional) {
    return next;
  }

  const photos = Array.isArray(next.photos) ? [...next.photos] : [];

  if (!showPicture) {
    next.profile_photo = null;
    next.image = null;
    next.photo = null;
    next.avatar = null;
    next.photos = showAdditional ? photos.slice(1) : [];
    return next;
  }

  next.photos = photos.slice(0, 1);
  return next;
};

const normalizeItem = (item: MatchApiItem): MatchApiItem => {
  const nested = item.user ?? item.profile;

  if (nested && typeof nested === 'object') {
    return withVisibleMedia({
      ...stripEmptyMedia(item),
      ...stripEmptyMedia(nested),
    });
  }

  return withVisibleMedia(item);
};

const resolveProfileImage = (
  ...items: MatchApiItem[]
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

const locationPart = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (!isPlainObject(value)) {
    return '';
  }

  return locationPart(
    value.name ??
      value.title ??
      value.city_name ??
      value.city ??
      value.country_name ??
      value.country,
  );
};

const resolveLocation = (item: MatchApiItem) => {
  if (typeof item.location === 'string' && item.location.trim()) {
    return item.location.trim();
  }

  const locationObj = isPlainObject(item.location) ? item.location : null;
  const city =
    locationPart(item.city) ||
    locationPart(locationObj?.city) ||
    locationPart(locationObj?.name);
  const state = locationPart(item.state) || locationPart(locationObj?.state);
  const country =
    locationPart(item.country) || locationPart(locationObj?.country);

  return [city, state, country].filter(Boolean).join(', ');
};

const resolveId = (item: MatchApiItem, index: number) => {
  const id = item.id ?? item.user_id;

  if (id !== undefined && id !== null && String(id).trim()) {
    return String(id);
  }

  return `match-${index}`;
};

const resolveTier = (value?: string | null): 'VIP' | 'VVIP' => {
  if (value?.toUpperCase().includes('VVIP')) {
    return 'VVIP';
  }

  return 'VIP';
};

const buildTags = (item: MatchApiItem): MatchTag[] => {
  const tags: MatchTag[] = [];
  const education = pickString(
    item.qualification,
    item.highest_education,
    item.field_of_study,
    item.education,
  );
  const profession = pickString(
    item.job_title,
    item.occupation,
    item.profession,
    item.employment_type,
  );
  const community = pickString(item.community, item.religion);

  if (education) {
    tags.push({ icon: 'school-outline', label: education });
  }

  if (profession) {
    tags.push({ icon: 'briefcase-outline', label: profession });
  }

  if (community) {
    tags.push({ icon: 'heart-outline', label: community });
  }

  return tags;
};

const isPhoneVerified = (profile: MatchApiItem) =>
  parseVisibilityFlag(profile.is_verified) === true ||
  parseVisibilityFlag(profile.phone_verified) === true ||
  parseVisibilityFlag(profile.is_phone_verified) === true ||
  Boolean(pickString(profile.phone_verified_at));

const readMatchLiked = (profile: MatchApiItem) => {
  const value = profile.is_liked ?? profile.is_like ?? profile.liked;
  return value === true || value === 1 || value === '1' || value === 'true';
};

export const mapFeaturedMatch = (
  item: MatchApiItem,
  index: number,
): FeaturedMatch => {
  const profile = normalizeItem(item);
  const pictureHidden =
    resolveMatchPhotoVisibility(profile).pictureVisible === false;

  return {
    id: resolveId(profile, index),
    name:
      pickString(profile.name, profile.full_name, profile.fullName) ||
      'Profile',
    age: pickNumber(profile.age),
    location: resolveLocation(profile) || '-',
    image: resolveProfileImage(profile),
    tags: buildTags(profile),
    isNew: Boolean(profile.is_new ?? profile.is_new_profile),
    isVerified: isPhoneVerified(profile),
    isLiked: readMatchLiked(profile),
    ...(pictureHidden ? { pictureHidden: true } : {}),
  };
};

export const mapSuggestedMatch = (
  item: MatchApiItem,
  index: number,
): SuggestedMatch => {
  const profile = normalizeItem(item);
  const location = resolveLocation(profile) || '-';
  const city = locationPart(profile.city) || location.split(',')[0]?.trim();
  const rawDistance = profile.distance_km ?? profile.distance;
  const distanceKm =
    rawDistance == null || rawDistance === ''
      ? undefined
      : pickNumber(rawDistance);

  return {
    id: resolveId(profile, index),
    name:
      pickString(profile.name, profile.full_name, profile.fullName) ||
      'Profile',
    age: pickNumber(profile.age),
    location,
    ...(city && city !== '-' ? { city } : {}),
    ...(distanceKm != null ? { distanceKm } : {}),
    ...(profile.is_new || profile.is_new_profile
      ? { isNew: true }
      : {}),
    ...(pickString(
      profile.created_at,
      profile.joined_at,
      profile.registered_at,
      profile.createdAt,
      profile.joined_date,
      profile.registered_on,
    )
      ? {
          createdAt: pickString(
            profile.created_at,
            profile.joined_at,
            profile.registered_at,
            profile.createdAt,
            profile.joined_date,
            profile.registered_on,
          ),
        }
      : {}),
    profession:
      pickString(
        profile.job_title,
        profile.occupation,
        profile.profession,
        profile.employment_type,
      ) || '-',
    image: resolveProfileImage(profile),
    tier: resolveTier(
      profile.tier ?? profile.plan ?? profile.subscription_plan,
    ),
    isVerified: isPhoneVerified(profile),
    isLiked: readMatchLiked(profile),
    ...(resolveMatchPhotoVisibility(profile).pictureVisible === false
      ? { pictureHidden: true }
      : {}),
  };
};

const extractMatchList = (response?: MatchListResponse | null) => {
  const normalized = normalizeMatchListResponse(response);

  if (!normalized) {
    return [];
  }

  if (Array.isArray(normalized.data)) {
    return normalized.data;
  }

  if (Array.isArray(normalized.profiles)) {
    return normalized.profiles;
  }

  if (Array.isArray(normalized.matches)) {
    return normalized.matches;
  }

  if (Array.isArray(normalized.results)) {
    return normalized.results;
  }

  if (Array.isArray(normalized.users)) {
    return normalized.users;
  }

  if (Array.isArray(normalized.recommendations)) {
    return normalized.recommendations;
  }

  if (Array.isArray(normalized.suggested_matches)) {
    return normalized.suggested_matches;
  }

  if (Array.isArray(normalized.exact_matches)) {
    return normalized.exact_matches;
  }

  return [];
};

export const normalizeMatchListResponse = (
  source?: MatchListResponse | null,
): MatchListResponse => {
  if (!source || typeof source !== 'object') {
    return {};
  }

  let merged: MatchListResponse = { ...source };
  const dataField = merged.data;

  if (dataField && typeof dataField === 'object' && !Array.isArray(dataField)) {
    merged = {
      ...merged,
      ...(dataField as MatchListResponse),
    };
  }

  return merged;
};

export const resolveOppositeGender = (gender?: string | null) => {
  const value = gender?.toLowerCase();

  if (value === 'male') {
    return 'female';
  }

  if (value === 'female') {
    return 'male';
  }

  return 'female';
};

export type SearchQueryCatalogs = {
  cities?: string[];
  professions?: string[];
};

const matchCatalogValue = (list: string[] | undefined, query: string) => {
  if (!list?.length || !query) {
    return undefined;
  }

  const lower = query.toLowerCase();
  const exact = list.find(item => item.toLowerCase() === lower);

  if (exact) {
    return exact;
  }

  const partial = list.filter(
    item =>
      item.toLowerCase().includes(lower) || lower.includes(item.toLowerCase()),
  );

  return partial.length === 1 ? partial[0] : undefined;
};

export const parseSearchQuery = (
  searchQuery: string,
  catalogs?: SearchQueryCatalogs,
) => {
  const trimmed = searchQuery.trim();

  if (!trimmed) {
    return {
      name: undefined,
      profession: undefined,
      city: undefined,
      search: undefined,
    };
  }

  const prefixMatch = trimmed.match(
    /^(name|profession|job|city|location)\s*[:=]\s*(.+)$/i,
  );

  if (prefixMatch) {
    const key = prefixMatch[1].toLowerCase();
    const value = prefixMatch[2].trim();

    if (key === 'profession' || key === 'job') {
      return {
        name: undefined,
        profession: value,
        city: undefined,
        search: undefined,
      };
    }

    if (key === 'city' || key === 'location') {
      return {
        name: undefined,
        profession: undefined,
        city: value,
        search: undefined,
      };
    }

    return {
      name: value,
      profession: undefined,
      city: undefined,
      search: undefined,
    };
  }

  const commaIndex = trimmed.indexOf(',');

  if (commaIndex !== -1) {
    const profession = trimmed.slice(0, commaIndex).trim();
    const city = trimmed.slice(commaIndex + 1).trim();

    return {
      name: undefined,
      profession: profession || undefined,
      city: city || undefined,
      search: undefined,
    };
  }

  const city = matchCatalogValue(catalogs?.cities, trimmed);
  if (city) {
    return {
      name: undefined,
      profession: undefined,
      city,
      search: undefined,
    };
  }

  const profession = matchCatalogValue(catalogs?.professions, trimmed);
  if (profession) {
    return {
      name: undefined,
      profession,
      city: undefined,
      search: undefined,
    };
  }

  return {
    name: trimmed,
    profession: undefined,
    city: undefined,
    search: trimmed,
  };
};

export const profileMatchesSearchQuery = (
  match: Pick<SuggestedMatch, 'name' | 'profession' | 'location'> & {
    city?: string;
  },
  searchQuery: string,
  catalogs?: SearchQueryCatalogs,
) => {
  const trimmed = searchQuery.trim();

  if (!trimmed) {
    return true;
  }

  const parsed = parseSearchQuery(trimmed, catalogs);
  const name = match.name.toLowerCase();
  const profession = (match.profession || '').toLowerCase();
  const location = (match.location || '').toLowerCase();
  const city = (match.city || '').toLowerCase();
  const place = `${location} ${city}`.trim();

  if (parsed.profession && parsed.city) {
    return (
      profession.includes(parsed.profession.toLowerCase()) &&
      place.includes(parsed.city.toLowerCase())
    );
  }

  if (parsed.profession) {
    return profession.includes(parsed.profession.toLowerCase());
  }

  if (parsed.city) {
    return place.includes(parsed.city.toLowerCase());
  }

  const needle = (parsed.name || parsed.search || trimmed).toLowerCase();
  const haystack = `${name} ${profession} ${place}`;

  if (haystack.includes(needle)) {
    return true;
  }

  const tokens = needle.split(/\s+/).filter(token => token.length >= 2);
  return tokens.length > 0 && tokens.every(token => haystack.includes(token));
};

export type BuildSearchParamsInput = {
  searchQuery?: string;
  quickFilter?: string | null;
  quickFilterLabel?: string | null;
  quickFilters?: Record<string, boolean | undefined>;
  profileGender?: string | null;
  profileCity?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  ageMin?: number;
  ageMax?: number;
  city?: string;
  country?: string;
  religion?: string;
  maritalStatus?: string;
  education?: string;
  profession?: string;
  heightMin?: number;
  heightMax?: number;
  searchCatalogs?: SearchQueryCatalogs;
};

export const buildMatchSearchParams = ({
  searchQuery = '',
  quickFilter = null,
  quickFilterLabel = null,
  quickFilters,
  profileGender,
  profileCity,
  latitude,
  longitude,
  ageMin,
  ageMax,
  city,
  country,
  religion,
  maritalStatus,
  education,
  profession,
  heightMin,
  heightMax,
  searchCatalogs,
}: BuildSearchParamsInput): MatchSearchParams => {
  const params: MatchSearchParams = {};
  const parsedSearch = parseSearchQuery(searchQuery, searchCatalogs);

  if (profileGender) {
    params.gender = resolveOppositeGender(profileGender);
  }

  if (ageMin !== undefined) {
    params.age_min = ageMin;
  }

  if (ageMax !== undefined) {
    params.age_max = ageMax;
  }

  if (city?.trim()) {
    params.city = city.trim();
  }

  if (country?.trim()) {
    params.country = country.trim();
  }

  if (religion?.trim()) {
    params.religion = religion.trim();
  }

  if (maritalStatus?.trim()) {
    params.marital_status = maritalStatus.trim().toLowerCase();
  }

  if (education?.trim()) {
    params.education = education.trim();
  }

  if (profession?.trim()) {
    params.profession = profession.trim();
  }

  if (heightMin !== undefined) {
    params.height_min = heightMin;
  }

  if (heightMax !== undefined) {
    params.height_max = heightMax;
  }

  if (parsedSearch.search) {
    params.search = parsedSearch.search;
    params.q = parsedSearch.search;
  }

  if (parsedSearch.name) {
    params.name = parsedSearch.name;
    if (!params.search) {
      params.search = parsedSearch.name;
      params.q = parsedSearch.name;
    }
  }

  if (!profession?.trim() && parsedSearch.profession) {
    params.profession = parsedSearch.profession;
  }

  if (!city?.trim() && parsedSearch.city) {
    params.city = parsedSearch.city;
  }

  const skipLocationOverlay = Boolean(parsedSearch.city);

  if (quickFilters) {
    Object.entries(quickFilters).forEach(([key, enabled]) => {
      if (!enabled) {
        return;
      }

      const kind = classifyLocationQuickFilter(key, key);
      if (skipLocationOverlay && (kind === 'same_city' || kind === 'near_me')) {
        return;
      }

      params[toSearchQueryKey(key)] = 1;
    });
    applyLocationFilterParams(
      params,
      Object.entries(quickFilters)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => ({ id: key, label: key }))
        .filter(item => {
          if (!skipLocationOverlay) {
            return true;
          }

          const kind = classifyLocationQuickFilter(item.id, item.label);
          return kind !== 'same_city' && kind !== 'near_me';
        }),
      { profileCity, country, latitude, longitude },
    );
  } else if (quickFilter) {
    const locationKind = classifyLocationQuickFilter(
      quickFilter,
      quickFilterLabel,
    );
    const skipThisLocation =
      skipLocationOverlay &&
      (locationKind === 'same_city' || locationKind === 'near_me');
    const key = toSearchQueryKey(quickFilter);
    if (
      !skipThisLocation &&
      key !== 'city' &&
      key !== 'location'
    ) {
      params[key] = 1;
    }
    if (!skipThisLocation) {
      applyLocationFilterParams(
        params,
        [{ id: quickFilter, label: quickFilterLabel || quickFilter }],
        {
          profileCity,
          country,
          latitude,
          longitude,
        },
      );
    }
  }

  return params;
};

const toSearchQueryKey = (key: string) =>
  key
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase() || key;

const isFallbackUsed = (value?: boolean | number | string | null) => {
  if (value === true || value === 1) {
    return true;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }

  return false;
};

export const mapMatchList = (
  response?: MatchListResponse | null,
): SuggestedMatch[] => extractMatchList(response).map(mapSuggestedMatch);

export const pickMatchListTotal = (
  response?: MatchListResponse | null,
  fallback = 0,
) => {
  const paginationTotal = pickNumber(response?.pagination?.total);
  const total = pickNumber(response?.total);

  if (paginationTotal) {
    return paginationTotal;
  }

  if (total) {
    return total;
  }

  return fallback || extractMatchList(response).length;
};

const mapSuggestedMatches = (items?: MatchApiItem[] | null) =>
  (items ?? []).map(mapSuggestedMatch);

const pickMatchArray = (...lists: Array<MatchApiItem[] | null | undefined>) => {
  for (const list of lists) {
    if (Array.isArray(list) && list.length) {
      return list;
    }
  }

  return [];
};

export const mapFilterMatchGroups = (
  response?: MatchListResponse | null,
) => {
  const normalized = normalizeMatchListResponse(response);
  const fallbackUsed = isFallbackUsed(normalized.fallback_used);
  const exactItems = pickMatchArray(normalized.exact_matches);
  const suggestedItems = pickMatchArray(normalized.suggested_matches);
  const general = extractMatchList(normalized);

  if (exactItems.length) {
    return {
      exact: exactItems.map(mapSuggestedMatch),
      suggested: [] as SuggestedMatch[],
      fallbackUsed: false,
    };
  }

  if (fallbackUsed) {
    const pool = suggestedItems.length ? suggestedItems : general;

    return {
      exact: [] as SuggestedMatch[],
      suggested: pool.map(mapSuggestedMatch),
      fallbackUsed: true,
    };
  }

  const pool = general.length ? general : suggestedItems;

  return {
    exact: pool.map(mapSuggestedMatch),
    suggested: [] as SuggestedMatch[],
    fallbackUsed: false,
  };
};

const normalizeHomeResponse = (
  source?: HomeMatchesResponse | null,
  depth = 0,
): HomeMatchesResponse => {
  if (!source || typeof source !== 'object' || depth > 4) {
    return source && typeof source === 'object' ? source : {};
  }

  if (Array.isArray(source.data)) {
    return {
      ...source,
      suggested_matches: pickMatchArray(
        source.suggested_matches,
        source.data,
      ),
      matches: pickMatchArray(source.matches, source.data),
    };
  }

  if (source.data && typeof source.data === 'object') {
    const { data: _ignored, ...rest } = source;
    return normalizeHomeResponse(
      {
        ...rest,
        ...source.data,
      },
      depth + 1,
    );
  }

  return source;
};

const extractFeaturedMatches = (response: HomeMatchesResponse) => {
  const featured = pickMatchArray(
    response.featured_matches,
    response.featured,
  );

  if (featured.length) {
    return featured;
  }

  if (response.top_match) {
    return [response.top_match];
  }

  return [];
};

const extractSuggestedMatches = (response: HomeMatchesResponse) => {
  return pickMatchArray(
    response.suggested_matches,
    response.exact_matches,
    response.matches,
    response.profiles,
    response.results,
    response.users,
    response.recommendations,
  );
};

const collectHomeMatchItems = (response: HomeMatchesResponse) => {
  const seen = new Set<string>();
  const items: MatchApiItem[] = [];

  [
    ...extractFeaturedMatches(response),
    ...extractSuggestedMatches(response),
  ].forEach((item, index) => {
    const id = String(item.id ?? item.user_id ?? `home-${index}`);
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    items.push(item);
  });

  return items;
};

const pickHomeViewer = (data: HomeMatchesResponse): MatchApiItem | null => {
  const candidates = [data.user, data.me, data.current_user, data.viewer];
  return candidates.find(item => item && typeof item === 'object') ?? null;
};

const FREE_MEMBERSHIP_KEYS = new Set(['', 'free', 'none', 'null']);
const PAID_BADGE_HINTS = ['vip', 'vvip', 'premium', 'platinum', 'gold', 'paid'];

const isPaidMembershipBadge = (value?: string | null) => {
  const key = String(value ?? '')
    .trim()
    .toLowerCase();
  return Boolean(key) && !FREE_MEMBERSHIP_KEYS.has(key);
};

const isPaidFlag = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 'true';

const planLooksPaid = (value: unknown) => {
  if (typeof value === 'string') {
    return isPaidMembershipBadge(value);
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const plan = value as Record<string, unknown>;
  return (
    isPaidMembershipBadge(
      pickString(
        typeof plan.type === 'string' ? plan.type : null,
        typeof plan.name === 'string' ? plan.name : null,
        typeof plan.plan === 'string' ? plan.plan : null,
        typeof plan.title === 'string' ? plan.title : null,
        typeof plan.membership_badge === 'string' ? plan.membership_badge : null,
      ),
    ) ||
    isPaidFlag(plan.is_paid) ||
    isPaidFlag(plan.is_premium)
  );
};

const pickHomeMembership = (data: HomeMatchesResponse) => {
  const viewer = pickHomeViewer(data);
  const extra = data as HomeMatchesResponse & Record<string, unknown>;
  const viewerExtra = viewer as (MatchApiItem & Record<string, unknown>) | null;
  const membershipBadge =
    pickString(
      data.membership_badge,
      data.membershipBadge,
      viewer?.membership_badge,
      viewer?.membershipBadge,
    ) || null;
  const rawBadges = data.badges ?? viewer?.badges ?? [];
  const membershipBadges = Array.isArray(rawBadges)
    ? rawBadges
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : [];
  const badgesLookPaid = membershipBadges.some(item =>
    PAID_BADGE_HINTS.some(hint => item.toLowerCase().includes(hint)),
  );
  const hasPaidPackage =
    isPaidMembershipBadge(membershipBadge) ||
    badgesLookPaid ||
    isPaidFlag(extra.is_premium) ||
    isPaidFlag(extra.has_subscription) ||
    isPaidFlag(extra.is_paid) ||
    isPaidFlag(viewerExtra?.is_premium) ||
    isPaidFlag(viewerExtra?.has_subscription) ||
    isPaidFlag(viewerExtra?.is_paid) ||
    planLooksPaid(extra.current_plan) ||
    planLooksPaid(extra.subscription) ||
    planLooksPaid(extra.membership) ||
    planLooksPaid(viewerExtra?.current_plan) ||
    planLooksPaid(viewerExtra?.subscription) ||
    planLooksPaid(viewerExtra?.membership);

  return { membershipBadge, membershipBadges, hasPaidPackage };
};

const splitGreeting = (greeting: string) => {
  const dotIndex = greeting.indexOf('. ');

  if (dotIndex === -1) {
    return { title: greeting, subtitle: '' };
  }

  return {
    title: greeting.slice(0, dotIndex + 1),
    subtitle: greeting.slice(dotIndex + 2),
  };
};

export const mapHomeMatches = (
  response?: HomeMatchesResponse | null,
): HomeMatchesData => {
  const data = normalizeHomeResponse(response);
  const allItems = collectHomeMatchItems(data);
  let featuredItems = extractFeaturedMatches(data);
  let suggestedItems = allItems.filter(item => {
    const featuredIds = new Set(
      featuredItems.map(featured => String(featured.id ?? featured.user_id ?? '')),
    );
    return !featuredIds.has(String(item.id ?? item.user_id ?? ''));
  });

  if (!featuredItems.length && suggestedItems.length) {
    featuredItems = [suggestedItems[0]];
    suggestedItems = suggestedItems.slice(1);
  }

  const mapped = {
    greeting: pickString(data.greeting),
    totalMatches:
      pickNumber(data.total_matches) ||
      featuredItems.length + suggestedItems.length,
    featuredMatches: featuredItems.map(mapFeaturedMatch),
    suggestedMatches: mapSuggestedMatches(suggestedItems),
    ...pickHomeMembership(data),
  };

  console.log('GET /matches/home mapped names:', [
    ...mapped.featuredMatches.map(item => item.name),
    ...mapped.suggestedMatches.map(item => item.name),
  ]);

  return mapped;
};

export const suggestedToFeatured = (item: SuggestedMatch): FeaturedMatch => ({
  id: item.id,
  name: item.name,
  age: item.age,
  location: item.location,
  image: item.pictureHidden ? Images.hiddenProfile : item.image,
  tags:
    item.profession && item.profession !== '-'
      ? [{ icon: 'briefcase-outline', label: item.profession }]
      : [],
  isVerified: item.isVerified,
  isLiked: Boolean(item.isLiked),
  ...(item.pictureHidden ? { pictureHidden: true } : {}),
});

const locationProximityScore = (
  location: string,
  city?: string | null,
  country?: string | null,
) => {
  const loc = location.toLowerCase();
  const cityKey = city?.trim().toLowerCase();
  const countryKey = country?.trim().toLowerCase();
  let score = 0;

  if (cityKey && loc.includes(cityKey)) {
    score += 2;
  }
  if (countryKey && loc.includes(countryKey)) {
    score += 1;
  }

  return score;
};

export const arrangeHomeMatchesByProximity = (
  featured: FeaturedMatch[],
  suggested: SuggestedMatch[],
  city?: string | null,
  country?: string | null,
) => {
  const featuredIds = new Set(featured.map(item => item.id));
  const uniqueSuggested = suggested.filter(item => !featuredIds.has(item.id));

  if (!featured.length && uniqueSuggested.length) {
    const nearest = [...uniqueSuggested].sort(
      (a, b) =>
        locationProximityScore(b.location, city, country) -
        locationProximityScore(a.location, city, country),
    )[0];

    return {
      featuredMatches: [suggestedToFeatured(nearest)],
      suggestedMatches: uniqueSuggested.filter(item => item.id !== nearest.id),
    };
  }

  const featuredMatches = [...featured].sort(
    (a, b) =>
      locationProximityScore(b.location, city, country) -
      locationProximityScore(a.location, city, country),
  );

  return {
    featuredMatches,
    suggestedMatches: uniqueSuggested,
  };
};

export const mapListToHomeMatches = (
  items: SuggestedMatch[],
  greeting = '',
): HomeMatchesData => {
  if (!items.length) {
    return {
      greeting,
      totalMatches: 0,
      featuredMatches: [],
      suggestedMatches: [],
    };
  }

  const mapped = {
    greeting,
    totalMatches: items.length,
    featuredMatches: [suggestedToFeatured(items[0])],
    suggestedMatches: items.length > 1 ? items.slice(1) : items,
  };
  return mapped;
};

export const mapHomeGreeting = (greeting: string) => splitGreeting(greeting);

export const mapBestMatch = (
  response?: BestMatchResponse | null,
): BestMatchData | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const source =
    response.profile ??
    (response.data &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data)
      ? response.data.profile
      : null) ??
    response;

  const matchScore =
    response.match_score ??
    (response.data &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data)
      ? response.data.match_score
      : null);

  if (!source || typeof source !== 'object') {
    return null;
  }

  const profile = unwrapMatchRecord(source);

  if (!pickString(profile.name, profile.full_name, profile.fullName) && !profile.id) {
    return null;
  }

  return {
    id: resolveId(profile, 0),
    name:
      pickString(profile.name, profile.full_name, profile.fullName) ||
      'Profile',
    age: pickNumber(profile.age),
    location: resolveLocation(profile) || '-',
    matchScore: pickNumber(matchScore),
    image: resolveProfileImage(profile),
  };
};

const parseLanguages = (value?: string | string[] | null) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const formatDetailValue = (label: string, value: string) => {
  if (!value || value === '-') {
    return '-';
  }

  if (label === 'Age' && !value.includes('year')) {
    return `${value} years`;
  }

  return value;
};

const unwrapMatchRecord = (
  source?: unknown,
  depth = 0,
): MatchApiItem => {
  if (depth > 5) {
    return isPlainObject(source) ? normalizeItem(source as MatchApiItem) : {};
  }

  if (Array.isArray(source)) {
    return unwrapMatchRecord(source[0], depth + 1);
  }

  if (!isPlainObject(source)) {
    return {};
  }

  const record = source as MatchApiItem & {
    data?: unknown;
    match?: unknown;
  };
  const nested = [record.data, record.user, record.profile, record.match].find(
    value =>
      (Array.isArray(value) && value.length > 0) || isPlainObject(value),
  );

  if (nested && nested !== record) {
    const inner = unwrapMatchRecord(nested, depth + 1);
    return normalizeItem({ ...record, ...inner });
  }

  return normalizeItem(record);
};

export type MatchProfilePreview = {
  name?: string;
  age?: number;
  location?: string;
  image?: ImageSourcePropType;
  isVerified?: boolean;
  pictureHidden?: boolean;
};

const isTruthyFlag = (value?: boolean | number | string | null) =>
  value === true || value === 1 || value === '1' || value === 'true';

const isRemoteProfileImage = (image?: ImageSourcePropType | null) =>
  Boolean(
    image &&
      typeof image === 'object' &&
      !Array.isArray(image) &&
      'uri' in image &&
      typeof image.uri === 'string' &&
      image.uri,
  );

export const mapMatchProfileDetail = (
  response: MatchProfileResponse | null | undefined,
  profileId: string,
  preview?: MatchProfilePreview | null,
) => {
  const profile = unwrapMatchRecord(response);
  const education = pickString(
    profile.qualification,
    profile.highest_education,
    profile.field_of_study,
    profile.education,
  );
  const profession = pickString(
    profile.job_title,
    profile.occupation,
    profile.profession,
    profile.employment_type,
  );
  const community = pickString(profile.community, profile.religion);
  const residentialStatus = pickString(
    profile.residential_status,
    profile.residence_status,
  );
  const visibility = resolveMatchPhotoVisibility(profile);
  const resolvedImage = resolveProfileImage(profile);
  const pictureIsHidden =
    visibility.pictureVisible === false ||
    (visibility.pictureVisible === undefined && Boolean(preview?.pictureHidden));
  const image = pictureIsHidden
    ? Images.hiddenProfile
    : visibility.pictureVisible === undefined &&
        preview?.image &&
        !isRemoteProfileImage(preview.image)
      ? preview.image
      : response
        ? resolvedImage
        : preview?.image ?? resolvedImage;
  const age = pickNumber(profile.age) || preview?.age || 0;
  const city =
    pickString(profile.city) ||
    pickString(preview?.location?.split(',')[0]) ||
    '-';
  const height = pickString(profile.height) || '-';
  const maritalStatus = toDisplayMaritalStatus(profile.marital_status) || '-';
  const motherTongue = pickString(profile.mother_tongue) || '-';

  const quickInfo = [
    education
      ? { icon: 'school-outline', title: education, subtitle: 'Education' }
      : null,
    profession
      ? {
          icon: 'briefcase-outline',
          title: profession,
          subtitle: 'Profession',
        }
      : null,
    community
      ? {
          iconSource: Images.religionIcon,
          title: community,
          subtitle: 'Religion',
        }
      : null,
    residentialStatus
      ? {
          icon: 'home-outline',
          title: residentialStatus,
          subtitle: 'Residential Status',
        }
      : null,
  ].filter(Boolean) as QuickInfo[];

  const basicDetails = [
    {
      icon: 'account-outline',
      label: 'Age',
      value: formatDetailValue('Age', String(age || '-')),
    },
    { icon: 'map-marker-outline', label: 'City', value: city },
    { icon: 'human-male-height', label: 'Height', value: height },
    { icon: 'heart-outline', label: 'Marital Status', value: maritalStatus },
    community
      ? {
          iconSource: Images.religionIcon,
          label: 'Religion',
          value: community,
        }
      : null,
    {
      icon: 'account-group-outline',
      label: 'Community',
      value: community || '-',
    },
    { icon: 'earth', label: 'Mother Tongue', value: motherTongue },
  ].filter(Boolean) as BasicDetail[];

  return {
    id: profileId,
    fullName:
      pickString(profile.name, profile.full_name, profile.fullName) ||
      preview?.name ||
      'Profile',
    age,
    location:
      resolveLocation(profile) ||
      (city !== '-' ? city : '') ||
      preview?.location ||
      '-',
    image,
    tier: resolveTier(profile.tier ?? profile.plan ?? profile.subscription_plan),
    isVerified: Boolean(profile.is_verified || preview?.isVerified),
    about:
      pickString(
        profile.bio,
        profile.about,
        profile.about_me,
        profile.description,
      ) || 'No description available.',
    quickInfo,
    basicDetails,
    languages: parseLanguages(profile.other_languages),
    interests: Array.isArray(profile.interests)
      ? profile.interests.filter(Boolean).map(String)
      : [],
    isLiked: [profile.is_liked, profile.is_like, profile.liked].some(isTruthyFlag),
    photosNeedAccess: profileNeedsPhotoAccess(profile, image),
    pictureHidden: pictureIsHidden,
    additionalPhotosHidden: visibility.additionalVisible === false,
  };
};

export const profileNeedsPhotoAccess = (
  profile: MatchApiItem,
  displayedImage?: ImageSourcePropType | null,
): boolean => {
  const { pictureVisible, additionalVisible } =
    resolveMatchPhotoVisibility(profile);

  if (pictureVisible === false || additionalVisible === false) {
    return true;
  }

  if (isRemoteProfileImage(displayedImage)) {
    return false;
  }

  return false;
};
