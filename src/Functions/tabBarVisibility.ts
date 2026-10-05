import { getFocusedRouteNameFromRoute, Route } from '@react-navigation/native';
import { StyleProp, ViewStyle } from 'react-native';

const HIDDEN_TAB_BAR_ROUTES: Record<string, string[]> = {
  Home: ['ProfileDetail', 'MatchSuccess'],
  Search: ['FilterMatches', 'ProfileDetail', 'MatchSuccess'],
  Messages: ['ChatRequests', 'Chat'],
  Like: ['FilterMatches', 'ProfileDetail', 'MatchSuccess'],
  Profile: [
    'EditProfile',
    'VerifyProfile',
    'VerifyProfileCode',
    'ProfileVerified',
    'Notifications',
    'ViewProfileRequests',
    'RequestHistory',
    'ViewProfileGallery',
    'ProfileDetail',
    'MatchSuccess',
    'ChangePassword',
    'AccountOptions',
    'ReferralProgram',
    'MyRewards',
    'ChooseYourPlan',
    'ComparePlans',
    'PremiumPaywall',
    'CompletePayment',
    'PremiumSuccess',
    'ManageSubscription',
  ],
};

export const getTabBarStyle = (
  route: Route<string>,
  visibleStyle: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> => {
  const focusedRoute = getFocusedRouteNameFromRoute(route);
  const hiddenRoutes = HIDDEN_TAB_BAR_ROUTES[route.name] ?? [];

  if (focusedRoute && hiddenRoutes.includes(focusedRoute)) {
    return { display: 'none' };
  }

  return visibleStyle;
};
