import { PLAN_OPTIONS, type PlanOption } from '../../Constant/Subscription';

export type SubscriptionPlanData = PlanOption & {
  title: string;
  features: string[];
  durationLabel: string;
  badge: string;
  apiId: string;
  paymentStatus: string;
};

export type SubscriptionFreePlanData = {
  title: string;
  features: string[];
  durationLabel: string;
  badge: string;
  apiId: string;
  paymentStatus: string;
};

export type SubscriptionCompareRow = {
  label: string;
  free: boolean | string;
  vip: boolean | string;
  vvip: boolean | string;
};

export type SubscriptionCurrentPlan = {
  title: string;
  priceLabel: string;
  period: string;
  renewsAt: string;
  expiresAt: string;
  isPaid: boolean;
  tier: 'VIP' | 'VVIP' | 'Free' | null;
  apiId: string;
};

export type SubscriptionPlansData = {
  freeFeatures: string[];
  freePlan: SubscriptionFreePlanData;
  vipPlan: SubscriptionPlanData;
  vvipPlan: SubscriptionPlanData;
  compareRows: SubscriptionCompareRow[];
  currentPlan: SubscriptionCurrentPlan;
};

export type SubscriptionApiFeatures =
  | string[]
  | {
      display?: Array<string | null> | null;
      list?: Array<string | null> | null;
      items?: Array<string | null> | null;
      [key: string]: unknown;
    }
  | null;

export type SubscriptionApiPlan = {
  id?: number | string;
  name?: string | null;
  plan?: string | null;
  title?: string | null;
  slug?: string | null;
  price?: number | string | null;
  price_label?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  duration?: number | string | null;
  duration_unit?: string | null;
  duration_label?: string | null;
  duration_days?: number | string | null;
  validity?: number | string | null;
  validity_label?: string | null;
  interval?: number | string | null;
  interval_unit?: string | null;
  period?: string | null;
  billing_period?: string | null;
  type?: string | null;
  payment_status?: string | null;
  status?: string | null;
  badge?: string | null;
  tag?: string | null;
  label?: string | null;
  highlight?: string | null;
  ribbon?: string | null;
  is_popular?: boolean | number | string | null;
  popular?: boolean | number | string | null;
  is_recommended?: boolean | number | string | null;
  recommended?: boolean | number | string | null;
  features?: SubscriptionApiFeatures;
  benefits?: string[] | null;
  is_current?: boolean | number | null;
  current?: boolean | number | null;
  renews_at?: string | null;
  next_billing_date?: string | null;
  expires_at?: string | null;
  expiry_date?: string | null;
};

export type SubscriptionComparisonRow = {
  feature?: string | null;
  name?: string | null;
  title?: string | null;
  label?: string | null;
  free?: boolean | string | number | null;
  vip?: boolean | string | number | null;
  vvip?: boolean | string | number | null;
  plans?: unknown[] | Record<string, unknown> | null;
  values?: Record<string, unknown> | null;
};

export type SubscriptionsResponse = {
  success?: boolean | number;
  plans?: SubscriptionApiPlan[];
  subscriptions?: SubscriptionApiPlan[];
  comparison?: SubscriptionComparisonRow[];
  compare?: SubscriptionComparisonRow[];
  data?:
    | SubscriptionApiPlan[]
    | { plans?: SubscriptionApiPlan[]; comparison?: SubscriptionComparisonRow[] };
  free_plan?: { features?: string[]; benefits?: string[] };
  free?: { features?: string[]; benefits?: string[] };
  current_plan?: SubscriptionApiPlan | string | number | null;
  current_subscription?: SubscriptionApiPlan | null;
  active_plan?: SubscriptionApiPlan | string | number | null;
  current_plan_id?: number | string | null;
  renews_at?: string | null;
  next_billing_date?: string | null;
  expires_at?: string | null;
  message?: string;
};

const pickString = (...values: Array<string | number | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const pickNumber = (value?: number | string | null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizePlanTier = (
  value?: string | null,
): 'VIP' | 'VVIP' | 'Free' | null => {
  const upper = value?.toUpperCase() ?? '';

  if (upper.includes('VVIP')) {
    return 'VVIP';
  }

  if (upper.includes('VIP')) {
    return 'VIP';
  }

  if (upper.includes('FREE')) {
    return 'Free';
  }

  return null;
};

const formatPriceLabel = (price: number, currency = 'PKR') => {
  if (!price) {
    return pickString() || `${currency} 0`;
  }

  return `${currency} ${price.toLocaleString('en-PK')}`;
};

const FEATURE_CANONICAL: Record<string, string> = {
  search: 'Search',
  'basic search': 'Search',
  chat: 'Chats',
  chats: 'Chats',
  messaging: 'Chats',
  messages: 'Chats',
  boost: 'Profile Boosts',
  boosts: 'Profile Boosts',
  'profile boost': 'Profile Boosts',
  'profile boosts': 'Profile Boosts',
  'super like': 'Super Likes',
  'super likes': 'Super Likes',
  badge: 'Plan Badge',
  'plan badge': 'Plan Badge',
  'vip badge': 'Plan Badge',
  'vvip badge': 'Plan Badge',
  likes: 'See Who Liked You',
  'see likes': 'See Who Liked You',
  'see who liked you': 'See Who Liked You',
};

const titleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const normalizeFeatureKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\beverything in\b.+$/g, ' ')
    .replace(/\bunlimited\b/g, ' ')
    .replace(/\blimited\b/g, ' ')
    .replace(/\bbasic\b/g, ' ')
    .replace(/\bper\s+(month|day|week|mo)\b/g, ' ')
    .replace(/\b(month|mo|day|week)\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\b(vip|vvip|free)\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const canonicalFeatureLabel = (value: string) => {
  const key = normalizeFeatureKey(value);
  if (!key) {
    return '';
  }

  return FEATURE_CANONICAL[key] || titleCase(key);
};

const deriveCellValue = (raw: string): boolean | string => {
  const text = raw.trim();
  if (!text || /^everything in\b/i.test(text)) {
    return true;
  }

  if (/\bunlimited\b/i.test(text)) {
    return 'Unlimited';
  }

  if (/\blimited\b/i.test(text)) {
    return 'Limited';
  }

  const per = text.match(/(\d+)\s*(?:\/\s*|\s+per\s+)(month|mo|day|week)/i);
  if (per) {
    const unit = per[2].toLowerCase().startsWith('mo')
      ? 'Month'
      : titleCase(per[2]);
    return `${per[1]}/${unit}`;
  }

  const qtyUnit = text.match(/(\d+).+?\b(month|mo|day|week)\b/i);
  if (qtyUnit) {
    const unit = qtyUnit[2].toLowerCase().startsWith('mo')
      ? 'Month'
      : titleCase(qtyUnit[2]);
    return `${qtyUnit[1]}/${unit}`;
  }

  const canonical = canonicalFeatureLabel(text);
  if (
    canonical &&
    normalizeFeatureKey(text) !== normalizeFeatureKey(canonical)
  ) {
    return text;
  }

  return true;
};

const coerceCell = (value: unknown): boolean | string => {
  if (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'yes' ||
    value === 'included'
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === '0' ||
    value === 'false' ||
    value === 'no' ||
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return false;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return coerceCell(
      obj.value ?? obj.label ?? obj.text ?? obj.included ?? obj.available,
    );
  }

  return false;
};

const toFeatureList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object') {
        return pickString(
          (item as { title?: string }).title,
          (item as { name?: string }).name,
          (item as { feature?: string }).feature,
          (item as { label?: string }).label,
          (item as { text?: string }).text,
        );
      }

      return '';
    })
    .filter(Boolean);
};

type ParsedCompareFeature = {
  label: string;
  value: boolean | string;
};

const parseFeatureItem = (item: unknown): ParsedCompareFeature | null => {
  if (typeof item === 'string' && item.trim()) {
    const raw = item.trim();
    if (/^everything in\b/i.test(raw)) {
      return null;
    }

    const label = canonicalFeatureLabel(raw) || raw;
    return { label, value: deriveCellValue(raw) };
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const obj = item as Record<string, unknown>;
  const labelRaw = pickString(
    obj.feature,
    obj.name,
    obj.title,
    obj.label,
    obj.key,
    obj.text,
  );
  if (!labelRaw || /^everything in\b/i.test(labelRaw)) {
    return null;
  }

  const label = canonicalFeatureLabel(labelRaw) || labelRaw;
  if (obj.included === false || obj.available === false || obj.enabled === false) {
    return { label, value: false };
  }

  const explicit = obj.value ?? obj.limit ?? obj.quota ?? obj.amount;
  if (explicit !== undefined && explicit !== null && explicit !== '') {
    return { label, value: coerceCell(explicit) };
  }

  if (typeof obj.included === 'boolean') {
    return { label, value: obj.included };
  }

  return { label, value: deriveCellValue(labelRaw) };
};

const parsePlanCompareFeatures = (
  plan?: SubscriptionApiPlan | null,
): ParsedCompareFeature[] => {
  const raw = plan?.features ?? plan?.benefits;
  const items: ParsedCompareFeature[] = [];

  const pushItem = (item: unknown) => {
    const parsed = parseFeatureItem(item);
    if (parsed) {
      items.push(parsed);
    }
  };

  if (Array.isArray(raw)) {
    raw.forEach(pushItem);
    return items;
  }

  if (raw && typeof raw === 'object') {
    const bucket = raw.display ?? raw.list ?? raw.items;
    if (Array.isArray(bucket)) {
      bucket.forEach(pushItem);
    }

    Object.entries(raw).forEach(([key, value]) => {
      if (
        key === 'display' ||
        key === 'list' ||
        key === 'items' ||
        key === 'comparison'
      ) {
        return;
      }

      const label = canonicalFeatureLabel(key) || titleCase(key.replace(/[_-]+/g, ' '));
      items.push({ label, value: coerceCell(value) });
    });
  }

  return items;
};

export const mapPlanFeatures = (plan?: SubscriptionApiPlan | null) => {
  const raw = plan?.features ?? plan?.benefits;

  if (Array.isArray(raw)) {
    return toFeatureList(raw);
  }

  if (raw && typeof raw === 'object') {
    return toFeatureList(raw.display ?? raw.list ?? raw.items);
  }

  return [];
};

const isTruthyFlag = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 'true';

const isPlanTypeLabel = (value: string) => {
  const key = value.trim().toLowerCase();
  return (
    key === 'free' ||
    key === 'vip' ||
    key === 'vvip' ||
    key === 'plan' ||
    normalizePlanTier(value) !== null
  );
};

const formatDurationLabel = (plan?: SubscriptionApiPlan | null) => {
  const labeled = pickString(plan?.duration_label, plan?.validity_label);
  if (labeled) {
    return labeled;
  }

  const duration = pickString(
    plan?.duration,
    plan?.duration_days,
    plan?.validity,
    plan?.interval,
  );
  const unit = pickString(plan?.duration_unit, plan?.interval_unit);

  if (duration && /[a-zA-Z]/.test(duration)) {
    return duration;
  }

  if (duration && unit) {
    return `${duration} ${unit}`;
  }

  if (duration && Number.isFinite(Number(duration))) {
    const count = Number(duration);
    return `${count} ${count === 1 ? 'Day' : 'Days'}`;
  }

  return pickString(plan?.period, plan?.billing_period);
};

const pickDisplayBadge = (plan?: SubscriptionApiPlan | null) => {
  if (!plan) {
    return '';
  }

  const raw = pickString(
    plan.badge,
    plan.tag,
    plan.label,
    plan.highlight,
    plan.ribbon,
  );
  const marketingBadge = raw && !isPlanTypeLabel(raw) ? raw : '';

  if (isTruthyFlag(plan.is_popular) || isTruthyFlag(plan.popular)) {
    return marketingBadge || 'Popular';
  }

  if (isTruthyFlag(plan.is_recommended) || isTruthyFlag(plan.recommended)) {
    return marketingBadge || 'Recommended';
  }

  return marketingBadge;
};

const emptyPaidPlan = (
  tier: 'VIP' | 'VVIP',
  fallback: PlanOption,
): SubscriptionPlanData => ({
  id: tier,
  gradient: fallback.gradient,
  ...(fallback.darkGradient ? { darkGradient: true } : {}),
  title: '',
  features: [],
  durationLabel: '',
  badge: '',
  apiId: '',
  price: 0,
  priceLabel: '',
  period: '',
  paymentStatus: '',
});

const EMPTY_PLANS: SubscriptionPlansData = {
  freeFeatures: [],
  freePlan: {
    title: '',
    features: [],
    durationLabel: '',
    badge: '',
    apiId: '',
    paymentStatus: '',
  },
  vipPlan: emptyPaidPlan('VIP', PLAN_OPTIONS.VIP),
  vvipPlan: emptyPaidPlan('VVIP', PLAN_OPTIONS.VVIP),
  compareRows: [],
  currentPlan: {
    title: '',
    priceLabel: '',
    period: '',
    renewsAt: '',
    expiresAt: '',
    isPaid: false,
    tier: null,
    apiId: '',
  },
};

const buildPaidPlan = (
  tier: 'VIP' | 'VVIP',
  apiPlan: SubscriptionApiPlan | undefined,
  fallback: PlanOption,
): SubscriptionPlanData => {
  if (!apiPlan) {
    return emptyPaidPlan(tier, fallback);
  }

  const price = pickNumber(apiPlan.price ?? apiPlan.amount);
  const currency = pickString(apiPlan.currency) || 'PKR';

  return {
    id: tier,
    gradient: fallback.gradient,
    ...(fallback.darkGradient ? { darkGradient: true } : {}),
    apiId: pickString(apiPlan.id),
    title:
      pickString(apiPlan.name, apiPlan.title, apiPlan.plan) ||
      (tier === 'VIP' ? 'VIP Plan' : 'VVIP Plan'),
    badge: pickDisplayBadge(apiPlan),
    price,
    priceLabel:
      pickString(apiPlan.price_label) || formatPriceLabel(price, currency),
    period: formatDurationLabel(apiPlan),
    durationLabel: formatDurationLabel(apiPlan),
    features: mapPlanFeatures(apiPlan),
    paymentStatus: pickString(apiPlan.payment_status),
  };
};

const buildFreePlan = (
  apiPlan?: SubscriptionApiPlan,
  extraFeatures?: string[],
): SubscriptionFreePlanData => ({
  title: pickString(apiPlan?.name, apiPlan?.title, apiPlan?.type) || 'Free',
  badge: pickDisplayBadge(apiPlan),
  apiId: pickString(apiPlan?.id),
  durationLabel: formatDurationLabel(apiPlan),
  paymentStatus: pickString(apiPlan?.payment_status),
  features:
    mapPlanFeatures(apiPlan).length > 0
      ? mapPlanFeatures(apiPlan)
      : extraFeatures ?? [],
});

const normalizeSubscriptionsResponse = (
  response?: SubscriptionsResponse | null,
): SubscriptionsResponse => {
  if (!response || typeof response !== 'object') {
    return {};
  }

  if (
    response.data &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data)
  ) {
    return {
      ...response,
      ...response.data,
    };
  }

  return response;
};

const extractPlans = (response?: SubscriptionsResponse | null) => {
  const normalized = normalizeSubscriptionsResponse(response);

  if (Array.isArray(normalized.plans)) {
    return normalized.plans;
  }

  if (Array.isArray(normalized.subscriptions)) {
    return normalized.subscriptions;
  }

  if (Array.isArray(normalized.data)) {
    return normalized.data;
  }

  if (
    normalized.data &&
    typeof normalized.data === 'object' &&
    Array.isArray(normalized.data.plans)
  ) {
    return normalized.data.plans;
  }

  return [];
};

const findPlan = (
  plans: SubscriptionApiPlan[],
  tier: 'VIP' | 'VVIP' | 'Free',
) =>
  plans.find(
    plan =>
      normalizePlanTier(
        pickString(plan.type, plan.name, plan.plan, plan.title, plan.slug, plan.badge),
      ) === tier,
  );

const cellFromList = (
  features: ParsedCompareFeature[],
  label: string,
): boolean | string => features.find(item => item.label === label)?.value ?? false;

const buildRowsFromFeatures = (
  freeFeatures: ParsedCompareFeature[],
  vipFeatures: ParsedCompareFeature[],
  vvipFeatures: ParsedCompareFeature[],
): SubscriptionCompareRow[] => {
  const labels = Array.from(
    new Set([
      ...freeFeatures.map(item => item.label),
      ...vipFeatures.map(item => item.label),
      ...vvipFeatures.map(item => item.label),
    ]),
  );

  return labels.map(label => ({
    label,
    free: cellFromList(freeFeatures, label),
    vip: cellFromList(vipFeatures, label),
    vvip: cellFromList(vvipFeatures, label),
  }));
};

const buildCompareRows = (
  freePlan: SubscriptionFreePlanData,
  vipPlan: SubscriptionPlanData,
  vvipPlan: SubscriptionPlanData,
  freeApi?: SubscriptionApiPlan,
  vipApi?: SubscriptionApiPlan,
  vvipApi?: SubscriptionApiPlan,
  comparison?: SubscriptionComparisonRow[],
): SubscriptionCompareRow[] => {
  const freeParsed = parsePlanCompareFeatures(freeApi);
  const vipParsed = parsePlanCompareFeatures(vipApi);
  const vvipParsed = parsePlanCompareFeatures(vvipApi);

  const fromComparison =
    Array.isArray(comparison) && comparison.length > 0
      ? comparison
          .map(row => {
            const label = pickString(
              row.feature,
              row.name,
              row.title,
              row.label,
            );
            if (!label) {
              return null;
            }

            const values = row.values ?? {};
            const plansMap =
              row.plans && !Array.isArray(row.plans) ? row.plans : {};
            const plansList = Array.isArray(row.plans) ? row.plans : [];

            return {
              label,
              free: coerceCell(
                row.free ?? values.free ?? plansMap.free ?? plansList[0],
              ),
              vip: coerceCell(
                row.vip ?? values.vip ?? plansMap.vip ?? plansList[1],
              ),
              vvip: coerceCell(
                row.vvip ?? values.vvip ?? plansMap.vvip ?? plansList[2],
              ),
            };
          })
          .filter((row): row is SubscriptionCompareRow => Boolean(row))
      : [];

  const comparisonIsEmpty = fromComparison.every(
    row => row.free === false && row.vip === false && row.vvip === false,
  );

  const featureRows =
    fromComparison.length > 0 && !comparisonIsEmpty
      ? fromComparison
      : buildRowsFromFeatures(freeParsed, vipParsed, vvipParsed);

  const metaRows: SubscriptionCompareRow[] = [];

  if (freePlan.durationLabel || vipPlan.durationLabel || vvipPlan.durationLabel) {
    metaRows.push({
      label: 'Duration',
      free: freePlan.durationLabel || false,
      vip: vipPlan.durationLabel || false,
      vvip: vvipPlan.durationLabel || false,
    });
  }

  if (vipPlan.priceLabel || vvipPlan.priceLabel) {
    metaRows.push({
      label: 'Price',
      free: 'Free',
      vip: vipPlan.priceLabel || false,
      vvip: vvipPlan.priceLabel || false,
    });
  }

  return [...metaRows, ...featureRows];
};

const isPaidStatus = (status: string) => {
  const key = status.toLowerCase();
  return (
    key === 'active' ||
    key === 'paid' ||
    key === 'subscribed' ||
    key === 'current' ||
    key.includes('active') ||
    key.includes('subscribed')
  );
};

const formatRenewDate = (value?: string | null) => {
  const text = pickString(value);
  if (!text) {
    return '';
  }

  const parsed = new Date(text.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const resolveCurrentPlan = (
  normalized: SubscriptionsResponse,
  freePlan: SubscriptionFreePlanData,
  vipPlan: SubscriptionPlanData,
  vvipPlan: SubscriptionPlanData,
  plans: SubscriptionApiPlan[],
): SubscriptionCurrentPlan => {
  const nested =
    (normalized.current_subscription &&
    typeof normalized.current_subscription === 'object'
      ? normalized.current_subscription
      : null) ??
    (normalized.current_plan && typeof normalized.current_plan === 'object'
      ? normalized.current_plan
      : null);

  const currentId = pickString(
    nested?.id,
    typeof normalized.current_plan === 'string' ||
      typeof normalized.current_plan === 'number'
      ? normalized.current_plan
      : '',
    typeof normalized.active_plan === 'string' ||
      typeof normalized.active_plan === 'number'
      ? normalized.active_plan
      : '',
    normalized.current_plan_id,
  );

  const matchedApi = currentId
    ? plans.find(plan => pickString(plan.id) === currentId)
    : plans.find(
        plan => isTruthyFlag(plan.is_current) || isTruthyFlag(plan.current),
      ) ??
      plans.find(plan => isPaidStatus(pickString(plan.payment_status)));

  const mapped = [vvipPlan, vipPlan].find(
    plan =>
      (currentId && plan.apiId === currentId) ||
      (matchedApi && plan.apiId === pickString(matchedApi.id)) ||
      isPaidStatus(plan.paymentStatus),
  );

  const title =
    pickString(nested?.name, nested?.title, mapped?.title, matchedApi?.name) ||
    freePlan.title;
  const priceLabel =
    pickString(nested?.price_label, mapped?.priceLabel) ||
    (mapped ? mapped.priceLabel : freePlan.title ? '' : '');
  const period = pickString(
    formatDurationLabel(nested),
    mapped?.durationLabel,
    freePlan.durationLabel,
  );
  const renewsAt = formatRenewDate(
    nested?.renews_at ??
      nested?.next_billing_date ??
      matchedApi?.renews_at ??
      matchedApi?.next_billing_date ??
      normalized.renews_at ??
      normalized.next_billing_date,
  );
  const expiresAt = formatRenewDate(
    nested?.expires_at ??
      nested?.expiry_date ??
      matchedApi?.expires_at ??
      matchedApi?.expiry_date ??
      normalized.expires_at,
  );

  const tier: SubscriptionCurrentPlan['tier'] =
    mapped === vvipPlan
      ? 'VVIP'
      : mapped === vipPlan
        ? 'VIP'
        : normalizePlanTier(
            pickString(nested?.type, nested?.name, nested?.plan, nested?.title),
          );

  return {
    title,
    priceLabel,
    period,
    renewsAt,
    expiresAt,
    isPaid: Boolean(mapped) || isPaidStatus(pickString(nested?.payment_status, nested?.status)),
    tier,
    apiId: pickString(nested?.id, mapped?.apiId, matchedApi?.id),
  };
};

export const mapSubscriptions = (
  response?: SubscriptionsResponse | null,
): SubscriptionPlansData => {
  if (!response) {
    return EMPTY_PLANS;
  }

  const normalized = normalizeSubscriptionsResponse(response);
  const plans = extractPlans(normalized);
  const freePlanApi = findPlan(plans, 'Free');
  const vipPlanApi = findPlan(plans, 'VIP');
  const vvipPlanApi = findPlan(plans, 'VVIP');

  const extraFreeCandidates = [
    toFeatureList(normalized.free_plan?.features),
    toFeatureList(normalized.free_plan?.benefits),
    toFeatureList(normalized.free?.features),
    toFeatureList(normalized.free?.benefits),
  ];
  const extraFree =
    extraFreeCandidates.find(list => list.length > 0) ?? [];

  const freePlan = buildFreePlan(
    freePlanApi,
    extraFree.length ? extraFree : undefined,
  );
  const vipPlan = buildPaidPlan('VIP', vipPlanApi, PLAN_OPTIONS.VIP);
  const vvipPlan = buildPaidPlan('VVIP', vvipPlanApi, PLAN_OPTIONS.VVIP);

  return {
    freeFeatures: freePlan.features,
    freePlan,
    vipPlan,
    vvipPlan,
    compareRows: buildCompareRows(
      freePlan,
      vipPlan,
      vvipPlan,
      freePlanApi,
      vipPlanApi,
      vvipPlanApi,
      normalized.comparison ?? normalized.compare,
    ),
    currentPlan: resolveCurrentPlan(
      normalized,
      freePlan,
      vipPlan,
      vvipPlan,
      plans,
    ),
  };
};

export type CurrentSubscriptionResponse = {
  success?: boolean | number;
  message?: string;
  subscription?: SubscriptionApiPlan | null;
  current_subscription?: SubscriptionApiPlan | null;
  current_plan?: SubscriptionApiPlan | string | number | null;
  plan?: SubscriptionApiPlan | null;
  package?: SubscriptionApiPlan | null;
  data?:
    | SubscriptionApiPlan
    | {
        subscription?: SubscriptionApiPlan | null;
        current_subscription?: SubscriptionApiPlan | null;
        current_plan?: SubscriptionApiPlan | null;
        plan?: SubscriptionApiPlan | null;
        package?: SubscriptionApiPlan | null;
      }
    | null;
};

const isPlanObject = (value: unknown): value is SubscriptionApiPlan =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const pickCurrentPlanObject = (
  response?: CurrentSubscriptionResponse | null,
): SubscriptionApiPlan | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const nested =
    response.data && typeof response.data === 'object' && !Array.isArray(response.data)
      ? response.data
      : null;

  const candidates: unknown[] = [
    response.current_subscription,
    response.subscription,
    response.plan,
    response.package,
    typeof response.current_plan === 'object' ? response.current_plan : null,
    nested && 'current_subscription' in nested ? nested.current_subscription : null,
    nested && 'subscription' in nested ? nested.subscription : null,
    nested && 'plan' in nested ? nested.plan : null,
    nested && 'package' in nested ? nested.package : null,
    nested && 'current_plan' in nested ? nested.current_plan : null,
    nested,
  ];

  return (
    candidates.find(
      item =>
        isPlanObject(item) &&
        (item.name ||
          item.title ||
          item.type ||
          item.plan ||
          item.id ||
          item.price_label ||
          item.payment_status),
    ) ?? null
  );
};

export const mapCurrentSubscription = (
  response?: CurrentSubscriptionResponse | null,
): SubscriptionCurrentPlan => {
  const current = pickCurrentPlanObject(response);

  if (!current) {
    return EMPTY_PLANS.currentPlan;
  }

  const title =
    pickString(current.name, current.title, current.plan, current.type) || 'Free';
  const price = pickNumber(current.price ?? current.amount);
  const currency = pickString(current.currency) || 'PKR';
  const priceLabel =
    pickString(current.price_label) ||
    (price ? formatPriceLabel(price, currency) : '');
  const period = formatDurationLabel(current);
  const renewsAt = formatRenewDate(
    current.renews_at ?? current.next_billing_date,
  );
  const expiresAt = formatRenewDate(current.expires_at ?? current.expiry_date);
  const tier = normalizePlanTier(
    pickString(current.type, current.name, current.plan, current.title),
  );
  const isPaid =
    isPaidStatus(pickString(current.payment_status, current.status)) ||
    tier === 'VIP' ||
    tier === 'VVIP';

  return {
    title,
    priceLabel,
    period,
    renewsAt,
    expiresAt,
    isPaid,
    tier,
    apiId: pickString(current.id),
  };
};

export type SubscribePaymentSummary = {
  discountPercent: number;
  amountPaidLabel: string;
  originalPriceLabel: string;
  hasDiscount: boolean;
};

const toMoneyNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, '').replace(/[^\d.]/g, ''));
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
};

const collectPaymentSources = (
  response?: Record<string, any> | null,
): Record<string, any>[] => {
  const sources: Record<string, any>[] = [];
  const add = (value: unknown) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sources.push(value as Record<string, any>);
    }
  };

  const nested =
    response?.data && typeof response.data === 'object' ? response.data : null;
  const subscription = response?.subscription ?? nested?.subscription;
  const plan = subscription?.plan ?? nested?.plan ?? response?.plan;

  add(subscription?.pricing);
  add(nested?.pricing);
  add(response?.pricing);
  add(subscription);
  add(nested);
  add(response);
  add(plan);

  return sources;
};

const pickFromSources = (sources: Record<string, any>[], keys: string[]) => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }

  return undefined;
};

export const mapSubscribePayment = (
  response?: Record<string, any> | null,
  fallbackPrice = 0,
  fallbackPriceLabel = '',
): SubscribePaymentSummary => {
  const nested =
    response?.data && typeof response.data === 'object' ? response.data : null;
  const subscription = response?.subscription ?? nested?.subscription;
  const pricing =
    subscription?.pricing ?? nested?.pricing ?? response?.pricing ?? null;
  const sources = collectPaymentSources(response);
  const originalPrice =
    toMoneyNumber(
      pricing?.original_price ??
        pickFromSources(sources, ['original_price', 'original_amount', 'plan_price']),
    ) || fallbackPrice;

  let amountPaid = toMoneyNumber(
    pricing?.payable_price ??
      pickFromSources(sources, [
        'payable_price',
        'final_price',
        'amount_paid',
        'paid_amount',
        'final_amount',
        'charged_amount',
        'payable_amount',
        'net_amount',
      ]),
  );

  let discountPercent = toMoneyNumber(
    pricing?.discount_percent ??
      pickFromSources(sources, ['discount_percent', 'discount_percentage']),
  );
  const discountAmount = toMoneyNumber(
    pickFromSources(sources, ['discount_amount']),
  );
  const discountApplied = isTruthyFlag(
    pricing?.discount_applied ??
      pickFromSources(sources, [
        'discount_applied',
        'has_discount',
        'is_discounted',
      ]),
  );

  if (discountPercent > 100) {
    discountPercent = 0;
  }

  if (
    !discountPercent &&
    originalPrice > 0 &&
    (amountPaid > 0 || discountAmount > 0)
  ) {
    const paid = amountPaid || originalPrice - discountAmount;
    if (paid < originalPrice) {
      discountPercent = Math.round(((originalPrice - paid) / originalPrice) * 100);
    }
  }

  if (!discountPercent && discountApplied) {
    discountPercent = 50;
  }

  if (discountPercent > 0 && !amountPaid && originalPrice > 0) {
    amountPaid = originalPrice * (1 - discountPercent / 100);
  }

  if (!amountPaid) {
    amountPaid = originalPrice;
  }

  const hasDiscount =
    discountApplied ||
    discountPercent > 0 ||
    discountAmount > 0 ||
    (originalPrice > 0 && amountPaid > 0 && amountPaid < originalPrice);

  return {
    discountPercent: hasDiscount ? Math.round(discountPercent || 50) : 0,
    amountPaidLabel: formatPriceLabel(amountPaid) || fallbackPriceLabel,
    originalPriceLabel:
      pickString(pickFromSources(sources, ['original_price_label'])) ||
      formatPriceLabel(originalPrice) ||
      fallbackPriceLabel,
    hasDiscount,
  };
};

export const pickUserSubscriptionId = (
  response?: Record<string, any> | null,
) => {
  const nested =
    response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
      ? response.data
      : null;
  const subscription = response?.subscription ?? nested?.subscription;

  return pickString(
    subscription?.id,
    response?.user_subscription_id,
    nested?.user_subscription_id,
    response?.id,
  );
};
