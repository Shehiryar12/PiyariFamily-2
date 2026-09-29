import type { ProfileApiData } from './mappers/profileMapper';
import { store, setProfile } from '../Redux';

export const profileStorage = {
  get: () => store.getState().profile.profile,
  set: (profile: ProfileApiData | null) => {
    store.dispatch(setProfile(profile));
  },
  clear: () => {
    store.dispatch(setProfile(null));
  },
};
