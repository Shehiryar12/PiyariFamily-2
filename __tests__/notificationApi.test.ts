import { AxiosError } from 'axios';

jest.mock('../src/API/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    postEmpty: jest.fn(),
    delete: jest.fn(),
    postForm: jest.fn(),
    postFormData: jest.fn(),
    postJson: jest.fn(),
    post: jest.fn(),
  },
  axiosInstance: {},
}));

jest.mock('../src/API/profileStorage', () => ({
  profileStorage: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
}));

jest.mock('../src/API/userStorage', () => ({
  userStorage: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
}));

import { apiClient } from '../src/API/apiClient';
import { Api } from '../src/API/Api';
import { ENDPOINTS } from '../src/API/endpoints';

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;

describe('notification API client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /notifications uses the Postman list URL', async () => {
    mockedClient.get.mockResolvedValue({
      status: 200,
      data: {
        success: 200,
        unread_count: 6,
        notifications: [{ id: 32, title: 'Test', message: 'Testing' }],
      },
    });

    const res = await Api.getNotifications();

    expect(mockedClient.get).toHaveBeenCalledWith(ENDPOINTS.NOTIFICATIONS);
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(200);
    expect(res.data.unread_count).toBe(6);
  });

  it('POST /notifications/{id}/read uses the notification id', async () => {
    mockedClient.postEmpty.mockResolvedValue({
      status: 200,
      data: {
        success: 200,
        message: 'Notification marked as read.',
        notification: {
          id: 32,
          is_read: true,
          read_at: '2026-08-25 08:01:54',
        },
      },
    });

    const res = await Api.markNotificationRead('32');

    expect(mockedClient.postEmpty).toHaveBeenCalledWith('/notifications/32/read');
    expect(res.success).toBe(200);
    expect(res.message).toBe('Notification marked as read.');
  });

  it('POST /notifications/read-all matches Postman', async () => {
    mockedClient.postEmpty.mockResolvedValue({
      status: 200,
      data: {
        success: 200,
        message: 'All notifications marked as read.',
        updated_count: 5,
      },
    });

    const res = await Api.markAllNotificationsRead();

    expect(mockedClient.postEmpty).toHaveBeenCalledWith(
      ENDPOINTS.NOTIFICATIONS_READ_ALL,
    );
    expect(res.status).toBe(200);
    expect(res.success).toBe(200);
    expect(res.updated_count).toBe(5);
  });

  it('DELETE /notifications/clear-all matches Postman', async () => {
    mockedClient.delete.mockResolvedValue({
      status: 200,
      data: {
        success: 200,
        message: 'All notifications cleared.',
        deleted_count: 6,
      },
    });

    const res = await Api.clearAllNotifications();

    expect(mockedClient.delete).toHaveBeenCalledWith(
      ENDPOINTS.NOTIFICATIONS_CLEAR_ALL,
    );
    expect(mockedClient.postEmpty).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.success).toBe(200);
    expect(res.deleted_count).toBe(6);
  });

  it('falls back to POST only when DELETE is method-not-allowed', async () => {
    mockedClient.delete.mockRejectedValue(
      new AxiosError(
        'HTTP method not allowed for this API endpoint',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 405,
          data: { message: 'HTTP method not allowed for this API endpoint' },
          statusText: 'Method Not Allowed',
          headers: {},
          config: {} as never,
        },
      ),
    );
    mockedClient.postEmpty.mockResolvedValue({
      status: 200,
      data: {
        success: 200,
        message: 'All notifications cleared.',
        deleted_count: 6,
      },
    });

    const res = await Api.clearAllNotifications();

    expect(mockedClient.delete).toHaveBeenCalledWith(
      ENDPOINTS.NOTIFICATIONS_CLEAR_ALL,
    );
    expect(mockedClient.postEmpty).toHaveBeenCalledWith(
      ENDPOINTS.NOTIFICATIONS_CLEAR_ALL,
    );
    expect(res.deleted_count).toBe(6);
  });
});
