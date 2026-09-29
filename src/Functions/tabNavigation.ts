import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import {
  CommonActions,
  NavigationProp,
  ParamListBase,
  useFocusEffect,
} from '@react-navigation/native';

const TAB_ROUTE_NAMES = ['Home', 'Search', 'Messages', 'Like', 'Profile'];

export const getTabNavigation = (navigation: NavigationProp<ParamListBase>) => {
  let current: NavigationProp<ParamListBase> | undefined = navigation;

  while (current) {
    const routeNames = current.getState()?.routeNames ?? [];

    if (TAB_ROUTE_NAMES.every(name => routeNames.includes(name))) {
      return current;
    }

    current = current.getParent();
  }

  return undefined;
};

export const navigateToHomeTab = (navigation: NavigationProp<ParamListBase>) => {
  const tabNavigation = getTabNavigation(navigation);

  if (tabNavigation) {
    tabNavigation.navigate('Home', { screen: 'HomeMain' });
    return;
  }

  navigation.dispatch(
    CommonActions.navigate({
      name: 'Home',
      params: { screen: 'HomeMain' },
    }),
  );
};

export const popStackOrGoHome = (
  navigation: NavigationProp<ParamListBase>,
) => {
  const index = navigation.getState()?.index;

  if (typeof index === 'number' && index > 0) {
    navigation.goBack();
    return;
  }

  navigateToHomeTab(navigation);
};

export const useTabRootBackToHome = (
  navigation: NavigationProp<ParamListBase>,
) => {
  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        navigateToHomeTab(navigation);
        return true;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onHardwareBack,
      );

      return () => sub.remove();
    }, [navigation]),
  );
};
