import type {
  MatchApiItem,
  MatchFilterOptions,
  MatchFilterParams,
  MatchListResponse,
} from './matchMapper';
import { normalizeMatchListResponse } from './matchMapper';
import { applyLocationFilterParams } from './matchLocationFilter';

export type FilterQuickOption = {
  id: string;
  label: string;
};

export type FilterOptionLists = {
  cities: string[];
  qualifications: string[];
  professions: string[];
  religions: string[];
  maritalStatuses: string[];
  incomeRanges: string[];
};

export type FilterAgeBounds = {
  ageMin: number;
  ageMax: number;
  incomeMin: number;
  incomeMax: number;
  incomeStep: number;
};

export type FilterIncomeRangeMeta = {
  monthly_income_min?: number;
  monthly_income_max?: number;
};

export type FilterFormDefaults = {
  ageMin: number;
  ageMax: number;
  city: string;
  qualification: string;
  profession: string;
  religion: string;
  maritalStatus: string;
  incomeRange: string;
  incomeMin: number;
  incomeMax: number;
};

export type FilterExtraSection = {
  id: string;
  label: string;
  options: string[];
};

export type FilterSetupData = {
  quickFilters: FilterQuickOption[];
  extraSections: FilterExtraSection[];
  options: FilterOptionLists;
  defaults: FilterFormDefaults;
  bounds: FilterAgeBounds;
  incomeRangeMeta: Record<string, FilterIncomeRangeMeta>;
};

const pickFiniteNumber = (...values: Array<number | string | null | undefined>) => {
  for (const value of values) {
    const parsed = pickNumber(value as number | string | null, Number.NaN);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const resolveIncomeStep = (min: number, max: number, apiStep?: number | null) => {
  if (apiStep && apiStep > 0) {
    return apiStep;
  }

  const span = Math.max(max - min, 1);

  if (span >= 100000) {
    return 1000;
  }

  if (span >= 10000) {
    return 500;
  }

  return 1;
};
export const FILTER_ANY = 'Any';
export const DEFAULT_AGE_MIN = 18;
export const DEFAULT_AGE_MAX = 60;
export const DEFAULT_INCOME_MIN = 0;
export const DEFAULT_INCOME_MAX = 200000;

const pickNumber = (value?: number | string | null, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const pickString = (value?: string | number | boolean | null) => {
  if (value === undefined || value === null || typeof value === 'boolean') {
    return '';
  }

  return String(value).trim();
};

const pickFirstString = (
  ...values: Array<string | number | boolean | null | undefined>
) => {
  for (const value of values) {
    const text = pickString(value);
    if (text) {
      return text;
    }
  }

  return '';
};

const normalizeList = (values?: Array<string | null | undefined>) =>
  [
    ...new Set(
      (values ?? [])
        .map(value => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((left, right) => left.localeCompare(right));

const FILTER_MARITAL_SINGLE = 'Single';

export const toFilterMaritalLabel = (value?: string | null) => {
  const text = value?.trim() ?? '';
  if (!text) {
    return '';
  }

  const key = text.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (key === 'single' || key === 'never married' || (key.includes('never') && key.includes('married'))) {
    return FILTER_MARITAL_SINGLE;
  }

  return text;
};

export const toFilterMaritalParam = (value?: string | null) => {
  const text = value?.trim() ?? '';
  if (!text || text === FILTER_ANY) {
    return '';
  }

  const key = text.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (key === 'single' || key === 'never married' || (key.includes('never') && key.includes('married'))) {
    return 'single';
  }

  return text;
};

const normalizeMaritalStatuses = (values: string[]) =>
  normalizeList(values.map(toFilterMaritalLabel));

const extractProfileList = (response?: MatchListResponse | null) => {
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

  return [];
};

const optionRecordLabel = (record: Record<string, unknown>) =>
  pickFirstString(
    record.label as string | number | null,
    record.name as string | number | null,
    record.value as string | number | null,
    record.title as string | number | null,
    record.city as string | number | null,
    record.qualification as string | number | null,
    record.education as string | number | null,
    record.profession as string | number | null,
    record.religion as string | number | null,
    record.marital_status as string | number | null,
    record.income_range as string | number | null,
    record.range as string | number | null,
  );

const asOptionStrings = (values?: unknown): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return normalizeList(
    values.map(item => {
      if (typeof item === 'string' || typeof item === 'number') {
        return String(item);
      }

      if (item && typeof item === 'object') {
        return optionRecordLabel(item as Record<string, unknown>);
      }

      return '';
    }),
  );
};

const pickOptionList = (...lists: unknown[]) => {
  for (const list of lists) {
    const mapped = asOptionStrings(list);
    if (mapped.length) {
      return mapped;
    }
  }

  return [];
};

const extractOptionsFromProfiles = (
  profiles: MatchApiItem[],
): FilterOptionLists => ({
  cities: normalizeList(profiles.map(profile => profile.city)),
  qualifications: normalizeList(
    profiles.map(
      profile =>
        profile.qualification ??
        profile.highest_education ??
        profile.education,
    ),
  ),
  professions: normalizeList(
    profiles.map(
      profile =>
        profile.profession ?? profile.job_title ?? profile.occupation,
    ),
  ),
  religions: normalizeList(
    profiles.map(profile => profile.religion ?? profile.community),
  ),
  maritalStatuses: normalizeMaritalStatuses(
    profiles
      .map(profile => profile.marital_status)
      .filter((value): value is string => Boolean(value?.trim())),
  ),
  incomeRanges: [],
});

const humanizeFilterKey = (id: string) =>
  id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());

export const toFilterQueryKey = (key: string) =>
  key
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();

const KNOWN_FILTER_OPTION_KEYS = new Set([
  'age_min',
  'age_max',
  'ageMin',
  'ageMax',
  'cities',
  'city',
  'qualifications',
  'education',
  'educations',
  'professions',
  'religions',
  'marital_statuses',
  'maritalStatuses',
  'marital_status',
  'maritalStatus',
  'income_ranges',
  'incomeRanges',
  'monthly_income_ranges',
  'pkr_income_ranges',
  'incomes',
  'monthly_incomes',
  'income_min',
  'income_max',
  'monthly_income_min',
  'monthly_income_max',
  'min_income',
  'max_income',
  'income_step',
  'monthly_income_step',
]);

export const mapExtraFilterSections = (
  apiOptions?: MatchFilterOptions | null,
): FilterExtraSection[] => {
  if (!apiOptions || typeof apiOptions !== 'object') {
    return [];
  }

  return Object.entries(apiOptions).flatMap(([key, value]) => {
    if (KNOWN_FILTER_OPTION_KEYS.has(key)) {
      return [];
    }

    const options = asOptionStrings(value);

    if (!options.length) {
      return [];
    }

    const id = toFilterQueryKey(key) || key;

    return [
      {
        id,
        label: humanizeFilterKey(key),
        options,
      },
    ];
  });
};

export const mapQuickFilters = (
  quickFilters?: MatchListResponse['quick_filters'],
) => {
  if (!quickFilters) {
    return [];
  }

  if (Array.isArray(quickFilters)) {
    return quickFilters
      .map((item, index) => {
        if (typeof item === 'string' && item.trim()) {
          const id = toFilterQueryKey(item.trim()) || item.trim();
          return { id, label: humanizeFilterKey(item.trim()) };
        }

        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const rawId =
            pickFirstString(
              record.id as string | number | null,
              record.key as string | number | null,
              record.slug as string | number | null,
              record.param as string | number | null,
            ) || String(index);
          const id = toFilterQueryKey(rawId) || rawId;
          const label =
            pickFirstString(
              record.label as string | number | null,
              record.name as string | number | null,
              record.title as string | number | null,
            ) || humanizeFilterKey(rawId);

          return { id, label };
        }

        return null;
      })
      .filter((item): item is FilterQuickOption => Boolean(item));
  }

  return Object.entries(quickFilters).flatMap(([id, label]) => {
    if (label === false || label === 0 || label === '0') {
      return [];
    }

    const queryKey = toFilterQueryKey(id) || id;
    return [
      {
        id: queryKey,
        label: humanizeFilterKey(id),
      },
    ];
  });
};

const appendFromApplied = (
  options: FilterOptionLists,
  applied?: Record<string, string | number | null>,
): FilterOptionLists => {
  if (!applied) {
    return options;
  }

  const add = (list: string[], value?: string | number | null) =>
    value !== undefined && value !== null && String(value).trim()
      ? normalizeList([...list, String(value)])
      : list;

  return {
    cities: add(options.cities, applied.city),
    qualifications: add(options.qualifications, applied.qualification),
    professions: add(options.professions, applied.profession),
    religions: add(options.religions, applied.religion),
    maritalStatuses: normalizeMaritalStatuses(
      add(options.maritalStatuses, applied.marital_status),
    ),
    incomeRanges: add(
      options.incomeRanges,
      applied.income_range ?? applied.monthly_income,
    ),
  };
};

const mapIncomeRangeMeta = (
  values?: unknown,
): Record<string, FilterIncomeRangeMeta> => {
  if (!Array.isArray(values)) {
    return {};
  }

  return values.reduce<Record<string, FilterIncomeRangeMeta>>((acc, item) => {
    if (!item || typeof item !== 'object') {
      return acc;
    }

    const record = item as Record<string, unknown>;
    const label = optionRecordLabel(record);

    if (!label) {
      return acc;
    }

    const min = pickNumber(
      (record.min ??
        record.monthly_income_min ??
        record.income_min) as number | string | null,
      Number.NaN,
    );
    const max = pickNumber(
      (record.max ??
        record.monthly_income_max ??
        record.income_max) as number | string | null,
      Number.NaN,
    );
    const meta: FilterIncomeRangeMeta = {};

    if (Number.isFinite(min)) {
      meta.monthly_income_min = min;
    }

    if (Number.isFinite(max)) {
      meta.monthly_income_max = max;
    }

    if (meta.monthly_income_min != null || meta.monthly_income_max != null) {
      acc[label] = meta;
    }

    return acc;
  }, {});
};

const mapFilterOptionLists = (
  response?: MatchListResponse | null,
): FilterOptionLists => {
  const fromApi = response?.filter_options as MatchFilterOptions | undefined;
  const fromProfiles = extractOptionsFromProfiles(extractProfileList(response));
  const applied = response?.filters_applied;

  if (fromApi && typeof fromApi === 'object') {
    return appendFromApplied(
      {
        cities: pickOptionList(fromApi.cities, fromApi.city).length
          ? pickOptionList(fromApi.cities, fromApi.city)
          : fromProfiles.cities,
        qualifications: pickOptionList(
          fromApi.qualifications,
          fromApi.education,
          fromApi.educations,
        ).length
          ? pickOptionList(
              fromApi.qualifications,
              fromApi.education,
              fromApi.educations,
            )
          : fromProfiles.qualifications,
        professions: pickOptionList(fromApi.professions).length
          ? pickOptionList(fromApi.professions)
          : fromProfiles.professions,
        religions: pickOptionList(fromApi.religions).length
          ? pickOptionList(fromApi.religions)
          : fromProfiles.religions,
        maritalStatuses: normalizeMaritalStatuses(
          pickOptionList(
            fromApi.marital_statuses,
            fromApi.maritalStatuses,
            fromApi.marital_status,
            fromApi.maritalStatus,
          ).length
            ? pickOptionList(
                fromApi.marital_statuses,
                fromApi.maritalStatuses,
                fromApi.marital_status,
                fromApi.maritalStatus,
              )
            : fromProfiles.maritalStatuses,
        ),
        incomeRanges: pickOptionList(
          fromApi.income_ranges,
          fromApi.incomeRanges,
          fromApi.monthly_income_ranges,
          fromApi.pkr_income_ranges,
          fromApi.incomes,
          fromApi.monthly_incomes,
        ).length
          ? pickOptionList(
              fromApi.income_ranges,
              fromApi.incomeRanges,
              fromApi.monthly_income_ranges,
              fromApi.pkr_income_ranges,
              fromApi.incomes,
              fromApi.monthly_incomes,
            )
          : fromProfiles.incomeRanges,
      },
      applied,
    );
  }

  return appendFromApplied(fromProfiles, applied);
};

const mapDefaults = (
  response: MatchListResponse | null | undefined,
  bounds: FilterAgeBounds,
): FilterFormDefaults => {
  const applied = response?.filters_applied ?? {};

  return {
    ageMin: pickNumber(applied.age_min, bounds.ageMin),
    ageMax: pickNumber(applied.age_max, bounds.ageMax),
    city: pickString(applied.city),
    qualification: pickString(applied.qualification) || FILTER_ANY,
    profession: pickString(applied.profession) || FILTER_ANY,
    religion: pickString(applied.religion) || FILTER_ANY,
    maritalStatus: toFilterMaritalLabel(pickString(applied.marital_status)),
    incomeRange:
      pickFirstString(applied.income_range, applied.monthly_income) ||
      FILTER_ANY,
    incomeMin: pickNumber(
      applied.monthly_income_min ?? applied.income_min,
      bounds.incomeMin,
    ),
    incomeMax: pickNumber(
      applied.monthly_income_max ?? applied.income_max,
      bounds.incomeMax,
    ),
  };
};

export const mapFilterSetup = (
  response?: MatchListResponse | null,
): FilterSetupData => {
  const normalized = normalizeMatchListResponse(response);
  const options = mapFilterOptionLists(normalized);
  const apiOptions = normalized.filter_options;
  const incomeRangeSource =
    apiOptions?.income_ranges ??
    apiOptions?.incomeRanges ??
    apiOptions?.monthly_income_ranges ??
    apiOptions?.pkr_income_ranges ??
    apiOptions?.incomes ??
    apiOptions?.monthly_incomes;
  const incomeRangeMeta = mapIncomeRangeMeta(incomeRangeSource);
  const incomeBounds = resolveIncomeBounds(
    apiOptions,
    options.incomeRanges,
    incomeRangeMeta,
    normalized.filters_applied,
  );
  const bounds: FilterAgeBounds = {
    ageMin: pickNumber(apiOptions?.age_min, DEFAULT_AGE_MIN),
    ageMax: pickNumber(apiOptions?.age_max, DEFAULT_AGE_MAX),
    incomeMin: incomeBounds.min,
    incomeMax: incomeBounds.max,
    incomeStep: incomeBounds.step,
  };

  if (bounds.ageMin > bounds.ageMax) {
    const swapped = bounds.ageMin;
    bounds.ageMin = bounds.ageMax;
    bounds.ageMax = swapped;
  }

  return {
    quickFilters: mapQuickFilters(normalized.quick_filters),
    extraSections: mapExtraFilterSections(apiOptions),
    options,
    defaults: mapDefaults(normalized, bounds),
    bounds,
    incomeRangeMeta,
  };
};

const parseMoneyToken = (raw: string): number | null => {
  const cleaned = raw.replace(/,/g, '').trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([kKmM])?$/);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  if (!Number.isFinite(amount)) {
    return null;
  }

  const suffix = match[2]?.toLowerCase();

  if (suffix === 'k') {
    return amount * 1000;
  }

  if (suffix === 'm') {
    return amount * 1000000;
  }

  return amount;
};

const extractMoneyAmounts = (value: string) =>
  [...value.matchAll(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKmM])?/g)]
    .map(match => parseMoneyToken(match[0]))
    .filter((amount): amount is number => amount != null);

const resolveIncomeBounds = (
  apiOptions: MatchFilterOptions | null | undefined,
  incomeLabels: string[],
  incomeRangeMeta: Record<string, FilterIncomeRangeMeta>,
  applied?: Record<string, string | number | null>,
) => {
  const mins: number[] = [];
  const maxs: number[] = [];
  const addMin = (value: number | null) => {
    if (value != null && Number.isFinite(value)) {
      mins.push(value);
    }
  };
  const addMax = (value: number | null) => {
    if (value != null && Number.isFinite(value)) {
      maxs.push(value);
    }
  };

  addMin(
    pickFiniteNumber(
      apiOptions?.income_min as number | string | null,
      apiOptions?.monthly_income_min as number | string | null,
      apiOptions?.min_income as number | string | null,
    ),
  );
  addMax(
    pickFiniteNumber(
      apiOptions?.income_max as number | string | null,
      apiOptions?.monthly_income_max as number | string | null,
      apiOptions?.max_income as number | string | null,
    ),
  );

  Object.values(incomeRangeMeta).forEach(item => {
    addMin(item.monthly_income_min ?? null);
    addMax(item.monthly_income_max ?? null);
  });

  incomeLabels.flatMap(extractMoneyAmounts).forEach(amount => {
    addMin(amount);
    addMax(amount);
  });

  addMin(
    pickFiniteNumber(applied?.monthly_income_min, applied?.income_min),
  );
  addMax(
    pickFiniteNumber(applied?.monthly_income_max, applied?.income_max),
  );

  let min = mins.length ? Math.min(...mins) : null;
  let max = maxs.length ? Math.max(...maxs) : null;

  if (min == null && max != null) {
    min = DEFAULT_INCOME_MIN;
  }

  const apiStep = pickFiniteNumber(
    apiOptions?.income_step as number | string | null,
    apiOptions?.monthly_income_step as number | string | null,
  );

  if (min == null || max == null || max <= min) {
    return {
      min: DEFAULT_INCOME_MIN,
      max: DEFAULT_INCOME_MAX,
      step: resolveIncomeStep(
        DEFAULT_INCOME_MIN,
        DEFAULT_INCOME_MAX,
        apiStep,
      ),
    };
  }

  return {
    min,
    max,
    step: resolveIncomeStep(min, max, apiStep),
  };
};

export const mapIncomeToParams = (
  value: string,
  meta?: FilterIncomeRangeMeta,
): Partial<MatchFilterParams> => {
  if (!value || value === FILTER_ANY) {
    return {};
  }

  if (meta && (meta.monthly_income_min != null || meta.monthly_income_max != null)) {
    return {
      ...(meta.monthly_income_min != null
        ? { monthly_income_min: meta.monthly_income_min }
        : {}),
      ...(meta.monthly_income_max != null
        ? { monthly_income_max: meta.monthly_income_max }
        : {}),
    };
  }

  const lower = value.toLowerCase();
  const amounts = extractMoneyAmounts(value);

  if (
    amounts.length >= 1 &&
    /(less than|below|under|upto|up to|max|<)/i.test(lower)
  ) {
    return { monthly_income_max: amounts[0] };
  }

  if (
    amounts.length >= 1 &&
    /(more than|above|over|greater|min|\+)/i.test(lower)
  ) {
    return { monthly_income_min: amounts[0] };
  }

  if (amounts.length >= 2) {
    return {
      monthly_income_min: Math.min(amounts[0], amounts[1]),
      monthly_income_max: Math.max(amounts[0], amounts[1]),
    };
  }

  return { monthly_income: value };
};

export type BuildFilterParamsInput = {
  citySearch: string;
  location: string;
  education: string;
  profession: string;
  religion: string;
  marital: string;
  ageMin: number;
  ageMax: number;
  ageBoundMin?: number;
  ageBoundMax?: number;
  incomeRange: string;
  incomeMin?: number;
  incomeMax?: number;
  incomeBoundMin?: number;
  incomeBoundMax?: number;
  incomeRangeMeta?: Record<string, FilterIncomeRangeMeta>;
  extraValues?: Record<string, string>;
  activeQuickFilters: Record<string, boolean>;
  profileCity?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export const buildMatchFilterParams = ({
  citySearch,
  location,
  education,
  profession,
  religion,
  marital,
  ageMin,
  ageMax,
  ageBoundMin = DEFAULT_AGE_MIN,
  ageBoundMax = DEFAULT_AGE_MAX,
  incomeRange,
  incomeMin,
  incomeMax,
  incomeBoundMin,
  incomeBoundMax,
  incomeRangeMeta,
  extraValues,
  activeQuickFilters,
  profileCity,
  latitude,
  longitude,
}: BuildFilterParamsInput): MatchFilterParams => {
  const params: MatchFilterParams = {};

  if (marital.trim() && marital !== FILTER_ANY) {
    params.marital_status = toFilterMaritalParam(marital);
  }

  if (education && education !== FILTER_ANY) {
    params.qualification = education;
  }

  if (profession && profession !== FILTER_ANY) {
    params.profession = profession;
  }

  if (religion && religion !== FILTER_ANY) {
    params.religion = religion;
  }

  const city = citySearch.trim() || location.trim();

  if (city) {
    params.city = city;
  }

  if (ageMin !== ageBoundMin || ageMax !== ageBoundMax) {
    params.age_min = ageMin;
    params.age_max = ageMax;
  }

  const hasIncomeSlider =
    incomeMin != null &&
    incomeMax != null &&
    incomeBoundMin != null &&
    incomeBoundMax != null &&
    incomeBoundMax > incomeBoundMin;

  if (hasIncomeSlider) {
    if (incomeMin !== incomeBoundMin || incomeMax !== incomeBoundMax) {
      params.monthly_income_min = incomeMin;
      params.monthly_income_max = incomeMax;
    }
  } else {
    Object.assign(
      params,
      mapIncomeToParams(incomeRange, incomeRangeMeta?.[incomeRange]),
    );
  }

  Object.entries(extraValues ?? {}).forEach(([key, value]) => {
    const text = value?.trim();

    if (!text || text === FILTER_ANY) {
      return;
    }

    const queryKey = toFilterQueryKey(key) || key;
    params[queryKey] =
      queryKey === 'marital_status' ? toFilterMaritalParam(text) : text;
  });

  Object.entries(activeQuickFilters).forEach(([key, enabled]) => {
    if (!enabled) {
      return;
    }

    const queryKey = toFilterQueryKey(key) || key;
    params[queryKey] = 1;
  });

  applyLocationFilterParams(
    params,
    Object.entries(activeQuickFilters)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key),
    { profileCity, latitude, longitude },
  );

  if (params.marital_status) {
    params.marital_status = toFilterMaritalParam(String(params.marital_status));
  }

  return params;
};

export const withAnyOption = (options: string[]) => [FILTER_ANY, ...options];
