import {
  CommonActions,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { Api, pickImageUrl, saveProfileCache, type ProfileApiData } from '../API';
import { clearNavigationState, clearSession, setHasSeenWelcome, setSetupComplete, store } from '../Redux';
import { resolveSessionNavigationState } from './navigationPersistence';

export type PostLoginRoute = 'Main' | 'SelectCountry';

const hasText = (value?: string | number | null) =>
  value !== undefined && value !== null && String(value).trim() !== '';

const hasCountry = (profile: ProfileApiData) => {
  const countryId = Number(profile.country_id);
  return (Number.isFinite(countryId) && countryId > 0) || hasText(profile.country);
};

export const isProfileSetupComplete = (profile?: ProfileApiData | null) => {
  if (store.getState().profile.setupComplete) {
    return true;
  }

  if (!profile) {
    return false;
  }

  if (profile.profile_completed === true) {
    return true;
  }

  const step = Number(profile.profile_step);
  if (Number.isFinite(step) && step >= 8) {
    return true;
  }

  const hasBasicInfo = hasText(profile.gender) || hasText(profile.birthday);
  const hasPhoto = Boolean(pickImageUrl(profile));

  return hasCountry(profile) && hasBasicInfo && hasPhoto;
};

export const getPostLoginRoute = (
  profile?: ProfileApiData | null,
): PostLoginRoute =>
  isProfileSetupComplete(profile) ? 'Main' : 'SelectCountry';

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

const isTruthyFlag = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 'true';

const isFalsyFlag = (value: unknown) =>
  value === false || value === 0 || value === '0' || value === 'false';

const pickProfileCompletionFlag = (response?: {
  requires_profile_completion?: boolean | number | string;
  data?: { requires_profile_completion?: boolean | number | string };
} | null) =>
  response?.requires_profile_completion ??
  response?.data?.requires_profile_completion;

export const finishLoginNavigation = async (
  navigation: AuthNavigation,
  response?: {
    requires_profile_completion?: boolean | number | string;
    data?: { requires_profile_completion?: boolean | number | string };
  } | null,
) => {
  const flag = pickProfileCompletionFlag(response);

  if (isTruthyFlag(flag)) {
    store.dispatch(setSetupComplete(false));
    navigateAfterLogin(navigation, 'SelectCountry');
    return;
  }

  if (isFalsyFlag(flag)) {
    store.dispatch(setSetupComplete(true));
    navigateAfterLogin(navigation, 'Main');
    return;
  }

  await finishAuthNavigation(navigation);
};

export const navigateAfterLogin = (
  navigation: AuthNavigation,
  route: PostLoginRoute,
) => {
  if (route === 'Main') {
    if (navigation.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      return;
    }

    navigation.replace('Main');
    return;
  }

  if (navigation.reset) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'SelectCountry' }],
    });
    return;
  }

  navigation.replace('SelectCountry');
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
