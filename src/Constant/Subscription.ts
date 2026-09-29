export type PlanTier = 'Free' | 'VIP' | 'VVIP';

export type PlanOption = {
  id: PlanTier;
  price: number;
  priceLabel: string;
  period: string;
  gradient: string[];
  darkGradient?: boolean;
};

export const PLAN_OPTIONS: Record<'VIP' | 'VVIP', PlanOption> = {
  VIP: {
    id: 'VIP',
    price: 2499,
    priceLabel: 'PKR 2,499',
    period: '/mo',
    gradient: ['#E8C96A', '#C9A227', '#8B6914'],
  },
  VVIP: {
    id: 'VVIP',
    price: 3999,
    priceLabel: 'PKR 3,999',
    period: '/mo',
    gradient: ['#D8D8D8', '#9E9E9E', '#3D3D3D'],
    darkGradient: true,
  },
};

export const FREE_FEATURES = ['Basic search', 'Limited chats', 'No boost'];

export const VIP_FEATURES = [
  'Unlimited Chats',
  '5 Boosts per Month',
  '5 Super Likes per Day',
  'VIP Badge',
];

export const VVIP_FEATURES = [
  'Everything in VIP Plan',
  'Unlimited Super likes',
  'Unlimited Boosts per Month',
  'See Who Liked You',
  'VVIP Badge',
];

export const COMPARE_FEATURES = [
  { label: 'Basic Search', free: true, vip: true, vvip: true },
  { label: 'Chats', free: 'Limited', vip: 'Unlimited', vvip: 'Unlimited' },
  { label: 'Profile Boosts', free: false, vip: '5/Month', vvip: 'Unlimited' },
  { label: 'Super Likes', free: false, vip: '5/Day', vvip: 'Unlimited' },
  { label: 'Plan Badge', free: false, vip: 'VIP Badge', vvip: 'VVIP Badge' },
];

export const PREMIUM_PERKS = [
  {
    icon: 'chat-outline',
    label: 'Unlimited Chats',
    subtitle: 'Connect with anyone, anytime',
  },
  {
    icon: 'eye-outline',
    label: 'Profile Boost',
    subtitle: '10x more profile views',
  },
  {
    icon: 'star-outline',
    label: 'Super Likes',
    subtitle: 'Stand out from the crowd',
  },
  {
    icon: 'shield-check-outline',
    label: 'Verified Badge',
    subtitle: 'Build instant trust',
  },
];

export const PAYWALL_LOCKED_FEATURES = [
  {
    icon: 'lock-outline',
    label: 'Unlimited Messages',
    description: 'Chat without daily limits',
    tag: 'Unlock',
  },
  {
    icon: 'lock-outline',
    label: 'See Who Liked You',
    description: "Know who's interested",
    tag: 'Unlock',
  },
  {
    icon: 'lock-outline',
    label: 'Profile Boost',
    description: 'Get 10x more views',
    tag: 'Unlock',
  },
  {
    icon: 'lock-outline',
    label: 'Super Likes',
    description: 'Stand out instantly',
    tag: 'Unlock',
  },
];

export const FREE_DAILY_MESSAGE_LIMIT = 3;
