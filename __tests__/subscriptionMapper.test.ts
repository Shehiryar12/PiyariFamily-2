import { isApiSuccess } from '../src/API/types';
import { mapSubscriptions } from '../src/API/mappers/subscriptionMapper';

const LIVE_SUBSCRIPTIONS = {
  success: 200,
  plans: [
    {
      id: 5,
      name: 'Free',
      price: 0,
      price_label: 'PKR 0',
      duration: 30,
      duration_unit: 'days',
      duration_label: '30 Days',
      duration_days: 30,
      type: 'Free',
      payment_status: 'free',
      badge: 'Free',
      features: {
        display: ['Basic search', 'Limited chats'],
      },
    },
    {
      id: 6,
      name: 'VIP',
      price: 2499,
      price_label: 'PKR 2,499',
      duration: 30,
      duration_unit: 'days',
      duration_label: '30 Days',
      type: 'VIP',
      badge: 'VIP',
      features: {
        display: ['Unlimited Chats', 'VIP Badge'],
      },
    },
  ],
};

describe('GET /subscriptions', () => {
  it('treats HTTP 200 and body success: 200 as success', () => {
    expect(isApiSuccess(200, 200)).toBe(true);
  });

  it('maps live plan fields including features.display', () => {
    const plans = mapSubscriptions(LIVE_SUBSCRIPTIONS);

    expect(plans.freePlan.title).toBe('Free');
    expect(plans.freePlan.features).toEqual(['Basic search', 'Limited chats']);
    expect(plans.freePlan.durationLabel).toBe('30 Days');
    expect(plans.vipPlan.apiId).toBe('6');
    expect(plans.vipPlan.price).toBe(2499);
    expect(plans.vipPlan.priceLabel).toBe('PKR 2,499');
    expect(plans.vipPlan.features).toEqual(['Unlimited Chats', 'VIP Badge']);
    expect(plans.vipPlan.price).toBe(2499);
    expect(plans.compareRows.find(row => row.label === 'Chats')).toEqual({
      label: 'Chats',
      free: 'Limited',
      vip: 'Unlimited',
      vvip: false,
    });
    expect(plans.compareRows.find(row => row.label === 'Search')).toEqual({
      label: 'Search',
      free: true,
      vip: false,
      vvip: false,
    });
    expect(plans.currentPlan.title).toBe('Free');
    expect(plans.currentPlan.isPaid).toBe(false);
    expect(plans.freePlan.badge).toBe('');
    expect(plans.vipPlan.badge).toBe('');
  });

  it('maps marketing badges and free duration without using badge as the title', () => {
    const plans = mapSubscriptions({
      success: 200,
      plans: [
        {
          id: 5,
          name: 'Free',
          type: 'Free',
          duration: 30,
          duration_unit: 'days',
          duration_label: '30 Days',
          badge: 'Free',
          features: { display: ['Basic search'] },
        },
        {
          id: 6,
          name: 'VIP',
          type: 'VIP',
          price: 2499,
          duration_label: '30 Days',
          badge: 'Popular',
          is_popular: true,
          features: { display: ['Unlimited Chats'] },
        },
      ],
    });

    expect(plans.freePlan.title).toBe('Free');
    expect(plans.freePlan.durationLabel).toBe('30 Days');
    expect(plans.freePlan.badge).toBe('');
    expect(plans.vipPlan.title).toBe('VIP');
    expect(plans.vipPlan.badge).toBe('Popular');
    expect(plans.vipPlan.durationLabel).toBe('30 Days');
  });

  it('maps comparison rows from API comparison matrix', () => {
    const plans = mapSubscriptions({
      success: 200,
      plans: [
        { id: 1, name: 'Free', type: 'Free', features: { display: ['Search'] } },
        { id: 2, name: 'VIP', type: 'VIP', price: 1000, features: { display: ['Chats'] } },
      ],
      comparison: [
        { feature: 'Chats', free: 'Limited', vip: 'Unlimited', vvip: 'Unlimited' },
        { feature: 'Boosts', free: false, vip: '5/Month', vvip: true },
      ],
    });

    expect(plans.compareRows.find(row => row.label === 'Chats')).toEqual({
      label: 'Chats',
      free: 'Limited',
      vip: 'Unlimited',
      vvip: 'Unlimited',
    });
    expect(plans.compareRows.find(row => row.label === 'Boosts')).toEqual({
      label: 'Boosts',
      free: false,
      vip: '5/Month',
      vvip: true,
    });
  });

  it('does not copy hardcoded PLAN_OPTIONS prices onto mapped VIP', () => {
    const plans = mapSubscriptions({
      success: 200,
      plans: [
        {
          id: 6,
          name: 'VIP',
          price: 1200,
          price_label: 'PKR 1,200',
          duration_label: '30 Days',
          type: 'VIP',
          features: { display: ['Unlimited Chats'] },
        },
      ],
    });

    expect(plans.vipPlan.price).toBe(1200);
    expect(plans.vipPlan.priceLabel).toBe('PKR 1,200');
    expect(plans.vipPlan.priceLabel).not.toBe('PKR 2,499');
  });
});
