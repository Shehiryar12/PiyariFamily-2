import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AccountStatus } from '../../API/accountStorage';
import type { ProfileApiData } from '../../API/mappers/profileMapper';
import { pickImageUrl } from '../../API/mappers/profileMapper';

export type ProfileState = {
  profile: ProfileApiData | null;
  accountStatus: AccountStatus | null;
  setupComplete: boolean;
};

const initialState: ProfileState = {
  profile: null,
  accountStatus: null,
  setupComplete: false,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<ProfileApiData | null>) => {
      state.profile = action.payload;
    },
    setAccountStatus: (state, action: PayloadAction<AccountStatus | null>) => {
      state.accountStatus = action.payload;
    },
    setSetupComplete: (state, action: PayloadAction<boolean>) => {
      state.setupComplete = action.payload;
    },
    clearProfile: () => initialState,
  },
});

export const { setProfile, setAccountStatus, setSetupComplete, clearProfile } =
  profileSlice.actions;

export const selectProfile = (state: { profile: ProfileState }) =>
  state.profile.profile;

export const selectAccountStatus = (state: { profile: ProfileState }) =>
  state.profile.accountStatus;

export const selectIsAccountInactive = (state: { profile: ProfileState }) =>
  state.profile.accountStatus === 'inactive';

export const selectProfilePhoto = (state: { profile: ProfileState }) =>
  pickImageUrl(state.profile.profile) || null;

export const selectSetupComplete = (state: { profile: ProfileState }) =>
  Boolean(state.profile.setupComplete);

export default profileSlice.reducer;
