import { isApiSuccess } from '../src/API/types';
import {
  mapReferralHistory,
  mapReferralLink,
  mapReferralRewards,
  mapReferralStats,
  mergeReferralData,
  applyReferralRedeem,
  extractReferralCodeFromUrl,
  normalizeReferralLink,
  CANONICAL_REFERRAL_BASE,
  type ReferralStatsResponse,
} from '../src/API/mappers/referralMapper';

const POSTMAN_REFERRAL_STATS: ReferralStatsResponse = {
  success: 200,
  referral_code: '60287E6A',
  referral_link: 'https://ranglerz.click/piyarifamily/60287E6A',
  total_registered: 0,
  reward_points: 0,
  reward_per_registration: 4,
  point_value_pkr: 4,
};

describe('GET /referrals/stats', () => {
  it('treats HTTP 200 and body success: 200 as success', () => {
    expect(isApiSuccess(200, 200)).toBe(true);
    expect(isApiSuccess(200, true)).toBe(true);
    expect(isApiSuccess(401, undefined)).toBe(false);
  });

  it('maps the live Postman payload onto Referral Program / My Rewards fields', () => {
    const stats = mapReferralStats(POSTMAN_REFERRAL_STATS);

    expect(stats.referralCode).toBe('60287E6A');
    expect(stats.referralLink).toBe(
      'https://ranglerz.click/piyarifamily/60287E6A',
    );
    expect(stats.registered).toBe(0);
    expect(stats.pointsEarned).toBe(0);
    expect(stats.pointValuePkr).toBe(4);
    expect(stats.rewardsTable).toEqual([
      {
        id: '1',
        registrations: '1 Registration',
        points: '4 pts',
      },
    ]);
  });

  it('maps nested data wrappers the same way', () => {
    const stats = mapReferralStats({
      success: 200,
      data: POSTMAN_REFERRAL_STATS,
    });

    expect(stats.referralCode).toBe('60287E6A');
    expect(stats.pointValuePkr).toBe(4);
    expect(stats.rewardsTable[0].points).toBe('4 pts');
  });

  it('maps backend aliases without dummy values', () => {
    const stats = mapReferralStats({
      success: 200,
      stats: {
        code: 'AB12CD34',
        link: 'https://ranglerz.click/piyarifamily/AB12CD34',
        registered: 3,
        points_earned: 12,
        point_value_pkr: 4,
        total_value_pkr: 48,
        redeemed: 1,
        rewards_table: [
          { registrations: '1 Registration', points: '4 pts' },
          { successful_registrations: 3, reward_points: 12 },
        ],
      },
    });

    expect(stats.referralCode).toBe('AB12CD34');
    expect(stats.referralLink).toBe(
      'https://ranglerz.click/piyarifamily/AB12CD34',
    );
    expect(stats.registered).toBe(3);
    expect(stats.pointsEarned).toBe(12);
    expect(stats.totalValuePkr).toBe(48);
    expect(stats.redeemed).toBe(1);
    expect(stats.rewardsTable).toHaveLength(2);
    expect(stats.rewardsTable[1].points).toBe('12 pts');
    expect(stats.redeemOptions).toEqual([]);
  });

  it('maps the live GET /referrals/stats payload including conversion rate and PKR value', () => {
    const stats = mapReferralStats({
      success: 200,
      conversion_rate: '1 Registration = 50 pts',
      point_value_pkr: 4,
      referral_code: 'F86CD84C',
      referral_link: 'https://ranglerz.click/piyarifamily/F86CD84C',
      reward_per_registration: 50,
      reward_points: 0,
      reward_value_pkr: 0,
      total_registered: 0,
    });

    expect(stats.referralCode).toBe('F86CD84C');
    expect(stats.referralLink).toBe(
      'https://ranglerz.click/piyarifamily/F86CD84C',
    );
    expect(stats.registered).toBe(0);
    expect(stats.pointsEarned).toBe(0);
    expect(stats.pointValuePkr).toBe(4);
    expect(stats.totalValuePkr).toBe(0);
    expect(stats.conversionRate).toBe('1 Registration = 50 pts');
    expect(stats.rewardsTable).toEqual([
      {
        id: '1',
        registrations: '1 Registration',
        points: '50 pts',
      },
    ]);
  });

  it('maps redeem options from stats when the API sends them', () => {
    const stats = mapReferralStats({
      success: 200,
      rewards: [{ type: 'vip_month', title: '1 Month VIP', points_required: 100 }],
    });

    expect(stats.redeemOptions).toHaveLength(1);
    expect(stats.redeemOptions[0].title).toBe('1 Month VIP');
    expect(stats.redeemOptions[0].pointsRequired).toBe('100 pts required');
    expect(stats.redeemOptions[0].canRedeem).toBe(true);
  });

  it('does not invent a rewards table when the API omits rate fields', () => {
    const stats = mapReferralStats({
      success: 200,
      referral_code: 'X',
      referral_link: 'https://example.com/X',
      total_registered: 0,
      reward_points: 0,
    });

    expect(stats.rewardsTable).toEqual([]);
    expect(stats.shareMessage).toBe('');
  });

  it('uses the backend referral_link as-is for share', () => {
    const stats = mapReferralStats({
      success: 200,
      referral_code: 'F86CD84C',
      referral_link: 'https://ranglerz.click/piyarifamily/F86CD84C',
    });

    expect(stats.referralLink).toBe(
      'https://ranglerz.click/piyarifamily/F86CD84C',
    );
  });
});

describe('GET /referrals/history', () => {
  it('maps the live Postman empty payload to an empty list', () => {
    expect(
      mapReferralHistory({
        success: 200,
        history: [],
      }),
    ).toEqual([]);
  });

  it('maps a history item from every API field onto the My Rewards row', () => {
    const [item] = mapReferralHistory({
      success: 200,
      history: [
        {
          id: 12,
          points: 4,
          status: 'registered',
          created_at: '2026-08-25',
          referred_user: {
            name: 'Ayesha Khan',
            email: 'ayesha@example.com',
            gender: 'female',
            profile_photo: 'https://cdn.example.com/photo.jpg',
          },
        },
      ],
    });

    expect(item.id).toBe('12');
    expect(item.name).toBe('Ayesha Khan');
    expect(item.points).toBe('+4 pts');
    expect(item.isRegistered).toBe(true);
    expect(item.statusLabel).toBe('Registered');
    expect(item.subtitle).toBe('Registered');
    expect(item.image).toEqual({
      uri: 'https://cdn.example.com/photo.jpg',
      headers: {
        Accept: 'image/jpeg,image/png,image/webp,image/*',
      },
    });
  });

  it('does not invent registered status when the API omits it', () => {
    const [item] = mapReferralHistory({
      success: 200,
      history: [{ id: 3, referred_name: 'Ali' }],
    });

    expect(item.name).toBe('Ali');
    expect(item.isRegistered).toBe(false);
    expect(item.statusLabel).toBe('');
    expect(item.points).toBe('+0 pts');
  });

  it('maps paginated and nested history lists from the live API shape', () => {
    const [item] = mapReferralHistory({
      success: 200,
      data: {
        history: {
          data: [
            {
              id: 9,
              points_earned: 4,
              status: 'registered',
              photos: [{ url: 'https://cdn.example.com/u.jpg' }],
              referred_user: { full_name: 'Sara' },
            },
          ],
        },
      },
    });

    expect(item.id).toBe('9');
    expect(item.name).toBe('Sara');
    expect(item.points).toBe('+4 pts');
    expect(item.image).toEqual({
      uri: 'https://cdn.example.com/u.jpg',
      headers: {
        Accept: 'image/jpeg,image/png,image/webp,image/*',
      },
    });
  });
});

describe('GET /referrals/link', () => {
  it('maps the live Postman link payload as-is', () => {
    const link = mapReferralLink({
      success: 200,
      referral_code: '60287E6A',
      referral_link: 'https://ranglerz.click/piyarifamily/60287E6A',
      reward_per_registration: 4,
      message:
        'Share this link. When someone registers and verifies email using your code, you earn reward points.',
    });

    expect(link.referralCode).toBe('60287E6A');
    expect(link.referralLink).toBe(
      'https://ranglerz.click/piyarifamily/60287E6A',
    );
    expect(link.rewardsTable[0].points).toBe('4 pts');
    expect(link.shareMessage).toContain('verifies email');
  });
});

describe('GET /referrals/rewards', () => {
  it('maps the live GET /referrals/rewards payload with labels, points_cost, and can_redeem', () => {
    const rewards = mapReferralRewards({
      success: 200,
      total_points: 0,
      point_value_pkr: 4,
      total_value_pkr: 0,
      rewards: [
        {
          type: 'vip_month',
          label: '1 Month Free VIP Plan',
          points_cost: 795,
          can_redeem: false,
        },
        {
          type: 'vvip_month',
          label: '1 Month Free VVIP Plan',
          points_cost: 1710,
          can_redeem: false,
        },
        {
          type: 'profile_boost',
          label: 'Profile Boost – 7 Days',
          points_cost: 50,
          can_redeem: false,
        },
      ],
    });

    expect(rewards.pointsEarned).toBe(0);
    expect(rewards.pointValuePkr).toBe(4);
    expect(rewards.totalValuePkr).toBe(0);
    expect(rewards.redeemOptions).toEqual([
      {
        id: 'vip_month',
        type: 'vip_month',
        title: '1 Month Free VIP Plan',
        pointsRequired: '795 pts required',
        icon: 'crown',
        canRedeem: false,
      },
      {
        id: 'vvip_month',
        type: 'vvip_month',
        title: '1 Month Free VVIP Plan',
        pointsRequired: '1710 pts required',
        icon: 'crown',
        canRedeem: false,
      },
      {
        id: 'profile_boost',
        type: 'profile_boost',
        title: 'Profile Boost – 7 Days',
        pointsRequired: '50 pts required',
        icon: 'chart-line',
        canRedeem: false,
      },
    ]);
  });

  it('falls back to a humanized type when the rewards payload omits a label', () => {
    const rewards = mapReferralRewards({
      success: 200,
      total_points: 0,
      point_value_pkr: 4,
      total_value_pkr: 0,
      rewards: [{ type: 'vip_month', points_required: 100 }],
    });

    expect(rewards.pointsEarned).toBe(0);
    expect(rewards.pointValuePkr).toBe(4);
    expect(rewards.redeemOptions[0].type).toBe('vip_month');
    expect(rewards.redeemOptions[0].title).toBe('Vip Month');
    expect(rewards.redeemOptions[0].canRedeem).toBe(true);
  });

  it('merges link, stats, and rewards without hardcoded values', () => {
    const merged = mergeReferralData(
      {
        success: 200,
        referral_code: '60287E6A',
        referral_link: 'https://ranglerz.click/piyarifamily/60287E6A',
        reward_per_registration: 4,
        message:
          'Share this link. When someone registers and verifies email using your code, you earn reward points.',
      },
      {
        success: 200,
        total_points: 8,
        point_value_pkr: 4,
        total_value_pkr: 32,
        rewards: [{ type: 'vip_month', title: '1 Month VIP', points: 100 }],
      },
      {
        success: 200,
        referral_code: '60287E6A',
        referral_link: 'https://ranglerz.click/piyarifamily/60287E6A',
        reward_per_registration: 4,
      },
    );

    expect(merged.referralCode).toBe('60287E6A');
    expect(merged.referralLink).toBe(
      'https://ranglerz.click/piyarifamily/60287E6A',
    );
    expect(merged.shareMessage).toContain('verifies email');
    expect(merged.pointsEarned).toBe(8);
    expect(merged.totalValuePkr).toBe(32);
    expect(merged.redeemOptions[0].title).toBe('1 Month VIP');
    expect(merged.redeemOptions[0].canRedeem).toBe(true);
  });

  it('keeps previous redeem options and redeemed count when a later fetch omits them', () => {
    const previous = mergeReferralData(
      null,
      {
        success: 200,
        total_points: 50,
        point_value_pkr: 4,
        total_value_pkr: 200,
        rewards: [{ type: 'profile_boost', title: 'Profile Boost', points_required: 30 }],
      },
      {
        success: 200,
        referral_code: '60287E6A',
        referral_link: 'https://ranglerz.click/piyarifamily/60287E6A',
        reward_per_registration: 4,
      },
    );

    const afterProgramRefetch = mergeReferralData(
      {
        success: 200,
        referral_code: '60287E6A',
        referral_link: 'https://ranglerz.click/piyarifamily/60287E6A',
        reward_per_registration: 4,
      },
      null,
      {
        success: 200,
        referral_code: '60287E6A',
        referral_link: 'https://ranglerz.click/piyarifamily/60287E6A',
        total_registered: 0,
        reward_points: 50,
        point_value_pkr: 4,
      },
      { ...previous, redeemed: 1 },
    );

    expect(afterProgramRefetch.redeemOptions[0].type).toBe('profile_boost');
    expect(afterProgramRefetch.redeemed).toBe(1);
    expect(afterProgramRefetch.pointsEarned).toBe(50);
  });

  it('applies POST /referrals/redeem remaining points from the live payload', () => {
    const next = applyReferralRedeem(
      {
        referralCode: '60287E6A',
        referralLink: 'https://ranglerz.click/piyarifamily/60287E6A',
        registered: 10,
        pointsEarned: 80,
        pointValuePkr: 4,
        totalValuePkr: 320,
        conversionRate: '',
        rewardsTable: [],
        shareMessage: '',
        redeemOptions: [],
        redeemed: 0,
      },
      {
        success: 200,
        message: 'Reward redeemed successfully.',
        remaining_points: 50,
        meta: {
          reward_label: 'Profile Boost - 7 Days',
          boost_until: '2026-09-21T12:36:50+00:00',
        },
      },
    );

    expect(next.pointsEarned).toBe(50);
    expect(next.totalValuePkr).toBe(200);
    expect(next.redeemed).toBe(1);
  });
});

describe('referral invite links', () => {
  it('extracts the code from the shared Postman URL', () => {
    expect(
      extractReferralCodeFromUrl(
        'https://ranglerz.click/piyarifamily/60287E6A',
      ),
    ).toBe('60287E6A');
  });

  it('ignores the site path without a code and API URLs', () => {
    expect(
      extractReferralCodeFromUrl('https://ranglerz.click/piyarifamily'),
    ).toBeNull();
    expect(
      extractReferralCodeFromUrl(
        'https://ranglerz.click/piyarifamily/api/register',
      ),
    ).toBeNull();
  });

  it('normalizes a bare code and custom scheme to the canonical invite URL', () => {
    expect(normalizeReferralLink('60287E6A')).toBe(
      'https://ranglerz.click/piyarifamily/60287E6A',
    );
    expect(normalizeReferralLink('piyarifamily://60287E6A')).toBe(
      'https://ranglerz.click/piyarifamily/60287E6A',
    );
  });

  it('keeps the original https invite URL for register', () => {
    expect(
      normalizeReferralLink('https://ranglerz.click/piyarifamily/60287E6A'),
    ).toBe('https://ranglerz.click/piyarifamily/60287E6A');
  });

  it('upgrades http invite URLs to https', () => {
    expect(
      normalizeReferralLink('http://ranglerz.click/piyarifamily/F86CD84C'),
    ).toBe('https://ranglerz.click/piyarifamily/F86CD84C');
  });

  it('reads a referral code from query params even on API URLs', () => {
    expect(
      extractReferralCodeFromUrl(
        'https://ranglerz.click/piyarifamily/api?ref=F86CD84C',
      ),
    ).toBe('F86CD84C');
  });

  it('sends the Register API URL even when the invite page was opened', () => {
    expect(
      normalizeReferralLink(
        'https://cdn.jsdelivr.net/gh/Junaid1216/PiyariFamily@main/web-invite/invite.html?ref=F86CD84C',
      ),
    ).toBe('https://ranglerz.click/piyarifamily/F86CD84C');
  });
});
