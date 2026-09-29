import type { MatchFilterParams, MatchSearchParams, SuggestedMatch } from './matchMapper';

export const NEAR_ME_RADIUS_KM = 50;
export const JOINED_WITHIN_DAYS = 3;
const JOINED_WITHIN_MS = JOINED_WITHIN_DAYS * 24 * 60 * 60 * 1000;

export type LocationQuickFilterKind =
  | 'same_city'
  | 'near_me'
  | 'nearby'
  | 'recent'
  | 'verified'
  | 'other';

export type QuickFilterRef =
  | string
  | { id?: string | null; label?: string | null }
  | null
  | undefined;

const toKey = (value: string) =>
  value
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();

const asFilterRef = (value: QuickFilterRef) => {
  if (typeof value === 'string') {
    return { id: value, label: value };
  }

  return { id: value?.id ?? '', label: value?.label ?? '' };
};

export const classifyLocationQuickFilter = (
  key?: string | null,
  label?: string | null,
): LocationQuickFilterKind => {
  const fromKey = classifyToken(key);
  const fromLabel = classifyToken(label);

  if (fromKey === 'verified' || fromLabel === 'verified') {
    return 'verified';
  }

  if (fromKey === 'recent' || fromLabel === 'recent') {
    return 'recent';
  }

  if (fromKey === 'near_me' || fromLabel === 'near_me') {
    return 'near_me';
  }

  if (fromKey === 'same_city' || fromLabel === 'same_city') {
    return 'same_city';
  }

  if (fromKey !== 'other') {
    return fromKey;
  }

  return fromLabel;
};

const classifyToken = (value?: string | null): LocationQuickFilterKind => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'other';
  }

  const id = toKey(value);
  const isSameCity =
    id === 'same_city' ||
    id === 'samecity' ||
    id.includes('same_city') ||
    (id.includes('same') && id.includes('city'));
  const isNearMe =
    id === 'near_me' ||
    id === 'nearme' ||
    id.includes('near_me') ||
    id.includes('within_50') ||
    id.includes('50_km') ||
    id.includes('50km') ||
    (id.includes('within') && id.includes('km')) ||
    id.includes('nearby') ||
    (id.includes('near') && !id.includes('nearly'));

  if (isSameCity) {
    return 'same_city';
  }

  if (isNearMe) {
    return 'near_me';
  }

  if (
    id.includes('joined') ||
    id.includes('last_3') ||
    id.includes('3_day') ||
    id.includes('3day') ||
    id === 'new_profiles' ||
    id === 'new_profile' ||
    id.includes('new_profile')
  ) {
    return 'recent';
  }

  if (
    id === 'verified' ||
    id.includes('verified') ||
    (id.includes('phone') && id.includes('verif'))
  ) {
    return 'verified';
  }

  return 'other';
};

export const cityKey = (value?: string | null) => {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  return value.split(',')[0].trim().toLowerCase();
};

export const resolveUserCity = (profile?: {
  city?: string | null;
  location?: string | null;
  state?: string | null;
} | null) => {
  const pickCityName = (value?: string | null) => {
    const text = value?.trim();
    if (!text || /^\d+$/.test(text)) {
      return '';
    }

    return text.split(',')[0].trim();
  };

  return (
    pickCityName(profile?.city) ||
    pickCityName(profile?.location) ||
    pickCityName(profile?.state)
  );
};

export const isSameCityLocation = (
  matchLocation?: string | null,
  profileCity?: string | null,
) => {
  const matchCity = cityKey(matchLocation);
  const origin = cityKey(profileCity);

  if (!matchCity || !origin || matchCity === '-') {
    return false;
  }

  if (matchCity === origin) {
    return true;
  }

  const shorter = matchCity.length <= origin.length ? matchCity : origin;
  const longer = matchCity.length > origin.length ? matchCity : origin;

  return shorter.length >= 3 && longer.startsWith(shorter);
};

const isSameCityMatch = (match: SuggestedMatch, profileCity?: string | null) =>
  isSameCityLocation(match.city, profileCity) ||
  isSameCityLocation(match.location, profileCity);

export type LocationFilterContext = {
  profileCity?: string | null;
  country?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const pickCoord = (value?: number | string | null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const kindsFromRefs = (quickFilterKeys: QuickFilterRef[]) =>
  new Set(
    quickFilterKeys
      .map(asFilterRef)
      .map(ref => classifyLocationQuickFilter(ref.id, ref.label))
      .filter(kind => kind !== 'other'),
  );

export const applyLocationFilterParams = <
  T extends MatchSearchParams | MatchFilterParams,
>(
  params: T,
  quickFilterKeys: QuickFilterRef[],
  context: LocationFilterContext = {},
): T => {
  const kinds = kindsFromRefs(quickFilterKeys);
  const city = resolveUserCity({
    city: context.profileCity,
  });
  const latitude = pickCoord(context.latitude);
  const longitude = pickCoord(context.longitude);

  if (kinds.has('same_city')) {
    params.same_city = 1;
    if (city) {
      params.city = city;
    }
  } else if (kinds.has('near_me')) {
    params.near_me = 1;
    params.radius = NEAR_ME_RADIUS_KM;
    params.radius_km = NEAR_ME_RADIUS_KM;
    if (city) {
      params.origin_city = city;
    }
    if (latitude != null) {
      params.latitude = latitude;
      params.lat = latitude;
    }
    if (longitude != null) {
      params.longitude = longitude;
      params.lng = longitude;
    }
  }

  if (kinds.has('recent')) {
    params.new_profiles = 1;
    params.new_profile = 1;
    params.joined_in_last_3_days = 1;
    params.last_3_days = 1;
    params.days = JOINED_WITHIN_DAYS;
  }

  if (kinds.has('verified')) {
    params.verified = 1;
    params.phone_verified = 1;
  }

  return params;
};

const pickDistanceKm = (match: SuggestedMatch) => {
  if (typeof match.distanceKm === 'number' && Number.isFinite(match.distanceKm)) {
    return match.distanceKm;
  }

  return null;
};

const isRecentMatch = (match: SuggestedMatch) => {
  if (match.isNew) {
    return true;
  }

  if (!match.createdAt) {
    return false;
  }

  const createdAt = Date.parse(match.createdAt);
  if (!Number.isFinite(createdAt)) {
    return false;
  }

  return Date.now() - createdAt <= JOINED_WITHIN_MS;
};

export const filterMatchesByLocation = (
  matches: SuggestedMatch[],
  kind: LocationQuickFilterKind,
  profileCity?: string | null,
): SuggestedMatch[] => {
  if (kind === 'other') {
    return matches;
  }

  if (kind === 'recent') {
    return matches.filter(isRecentMatch);
  }

  if (kind === 'verified') {
    return matches.filter(match => match.isVerified);
  }

  if (kind === 'same_city') {
    if (!profileCity?.trim()) {
      return [];
    }

    return matches.filter(match => isSameCityMatch(match, profileCity));
  }

  if (kind === 'near_me' || kind === 'nearby') {
    return matches.filter(match => {
      const distanceKm = pickDistanceKm(match);
      if (distanceKm != null) {
        return distanceKm <= NEAR_ME_RADIUS_KM;
      }

      return isSameCityMatch(match, profileCity);
    });
  }

  if (!profileCity?.trim()) {
    return matches;
  }

  return matches.filter(match => isSameCityMatch(match, profileCity));
};

export const filterMatchesByQuickFilters = (
  matches: SuggestedMatch[],
  quickFilterKeys: QuickFilterRef[],
  profileCity?: string | null,
) => {
  const kinds = [...kindsFromRefs(quickFilterKeys)];

  return kinds.reduce(
    (current, kind) => filterMatchesByLocation(current, kind, profileCity),
    matches,
  );
};

export const stabilizeMatchOrder = (matches: SuggestedMatch[]) =>
  [...matches].sort((left, right) => {
    const leftDistance = pickDistanceKm(left);
    const rightDistance = pickDistanceKm(right);

    if (leftDistance != null && rightDistance != null && leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    return left.id.localeCompare(right.id);
  });
