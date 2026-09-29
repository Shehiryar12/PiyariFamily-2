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
  isPaid: boolean;
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
  period?: string | null;
  type?: string | null;
  payment_status?: string | null;
  badge?: string | null;
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
  plans?: unknown[];
};

export type SubscriptionsResponse = {
  success?: boolean | number;
  plans?: SubscriptionApiPlan[];
  subscriptions?: SubscriptionApiPlan[];
  comparison?: SubscriptionComparisonRow[];
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

const toFeatureList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
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

const formatDurationLabel = (plan?: SubscriptionApiPlan | null) => {
  const labeled = pickString(plan?.duration_label);
  if (labeled) {
    return labeled;
  }

  const duration = pickString(plan?.duration, plan?.duration_days);
  const unit = pickString(plan?.duration_unit);
  if (duration && unit) {
    return `${duration} ${unit}`;
  }

  return pickString(plan?.period);
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
    isPaid: false,
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
      pickString(apiPlan.name, apiPlan.title, apiPlan.plan, apiPlan.badge) ||
      (tier === 'VIP' ? 'VIP Plan' : 'VVIP Plan'),
    badge: pickString(apiPlan.badge, apiPlan.type),
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
  title: pickString(apiPlan?.name, apiPlan?.title, apiPlan?.badge) || 'Free',
  badge: pickString(apiPlan?.badge, apiPlan?.type),
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

const buildCompareRows = (
  freeFeatures: string[],
  vipFeatures: string[],
  vvipFeatures: string[],
  comparison?: SubscriptionComparisonRow[],
): SubscriptionCompareRow[] => {
  if (Array.isArray(comparison) && comparison.length > 0) {
    return comparison
      .map(row => {
        const label = pickString(row.feature);
        if (!label) {
          return null;
        }

        return {
          label,
          free: freeFeatures.includes(label),
          vip: vipFeatures.includes(label),
          vvip: vvipFeatures.includes(label),
        };
      })
      .filter((row): row is SubscriptionCompareRow => Boolean(row));
  }

  const labels = Array.from(
    new Set([...freeFeatures, ...vipFeatures, ...vvipFeatures]),
  );

  return labels.map(label => ({
    label,
    free: freeFeatures.includes(label),
    vip: vipFeatures.includes(label),
    vvip: vvipFeatures.includes(label),
  }));
};

const isTruthyFlag = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 'true';

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
      nested?.expires_at ??
      nested?.expiry_date ??
      matchedApi?.renews_at ??
      matchedApi?.next_billing_date ??
      matchedApi?.expires_at ??
      normalized.renews_at ??
      normalized.next_billing_date ??
      normalized.expires_at,
  );

  return {
    title,
    priceLabel,
    period,
    renewsAt,
    isPaid: Boolean(mapped) || isPaidStatus(pickString(nested?.payment_status)),
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
      freePlan.features,
      vipPlan.features,
      vvipPlan.features,
      normalized.comparison,
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
