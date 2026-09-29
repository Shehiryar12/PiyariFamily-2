import { isApiSuccess } from '../src/API/types';
import { ENDPOINTS } from '../src/API/endpoints';
import {
  applyAllNotificationsRead,
  applyNotificationRead,
  extractReadNotification,
  formatNotificationTime,
  mapNotifications,
  pickUnreadCount,
  unwrapNotificationAction,
  type NotificationsResponse,
} from '../src/API/mappers/notificationMapper';

const POSTMAN_LIST: NotificationsResponse = {
  success: 200,
  unread_count: 6,
  notifications: [
    {
      id: 32,
      title: 'Test',
      message: 'Testing',
      is_read: false,
      read_at: null,
    },
  ],
};

describe('notification endpoints', () => {
  it('matches the live Postman URLs and methods', () => {
    expect(ENDPOINTS.NOTIFICATIONS).toBe('/notifications');
    expect(ENDPOINTS.NOTIFICATIONS_READ_ALL).toBe('/notifications/read-all');
    expect(ENDPOINTS.NOTIFICATIONS_CLEAR_ALL).toBe('/notifications/clear-all');
    expect(`${ENDPOINTS.NOTIFICATIONS}/32/read`).toBe('/notifications/32/read');
  });
});

describe('GET /notifications', () => {
  it('treats HTTP 200 and body success: 200 as success', () => {
    expect(isApiSuccess(200, 200)).toBe(true);
    expect(isApiSuccess(204, undefined)).toBe(true);
  });

  it('maps the Postman GET /notifications payload onto the card', () => {
    const items = mapNotifications(POSTMAN_LIST);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('32');
    expect(items[0].title).toBe('Test');
    expect(items[0].description).toBe('Testing');
    expect(items[0].unread).toBe(true);
    expect(pickUnreadCount(POSTMAN_LIST, items)).toBe(6);
  });

  it('maps extra fields onto the existing card when the API sends them', () => {
    const items = mapNotifications({
      success: 200,
      notifications: [
        {
          id: 1,
          title: 'Package Reminder',
          message: 'Upgrade your package to view more profile details.',
          is_read: false,
          created_at: '2026-09-03 12:00:00',
          action_label: 'Upgrade Now',
          type: 'package',
        },
      ],
    });

    expect(items[0].unread).toBe(true);
    expect(items[0].createdAt).toBe('2026-09-03 12:00:00');
    expect(items[0].time).not.toBe('5h');
    expect(items[0].time).not.toBe('Yesterday');
    expect(items[0].actionLabel).toBe('Upgrade Now');
    expect(items[0].icon).toBe('gift-outline');
  });
});

describe('POST /notifications/{id}/read', () => {
  it('unwraps the Postman read payload and marks the matching card read', () => {
    const res = unwrapNotificationAction(200, {
      success: 200,
      message: 'Notification marked as read.',
      notification: {
        id: 32,
        is_read: true,
        read_at: '2026-08-25 08:01:54',
      },
    });

    expect(isApiSuccess(res.status, res.success)).toBe(true);
    expect(res.message).toBe('Notification marked as read.');

    const updated = applyNotificationRead(
      [
        {
          id: '32',
          icon: 'bell-outline',
          title: 'Test',
          description: 'Testing',
          time: '',
          unread: true,
          type: '',
        },
      ],
      '32',
      extractReadNotification(res),
    );

    expect(updated[0].unread).toBe(false);
  });
});

describe('POST /notifications/read-all', () => {
  it('treats the Postman read-all payload as success and clears unread dots', () => {
    const res = unwrapNotificationAction(200, {
      success: 200,
      message: 'All notifications marked as read.',
      updated_count: 5,
    });

    expect(isApiSuccess(res.status, res.success) && res.success !== false).toBe(
      true,
    );
    expect(res.updated_count).toBe(5);

    const updated = applyAllNotificationsRead([
      {
        id: '32',
        icon: 'bell-outline',
        title: 'Test',
        description: 'Testing',
        time: '',
        unread: true,
        type: '',
      },
      {
        id: '33',
        icon: 'bell-outline',
        title: 'New Account',
        description: 'Created',
        time: '',
        unread: true,
        type: '',
      },
    ]);

    expect(updated.every(item => item.unread === false)).toBe(true);
  });
});

describe('DELETE /notifications/clear-all', () => {
  it('treats the Postman clear-all payload as success', () => {
    const res = unwrapNotificationAction(200, {
      success: 200,
      message: 'All notifications cleared.',
      deleted_count: 6,
    });

    expect(isApiSuccess(res.status, res.success) && res.success !== false).toBe(
      true,
    );
    expect(res.message).toBe('All notifications cleared.');
    expect(res.deleted_count).toBe(6);
  });
});

describe('notification time formatting', () => {
  const now = Date.parse('2026-09-04T15:00:00');

  it('calculates relative time from created_at, not hardcoded labels', () => {
    expect(formatNotificationTime(new Date(now - 10 * 1000).toISOString(), now)).toBe(
      'Just now',
    );
    expect(
      formatNotificationTime(new Date(now - 5 * 60 * 1000).toISOString(), now),
    ).toBe('5 minutes ago');
    expect(
      formatNotificationTime(new Date(now - 60 * 60 * 1000).toISOString(), now),
    ).toBe('1 hour ago');
    expect(
      formatNotificationTime(new Date(now - 5 * 60 * 60 * 1000).toISOString(), now),
    ).toBe('5 hours ago');
    expect(
      formatNotificationTime(new Date(now - 24 * 60 * 60 * 1000).toISOString(), now),
    ).toBe('1 day ago');
    expect(
      formatNotificationTime(new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), now),
    ).toBe('2 days ago');
  });

  it('ignores static API time strings like 5h when created_at is present', () => {
    const createdAt = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const items = mapNotifications({
      success: 200,
      notifications: [
        {
          id: 9,
          title: 'New Notification',
          message: 'Explore your suggested matches today.',
          time: '5h',
          created_at: createdAt,
        },
      ],
    });

    expect(items[0].createdAt).toBe(createdAt);
    expect(items[0].time).toBe('5 hours ago');
  });

  it('does not pass through hardcoded relative strings as timestamps', () => {
    expect(formatNotificationTime('5h')).toBe('');
    expect(formatNotificationTime('Yesterday')).toBe('');
  });
});
