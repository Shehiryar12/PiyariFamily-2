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
    hiddenProfile: 7,
  },
}));

import { mapPhotoGallery } from '../src/API/mappers/photoGalleryMapper';
import { applyViewerPhotoPrivacy } from '../src/API/photoPrivacy';

describe('GET /profile/{id}/photo-gallery', () => {
  it('maps Postman access_granted + photo urls', () => {
    const gallery = mapPhotoGallery({
      access_granted: true,
      photos: [
        {
          index: 0,
          url: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1080/a.jpg',
          path: 'profiles/1080/a.jpg',
          is_main: true,
        },
        {
          index: 1,
          url: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1080/b.jpg',
          path: 'profiles/1080/b.jpg',
          is_main: true,
        },
      ],
    });

    expect(gallery.accessGranted).toBe(true);
    expect(gallery.photos).toHaveLength(2);
    expect(gallery.photos[0]).toEqual({
      uri: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1080/a.jpg',
    });
  });

  it('shows photos from the live 1056 payload even if access_granted is false', () => {
    const gallery = mapPhotoGallery({
      success: 200,
      message: 'Photo gallery retrieved successfully.',
      user: { id: 1056, name: 'Taha' },
      total_photos: 2,
      visibility: {
        access_granted: false,
        additional_photos_visible: true,
        profile_photo_visible: true,
      },
      photos: [
        {
          index: 0,
          url: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
          path: 'profiles/1056/male-08.png',
          is_main: true,
        },
        {
          index: 1,
          url: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
          path: 'profiles/1056/male-08.png',
          is_main: true,
        },
      ],
    });

    expect(gallery.accessGranted).toBe(true);
    expect(gallery.hiddenByOwner).toBe(false);
    expect(gallery.photos).toHaveLength(2);
    expect(gallery.photos[0]).toEqual({
      uri: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
    });
  });

  it('locks the gallery when visibility.access_granted is false and photos are empty', () => {
    const gallery = mapPhotoGallery({
      success: 200,
      message: 'Photo gallery retrieved successfully.',
      user: { id: 1056, name: 'Taha' },
      photos: [],
      total_photos: 0,
      visibility: {
        access_granted: false,
        additional_photos_visible: true,
        profile_photo_visible: false,
      },
    });

    expect(gallery.accessGranted).toBe(false);
    expect(gallery.photos).toHaveLength(0);
    expect(gallery.name).toBe('Taha');
    expect(gallery.userId).toBe('1056');
  });

  it('locks the gallery when the owner hides photos and this viewer has no access', () => {
    const gallery = mapPhotoGallery({
      success: 200,
      user: { id: 22, name: 'Hina' },
      visibility: {
        access_granted: false,
        additional_photos_visible: false,
        profile_photo_visible: false,
      },
      photos: [
        {
          index: 0,
          url: 'https://example.com/main.png',
          is_main: true,
        },
        {
          index: 1,
          url: 'https://example.com/extra.png',
          is_main: false,
        },
      ],
    });

    expect(gallery.hiddenByOwner).toBe(true);
    expect(gallery.accessGranted).toBe(false);
    expect(gallery.photos).toHaveLength(0);
  });

  it('unlocks hidden photos only for the approved viewer', () => {
    const gallery = mapPhotoGallery({
      success: 200,
      user: { id: 22, name: 'Hina' },
      visibility: {
        access_granted: true,
        additional_photos_visible: false,
        profile_photo_visible: false,
      },
      photos: [
        {
          index: 0,
          url: 'https://example.com/main.png',
          is_main: true,
        },
        {
          index: 1,
          url: 'https://example.com/extra.png',
          is_main: false,
        },
      ],
    });

    expect(gallery.hiddenByOwner).toBe(false);
    expect(gallery.accessGranted).toBe(true);
    expect(gallery.photos).toEqual([
      { uri: 'https://example.com/main.png' },
      { uri: 'https://example.com/extra.png' },
    ]);
  });

  it('hides only additional photos when that visibility flag is off', () => {
    const gallery = mapPhotoGallery({
      visibility: {
        profile_photo_visible: true,
        additional_photos_visible: false,
      },
      photos: [
        {
          index: 0,
          url: 'https://example.com/main.png',
          is_main: true,
        },
        {
          index: 1,
          url: 'https://example.com/extra.png',
          is_main: false,
        },
      ],
    });

    expect(gallery.photos).toEqual([{ uri: 'https://example.com/main.png' }]);
    expect(gallery.additionalPhotosVisible).toBe(false);
    expect(gallery.hiddenByOwner).toBe(true);
  });

  it('replaces leaked match photos with a dummy when gallery says the picture is hidden', () => {
    const gallery = mapPhotoGallery({
      visibility: {
        access_granted: false,
        profile_photo_visible: false,
        additional_photos_visible: false,
      },
      photos: [
        {
          index: 0,
          url: 'https://example.com/leaked.png',
          is_main: true,
        },
      ],
    });
    const card = applyViewerPhotoPrivacy(
      {
        image: { uri: 'https://example.com/leaked.png' },
        pictureHidden: false,
      },
      gallery,
    );

    expect(gallery.photos).toHaveLength(0);
    expect(card.pictureHidden).toBe(true);
    expect(card.image).toBe(7);
    expect(card.photosNeedAccess).toBe(true);
  });
});
