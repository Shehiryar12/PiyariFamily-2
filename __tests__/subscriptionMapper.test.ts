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
    expect(plans.compareRows[0].label).toBe('Basic search');
    expect(plans.currentPlan.title).toBe('Free');
    expect(plans.currentPlan.isPaid).toBe(false);
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
