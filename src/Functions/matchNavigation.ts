import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { ImageSourcePropType } from 'react-native';
import { getTabNavigation } from './tabNavigation';

type MatchSuccessParams = {
  name: string;
  fullName: string;
  matchImage: ImageSourcePropType;
  matchId?: string;
  mutualMatch?: boolean;
};

const routeNames = (navigation: NavigationProp<ParamListBase>) =>
  navigation.getState()?.routeNames ?? [];

export const navigateToMatchSuccess = (
  navigation: NavigationProp<ParamListBase>,
  params: MatchSuccessParams,
) => {
  if (routeNames(navigation).includes('MatchSuccess')) {
    navigation.navigate('MatchSuccess', params);
    return;
  }

  const tabNavigation = getTabNavigation(navigation);

  if (tabNavigation) {
    tabNavigation.navigate('Home', {
      screen: 'MatchSuccess',
      params,
    });
    return;
  }

  navigation.getParent()?.navigate('Home', {
    screen: 'MatchSuccess',
    params,
  });
};

export const navigateToChat = (
  navigation: NavigationProp<ParamListBase>,
  params: { chatId: string; name: string },
) => {
  const tabNavigation = getTabNavigation(navigation);

  if (tabNavigation) {
    tabNavigation.navigate('Messages', {
      screen: 'Chat',
      params,
    });
    return;
  }

  navigation.getParent()?.navigate('Messages', {
    screen: 'Chat',
    params,
  });
};

export const navigateToSearchFilterResults = (
  navigation: NavigationProp<ParamListBase>,
) => {
  if (routeNames(navigation).includes('SearchMain')) {
    navigation.navigate('SearchMain', { fromFilter: true });
    return;
  }

  const tabNavigation = getTabNavigation(navigation);

  if (tabNavigation) {
    tabNavigation.navigate('Search', {
      screen: 'SearchMain',
      params: { fromFilter: true },
    });
    return;
  }

  navigation.getParent()?.navigate('Search', {
    screen: 'SearchMain',
    params: { fromFilter: true },
  });
};
