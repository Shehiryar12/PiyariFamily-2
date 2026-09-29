import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { ProfileStackParamList } from '../Navigation/ProfileStackNavigator';
import { getTabNavigation } from './tabNavigation';

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
