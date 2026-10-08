import { getFocusedRouteNameFromRoute, Route } from '@react-navigation/native';
import { StyleProp, ViewStyle } from 'react-native';

const HIDDEN_TAB_BAR_ROUTES: Record<string, string[]> = {
  Home: ['ProfileDetail', 'MatchSuccess', 'ViewProfileGallery'],
  Search: ['FilterMatches', 'ProfileDetail', 'MatchSuccess', 'ViewProfileGallery'],
  Messages: ['ChatRequests', 'Chat'],
  Like: ['FilterMatches', 'ProfileDetail', 'MatchSuccess', 'ViewProfileGallery'],
  Profile: [
    'EditProfile',
    'VerifyProfile',
    'VerifyProfileCode',
    'ProfileVerified',
    'Notifications',
    'ViewProfileRequests',
    'RequestHistory',
    'ApprovedPhotoAccess',
    'HelpCenter',
    'ContactSupport',
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

type NestedRouteParams = {
  screen?: string;
  state?: {
    index?: number;
    routes?: Array<{ name?: string }>;
  };
};

export const HIDDEN_TAB_BAR_STYLE: ViewStyle = {
  display: 'none',
  height: 0,
  overflow: 'hidden',
  opacity: 0,
  borderTopWidth: 0,
  elevation: 0,
  position: 'absolute',
};

export const getFocusedTabChildName = (route: Route<string>) => {
  const fromRoute = getFocusedRouteNameFromRoute(route);
  if (fromRoute) {
    return fromRoute;
  }

  const params = route.params as NestedRouteParams | undefined;
  if (params?.state?.routes?.length) {
    const index = params.state.index ?? 0;
    return params.state.routes[index]?.name;
  }

  if (typeof params?.screen === 'string') {
    return params.screen;
  }

  return undefined;
};

export const getTabBarStyle = (
  route: Route<string>,
  visibleStyle: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> => {
  const focusedRoute = getFocusedTabChildName(route);
  const hiddenRoutes = HIDDEN_TAB_BAR_ROUTES[route.name] ?? [];

  if (focusedRoute && hiddenRoutes.includes(focusedRoute)) {
    return HIDDEN_TAB_BAR_STYLE;
  }

  return visibleStyle;
};
