import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ShortlistTab,
  ShortlistedProfile,
} from '../../API/mappers/shortlistMapper';

type ShortlistBucket = {
  profiles: ShortlistedProfile[];
  total: number;
};

export type ShortlistState = {
  i_liked: ShortlistBucket;
  liked_me: ShortlistBucket;
};

const emptyBucket = (): ShortlistBucket => ({
  profiles: [],
  total: 0,
});

const initialState: ShortlistState = {
  i_liked: emptyBucket(),
  liked_me: emptyBucket(),
};

type ShortlistPayload = {
  tab: ShortlistTab;
  profiles: ShortlistedProfile[];
  total: number;
};

const shortlistSlice = createSlice({
  name: 'shortlist',
  initialState,
  reducers: {
    setShortlistData: (state, action: PayloadAction<ShortlistPayload>) => {
      const bucket = {
        profiles: action.payload.profiles,
        total: action.payload.total,
      };

      if (action.payload.tab === 'i_liked') {
        state.i_liked = bucket;
      } else {
        state.liked_me = bucket;
      }
    },
    clearShortlist: () => initialState,
  },
});

export const { setShortlistData, clearShortlist } = shortlistSlice.actions;

export const selectShortlistLiked = (state: { shortlist: ShortlistState }) =>
  state.shortlist.i_liked;

export const selectShortlistLikedMe = (state: { shortlist: ShortlistState }) =>
  state.shortlist.liked_me;

export default shortlistSlice.reducer;
