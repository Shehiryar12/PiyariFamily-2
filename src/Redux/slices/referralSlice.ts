import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ReferralStats } from '../../API/mappers/referralMapper';

export type ReferralState = {
  stats: ReferralStats | null;
};

const initialState: ReferralState = {
  stats: null,
};

const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {
    setReferralStats: (state, action: PayloadAction<ReferralStats | null>) => {
      state.stats = action.payload;
    },
    clearReferral: () => initialState,
  },
});

export const { setReferralStats, clearReferral } = referralSlice.actions;

export const selectReferralStats = (state: { referral: ReferralState }) =>
  state.referral.stats;

export default referralSlice.reducer;
