import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../API/types';

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

type AuthSessionPayload = {
  user?: User | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string | null>) => {
      state.refreshToken = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setAuthSession: (state, action: PayloadAction<AuthSessionPayload>) => {
      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }

      if (action.payload.accessToken !== undefined) {
        state.accessToken = action.payload.accessToken;
      }

      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
      }
    },
    clearAuth: () => initialState,
  },
});

export const {
  setAccessToken,
  setRefreshToken,
  setUser,
  setAuthSession,
  clearAuth,
} = authSlice.actions;

export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;

export const selectRefreshToken = (state: { auth: AuthState }) =>
  state.auth.refreshToken;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;

export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  Boolean(state.auth.accessToken);

export default authSlice.reducer;
