import {
  CommonActions,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { Api, pickImageUrl, saveProfileCache, type ProfileApiData } from '../API';
import { clearNavigationState, clearSession, setHasSeenWelcome, setSetupComplete, store } from '../Redux';
import { resolveSessionNavigationState } from './navigationPersistence';

export const PROFILE_SETUP_FLOW = [
  'SelectCountry',
  'BasicInfo',
  'Education',
  'Career',
  'PhysicalDetails',
  'FaithCommunity',
  'AddPhotos',
  'ProfileReady',
] as const;

export type ProfileSetupRoute = (typeof PROFILE_SETUP_FLOW)[number];
export type PostLoginRoute = 'Main' | ProfileSetupRoute;

const isTruthyFlag = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 'true';

const isFalsyFlag = (value: unknown) =>
  value === false || value === 0 || value === '0' || value === 'false';

const hasText = (value?: string | number | null) =>
  value !== undefined && value !== null && String(value).trim() !== '';

const hasCountry = (profile: ProfileApiData) => {
  const countryId = Number(profile.country_id);
  return (Number.isFinite(countryId) && countryId > 0) || hasText(profile.country);
};

export const getNextSetupRoute = (
  profileStep?: number | string | null,
): PostLoginRoute => {
  const completed = Number(profileStep);

  if (!Number.isFinite(completed) || completed < 1) {
    return 'SelectCountry';
  }

  if (completed >= PROFILE_SETUP_FLOW.length) {
    return 'Main';
  }

  return PROFILE_SETUP_FLOW[completed];
};

export const isProfileSetupComplete = (profile?: ProfileApiData | null) => {
  if (store.getState().profile.setupComplete) {
    return true;
  }

  if (!profile) {
    return false;
  }

  if (isTruthyFlag(profile.profile_completed)) {
    return true;
  }

  if (isFalsyFlag(profile.profile_completed)) {
    return false;
  }

  const step = Number(profile.profile_step);
  if (Number.isFinite(step)) {
    return step >= PROFILE_SETUP_FLOW.length;
  }

  const hasBasicInfo = hasText(profile.gender) || hasText(profile.birthday);
  const hasPhoto = Boolean(pickImageUrl(profile));

  return hasCountry(profile) && hasBasicInfo && hasPhoto;
};

export const getPostLoginRoute = (
  profile?: ProfileApiData | null,
): PostLoginRoute =>
  isProfileSetupComplete(profile)
    ? 'Main'
    : getNextSetupRoute(profile?.profile_step);

export const getSetupNavigationState = (route: PostLoginRoute) => {
  if (route === 'Main') {
    return {
      index: 0,
      routes: [{ name: 'Main' as const }],
    };
  }

  const currentIndex = Math.max(PROFILE_SETUP_FLOW.indexOf(route), 0);
  const routes = PROFILE_SETUP_FLOW.slice(0, currentIndex + 1).map(name => ({
    name,
  }));

  return {
    index: routes.length - 1,
    routes,
  };
};

export const resolvePostLoginRoute = async (): Promise<PostLoginRoute> => {
  let profile = store.getState().profile.profile;

  if (!isProfileSetupComplete(profile)) {
    try {
      const res = await Api.getProfile();
      if (res?.status == 200) {
        profile = saveProfileCache(res.data);
      }
    } catch (error) {
    }
  }

  const route = getPostLoginRoute(profile);

  if (route === 'Main') {
    store.dispatch(setSetupComplete(true));
  }

  return route;
};

type AuthNavigation = {
  replace: (screen: string) => void;
  reset?: (state: {
    index: number;
    routes: Array<{ name: string; params?: object; state?: object }>;
  }) => void;
};

export const finishAuthNavigation = async (navigation: AuthNavigation) => {
  const route = await resolvePostLoginRoute();

  if (route === 'Main' && navigation.reset) {
    navigation.reset(
      resolveSessionNavigationState() as {
        index: number;
        routes: Array<{ name: string; params?: object; state?: object }>;
      },
    );
    return;
  }

  navigateAfterLogin(navigation, route);
};

type LoginNavResponse = {
  requires_profile_completion?: boolean | number | string;
  profile_completed?: boolean | number | string;
  profile_step?: number | string;
  user?: {
    profile_step?: number | string;
    profile_completed?: boolean | number | string;
  };
  data?: {
    requires_profile_completion?: boolean | number | string;
    profile_completed?: boolean | number | string;
    profile_step?: number | string;
  };
} | null;

const pickProfileCompletionFlag = (response?: LoginNavResponse) =>
  response?.requires_profile_completion ??
  response?.data?.requires_profile_completion;

const pickProfileCompleted = (response?: LoginNavResponse) =>
  response?.profile_completed ??
  response?.data?.profile_completed ??
  response?.user?.profile_completed;

const pickProfileStep = (response?: LoginNavResponse) =>
  response?.profile_step ??
  response?.data?.profile_step ??
  response?.user?.profile_step;

export const isIncompleteProfileLogin = (response?: LoginNavResponse) => {
  if (!response) {
    return false;
  }

  if (isTruthyFlag(pickProfileCompletionFlag(response))) {
    return true;
  }

  if (isFalsyFlag(pickProfileCompleted(response))) {
    return true;
  }

  const step = Number(pickProfileStep(response));
  return Number.isFinite(step) && step < PROFILE_SETUP_FLOW.length;
};

export const finishLoginNavigation = async (
  navigation: AuthNavigation,
  response?: LoginNavResponse,
) => {
  const flag = pickProfileCompletionFlag(response);
  const completed = pickProfileCompleted(response);
  const step = pickProfileStep(response);

  if (isFalsyFlag(flag) || isTruthyFlag(completed)) {
    store.dispatch(setSetupComplete(true));
    navigateAfterLogin(navigation, 'Main');
    return;
  }

  if (isTruthyFlag(flag) || isFalsyFlag(completed)) {
    store.dispatch(setSetupComplete(false));
    navigateAfterLogin(navigation, getNextSetupRoute(step));
    return;
  }

  await finishAuthNavigation(navigation);
};

export const navigateAfterLogin = (
  navigation: AuthNavigation,
  route: PostLoginRoute,
) => {
  const nextState = getSetupNavigationState(route);

  if (navigation.reset) {
    navigation.reset(nextState);
    return;
  }

  navigation.replace(route);
};

export const resetToLogin = (
  navigation: NavigationProp<ParamListBase>,
  options?: { forgetAccount?: boolean },
) => {
  store.dispatch(setHasSeenWelcome(true));
  store.dispatch(clearNavigationState());
  void clearSession({
    rememberAccount: options?.forgetAccount === false,
  });

  const loginReset = {
    index: 0,
    routes: [{ name: 'Login' }],
  };

  let rootNavigation: NavigationProp<ParamListBase> = navigation;
  while (rootNavigation.getParent()) {
    rootNavigation = rootNavigation.getParent() as NavigationProp<ParamListBase>;
  }

  rootNavigation.dispatch(CommonActions.reset(loginReset));
};
