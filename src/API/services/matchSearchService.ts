import { Api } from '../Api';
import { getApiErrorMessage } from '../handleApiError';
import { isApiSuccess } from '../types';
import {
  buildMatchSearchParams,
  mapFilterMatchGroups,
  mapHomeMatches,
  parseSearchQuery,
  profileMatchesSearchQuery,
  type FeaturedMatch,
  type MatchListResponse,
  type SearchQueryCatalogs,
  type SuggestedMatch,
} from '../mappers/matchMapper';
import { mapFilterSetup, type FilterSetupData } from '../mappers/filterMapper';
import {
  classifyLocationQuickFilter,
  filterMatchesByQuickFilters,
  resolveUserCity,
  stabilizeMatchOrder,
} from '../mappers/matchLocationFilter';

export const MIN_SEARCH_LENGTH = 2;

export type MatchSearchQuery = {
  searchQuery?: string;
  quickFilter?: string | null;
  quickFilterLabel?: string | null;
  profileGender?: string | null;
  profileCity?: string | null;
  profileLocation?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  searchCatalogs?: SearchQueryCatalogs;
};

export type MatchSearchResult = {
  matches: SuggestedMatch[];
  emptyMessage: string;
  setup: FilterSetupData;
  isUserSearch: boolean;
};

const uniqueMatches = (matches: SuggestedMatch[]) => {
  const seen = new Set<string>();

  return matches.filter(match => {
    const key = match.id || `${match.name}-${match.location}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const featuredToSuggested = (item: FeaturedMatch): SuggestedMatch => ({
  id: item.id,
  name: item.name,
  age: item.age,
  location: item.location,
  profession: item.tags[0]?.label || '-',
  image: item.image,
  tier: 'VIP',
  isVerified: Boolean(item.isVerified),
  ...(item.pictureHidden ? { pictureHidden: true } : {}),
});

const poolFromSearchResponse = (
  data: Parameters<typeof mapFilterMatchGroups>[0],
  isUserSearch: boolean,
) => {
  const groups = mapFilterMatchGroups(data);
  return uniqueMatches(
    isUserSearch
      ? [...groups.exact, ...groups.suggested]
      : groups.exact.length
        ? groups.exact
        : groups.suggested,
  );
};

const homePoolFromResponse = (data: Parameters<typeof mapHomeMatches>[0]) => {
  const home = mapHomeMatches(data);
  return uniqueMatches([
    ...home.featuredMatches.map(featuredToSuggested),
    ...home.suggestedMatches,
  ]);
};

const filterBySubmittedQuery = (
  pool: SuggestedMatch[],
  trimmedQuery: string,
  catalogs: SearchQueryCatalogs,
) => {
  const named = pool.filter(match =>
    profileMatchesSearchQuery(match, trimmedQuery, catalogs),
  );
  if (named.length) {
    return named;
  }

  const needle = trimmedQuery.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  return pool.filter(match => match.name.toLowerCase().includes(needle));
};

const readFulfilledSearch = (
  result: PromiseSettledResult<{ status: number; data?: MatchListResponse } | null>,
) => {
  if (result.status !== 'fulfilled' || !result.value) {
    return null;
  }

  const res = result.value;
  if (!isApiSuccess(res?.status, res?.data?.success)) {
    return null;
  }

  return res.data ?? null;
};

export const buildSearchRequestKey = (query: MatchSearchQuery) =>
  JSON.stringify({
    query: query.searchQuery?.trim() ?? '',
    quickFilter: query.quickFilter ?? null,
    gender: query.profileGender ?? '',
    city: resolveUserCity({
      city: query.profileCity,
      location: query.profileLocation,
    }),
    catalogs: query.searchCatalogs?.cities?.slice().sort().join('|') ?? '',
  });

export const searchMatches = async (
  query: MatchSearchQuery,
): Promise<MatchSearchResult> => {
  const trimmedQuery = query.searchQuery?.trim() ?? '';
  const catalogs = query.searchCatalogs ?? { cities: [], professions: [] };
  const profileCity = resolveUserCity({
    city: query.profileCity,
    location: query.profileLocation,
  });
  const params = buildMatchSearchParams({
    searchQuery: trimmedQuery,
    quickFilter: query.quickFilter,
    quickFilterLabel: query.quickFilterLabel,
    profileGender: query.profileGender,
    profileCity,
    latitude: query.latitude,
    longitude: query.longitude,
    searchCatalogs: catalogs,
  });
  const isUserSearch = trimmedQuery.length >= MIN_SEARCH_LENGTH;
  const parsed = parseSearchQuery(trimmedQuery, catalogs);
  const isNameSearch = Boolean(parsed.name || parsed.search);
  const nameTerm = parsed.name || parsed.search;

  console.log('GET /matches/search params:', params, {
    viewerGender: query.profileGender,
    isNameSearch,
  });

  const nameOnlyParams = nameTerm
    ? { name: nameTerm, search: nameTerm, q: nameTerm }
    : null;

  const [primaryRes, nameOnlyRes, homeRes] = await Promise.allSettled([
    Api.getMatchSearch(params),
    isNameSearch && nameOnlyParams
      ? Api.getMatchSearch(nameOnlyParams)
      : Promise.resolve(null),
    isNameSearch ? Api.getHomeMatches() : Promise.resolve(null),
  ]);

  const primaryData = readFulfilledSearch(primaryRes);
  if (!isNameSearch && !primaryData) {
    const failed =
      primaryRes.status === 'rejected' ? primaryRes.reason : primaryRes.value;
    throw new Error(
      (failed as { data?: { message?: string } })?.data?.message ??
        'Failed to load search results',
    );
  }

  const setup = mapFilterSetup(primaryData ?? readFulfilledSearch(nameOnlyRes));
  const mergedPool = uniqueMatches([
    ...(primaryData ? poolFromSearchResponse(primaryData, isUserSearch) : []),
    ...(isNameSearch && nameOnlyRes.status === 'fulfilled'
      ? poolFromSearchResponse(readFulfilledSearch(nameOnlyRes), true)
      : []),
    ...(isNameSearch && homeRes.status === 'fulfilled' && homeRes.value
      ? isApiSuccess(homeRes.value.status, homeRes.value.data?.success)
        ? homePoolFromResponse(homeRes.value.data)
        : []
      : []),
  ]);

  console.log('GET /matches/search merged count:', mergedPool.length, {
    names: mergedPool.map(item => item.name),
  });

  let matches = mergedPool;

  if (isUserSearch) {
    const named = filterBySubmittedQuery(mergedPool, trimmedQuery, catalogs);
    matches = isNameSearch ? named : named.length ? named : mergedPool;
  }

  const locationKind = classifyLocationQuickFilter(
    query.quickFilter,
    query.quickFilterLabel,
  );
  const skipLocationOnCitySearch =
    isUserSearch &&
    Boolean(parsed.city) &&
    (locationKind === 'same_city' || locationKind === 'near_me');
  const shouldApplyQuickFilter =
    Boolean(query.quickFilter) &&
    !isUserSearch &&
    !skipLocationOnCitySearch;

  const filtered = stabilizeMatchOrder(
    shouldApplyQuickFilter
      ? filterMatchesByQuickFilters(
          matches,
          [{ id: query.quickFilter, label: query.quickFilterLabel }],
          profileCity,
        )
      : matches,
  );

  return {
    matches: filtered,
    emptyMessage: isUserSearch ? 'No exact matches found' : 'No matches found',
    setup,
    isUserSearch,
  };
};

export const getSearchErrorMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : getApiErrorMessage(error, 'Failed to load search results');
