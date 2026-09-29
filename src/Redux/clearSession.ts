import { persistor, store } from './store';
import { clearAuth } from './slices/authSlice';
import { clearProfile } from './slices/profileSlice';
import { clearHomeMatches } from './slices/homeSlice';
import { clearShortlist } from './slices/shortlistSlice';
import { clearReferral } from './slices/referralSlice';
import { clearFilter } from './slices/filterSlice';
import {
  clearNavigationState,
  clearLastAccount,
  setHasSeenWelcome,
  setLastAccount,
} from './slices/appSlice';

export const clearSession = (options?: { rememberAccount?: boolean }) => {
  const rememberAccount = options?.rememberAccount === true;
  const { auth, profile } = store.getState();

  if (rememberAccount) {
    store.dispatch(
      setLastAccount({
        name: auth.user?.name || profile.profile?.name,
        email: auth.user?.email || profile.profile?.email,
      }),
    );
  } else {
    store.dispatch(clearLastAccount());
  }

  store.dispatch(clearAuth());
  store.dispatch(clearProfile());
  store.dispatch(clearHomeMatches());
  store.dispatch(clearShortlist());
  store.dispatch(clearReferral());
  store.dispatch(clearFilter());
  store.dispatch(clearNavigationState());
  store.dispatch(setHasSeenWelcome(true));
  return persistor.flush();
};
