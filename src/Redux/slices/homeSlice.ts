import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  FeaturedMatch,
  SuggestedMatch,
} from '../../API/mappers/matchMapper';

export type HomeState = {
  greeting: string;
  subtitle: string;
  featuredMatches: FeaturedMatch[];
  suggestedMatches: SuggestedMatch[];
  totalMatches: number;
};

const initialState: HomeState = {
  greeting: '',
  subtitle: '',
  featuredMatches: [],
  suggestedMatches: [],
  totalMatches: 0,
};

type HomeMatchesPayload = {
  greeting: string;
  subtitle: string;
  featuredMatches: FeaturedMatch[];
  suggestedMatches: SuggestedMatch[];
  totalMatches: number;
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setHomeMatches: (state, action: PayloadAction<HomeMatchesPayload>) => {
      state.greeting = action.payload.greeting;
      state.subtitle = action.payload.subtitle;
      state.featuredMatches = action.payload.featuredMatches;
      state.suggestedMatches = action.payload.suggestedMatches;
      state.totalMatches = action.payload.totalMatches;
    },
    clearHomeMatches: () => initialState,
    removeFeaturedMatch: (state, action: PayloadAction<string>) => {
      state.featuredMatches = state.featuredMatches.filter(
        match => match.id !== action.payload,
      );
    },
    dismissFeaturedMatch: (state, action: PayloadAction<string>) => {
      const featuredIndex = state.featuredMatches.findIndex(
        match => match.id === action.payload,
      );

      if (featuredIndex < 0) {
        return;
      }

      state.featuredMatches.splice(featuredIndex, 1);

      const nextSuggested = state.suggestedMatches.shift();
      if (!nextSuggested) {
        return;
      }

      state.featuredMatches.splice(featuredIndex, 0, {
        id: nextSuggested.id,
        name: nextSuggested.name,
        age: nextSuggested.age,
        location: nextSuggested.location,
        image: nextSuggested.image,
        tags:
          nextSuggested.profession && nextSuggested.profession !== '-'
            ? [{ icon: 'briefcase-outline', label: nextSuggested.profession }]
            : [],
        isNew: false,
        isVerified: nextSuggested.isVerified,
      });
    },
  },
});

export const {
  setHomeMatches,
  clearHomeMatches,
  removeFeaturedMatch,
  dismissFeaturedMatch,
} = homeSlice.actions;

export const selectHomeGreeting = (state: { home: HomeState }) =>
  state.home.greeting;

export const selectHomeSubtitle = (state: { home: HomeState }) =>
  state.home.subtitle;

export const selectFeaturedMatches = (state: { home: HomeState }) =>
  state.home.featuredMatches;

export const selectSuggestedMatches = (state: { home: HomeState }) =>
  state.home.suggestedMatches;

export const selectTotalMatches = (state: { home: HomeState }) =>
  state.home.totalMatches;

export default homeSlice.reducer;
