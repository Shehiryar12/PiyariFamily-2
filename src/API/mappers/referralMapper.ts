import { ImageSourcePropType } from 'react-native';
import { Images } from '../../Assets';
import { resolveMediaUrl, toRemoteImageSource } from '../mediaUrl';

export type ReferralRewardRow = {
  id: string;
  registrations: string;
  points: string;
};

export type ReferralRedeemOption = {
  id: string;
  type: string;
  title: string;
  pointsRequired: string;
  icon: string;
  canRedeem: boolean;
};

export type ReferralRewardApiItem = {
  type?: string | null;
  title?: string | null;
  name?: string | null;
  label?: string | null;
  points_required?: number | string | null;
  required_points?: number | string | null;
  points_cost?: number | string | null;
  points?: number | string | null;
  cost?: number | string | null;
  can_redeem?: boolean | number | string | null;
  icon?: string | null;
  [key: string]: unknown;
};

export type ReferralStats = {
  referralCode: string;
  referralLink: string;
  registered: number;
  pointsEarned: number;
  pointValuePkr: number;
  totalValuePkr: number;
  conversionRate: string;
  rewardsTable: ReferralRewardRow[];
  shareMessage: string;
  redeemOptions: ReferralRedeemOption[];
  redeemed: number;
};

export type ReferralRewardTableApiItem = {
  id?: number | string | null;
  registrations?: string | number | null;
  successful_registrations?: string | number | null;
  label?: string | null;
  title?: string | null;
  points?: string | number | null;
  reward?: string | number | null;
  reward_points?: string | number | null;
  points_earned?: string | number | null;
};

export type ReferralStatsResponse = {
  success?: boolean | number;
  referral_code?: string | null;
  code?: string | null;
  ref_code?: string | null;
  referral_link?: string | null;
  link?: string | null;
  url?: string | null;
  share_url?: string | null;
  reward_per_registration?: string | number | null;
  reward_points?: number | string | null;
  points_earned?: number | string | null;
  total_points?: number | string | null;
  points?: number | string | null;
  total_registered?: number | string | null;
  registered?: number | string | null;
  registrations?: number | string | null;
  total_referrals?: number | string | null;
  referral_count?: number | string | null;
  point_value_pkr?: number | string | null;
  point_value?: number | string | null;
  pkr_value?: number | string | null;
  reward_value_pkr?: number | string | null;
  total_value_pkr?: number | string | null;
  total_pkr?: number | string | null;
  total_value?: number | string | null;
  conversion_rate?: string | null;
  rewards_table?: ReferralRewardTableApiItem[] | null;
  rewardsTable?: ReferralRewardTableApiItem[] | null;
  redeemed?: number | string | null;
  redeemed_count?: number | string | null;
  share_message?: string | null;
  invite_message?: string | null;
  referral_note?: string | null;
  note?: string | null;
  message?: string;
  rewards?: ReferralRewardApiItem[] | null;
  redeem_options?: ReferralRewardApiItem[] | null;
  redeemOptions?: ReferralRewardApiItem[] | null;
  stats?: ReferralStatsResponse;
  result?: ReferralStatsResponse;
  payload?: ReferralStatsResponse;
  data?: ReferralStatsResponse;
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

const pickString = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const formatPoints = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') {
    return '0 pts';
  }

  const text = String(value).trim();

  if (/pt/i.test(text)) {
    return text;
  }

  return `${text} pts`;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const unwrapPayload = <T extends Record<string, unknown>>(
  response?: T | null,
): T | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  let current: Record<string, unknown> = { ...response };

  for (let depth = 0; depth < 3; depth += 1) {
    const nested =
      current.data ?? current.stats ?? current.result ?? current.payload;

    if (!isPlainObject(nested)) {
      break;
    }

    current = { ...current, ...nested };
  }

  return current as T;
};

const mapRewardsTableFromApi = (
  rows?: ReferralRewardTableApiItem[] | null,
): ReferralRewardRow[] | undefined => {
  if (!Array.isArray(rows)) {
    return undefined;
  }

  return rows.map((row, index) => {
    const registrations = pickString(
      typeof row.registrations === 'number'
        ? `${row.registrations} Registration${row.registrations === 1 ? '' : 's'}`
        : row.registrations,
      typeof row.successful_registrations === 'number'
        ? `${row.successful_registrations} Registration${
            row.successful_registrations === 1 ? '' : 's'
          }`
        : typeof row.successful_registrations === 'string'
          ? row.successful_registrations
          : '',
      row.label,
      row.title,
    );

    return {
      id: String(row.id ?? index + 1),
      registrations: registrations || `${index + 1} Registration`,
      points: formatPoints(
        row.points ?? row.reward ?? row.reward_points ?? row.points_earned,
      ),
    };
  });
};

const buildRewardsTable = (
  rewardPerRegistration?: string | number | null,
  conversionRate?: string | null,
): ReferralRewardRow[] => {
  if (conversionRate?.trim()) {
    const [registrations = '1 Registration', points = ''] = conversionRate
      .split('=')
      .map(part => part.trim());

    return [
      {
        id: '1',
        registrations,
        points: points || formatPoints(rewardPerRegistration ?? 0),
      },
    ];
  }

  if (
    rewardPerRegistration === undefined ||
    rewardPerRegistration === null ||
    rewardPerRegistration === ''
  ) {
    return [];
  }

  return [
    {
      id: '1',
      registrations: '1 Registration',
      points: formatPoints(rewardPerRegistration),
    },
  ];
};

const pickShareMessage = (data?: ReferralStatsResponse | null) => {
  const dedicated = pickString(
    data?.share_message,
    data?.invite_message,
    data?.referral_note,
    data?.note,
  );

  if (dedicated) {
    return dedicated;
  }

  const message = pickString(data?.message);

  if (
    message &&
    /(share|invite|earn|register|referral|point)/i.test(message) &&
    !/^(success|ok|successful|retrieved|fetched)[.!]?$/i.test(message)
  ) {
    return message;
  }

  return '';
};

const humanizeType = (value?: string) => {
  if (!value?.trim()) {
    return '';
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
};

const iconForReward = (type?: string, icon?: string) => {
  if (icon?.trim()) {
    return icon.trim();
  }

  const key = (type || '').toLowerCase();

  if (key.includes('vvip')) {
    return 'crown';
  }

  if (key.includes('vip')) {
    return 'crown';
  }

  if (key.includes('boost')) {
    return 'chart-line';
  }

  return 'gift-outline';
};

const mapRedeemOptions = (
  rewards?: ReferralRewardApiItem[] | null,
): ReferralRedeemOption[] => {
  if (!Array.isArray(rewards)) {
    return [];
  }

  return rewards.flatMap((item, index) => {
    const type = pickString(item.type);
    const title =
      pickString(item.title, item.name, item.label) || humanizeType(type);

    if (!type || !title) {
      return [];
    }

    const points = pickNumber(
      item.points_required,
      item.required_points,
      item.points_cost,
      item.points,
      item.cost,
    );
    const canRedeemValue = item.can_redeem;
    const canRedeemDenied =
      canRedeemValue === false ||
      canRedeemValue === 0 ||
      canRedeemValue === '0' ||
      canRedeemValue === 'false';
    const canRedeemAllowed =
      canRedeemValue === true ||
      canRedeemValue === 1 ||
      canRedeemValue === '1' ||
      canRedeemValue === 'true';

    return [
      {
        id: type || `reward-${index}`,
        type,
        title,
        pointsRequired: points ? `${points} pts required` : formatPoints(item.points),
        icon: iconForReward(type, pickString(item.icon)),
        canRedeem: canRedeemDenied ? false : canRedeemAllowed || canRedeemValue == null,
      },
    ];
  });
};

export const mapReferralStats = (
  response?: ReferralStatsResponse | null,
): ReferralStats => {
  const data = unwrapPayload(response as Record<string, unknown> | null) as
    | ReferralStatsResponse
    | null;

  const pointsEarned = pickNumber(
    data?.reward_points,
    data?.points_earned,
    data?.total_points,
    data?.points,
  );
  const pointValuePkr = pickNumber(
    data?.point_value_pkr,
    data?.point_value,
    data?.pkr_value,
  );
  const totalValuePkr = pickNumber(
    data?.total_value_pkr,
    data?.total_pkr,
    data?.total_value,
    data?.reward_value_pkr,
    pointsEarned && pointValuePkr ? pointsEarned * pointValuePkr : 0,
  );

  return {
    referralCode: pickString(data?.referral_code, data?.code, data?.ref_code),
    referralLink: pickString(
      data?.referral_link,
      data?.link,
      data?.url,
      data?.share_url,
      buildRegisterReferralLink(
        pickString(data?.referral_code, data?.code, data?.ref_code),
      ),
    ),
    registered: pickNumber(
      data?.total_registered,
      data?.registered,
      data?.registrations,
      data?.total_referrals,
      data?.referral_count,
    ),
    pointsEarned,
    pointValuePkr,
    totalValuePkr,
    conversionRate: pickString(data?.conversion_rate),
    rewardsTable:
      mapRewardsTableFromApi(data?.rewards_table ?? data?.rewardsTable) ??
      buildRewardsTable(data?.reward_per_registration, data?.conversion_rate),
    shareMessage: pickShareMessage(data),
    redeemOptions: mapRedeemOptions(
      data?.rewards ?? data?.redeem_options ?? data?.redeemOptions,
    ),
    redeemed: pickNumber(data?.redeemed, data?.redeemed_count),
  };
};

export type ReferralLinkResponse = {
  success?: boolean | number;
  referral_code?: string | null;
  referral_link?: string | null;
  reward_per_registration?: number | string | null;
  message?: string;
  data?: ReferralLinkResponse;
};

export type ReferralRewardsResponse = {
  success?: boolean | number;
  total_points?: number | string | null;
  point_value_pkr?: number | string | null;
  total_value_pkr?: number | string | null;
  reward_value_pkr?: number | string | null;
  redeemed?: number | string | null;
  redeemed_count?: number | string | null;
  total_registered?: number | string | null;
  registrations?: number | string | null;
  rewards?: ReferralRewardApiItem[];
  message?: string;
  data?: ReferralRewardsResponse;
};

const flattenResponse = <T extends { data?: T }>(response?: T | null): T | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return {
      ...response,
      ...response.data,
    };
  }

  return response;
};

export const mapReferralLink = (
  response?: ReferralLinkResponse | null,
): Pick<
  ReferralStats,
  'referralCode' | 'referralLink' | 'shareMessage' | 'rewardsTable'
> => {
  const data = flattenResponse(response);
  const referralCode = pickString(data?.referral_code);

  return {
    referralCode,
    referralLink:
      pickString(data?.referral_link) || buildRegisterReferralLink(referralCode),
    shareMessage: pickString(data?.message),
    rewardsTable: buildRewardsTable(data?.reward_per_registration),
  };
};

export const mapReferralRewards = (
  response?: ReferralRewardsResponse | null,
): Pick<
  ReferralStats,
  | 'pointsEarned'
  | 'pointValuePkr'
  | 'totalValuePkr'
  | 'registered'
  | 'redeemed'
  | 'redeemOptions'
  | 'shareMessage'
> => {
  const data = flattenResponse(response);

  return {
    pointsEarned: pickNumber(data?.total_points),
    pointValuePkr: pickNumber(data?.point_value_pkr),
    totalValuePkr: pickNumber(data?.total_value_pkr, data?.reward_value_pkr),
    registered: pickNumber(data?.total_registered, data?.registrations),
    redeemed: pickNumber(data?.redeemed, data?.redeemed_count),
    redeemOptions: mapRedeemOptions(data?.rewards),
    shareMessage: pickString(data?.message),
  };
};

export const mergeReferralData = (
  link?: ReferralLinkResponse | null,
  rewards?: ReferralRewardsResponse | null,
  stats?: ReferralStatsResponse | null,
  previous?: ReferralStats | null,
): ReferralStats => {
  const fromLink = link ? mapReferralLink(link) : null;
  const fromRewards = rewards ? mapReferralRewards(rewards) : null;
  const fromStats = mapReferralStats(stats);

  return {
    referralCode:
      fromLink?.referralCode ||
      fromStats.referralCode ||
      previous?.referralCode ||
      '',
    referralLink:
      fromLink?.referralLink ||
      fromStats.referralLink ||
      previous?.referralLink ||
      '',
    registered: fromStats.registered || fromRewards?.registered || previous?.registered || 0,
    pointsEarned: fromRewards
      ? fromRewards.pointsEarned
      : stats
        ? fromStats.pointsEarned
        : previous?.pointsEarned ?? 0,
    pointValuePkr:
      fromRewards?.pointValuePkr ||
      fromStats.pointValuePkr ||
      previous?.pointValuePkr ||
      0,
    totalValuePkr: fromRewards
      ? fromRewards.totalValuePkr
      : stats
        ? fromStats.totalValuePkr
        : previous?.totalValuePkr ?? 0,
    conversionRate: fromStats.conversionRate || previous?.conversionRate || '',
    rewardsTable: fromStats.rewardsTable.length
      ? fromStats.rewardsTable
      : fromLink?.rewardsTable.length
        ? fromLink.rewardsTable
        : previous?.rewardsTable ?? [],
    shareMessage:
      fromLink?.shareMessage ||
      fromRewards?.shareMessage ||
      fromStats.shareMessage ||
      previous?.shareMessage ||
      '',
    redeemOptions: fromRewards
      ? fromRewards.redeemOptions
      : fromStats.redeemOptions.length
        ? fromStats.redeemOptions
        : previous?.redeemOptions ?? [],
    redeemed: fromStats.redeemed || fromRewards?.redeemed || previous?.redeemed || 0,
  };
};

export type ReferralRedeemResponse = {
  success?: boolean | number;
  message?: string;
  remaining_points?: number | string | null;
  remainingPoints?: number | string | null;
  meta?: {
    reward_label?: string | null;
    rewardLabel?: string | null;
    boost_until?: string | null;
    [key: string]: unknown;
  } | null;
  data?: ReferralRedeemResponse;
};

export const applyReferralRedeem = (
  current: ReferralStats,
  response?: ReferralRedeemResponse | null,
): ReferralStats => {
  const data = flattenResponse(response);
  const remaining = pickNumber(data?.remaining_points, data?.remainingPoints);
  const hasRemaining =
    data?.remaining_points != null || data?.remainingPoints != null;

  return {
    ...current,
    pointsEarned: hasRemaining ? remaining : current.pointsEarned,
    totalValuePkr: hasRemaining
      ? remaining * current.pointValuePkr
      : current.totalValuePkr,
    redeemed: current.redeemed + 1,
  };
};

export type ReferralHistoryItem = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  points: string;
  isRegistered: boolean;
  statusLabel: string;
  subtitle: string;
};

export type ReferralHistoryApiItem = {
  id?: number | string;
  user_id?: number | string;
  referred_user_id?: number | string;
  name?: string | null;
  full_name?: string | null;
  referred_name?: string | null;
  email?: string | null;
  phone?: string | null;
  points?: number | string | null;
  reward_points?: number | string | null;
  points_earned?: number | string | null;
  profile_photo?: string | null;
  photo?: string | null;
  avatar?: string | null;
  image?: string | null;
  photos?: Array<Record<string, unknown> | string> | null;
  gender?: string | null;
  status?: string | null;
  registration_status?: string | null;
  is_registered?: boolean | number | null;
  registered?: boolean | number | null;
  created_at?: string | null;
  registered_at?: string | null;
  date?: string | null;
  message?: string | null;
  note?: string | null;
  user?: ReferralHistoryApiItem;
  profile?: ReferralHistoryApiItem;
  referred_user?: ReferralHistoryApiItem;
};

type ReferralHistoryListSource =
  | ReferralHistoryApiItem[]
  | {
      data?: ReferralHistoryApiItem[] | ReferralHistoryResponse;
      history?: ReferralHistoryApiItem[];
      referrals?: ReferralHistoryApiItem[];
      items?: ReferralHistoryApiItem[];
      results?: ReferralHistoryApiItem[];
      users?: ReferralHistoryApiItem[];
      records?: ReferralHistoryApiItem[];
    };

export type ReferralHistoryResponse = {
  success?: boolean | number;
  history?: ReferralHistoryListSource | null;
  referrals?: ReferralHistoryListSource | null;
  users?: ReferralHistoryListSource | null;
  results?: ReferralHistoryListSource | null;
  items?: ReferralHistoryListSource | null;
  records?: ReferralHistoryListSource | null;
  data?: ReferralHistoryApiItem[] | ReferralHistoryResponse;
  total?: number | string | null;
  message?: string;
};

const REGISTERED_STATUSES = new Set([
  'registered',
  'completed',
  'success',
  'successful',
  'active',
]);

const normalizeHistoryItem = (
  item: ReferralHistoryApiItem,
): ReferralHistoryApiItem => {
  const nested = item.referred_user ?? item.user ?? item.profile;

  if (!nested || typeof nested !== 'object') {
    return item;
  }

  return {
    ...nested,
    ...item,
    name:
      pickString(
        item.name,
        item.full_name,
        item.referred_name,
        nested.name,
        nested.full_name,
        nested.referred_name,
      ) || null,
    email: pickString(item.email, nested.email) || null,
    phone: pickString(item.phone, nested.phone) || null,
    gender: pickString(item.gender, nested.gender) || null,
    status: pickString(item.status, item.registration_status, nested.status) || null,
    profile_photo:
      pickString(
        item.profile_photo,
        item.photo,
        item.avatar,
        item.image,
        nested.profile_photo,
        nested.photo,
        nested.avatar,
        nested.image,
      ) || null,
  };
};

const pickPhotoFromList = (
  photos?: Array<Record<string, unknown> | string> | null,
) => {
  if (!Array.isArray(photos) || photos.length === 0) {
    return '';
  }

  const first = photos[0];

  if (typeof first === 'string') {
    return first;
  }

  if (!isPlainObject(first)) {
    return '';
  }

  return pickString(
    typeof first.url === 'string' ? first.url : '',
    typeof first.path === 'string' ? first.path : '',
    typeof first.photo === 'string' ? first.photo : '',
    typeof first.image === 'string' ? first.image : '',
    typeof first.profile_photo === 'string' ? first.profile_photo : '',
    typeof first.src === 'string' ? first.src : '',
  );
};

const resolveHistoryImage = (
  item: ReferralHistoryApiItem,
): ImageSourcePropType => {
  const photo = pickString(
    item.profile_photo,
    item.photo,
    item.avatar,
    item.image,
    pickPhotoFromList(item.photos),
  );
  const url = resolveMediaUrl(photo);

  if (url) {
    return toRemoteImageSource(url);
  }

  if (item.gender?.toLowerCase() === 'male') {
    return Images.maleProfile;
  }

  return Images.femaleProfile;
};

const formatHistoryPoints = (value?: number | string | null) => {
  const points = pickNumber(value);

  if (!points) {
    return '+0 pts';
  }

  return `+${points} pts`;
};

const formatStatusLabel = (status: string) => {
  if (!status) {
    return '';
  }

  return status
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const resolveHistoryId = (item: ReferralHistoryApiItem, index: number) => {
  const id = item.id ?? item.user_id ?? item.referred_user_id;

  if (id !== undefined && id !== null && String(id).trim()) {
    return String(id);
  }

  return `referral-history-${index}`;
};

const isHistoryRegistered = (item: ReferralHistoryApiItem, status: string) =>
  item.is_registered === true ||
  item.is_registered === 1 ||
  item.registered === true ||
  item.registered === 1 ||
  REGISTERED_STATUSES.has(status);

export const mapReferralHistoryItem = (
  item: ReferralHistoryApiItem,
  index: number,
): ReferralHistoryItem => {
  const profile = normalizeHistoryItem(item);
  const status = pickString(profile.status, profile.registration_status).toLowerCase();
  const statusLabel = formatStatusLabel(status);
  const isRegistered = isHistoryRegistered(profile, status);
  const subtitle = pickString(
    profile.message,
    profile.note,
    statusLabel,
    profile.registered_at,
    profile.created_at,
    profile.date,
    profile.email,
  );

  return {
    id: resolveHistoryId(profile, index),
    name:
      pickString(
        profile.name,
        profile.full_name,
        profile.referred_name,
      ) || '-',
    image: resolveHistoryImage(profile),
    points: formatHistoryPoints(
      profile.points ?? profile.reward_points ?? profile.points_earned,
    ),
    isRegistered,
    statusLabel,
    subtitle,
  };
};

const extractObjectArray = (value: unknown): ReferralHistoryApiItem[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ReferralHistoryApiItem =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    );
  }

  if (!isPlainObject(value)) {
    return [];
  }

  const nested =
    value.data ??
    value.history ??
    value.referrals ??
    value.items ??
    value.results ??
    value.users ??
    value.records;

  if (Array.isArray(nested)) {
    return extractObjectArray(nested);
  }

  return [];
};

const extractHistory = (
  response?: ReferralHistoryResponse | null,
): ReferralHistoryApiItem[] => {
  const normalized = unwrapPayload(
    response as Record<string, unknown> | null,
  ) as ReferralHistoryResponse | null;

  if (!normalized) {
    return [];
  }

  const sources: Array<unknown> = [
    normalized.history,
    normalized.referrals,
    normalized.users,
    normalized.results,
    normalized.items,
    normalized.records,
    normalized.data,
  ];

  for (const source of sources) {
    if (source == null) {
      continue;
    }

    return extractObjectArray(source);
  }

  return [];
};

export const mapReferralHistory = (
  response?: ReferralHistoryResponse | null,
): ReferralHistoryItem[] => extractHistory(response).map(mapReferralHistoryItem);

const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9]{6,16}$/;
const RESERVED_REFERRAL_SEGMENTS =
  /^(api|login|register|profile|matches|notifications|piyarifamily)$/i;

export const CANONICAL_REFERRAL_BASE =
  'https://ranglerz.click/piyarifamily';

export const SHAREABLE_INVITE_PAGE =
  'https://cdn.jsdelivr.net/gh/Junaid1216/PiyariFamily@main/web-invite/invite.html';

const isReferralCode = (value?: string | null) => {
  const code = value?.trim() ?? '';
  return REFERRAL_CODE_PATTERN.test(code) && !RESERVED_REFERRAL_SEGMENTS.test(code);
};

export const buildRegisterReferralLink = (code?: string | null) => {
  if (!isReferralCode(code)) {
    return '';
  }

  return `${CANONICAL_REFERRAL_BASE}/${code.trim()}`;
};

export const buildShareableInviteLink = (code?: string | null) =>
  buildRegisterReferralLink(code);

const toParseableUrl = (value: string) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return value;
  }

  if (value.includes('.') || value.includes('/')) {
    return `https://${value.replace(/^\/+/, '')}`;
  }

  return value;
};

export const extractReferralCodeFromUrl = (url?: string | null): string | null => {
  if (!url?.trim()) {
    return null;
  }

  const trimmed = url.trim();

  if (isReferralCode(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(toParseableUrl(trimmed));

    const fromQuery =
      parsed.searchParams.get('referral_code') ||
      parsed.searchParams.get('referral_link') ||
      parsed.searchParams.get('ref') ||
      parsed.searchParams.get('code');

    if (fromQuery?.trim()) {
      return extractReferralCodeFromUrl(fromQuery.trim());
    }

    if (/\/api(\/|$)/i.test(parsed.pathname)) {
      return null;
    }

    const last = parsed.pathname.split('/').filter(Boolean).pop() ?? '';

    if (isReferralCode(last)) {
      return last;
    }

    if (!last && isReferralCode(parsed.hostname)) {
      return parsed.hostname;
    }
  } catch {
    return null;
  }

  return null;
};

export const normalizeReferralLink = (value?: string | null): string | null => {
  const code = extractReferralCodeFromUrl(value);

  if (!code) {
    return null;
  }

  return buildRegisterReferralLink(code);
};
