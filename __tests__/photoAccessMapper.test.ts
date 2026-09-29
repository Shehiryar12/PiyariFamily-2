import {
  mapPhotoAccessRequestItem,
  mapPhotoAccessRequests,
  mergePhotoAccessResponses,
  resolvePhotoAccessRespond,
} from '../src/API/mappers/photoAccessMapper';

const POSTMAN_LIST = {
  requests: [
    {
      id: 1,
      status: 'approved',
      profile: {
        id: 1056,
        name: 'Taha',
        profile_photo:
          'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
      },
    },
  ],
};

describe('GET /photo-access-requests', () => {
  it('maps a request even when nested collection keys are empty', () => {
    const [item] = mapPhotoAccessRequests({
      id: 1,
      status: 'approved',
      items: [],
      profile: {
        id: 1056,
        name: 'Taha',
        profile_photo:
          'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
      },
    });

    expect(item.name).toBe('Taha');
    expect(item.profileId).toBe('1056');
  });

  it('maps the live Postman list onto View Profile Requests cards', () => {
    const [item] = mapPhotoAccessRequests(POSTMAN_LIST);

    expect(item.id).toBe('1');
    expect(item.profileId).toBe('1056');
    expect(item.name).toBe('Taha');
    expect(item.status).toBe('accepted');
    expect(item.statusLabel).toBe('Approved');
    expect(item.image).toEqual({
      uri: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
      headers: {
        Accept: 'image/jpeg,image/png,image/webp,image/*',
      },
    });
    expect(item.photos).toHaveLength(1);
  });

  it('keeps incoming requests empty until another user sends one', () => {
    const items = mapPhotoAccessRequests({
      success: 200,
      type: 'incoming',
      requests: [],
    });

    expect(items).toHaveLength(0);
  });

  it('maps requests nested under data when wrapper status is success', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      status: 'success',
      data: {
        requests: [
          {
            id: 1,
            status: 'approved',
            profile: {
              id: 1056,
              name: 'Taha',
              profile_photo:
                'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
            },
          },
        ],
      },
    });

    expect(item.id).toBe('1');
    expect(item.name).toBe('Taha');
    expect(item.profileId).toBe('1056');
  });

  it('maps nested request profiles even when the wrapper has a status string', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      status: 'success',
      requests: [
        {
          id: 1,
          status: 'approved',
          profile: {
            id: 1002,
            name: 'Jannat',
            age: 26,
            city: 'Lahore',
            country: 'Pakistan',
            location: 'Lahore, Pakistan',
          },
        },
      ],
    });

    expect(item.location).toBe('Lahore, Pakistan');
    expect(item.age).toBe(26);
    expect(item.name).toBe('Jannat');
  });

  it('maps a single request payload without a requests array', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      message: 'Photo access is already approved.',
      request_id: 1,
      status: 'approved',
      profile: {
        id: 1002,
        name: 'Jannat',
        age: 26,
        city: 'Lahore',
        country: 'Pakistan',
        location: 'Lahore, Pakistan',
      },
    });

    expect(item.id).toBe('1');
    expect(item.location).toBe('Lahore, Pakistan');
    expect(item.name).toBe('Jannat');
  });

  it('shows the root request when requests is empty but profile data is present', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      message: 'Photo access is already approved.',
      request_id: 1,
      status: 'approved',
      requests: [],
      profile: {
        id: 1002,
        name: 'Jannat',
        age: 26,
        city: 'Lahore',
        country: 'Pakistan',
        location: 'Lahore, Pakistan',
      },
    });

    expect(item.name).toBe('Jannat');
    expect(item.profileId).toBe('1002');
    expect(item.statusLabel).toBe('Approved');
  });

  it('merges outgoing requests when the incoming list is empty', () => {
    const items = mergePhotoAccessResponses([
      { success: 200, type: 'incoming', requests: [] },
      {
        success: 200,
        type: 'outgoing',
        requests: [
          {
            id: 7,
            status: 'pending',
            profile: { id: 9, name: 'Hina' },
          },
        ],
      },
    ]);

    expect(items).toHaveLength(1);
    expect(mapPhotoAccessRequests({ requests: items })[0].name).toBe('Hina');
  });

  it('merges root profile location onto sparse nested requests', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      request_id: 1,
      status: 'approved',
      profile: {
        id: 1002,
        name: 'Jannat',
        age: 26,
        city: 'Lahore',
        country: 'Pakistan',
        location: 'Lahore, Pakistan',
      },
      requests: [
        {
          id: 1,
          status: 'approved',
          profile: { id: 1002, name: 'Jannat' },
        },
      ],
    });

    expect(item.location).toBe('Lahore, Pakistan');
  });

  it('maps location from a full profile on the request card', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      requests: [
        {
          id: 1,
          status: 'approved',
          profile: {
            id: 1002,
            name: 'Jannat',
            age: 26,
            city: 'Lahore',
            country: 'Pakistan',
            location: 'Lahore, Pakistan',
            profile_photo:
              'https://ranglerz.click/piyarifamily/uploads/store/profiles/1002/aTpWr7FutHzsdbG80uDVrCF3RLmM1Yhg56YKlGIu.jpg',
          },
        },
      ],
    });

    expect(item.location).toBe('Lahore, Pakistan');
    expect(item.age).toBe(26);
    expect(item.name).toBe('Jannat');
  });

  it('does not invent age, location, or verified when the API omits them', () => {
    const [item] = mapPhotoAccessRequests(POSTMAN_LIST);

    expect(item.age).toBeUndefined();
    expect(item.location).toBeUndefined();
    expect(item.isVerified).toBeUndefined();
    expect(item.requestedAt).toBe('');
  });

  it('does not invent name or age when the API omits them', () => {
    const [item] = mapPhotoAccessRequests({
      requests: [{ id: 3, status: 'pending', profile: { id: 9 } }],
    });

    expect(item.name).toBeUndefined();
    expect(item.age).toBeUndefined();
  });

  it('maps pending and extra profile fields when the API sends them', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      requests: [
        {
          id: 2,
          status: 'pending',
          created_at: '2026-08-26 12:00:00',
          profile: {
            id: 9,
            name: 'Sara',
            age: 26,
            city: 'Lahore',
            is_verified: true,
          },
        },
      ],
    });

    expect(item.status).toBe('pending');
    expect(item.age).toBe(26);
    expect(item.location).toBe('Lahore');
    expect(item.isVerified).toBe(true);
    expect(item.requestedAt).toBeTruthy();
  });

  it('maps location when city/country arrive as objects', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      requests: [
        {
          id: 1,
          status: 'approved',
          profile: {
            id: 1056,
            name: 'Taha',
            age: 26,
            city: { id: 12, name: 'Lahore' },
            country: { id: 1, name: 'Pakistan' },
            is_verified: 1,
          },
        },
      ],
    });

    expect(item.location).toBe('Lahore, Pakistan');
  });

  it('maps location from the request root when profile omits it', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      requests: [
        {
          id: 1,
          status: 'approved',
          location: { city: 'Karachi', country: 'Pakistan' },
          profile: { id: 1056, name: 'Taha', age: 26 },
        },
      ],
    });

    expect(item.location).toBe('Karachi, Pakistan');
  });

  it('merges user fields when profile is sparse', () => {
    const [item] = mapPhotoAccessRequests({
      success: 200,
      type: 'outgoing',
      requests: [
        {
          id: 1,
          status: 'approved',
          profile: { id: 1056, name: 'Taha' },
          user: {
            id: 1056,
            name: 'Taha',
            age: 26,
            is_verified: 1,
            photos: [
              {
                url: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1056/male-08.png',
              },
            ],
          },
        },
      ],
    });

    expect(item.age).toBe(26);
    expect(item.isVerified).toBe(true);
    expect(item.photos).toHaveLength(1);
  });

  it('merges empty incoming with outgoing requests', () => {
    const items = mergePhotoAccessResponses([
      { success: 200, type: 'incoming', requests: [] },
      {
        success: 200,
        type: 'outgoing',
        requests: [
          {
            id: 1,
            status: 'approved',
            profile: { id: 1056, name: 'Taha' },
          },
        ],
      },
    ]);

    expect(mapPhotoAccessRequests({ requests: items })).toHaveLength(1);
    expect(items[0].id).toBe(1);
  });
});

describe('POST /photo-access-requests/{id}/respond', () => {
  it('maps approved response status onto the request card', () => {
    const item = mapPhotoAccessRequestItem(
      { id: 1, status: 'approved', profile: { id: 1056, name: 'Taha' } },
      0,
    );

    expect(item.status).toBe('accepted');
    expect(item.statusLabel).toBe('Approved');
  });

  it('reads status and request_id from the live respond payload', () => {
    const resolved = resolvePhotoAccessRespond({
      success: 200,
      message: 'Photo access request approved.',
      request_id: 1,
      status: 'approved',
    });

    expect(resolved.requestId).toBe('1');
    expect(resolved.status).toBe('accepted');
    expect(resolved.statusLabel).toBe('Approved');
    expect(resolved.message).toBe('Photo access request approved.');
    expect(resolved.request).toBeNull();
  });

  it('maps location from the respond profile payload', () => {
    const resolved = resolvePhotoAccessRespond({
      success: 200,
      message: 'Photo access is already approved.',
      request_id: 1,
      status: 'approved',
      profile: {
        id: 1002,
        name: 'Jannat',
        age: 26,
        city: 'Lahore',
        country: 'Pakistan',
        location: 'Lahore, Pakistan',
        profile_photo:
          'https://ranglerz.click/piyarifamily/uploads/store/profiles/1002/aTpWr7FutHzsdbG80uDVrCF3RLmM1Yhg56YKlGIu.jpg',
        photos: [
          {
            url: 'https://ranglerz.click/piyarifamily/uploads/store/profiles/1002/aTpWr7FutHzsdbG80uDVrCF3RLmM1Yhg56YKlGIu.jpg',
            is_main: true,
          },
        ],
      },
    });

    expect(resolved.request?.location).toBe('Lahore, Pakistan');
    expect(resolved.request?.age).toBe(26);
    expect(resolved.request?.name).toBe('Jannat');
    expect(resolved.request?.profileId).toBe('1002');
    expect(resolved.request?.photos).toHaveLength(1);
  });
});
