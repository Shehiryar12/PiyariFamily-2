import { store, setAccessToken, setRefreshToken } from '../Redux';

export const tokenStorage = {
  getAccessToken: () => store.getState().auth.accessToken,
  setAccessToken: (token: string | null) => {
    store.dispatch(setAccessToken(token));
  },
  getRefreshToken: () => store.getState().auth.refreshToken,
  setRefreshToken: (token: string | null) => {
    store.dispatch(setRefreshToken(token));
  },
  clear: () => {
    store.dispatch(setAccessToken(null));
    store.dispatch(setRefreshToken(null));
  },
};
