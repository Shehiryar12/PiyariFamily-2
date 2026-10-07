jest.mock('../src/API/profileStorage', () => ({
  profileStorage: {
    get: jest.fn(() => null),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../src/API/userStorage', () => ({
  userStorage: {
    getUser: jest.fn(() => null),
    setUser: jest.fn(),
  },
}));

import {
  mapFormToProfilePayload,
  mapProfileToForm,
  normalizeProfileData,
  toApiMaritalStatus,
} from '../src/API/mappers/profileMapper';

describe('edit profile marital status and community', () => {
  it('maps Never Married to the same API value as profile setup', () => {
    expect(toApiMaritalStatus('Never Married')).toBe('single');
    expect(toApiMaritalStatus('Single')).toBe('single');
    expect(toApiMaritalStatus('Divorced')).toBe('divorced');
  });

  it('hydrates the edit form from Redux/API profile fields', () => {
    const form = mapProfileToForm({
      marital_status: 'single',
      community: 'sunni',
    });

    expect(form.maritalStatus).toBe('Single');
    expect(form.community).toBe('Sunni');
  });

  it('sends marital_status and community on save', () => {
    const payload = mapFormToProfilePayload({
      fullName: 'Hania',
      birthday: '1999-11-11',
      dateOfBirth: '11/11/1999',
      gender: 'female',
      aboutMe: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      heightFeet: '',
      heightInches: '',
      motherTongue: 'English',
      otherLanguages: [],
      maritalStatus: 'Never Married',
      community: 'Sunni',
      residenceStatus: '',
      age: 26,
      profilePhoto: null,
    });

    expect(payload.marital_status).toBe('single');
    expect(payload['marital status']).toBe('single');
    expect(payload.community).toBe('Sunni');
  });

  it('keeps top-level marital_status when nested user has a stale value', () => {
    const profile = normalizeProfileData({
      marital_status: 'divorced',
      user: {
        marital_status: 'single',
        community: 'Sunni',
      },
    });

    expect(profile.marital_status).toBe('divorced');
  });

  it('reads community from get-profile payloads', () => {
    const profile = normalizeProfileData({
      user: {
        marital_status: 'divorced',
        community: 'Shia',
        religion: 'Islam',
      },
    });

    expect(profile.marital_status).toBe('divorced');
    expect(profile.community).toBe('Shia');
    expect(profile.religion).toBe('Islam');
  });

  it('reads show_verified_badge from wrapper when nested user omits it', () => {
    const profile = normalizeProfileData({
      success: 200,
      show_verified_badge: true,
      data: {
        show_verified_badge: true,
        is_serious_member: true,
        user: {
          name: 'Hania',
          is_serious_member: true,
        },
      },
    });

    expect(profile.show_verified_badge).toBe(true);
    expect(profile.is_serious_member).toBe(true);
    expect(profile.name).toBe('Hania');
  });
});
