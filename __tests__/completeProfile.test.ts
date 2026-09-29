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
  isProfileMarkedComplete,
  mapCompleteProfile,
} from '../src/API/mappers/profileMapper';

const COMPLETE_PROFILE_RESPONSE = {
  success: 200,
  message: 'Congratulations! Your profile is ready.',
  user: {
    id: 1175,
    name: 'Hania',
    email: 'shehiryar.ranglerz@gmail.com',
    phone: '235689415',
    is_verified: true,
    phone_verified: false,
    gender: 'female',
    birthday: '1999-11-11',
    siblings: null,
    family_information: null,
    age: 26,
    country: 'Argentina',
    city: null,
    bio: null,
    profile_photo:
      'https://ranglerz.click/piyarifamily/assets/img/default-female.png',
    main_photo_index: null,
    photos: [],
    profile_completed: true,
    profile_step: 8,
    qualification: 'phd',
    field_of_study: 'computer Science',
    university: 'UCL',
    graduation_year: '2013',
    employment_type: 'business',
    job_title: 'Doctor',
    company: 'ranglerz',
    monthly_income: '40000',
    residential_status: 'rented',
    height: '7.2',
    weight: null,
    body_type: 'slim',
    complexion: 'dark',
    physical_disability: true,
    religion: 'Christianity',
    community: null,
    sect: null,
    mother_tongue: 'English',
    other_languages: ['Urdu', 'English', 'Hindi', 'Punjabi', 'Sindhi'],
    interests: [],
    marital_status: null,
    social_provider: null,
    status: 'active',
    location: 'Argentina',
    profession: 'Doctor',
    referral_code: 'C94A083D',
    reward_points: 0,
    profile_photo_visible: true,
    additional_photos_visible: true,
    profile_boost_until: null,
    created_at: '2026-09-08T07:48:12+00:00',
  },
};

describe('POST /profile/complete', () => {
  it('maps the backend user payload onto cached profile fields', () => {
    const mapped = mapCompleteProfile(COMPLETE_PROFILE_RESPONSE);

    expect(mapped.message).toBe('Congratulations! Your profile is ready.');
    expect(mapped.profileCompleted).toBe(true);
    expect(mapped.status).toBe('active');
    expect(mapped.profile.name).toBe('Hania');
    expect(mapped.profile.gender).toBe('female');
    expect(mapped.profile.profile_completed).toBe(true);
    expect(mapped.profile.profile_step).toBe(8);
    expect(mapped.profile.status).toBe('active');
    expect(mapped.profile.profession).toBe('Doctor');
    expect(mapped.profile.phone_verified).toBe(false);
    expect(mapped.profile.country).toBe('Argentina');
  });

  it('treats profile_step 8 as complete', () => {
    expect(
      isProfileMarkedComplete({
        profile_completed: false,
        profile_step: 8,
      }),
    ).toBe(true);
  });
});
