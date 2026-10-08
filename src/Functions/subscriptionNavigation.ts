import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { ProfileStackParamList } from '../Navigation/ProfileStackNavigator';
import { getTabNavigation } from './tabNavigation';

export const toCompletePaymentParams = (
  plan: {
    id: string;
    price: number;
    priceLabel: string;
    apiId: string;
  },
  extra?: { isUpgrade?: boolean },
): ProfileStackParamList['CompletePayment'] | null => {
  if (!plan.apiId || (plan.id !== 'VIP' && plan.id !== 'VVIP')) {
    return null;
  }

  return {
    plan: plan.id,
    price: plan.price,
    priceLabel: plan.priceLabel,
    subscriptionId: plan.apiId,
    ...(extra?.isUpgrade ? { isUpgrade: true } : {}),
  };
};

type SubscriptionScreen = keyof Pick<
  ProfileStackParamList,
  | 'ChooseYourPlan'
  | 'ComparePlans'
  | 'PremiumPaywall'
  | 'CompletePayment'
  | 'PremiumSuccess'
  | 'ManageSubscription'
>;

export const navigateToSubscription = <T extends SubscriptionScreen>(
  navigation: NavigationProp<ParamListBase>,
  screen: T,
  params?: ProfileStackParamList[T],
) => {
  const tabNavigation = getTabNavigation(navigation);
  const nestedRoute = params ? { name: screen, params } : { name: screen };

  if (tabNavigation) {
    tabNavigation.navigate('Profile', {
      state: {
        index: 0,
        routes: [nestedRoute],
      },
    });
    return;
  }

  const parent = navigation.getParent();

  if (parent) {
    parent.navigate('Profile', {
      state: {
        index: 0,
        routes: [nestedRoute],
      },
    });
    return;
  }

  navigation.dispatch(
    CommonActions.navigate({
      name: 'Profile',
      params: {
        state: {
          index: 0,
          routes: [nestedRoute],
        },
      },
    }),
  );
};
