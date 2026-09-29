import type { NavigationState, PartialState } from '@react-navigation/native';
import { store } from '../Redux';
import { isProfileSetupComplete } from './authNavigation';

export const PROFILE_SETUP_ROUTES = [
  'SelectCountry',
  'BasicInfo',
  'Education',
  'Career',
  'PhysicalDetails',
  'FaithCommunity',
  'AddPhotos',
  'ProfileReady',
] as const;

const GUEST_ROUTES = [
  'Onboarding',
  'Login',
  'SignUp',
  'VerifyEmail',
  'ForgotPassword',
  'CheckEmail',
  'CodeVerified',
  'SetNewPassword',
  'PasswordResetSuccess',
  'WelcomeBack',
];

type NavState = NavigationState | PartialState<NavigationState>;

export const getActiveRouteName = (state?: NavState | null): string | undefined => {
  if (!state?.routes?.length) {
    return undefined;
  }

  const index = 'index' in state && typeof state.index === 'number'
    ? state.index
    : state.routes.length - 1;
  const route = state.routes[index];

  if (route?.state) {
    return getActiveRouteName(route.state as NavState);
  }

  return route?.name;
};

const stackState = (name: string): PartialState<NavigationState> => ({
  index: 0,
  routes: [{ name }],
});

const isProfileSetupRoute = (
  name?: string,
): name is (typeof PROFILE_SETUP_ROUTES)[number] =>
  Boolean(
    name &&
      PROFILE_SETUP_ROUTES.includes(name as (typeof PROFILE_SETUP_ROUTES)[number]),
  );

const isGuestRoute = (name?: string) =>
  Boolean(name && GUEST_ROUTES.includes(name));

const isMainAppRoute = (name?: string) =>
  Boolean(
    name && name !== 'Splash' && !isGuestRoute(name) && !isProfileSetupRoute(name),
  );

export const resolveSessionNavigationState = ():
  | NavigationState
  | PartialState<NavigationState> => {
  const { auth, profile, app } = store.getState();
  const isAuthenticated = Boolean(auth.accessToken);
  const profileComplete = isProfileSetupComplete(profile.profile);
  const saved = app.navigationState;
  const routeName = getActiveRouteName(saved);

  if (!isAuthenticated) {
    return stackState('Login');
  }

  if (profileComplete || isMainAppRoute(routeName)) {
    if (saved && isMainAppRoute(routeName)) {
      return saved;
    }

    return stackState('Main');
  }

  if (saved && isProfileSetupRoute(routeName)) {
    const setupRoutes = (saved.routes ?? []).filter(
      route => route.name && route.name !== 'Main' && route.name !== 'Splash',
    );

    if (!setupRoutes.length) {
      return stackState('SelectCountry');
    }

    const nextIndex = Math.min(
      'index' in saved && typeof saved.index === 'number'
        ? saved.index
        : setupRoutes.length - 1,
      setupRoutes.length - 1,
    );

    return {
      ...saved,
      index: nextIndex,
      routes: setupRoutes,
    };
  }

  return stackState('SelectCountry');
};
