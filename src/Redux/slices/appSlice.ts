import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { NavigationState, PartialState } from '@react-navigation/native';

export type PersistedNavigationState =
  | NavigationState
  | PartialState<NavigationState>
  | null;

export type AppUiState = {
  hasSeenWelcome: boolean;
  navigationState: PersistedNavigationState;
  lastAccountName: string | null;
  lastAccountEmail: string | null;
};

const initialState: AppUiState = {
  hasSeenWelcome: false,
  navigationState: null,
  lastAccountName: null,
  lastAccountEmail: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setHasSeenWelcome: (state, action: PayloadAction<boolean>) => {
      state.hasSeenWelcome = action.payload;
    },
    setNavigationState: (
      state,
      action: PayloadAction<PersistedNavigationState>,
    ) => {
      state.navigationState = action.payload;
    },
    clearNavigationState: state => {
      state.navigationState = null;
    },
    setLastAccount: (
      state,
      action: PayloadAction<{ name?: string | null; email?: string | null }>,
    ) => {
      const name = action.payload.name?.trim();
      const email = action.payload.email?.trim();

      if (name && !name.includes('@')) {
        state.lastAccountName = name;
      }

      if (email) {
        state.lastAccountEmail = email;
      }
    },
    clearLastAccount: state => {
      state.lastAccountName = null;
      state.lastAccountEmail = null;
    },
  },
});

export const {
  setHasSeenWelcome,
  setNavigationState,
  clearNavigationState,
  setLastAccount,
  clearLastAccount,
} = appSlice.actions;

export const selectHasSeenWelcome = (state: { app: AppUiState }) =>
  state.app.hasSeenWelcome;

export const selectNavigationState = (state: { app: AppUiState }) =>
  state.app.navigationState;

export const selectLastAccountName = (state: { app: AppUiState }) =>
  state.app.lastAccountName;

export const selectLastAccountEmail = (state: { app: AppUiState }) =>
  state.app.lastAccountEmail;

export default appSlice.reducer;
