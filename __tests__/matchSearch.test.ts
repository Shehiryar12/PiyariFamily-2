jest.mock('../src/API/mappers/profileMapper', () => ({
  parseVisibilityFlag: () => true,
  pickImageUrl: () => null,
}));

jest.mock('../src/Assets', () => ({
  Images: {
    maleProfile: 1,
    femaleProfile: 1,
    hiddenProfile: 1,
  },
}));

import {
  buildMatchSearchParams,
  mapFilterMatchGroups,
  mapHomeMatches,
  mapMatchList,
  parseSearchQuery,
  profileMatchesSearchQuery,
} from '../src/API/mappers/matchMapper';
import { filterMatchesByQuickFilters } from '../src/API/mappers/matchLocationFilter';

const CATALOGS = {
  cities: ['Lahore', 'Karachi', 'Islamabad'],
  professions: ['Doctor', 'Software Engineer', 'Teacher'],
};

describe('GET /matches/search params', () => {
  it('does not send a search term for an empty query', () => {
    expect(
      buildMatchSearchParams({
        searchQuery: '   ',
        profileGender: 'male',
      }),
    ).toEqual({ gender: 'female' });
  });

  it('sends city when the submitted value matches API city options', () => {
    expect(
      buildMatchSearchParams({
        searchQuery: 'Lahore',
        searchCatalogs: CATALOGS,
      }),
    ).toEqual({ city: 'Lahore' });
  });

  it('sends profession when the submitted value matches API profession options', () => {
    expect(
      buildMatchSearchParams({
        searchQuery: 'doctor',
        searchCatalogs: CATALOGS,
      }),
    ).toEqual({ profession: 'Doctor' });
  });

  it('sends name and search for a free-text name query', () => {
    expect(
      buildMatchSearchParams({
        searchQuery: 'Ayesha',
        searchCatalogs: CATALOGS,
      }),
    ).toEqual({
      name: 'Ayesha',
      search: 'Ayesha',
      q: 'Ayesha',
    });
  });

  it('sends opposite gender with a name search so male can find a female profile', () => {
    expect(
      buildMatchSearchParams({
        searchQuery: 'Hania',
        profileGender: 'male',
        searchCatalogs: CATALOGS,
      }),
    ).toEqual({
      gender: 'female',
      name: 'Hania',
      search: 'Hania',
      q: 'Hania',
    });
  });

  it('parses profession, city from the comma format', () => {
    expect(parseSearchQuery('Software Engineer, Multan')).toEqual({
      name: undefined,
      profession: 'Software Engineer',
      city: 'Multan',
      search: undefined,
    });
  });

  it('honors explicit field prefixes without hardcoded lists', () => {
    expect(parseSearchQuery('profession: Pharmacist')).toEqual({
      name: undefined,
      profession: 'Pharmacist',
      city: undefined,
      search: undefined,
    });
    expect(parseSearchQuery('city: Faisalabad')).toEqual({
      name: undefined,
      profession: undefined,
      city: 'Faisalabad',
      search: undefined,
    });
    expect(parseSearchQuery('name: Hina')).toEqual({
      name: 'Hina',
      profession: undefined,
      city: undefined,
      search: undefined,
    });
  });

  it('maps a home profile from exact_matches onto the featured card', () => {
    const mapped = mapHomeMatches({
      success: true,
      exact_matches: [
        {
          id: 1175,
          name: 'Hania',
          age: 26,
          city: 'Argentina',
        },
      ],
    });

    expect(mapped.featuredMatches[0].name).toBe('Hania');
    expect(mapped.totalMatches).toBe(1);
  });

  it('maps search API results dynamically with no dummy profiles', () => {
    const matches = mapMatchList({
      success: 200,
      matches: [
        {
          id: 44,
          name: 'Sara',
          city: 'Lahore',
          profession: 'Doctor',
        },
      ],
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe('Sara');
    expect(matches[0].profession).toBe('Doctor');
  });

  it('returns an empty list when the search API has no matches', () => {
    expect(mapMatchList({ success: 200, matches: [] })).toEqual([]);
    expect(mapMatchList({ success: 200, data: [] })).toEqual([]);
  });

  it('treats fallback search results as not exact matches', () => {
    const groups = mapFilterMatchGroups({
      success: 200,
      fallback_used: true,
      matches: [{ id: 8, name: 'Random Profile', profession: 'Teacher' }],
    });

    expect(groups.exact).toEqual([]);
    expect(groups.fallbackUsed).toBe(true);
  });

  it('maps Same City from the API label even when the id is city', () => {
    expect(
      buildMatchSearchParams({
        quickFilter: 'city',
        quickFilterLabel: 'Same City',
        profileCity: 'Lahore',
      }),
    ).toMatchObject({
      same_city: 1,
      city: 'Lahore',
    });
  });

  it('sends new_profiles for Joined in last 3 days', () => {
    expect(
      buildMatchSearchParams({
        quickFilter: 'Joined in last 3 days',
      }),
    ).toMatchObject({
      joined_in_last_3_days: 1,
      new_profiles: 1,
      days: 3,
    });
  });

  it('sends same_city and city for Same city or within 50km', () => {
    expect(
      buildMatchSearchParams({
        quickFilter: 'same_city_or_within_50km',
        quickFilterLabel: 'Same city or within 50km',
        profileCity: 'Lahore',
      }),
    ).toMatchObject({
      same_city: 1,
      city: 'Lahore',
    });
  });

  it('sends city and same_city when Same City is selected', () => {
    expect(
      buildMatchSearchParams({
        quickFilter: 'same_city',
        profileCity: 'Lahore',
        profileGender: 'male',
      }),
    ).toEqual({
      gender: 'female',
      same_city: 1,
      city: 'Lahore',
    });
  });

  it('sends near_me and 50km radius for Within 50 KM', () => {
    expect(
      buildMatchSearchParams({
        quickFilter: 'Within 50 KM',
        profileCity: 'Lahore',
      }),
    ).toMatchObject({
      near_me: 1,
      radius: 50,
      radius_km: 50,
      origin_city: 'Lahore',
      within_50_km: 1,
    });
  });

  it('keeps only profiles that actually match the search query', () => {
    const hrManager = {
      name: 'Ayesha',
      profession: 'HR Manager',
      location: 'Lahore',
    };
    const unrelated = {
      name: 'Sara',
      profession: 'Doctor',
      location: 'Karachi',
    };

    expect(
      profileMatchesSearchQuery(hrManager, 'Hr manager', CATALOGS),
    ).toBe(true);
    expect(
      profileMatchesSearchQuery(unrelated, 'Hr manager', CATALOGS),
    ).toBe(false);
    expect(
      profileMatchesSearchQuery(hrManager, 'dfnsksksnfk', CATALOGS),
    ).toBe(false);
  });

  it('keeps Lahore profiles as exact city matches even without catalogs', () => {
    const lahoreByCity = {
      name: 'Ayesha',
      profession: 'Doctor',
      location: '-',
      city: 'Lahore',
    };
    const lahoreByLocation = {
      name: 'Hina',
      profession: 'Teacher',
      location: 'Lahore, Pakistan',
    };
    const otherCity = {
      name: 'Sara',
      profession: 'Doctor',
      location: 'Karachi',
      city: 'Karachi',
    };

    expect(profileMatchesSearchQuery(lahoreByCity, 'Lahore')).toBe(true);
    expect(profileMatchesSearchQuery(lahoreByLocation, 'Lahore')).toBe(true);
    expect(profileMatchesSearchQuery(otherCity, 'Lahore')).toBe(false);
  });

  it('does not let Same City overwrite a typed city search', () => {
    expect(
      buildMatchSearchParams({
        searchQuery: 'Lahore',
        searchCatalogs: CATALOGS,
        quickFilter: 'same_city_or_within_50km',
        quickFilterLabel: 'Same city or within 50km',
        profileCity: 'Karachi',
      }),
    ).toEqual({ city: 'Lahore' });
  });

  it('drops other cities when Same City is selected', () => {
    const matches = filterMatchesByQuickFilters(
      [
        { id: '1', name: 'Ayesha', age: 26, location: 'Lahore, Pakistan', profession: 'Doctor', image: 1, tier: 'VIP', isVerified: true },
        { id: '2', name: 'Sara', age: 24, location: 'Karachi', profession: 'Teacher', image: 1, tier: 'VIP', isVerified: false },
      ],
      ['same_city'],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1']);
  });

  it('keeps Lahore matches when location includes country', () => {
    const matches = filterMatchesByQuickFilters(
      [
        {
          id: '1',
          name: 'Ayesha',
          age: 26,
          location: 'Lahore Pakistan',
          profession: 'Doctor',
          image: 1,
          tier: 'VIP',
          isVerified: true,
        },
      ],
      [{ id: 'same_city_or_within_50km', label: 'Same city or within 50km' }],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1']);
  });

  it('keeps only matches within 50km when distance is present', () => {
    const matches = filterMatchesByQuickFilters(
      [
        { id: '1', name: 'Ayesha', age: 26, location: 'Lahore', distanceKm: 12, profession: 'Doctor', image: 1, tier: 'VIP', isVerified: true },
        { id: '2', name: 'Hina', age: 27, location: 'Multan', distanceKm: 340, profession: 'Teacher', image: 1, tier: 'VIP', isVerified: false },
      ],
      ['near_me'],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1']);
  });

  it('keeps only new profiles for Joined in last 3 days', () => {
    const matches = filterMatchesByQuickFilters(
      [
        {
          id: '1',
          name: 'Ayesha',
          age: 26,
          location: 'Lahore',
          profession: 'Doctor',
          image: 1,
          tier: 'VIP',
          isVerified: true,
          isNew: true,
        },
        {
          id: '2',
          name: 'Sara',
          age: 24,
          location: 'Karachi',
          profession: 'Teacher',
          image: 1,
          tier: 'VIP',
          isVerified: false,
        },
      ],
      [{ id: 'joined_in_last_3_days', label: 'Joined in last 3 days' }],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1']);
  });

  it('keeps only profiles who joined in the last 3 days by createdAt', () => {
    const matches = filterMatchesByQuickFilters(
      [
        {
          id: '1',
          name: 'Ayesha',
          age: 26,
          location: 'Lahore',
          profession: 'Doctor',
          image: 1,
          tier: 'VIP',
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Sara',
          age: 24,
          location: 'Lahore',
          profession: 'Teacher',
          image: 1,
          tier: 'VIP',
          isVerified: false,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      [{ id: 'joined_in_last_3_days', label: 'Joined in last 3 days' }],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1']);
  });

  it('keeps nearby matches within 50km for Near Me', () => {
    expect(
      buildMatchSearchParams({
        quickFilter: 'near_me',
        quickFilterLabel: 'Near Me',
        profileCity: 'Lahore',
      }),
    ).toMatchObject({
      near_me: 1,
      radius: 50,
      radius_km: 50,
      origin_city: 'Lahore',
    });

    const matches = filterMatchesByQuickFilters(
      [
        {
          id: '1',
          name: 'Ayesha',
          age: 26,
          location: 'Lahore',
          distanceKm: 8,
          profession: 'Doctor',
          image: 1,
          tier: 'VIP',
          isVerified: true,
        },
        {
          id: '2',
          name: 'Hina',
          age: 27,
          location: 'Kasur',
          distanceKm: 42,
          profession: 'Teacher',
          image: 1,
          tier: 'VIP',
          isVerified: false,
        },
        {
          id: '3',
          name: 'Sara',
          age: 24,
          location: 'Karachi',
          distanceKm: 340,
          profession: 'Doctor',
          image: 1,
          tier: 'VIP',
          isVerified: false,
        },
      ],
      [{ id: 'near_me', label: 'Near Me' }],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1', '2']);
  });

  it('keeps only phone verified profiles', () => {
    const matches = filterMatchesByQuickFilters(
      [
        {
          id: '1',
          name: 'Ayesha',
          age: 26,
          location: 'Lahore',
          profession: 'Doctor',
          image: 1,
          tier: 'VIP',
          isVerified: true,
        },
        {
          id: '2',
          name: 'Sara',
          age: 24,
          location: 'Lahore',
          profession: 'Teacher',
          image: 1,
          tier: 'VIP',
          isVerified: false,
        },
      ],
      [{ id: 'verified', label: 'Phone verified profiles' }],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1']);
  });

  it('keeps only new profiles for API new_profiles chip', () => {
    const matches = filterMatchesByQuickFilters(
      [
        {
          id: '1',
          name: 'Ayesha',
          age: 26,
          location: 'Lahore',
          profession: 'Doctor',
          image: 1,
          tier: 'VIP',
          isVerified: true,
          isNew: true,
        },
        {
          id: '2',
          name: 'Sara',
          age: 24,
          location: 'Lahore',
          profession: 'Teacher',
          image: 1,
          tier: 'VIP',
          isVerified: false,
        },
      ],
      [{ id: 'new_profiles', label: 'Joined in last 3 days' }],
      'Lahore',
    );

    expect(matches.map(item => item.id)).toEqual(['1']);
  });
});
