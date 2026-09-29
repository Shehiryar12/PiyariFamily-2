jest.mock('../src/API/mappers/profileMapper', () => ({
  parseVisibilityFlag: () => true,
  pickImageUrl: () => null,
}));

jest.mock('../src/Assets', () => ({
  Images: {
    maleProfile: 1,
    femaleProfile: 1,
  },
}));

import { isApiSuccess } from '../src/API/types';
import {
  buildMatchFilterParams,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  DEFAULT_INCOME_MAX,
  DEFAULT_INCOME_MIN,
  FILTER_ANY,
  mapFilterSetup,
  mapIncomeToParams,
  mapQuickFilters,
  toFilterQueryKey,
} from '../src/API/mappers/filterMapper';
import { mapFilterMatchGroups, mapMatchList } from '../src/API/mappers/matchMapper';

const LIVE_FILTER_RESPONSE = {
  success: 200,
  fallback_used: true,
  message:
    'No exact match was found, so other opposite-gender profiles are shown.',
  filters_applied: {
    religion: 'islam',
  },
  quick_filters: {
    near_me: 'Near me',
  },
  matches: [
    {
      id: 1,
      name: 'Ayesha',
      religion: 'islam',
    },
  ],
};

const FULL_DYNAMIC_RESPONSE = {
  success: 200,
  data: {
    filter_options: {
      age_min: 21,
      age_max: 50,
      cities: [{ name: 'Lahore' }, { label: 'Karachi' }],
      qualifications: ['Bachelors', 'Masters'],
      professions: ['Doctor', 'Engineer'],
      religions: ['Islam', 'Christian'],
      marital_statuses: ['Never Married', 'Divorced'],
      income_ranges: [
        { label: 'Starter', min: 0, max: 40000 },
        '50K to 90K',
        'Above 200K',
      ],
    },
    quick_filters: [
      { id: 'nearMe', label: 'Near me' },
      { key: 'verified', name: 'Verified' },
      'new_profiles',
    ],
    filters_applied: {
      city: 'Lahore',
      qualification: 'Masters',
      age_min: 25,
      age_max: 40,
    },
    matches: [
      {
        id: 9,
        name: 'Sara',
        city: 'Lahore',
        qualification: 'Masters',
        profession: 'Doctor',
      },
    ],
  },
};

const emptyForm = {
  citySearch: '',
  location: '',
  education: FILTER_ANY,
  profession: FILTER_ANY,
  religion: FILTER_ANY,
  marital: '',
  ageMin: DEFAULT_AGE_MIN,
  ageMax: DEFAULT_AGE_MAX,
  incomeRange: FILTER_ANY,
  activeQuickFilters: {},
};

describe('GET /matches/filter', () => {
  it('treats HTTP 200 and body success: 200 as success', () => {
    expect(isApiSuccess(200, 200)).toBe(true);
  });

  it('maps filters_applied, quick_filters, and fallback message from the live payload', () => {
    const setup = mapFilterSetup(LIVE_FILTER_RESPONSE);

    expect(setup.defaults.religion).toBe('islam');
    expect(setup.options.religions).toContain('islam');
    expect(setup.quickFilters).toEqual([{ id: 'near_me', label: 'Near me' }]);
    expect(setup.extraSections).toEqual([]);
    expect(setup.bounds.incomeMin).toBe(DEFAULT_INCOME_MIN);
    expect(setup.bounds.incomeMax).toBe(DEFAULT_INCOME_MAX);
    expect(LIVE_FILTER_RESPONSE.fallback_used).toBe(true);
    expect(LIVE_FILTER_RESPONSE.message).toContain('No exact match');
    expect(mapMatchList(LIVE_FILTER_RESPONSE)[0].name).toBe('Ayesha');
  });

  it('maps nested filter_options, object chips, and camelCase quick filter ids', () => {
    const setup = mapFilterSetup(FULL_DYNAMIC_RESPONSE);

    expect(setup.options.cities).toEqual(['Karachi', 'Lahore']);
    expect(setup.options.qualifications).toEqual(['Bachelors', 'Masters']);
    expect(setup.options.professions).toEqual(['Doctor', 'Engineer']);
    expect(setup.options.religions).toEqual(['Christian', 'Islam']);
    expect(setup.options.maritalStatuses).toEqual([
      'Divorced',
      'Never Married',
    ]);
    expect(setup.options.incomeRanges).toEqual([
      '50K to 90K',
      'Above 200K',
      'Starter',
    ]);
    expect(setup.bounds.ageMin).toBe(21);
    expect(setup.bounds.ageMax).toBe(50);
    expect(setup.bounds.incomeMin).toBe(0);
    expect(setup.bounds.incomeMax).toBe(200000);
    expect(setup.defaults.city).toBe('Lahore');
    expect(setup.defaults.qualification).toBe('Masters');
    expect(setup.defaults.ageMin).toBe(25);
    expect(setup.defaults.ageMax).toBe(40);
    expect(setup.incomeRangeMeta.Starter).toEqual({
      monthly_income_min: 0,
      monthly_income_max: 40000,
    });
    expect(setup.quickFilters).toEqual([
      { id: 'near_me', label: 'Near me' },
      { id: 'verified', label: 'Verified' },
      { id: 'new_profiles', label: 'New Profiles' },
    ]);
    expect(setup.extraSections).toEqual([]);
    expect(mapMatchList(FULL_DYNAMIC_RESPONSE)[0].name).toBe('Sara');
  });

  it('sends only selected query params, matching Postman religion=islam', () => {
    const params = buildMatchFilterParams({
      ...emptyForm,
      religion: 'islam',
    });

    expect(params).toEqual({ religion: 'islam' });
  });

  it('omits Any, empty, and default age-bound values', () => {
    expect(buildMatchFilterParams(emptyForm)).toEqual({});
  });

  it('passes selected chips to the API as-is, including marital status', () => {
    const params = buildMatchFilterParams({
      ...emptyForm,
      citySearch: 'Lahore',
      education: 'Masters',
      profession: 'Doctor',
      religion: 'Islam',
      marital: 'Never Married',
      ageMin: 25,
      ageMax: 40,
      ageBoundMin: 21,
      ageBoundMax: 50,
      incomeRange: '50K to 90K',
      activeQuickFilters: {
        near_me: true,
        verified: false,
        new_profiles: true,
      },
    });

    expect(params).toEqual({
      city: 'Lahore',
      qualification: 'Masters',
      profession: 'Doctor',
      religion: 'Islam',
      marital_status: 'Never Married',
      age_min: 25,
      age_max: 40,
      monthly_income_min: 50000,
      monthly_income_max: 90000,
      near_me: 1,
      radius: 50,
      radius_km: 50,
      new_profiles: 1,
      new_profile: 1,
      joined_in_last_3_days: 1,
      last_3_days: 1,
      days: 3,
    });
  });

  it('uses typed city search over the location chip when both are set', () => {
    const params = buildMatchFilterParams({
      ...emptyForm,
      location: 'Lahore',
      citySearch: 'Islamabad',
    });

    expect(params).toEqual({ city: 'Islamabad' });
  });

  it('maps camelCase quick filter ids to API query keys with value 1', () => {
    expect(toFilterQueryKey('nearMe')).toBe('near_me');
    expect(
      buildMatchFilterParams({
        ...emptyForm,
        activeQuickFilters: { nearMe: true, verified: true },
      }),
    ).toEqual({
      near_me: 1,
      radius: 50,
      radius_km: 50,
      verified: 1,
    });
  });

  it('does not remap marital labels to hardcoded API aliases', () => {
    expect(
      buildMatchFilterParams({
        ...emptyForm,
        marital: 'Single',
      }),
    ).toEqual({ marital_status: 'Single' });
  });

  it('parses income labels dynamically and falls back to the raw option', () => {
    expect(mapIncomeToParams('Less than 50K')).toEqual({
      monthly_income_max: 50000,
    });
    expect(mapIncomeToParams('100K to 200K')).toEqual({
      monthly_income_min: 100000,
      monthly_income_max: 200000,
    });
    expect(mapIncomeToParams('Above 200K')).toEqual({
      monthly_income_min: 200000,
    });
    expect(mapIncomeToParams('Government Employee')).toEqual({
      monthly_income: 'Government Employee',
    });
    expect(
      mapIncomeToParams('Starter', {
        monthly_income_min: 0,
        monthly_income_max: 40000,
      }),
    ).toEqual({
      monthly_income_min: 0,
      monthly_income_max: 40000,
    });
  });

  it('sends income slider values only when they differ from API bounds', () => {
    expect(
      buildMatchFilterParams({
        ...emptyForm,
        incomeMin: 0,
        incomeMax: 200000,
        incomeBoundMin: 0,
        incomeBoundMax: 200000,
      }),
    ).toEqual({});

    expect(
      buildMatchFilterParams({
        ...emptyForm,
        incomeMin: 5000,
        incomeMax: 20000,
        incomeBoundMin: 0,
        incomeBoundMax: 200000,
      }),
    ).toEqual({
      monthly_income_min: 5000,
      monthly_income_max: 20000,
    });
  });

  it('keeps results from the filter response after applying params', () => {
    const setup = mapFilterSetup(FULL_DYNAMIC_RESPONSE);
    const params = buildMatchFilterParams({
      ...emptyForm,
      location: setup.defaults.city,
      education: setup.defaults.qualification,
      ageMin: setup.defaults.ageMin,
      ageMax: setup.defaults.ageMax,
      ageBoundMin: setup.bounds.ageMin,
      ageBoundMax: setup.bounds.ageMax,
    });

    expect(params).toEqual({
      city: 'Lahore',
      qualification: 'Masters',
      age_min: 25,
      age_max: 40,
    });
    expect(mapMatchList(FULL_DYNAMIC_RESPONSE)).toHaveLength(1);
  });

  it('maps leftover filter_options lists as extra dynamic sections', () => {
    const setup = mapFilterSetup({
      success: 200,
      filter_options: {
        age_min: 18,
        sects: ['Sunni', 'Shia'],
        mother_tongues: [{ label: 'Urdu' }, { name: 'Punjabi' }],
      },
    });

    expect(setup.extraSections).toEqual([
      { id: 'sects', label: 'Sects', options: ['Shia', 'Sunni'] },
      {
        id: 'mother_tongues',
        label: 'Mother Tongues',
        options: ['Punjabi', 'Urdu'],
      },
    ]);
  });

  it('sends extra section values with selected quick filters', () => {
    expect(
      buildMatchFilterParams({
        ...emptyForm,
        extraValues: { sect: 'Sunni', mother_tongue: FILTER_ANY },
        activeQuickFilters: { near_me: true, verified: false },
      }),
    ).toEqual({
      sect: 'Sunni',
      near_me: 1,
      radius: 50,
      radius_km: 50,
    });
  });

  it('does not invent hardcoded quick filters when the API omits them', () => {
    expect(mapQuickFilters(undefined)).toEqual([]);
    expect(mapFilterSetup({ success: 200, matches: [] }).quickFilters).toEqual(
      [],
    );
  });

  it('keeps only API-enabled quick filter flags', () => {
    expect(
      mapQuickFilters({
        near_me: false,
        verified: true,
        custom_chip: 'Top Rated',
      }),
    ).toEqual([
      { id: 'verified', label: 'Verified' },
      { id: 'custom_chip', label: 'Custom Chip' },
    ]);
  });

  it('shows API quick filter keys as chip text, not the description values', () => {
    expect(
      mapQuickFilters({
        near_me: 'Same city or within 50km',
        new_profiles: 'Joined in last 3 days',
        verified: 'Phone verified profiles',
      }),
    ).toEqual([
      { id: 'near_me', label: 'Near Me' },
      { id: 'new_profiles', label: 'New Profiles' },
      { id: 'verified', label: 'Verified' },
    ]);
  });

  it('titles filter results as exact matches unless fallback_used is set', () => {
    const exact = mapFilterMatchGroups({
      success: 200,
      matches: [{ id: 2, name: 'Hina', profession: 'Software Engineer' }],
    });

    expect(exact.exact).toHaveLength(1);
    expect(exact.exact[0].name).toBe('Hina');
    expect(exact.suggested).toEqual([]);
    expect(exact.fallbackUsed).toBe(false);

    const fallback = mapFilterMatchGroups({
      success: 200,
      fallback_used: true,
      matches: [{ id: 3, name: 'Other Profile' }],
    });

    expect(fallback.exact).toEqual([]);
    expect(fallback.suggested).toHaveLength(1);
    expect(fallback.fallbackUsed).toBe(true);
  });

  it('prefers exact_matches over suggested_matches when both are present', () => {
    const groups = mapFilterMatchGroups({
      success: 200,
      fallback_used: true,
      exact_matches: [{ id: 4, name: 'Exact Engineer' }],
      suggested_matches: [{ id: 5, name: 'Suggested Profile' }],
    });

    expect(groups.exact[0].name).toBe('Exact Engineer');
    expect(groups.suggested).toEqual([]);
    expect(groups.fallbackUsed).toBe(false);
  });
});
