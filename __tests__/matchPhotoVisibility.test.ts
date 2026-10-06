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

jest.mock('../src/Assets', () => ({
  Images: {
    maleProfile: 1,
    femaleProfile: 1,
    religionIcon: 1,
    hiddenProfile: 7,
  },
}));

import {
  mapFeaturedMatch,
  mapMatchProfileDetail,
  profileNeedsPhotoAccess,
} from '../src/API/mappers/matchMapper';

describe('hidden match photos', () => {
  it('hides home card photos when profile picture visibility is off', () => {
    const match = mapFeaturedMatch(
      {
        id: 22,
        name: 'Hina',
        gender: 'female',
        profile_photo: 'https://example.com/hina.png',
        profile_photo_visible: 0,
        additional_photos_visible: 0,
      },
      0,
    );

    expect(match.pictureHidden).toBe(true);
    expect(match.image).toBe(7);
  });

  it('hides nested visibility photos from other members', () => {
    const profile = {
      id: 22,
      name: 'Hina',
      profile_photo: 'https://example.com/hina.png',
      visibility: {
        profile_photo_visible: false,
        additional_photos_visible: false,
      },
    };

    expect(profileNeedsPhotoAccess(profile)).toBe(true);
    expect(mapMatchProfileDetail({ profile }, '22').photosNeedAccess).toBe(
      true,
    );
    expect(mapMatchProfileDetail({ profile }, '22').pictureHidden).toBe(true);
    expect(mapMatchProfileDetail({ profile }, '22').image).toBe(7);
  });

  it('keeps the profile picture visible and asks for additional photo access', () => {
    const mapped = mapMatchProfileDetail(
      {
        id: 22,
        name: 'Jannat',
        profile_photo: 'https://example.com/jannat.png',
        profile_photo_visible: 1,
        additional_photos_visible: 0,
      },
      '22',
    );

    expect(mapped.image).toEqual(
      expect.objectContaining({ uri: 'https://example.com/jannat.png' }),
    );
    expect(mapped.pictureHidden).toBe(false);
    expect(mapped.photosNeedAccess).toBe(true);
    expect(mapped.additionalPhotosHidden).toBe(true);
  });

  it('shows hidden photos only to the person whose request was approved', () => {
    const mapped = mapMatchProfileDetail(
      {
        id: 22,
        name: 'Hina',
        profile_photo: 'https://example.com/hina.png',
        photos: [
          'https://example.com/hina.png',
          'https://example.com/extra.png',
        ],
        visibility: {
          profile_photo_visible: false,
          additional_photos_visible: false,
        },
        photo_access_granted: true,
      },
      '22',
      { pictureHidden: true },
    );

    expect(mapped.pictureHidden).toBe(false);
    expect(mapped.additionalPhotosHidden).toBe(false);
    expect(mapped.photosNeedAccess).toBe(false);
    expect(mapped.image).toEqual(
      expect.objectContaining({ uri: 'https://example.com/hina.png' }),
    );
  });

  it('keeps a dummy image when another account opens a hidden preview', () => {
    const mapped = mapMatchProfileDetail(
      {
        id: 22,
        name: 'Hina',
        profile_photo: 'https://example.com/hina.png',
      },
      '22',
      { pictureHidden: true },
    );

    expect(mapped.pictureHidden).toBe(true);
    expect(mapped.image).toBe(7);
  });

  it('does not unlock hidden photos just because access_granted is true', () => {
    const match = mapFeaturedMatch(
      {
        id: 22,
        name: 'Hina',
        profile_photo: 'https://example.com/hina.png',
        profile_photo_visible: false,
        access_granted: true,
      },
      0,
    );

    expect(match.pictureHidden).toBe(true);
    expect(match.image).toBe(7);
  });
});
