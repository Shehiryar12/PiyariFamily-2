export type AppNotification = {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  createdAt?: string;
  unread: boolean;
  actionLabel?: string;
  count?: number;
  type: string;
};

export type NotificationApiItem = {
  id?: number | string;
  title?: string | null;
  message?: string | null;
  description?: string | null;
  body?: string | null;
  type?: string | null;
  notification_type?: string | null;
  category?: string | null;
  is_read?: boolean | number | string | null;
  read?: boolean | number | string | null;
  unread?: boolean | number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  read_at?: string | null;
  time?: string | null;
  timestamp?: string | null;
  date?: string | null;
  count?: number | string | null;
  badge?: number | string | null;
  action_label?: string | null;
  actionLabel?: string | null;
  button_text?: string | null;
  button?: string | null;
  cta?: string | null;
  action?: string | null;
  icon?: string | null;
  data?: NotificationApiItem | Record<string, unknown> | null;
  notification?: NotificationApiItem | null;
  [key: string]: unknown;
};

export type NotificationPagination = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type NotificationsResponse = {
  success?: boolean | number;
  unread_count?: number | string | null;
  unreadCount?: number | string | null;
  notifications?: NotificationApiItem[];
  pagination?: NotificationPagination;
  data?: NotificationsResponse | NotificationApiItem[];
  message?: string;
};

export type NotificationReadResponse = {
  success?: boolean | number;
  message?: string;
  notification?: NotificationApiItem;
  data?: NotificationReadResponse | NotificationApiItem;
};

export type NotificationsReadAllResponse = {
  success?: boolean | number;
  message?: string;
  updated_count?: number | string | null;
};

export type NotificationsClearAllResponse = {
  success?: boolean | number;
  message?: string;
  deleted_count?: number | string | null;
};

const pickString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const pickNumber = (...values: Array<number | string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
};

const isTruthyFlag = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 'true';

const flattenItem = (item?: NotificationApiItem | null): NotificationApiItem => {
  if (!item || typeof item !== 'object') {
    return {};
  }

  const nested =
    (item.data && typeof item.data === 'object' && !Array.isArray(item.data)
      ? (item.data as NotificationApiItem)
      : null) ?? item.notification;

  if (!nested || typeof nested !== 'object') {
    return item;
  }

  return {
    ...nested,
    ...item,
    title: pickString(item.title, nested.title) || null,
    message:
      pickString(item.message, nested.message, item.description, nested.description) ||
      null,
    type: pickString(item.type, nested.type, item.notification_type) || null,
    icon: pickString(item.icon, nested.icon) || null,
    created_at: pickString(item.created_at, nested.created_at) || null,
    timestamp: pickString(item.timestamp, nested.timestamp) || null,
    date: pickString(item.date, nested.date) || null,
    updated_at: pickString(item.updated_at, nested.updated_at) || null,
  };
};

const flattenListResponse = (
  response?: NotificationsResponse | null,
): NotificationsResponse | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (Array.isArray(response.data)) {
    return { ...response, notifications: response.notifications ?? response.data };
  }

  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    const nested = response.data as NotificationsResponse;

    return {
      ...response,
      ...nested,
      notifications: response.notifications ?? nested.notifications,
      unread_count: response.unread_count ?? nested.unread_count,
    };
  }

  return response;
};

const extractList = (response?: NotificationsResponse | null) => {
  const data = flattenListResponse(response);

  if (!data) {
    return [];
  }

  if (Array.isArray(data.notifications)) {
    return data.notifications;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

const isPreformattedRelativeTime = (value: string) =>
  /^(yesterday|today|just now|\d+\s*[smhd]|\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)(\s+ago)?)$/i.test(
    value.trim(),
  );

const parseNotificationDate = (value?: string | number | null) => {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = String(value).trim();

  if (!text || isPreformattedRelativeTime(text)) {
    return null;
  }

  if (/^\d+$/.test(text)) {
    const parsed = Number(text);
    const ms = parsed < 1e12 ? parsed * 1000 : parsed;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const laravelDate = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
  );

  if (laravelDate) {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
    const date = hasTimezone
      ? new Date(text.replace(' ', 'T'))
      : new Date(
          Number(laravelDate[1]),
          Number(laravelDate[2]) - 1,
          Number(laravelDate[3]),
          Number(laravelDate[4]),
          Number(laravelDate[5]),
          Number(laravelDate[6]),
        );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const pluralize = (count: number, unit: string) =>
  `${count} ${unit}${count === 1 ? '' : 's'} ago`;

export const formatNotificationTime = (
  value?: string | number | null,
  now = Date.now(),
) => {
  const date = parseNotificationDate(value);

  if (!date) {
    return '';
  }

  const diffMs = Math.max(0, now - date.getTime());
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 45) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return pluralize(minutes, 'minute');
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return pluralize(hours, 'hour');
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return pluralize(days, 'day');
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return pluralize(months, 'month');
  }

  return pluralize(Math.floor(days / 365), 'year');
};

export const pickNotificationTimestamp = (item: NotificationApiItem) =>
  pickString(item.created_at, item.timestamp, item.date, item.updated_at);

const iconForNotification = (type: string, title: string, icon?: string) => {
  if (icon?.trim() && !icon.includes('/')) {
    return icon.trim();
  }

  const key = `${type} ${title}`.toLowerCase();

  if (key.includes('match') || key.includes('heart')) {
    return 'heart-outline';
  }

  if (key.includes('accepted')) {
    return 'check-circle-outline';
  }

  if (key.includes('interest') || key.includes('sent')) {
    return 'send-outline';
  }

  if (key.includes('view request') || key.includes('profile request')) {
    return 'account-eye-outline';
  }

  if (key.includes('viewed') || key.includes('view')) {
    return 'eye-outline';
  }

  if (key.includes('expir')) {
    return 'clock-outline';
  }

  if (key.includes('package') || key.includes('upgrade') || key.includes('plan')) {
    return 'gift-outline';
  }

  if (
    key.includes('complete') ||
    key.includes('profile') ||
    key.includes('account')
  ) {
    return 'account-outline';
  }

  return 'bell-outline';
};

const isUnread = (item: NotificationApiItem) => {
  if (isTruthyFlag(item.unread)) {
    return true;
  }

  if (item.unread === false || item.unread === 0 || item.unread === '0') {
    return false;
  }

  if (isTruthyFlag(item.is_read) || isTruthyFlag(item.read) || pickString(item.read_at)) {
    return false;
  }

  if (item.is_read === false || item.is_read === 0 || item.is_read === '0') {
    return true;
  }

  if (item.read === false || item.read === 0 || item.read === '0') {
    return true;
  }

  const hasReadField =
    'is_read' in item || 'read' in item || 'unread' in item || 'read_at' in item;

  return !hasReadField;
};

export const mapNotificationItem = (
  item: NotificationApiItem,
  index: number,
): AppNotification => {
  const data = flattenItem(item);
  const title = pickString(data.title) || 'Notification';
  const type = pickString(data.type, data.notification_type, data.category);
  const actionLabel = pickString(
    data.action_label,
    data.actionLabel,
    data.button_text,
    data.button,
    data.cta,
    typeof data.action === 'string' && /[a-zA-Z]/.test(data.action) && data.action.length < 24
      ? data.action
      : '',
  );
  const count = pickNumber(data.count, data.badge);
  const id = data.id ?? index;
  const createdAt = pickNotificationTimestamp(data);

  return {
    id: String(id),
    icon: iconForNotification(type, title, pickString(data.icon)),
    title,
    description: pickString(data.message, data.description, data.body),
    createdAt,
    time: formatNotificationTime(createdAt),
    unread: isUnread(data),
    ...(actionLabel ? { actionLabel } : {}),
    ...(count ? { count } : {}),
    type,
  };
};

export const mapNotifications = (
  response?: NotificationsResponse | null,
): AppNotification[] => extractList(response).map(mapNotificationItem);

export const pickUnreadCount = (
  response?: NotificationsResponse | null,
  items: AppNotification[] = [],
) => {
  const data = flattenListResponse(response);

  if (
    data &&
    (data.unread_count != null || data.unreadCount != null)
  ) {
    return pickNumber(data.unread_count, data.unreadCount);
  }

  return items.filter(item => item.unread).length;
};

export const isViewProfileRequestNotification = (item: AppNotification) => {
  const key = `${item.type} ${item.title}`.toLowerCase();
  return (
    key.includes('view profile request') || key.includes('profile requests')
  );
};

export const unwrapNotificationAction = <T extends object>(
  status: number,
  data?: T | null,
) => {
  const payload = (data ?? {}) as T & { data?: T };
  const nested =
    payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? payload.data
      : null;

  return {
    status,
    ...payload,
    ...(nested ?? {}),
  };
};

export const applyNotificationRead = (
  items: AppNotification[],
  notificationId: string,
  _patch?: NotificationApiItem | null,
) =>
  items.map(item =>
    item.id === String(notificationId) ? { ...item, unread: false } : item,
  );

export const applyAllNotificationsRead = (items: AppNotification[]) =>
  items.map(item => ({ ...item, unread: false }));

export const extractReadNotification = (
  response?: NotificationReadResponse | null,
): NotificationApiItem | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (response.notification) {
    return response.notification;
  }

  const nested = response.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    if ('notification' in nested && nested.notification) {
      return nested.notification;
    }

    if ('id' in nested) {
      return nested as NotificationApiItem;
    }
  }

  return null;
};
