import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SuggestedMatch } from '../../API/mappers/matchMapper';

export type FilterFormState = {
  location: string;
  citySearch: string;
  education: string;
  profession: string;
  religion: string;
  marital: string;
  ageMin: number;
  ageMax: number;
  incomeRange: string;
  incomeMin?: number;
  incomeMax?: number;
  extraValues: Record<string, string>;
  activeQuickFilters: Record<string, boolean>;
};

export type FilterState = {
  form: FilterFormState | null;
  results: SuggestedMatch[];
  total: number;
  applied: boolean;
  fallbackUsed: boolean;
  hasExactMatches: boolean;
};

export const EMPTY_FILTER_FORM: FilterFormState = {
  location: '',
  citySearch: '',
  education: 'Any',
  profession: 'Any',
  religion: 'Any',
  marital: '',
  ageMin: 18,
  ageMax: 60,
  incomeRange: 'Any',
  incomeMin: 0,
  incomeMax: 200000,
  extraValues: {},
  activeQuickFilters: {},
};

const initialState: FilterState = {
  form: null,
  results: [],
  total: 0,
  applied: false,
  fallbackUsed: false,
  hasExactMatches: false,
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setFilterForm: (state, action: PayloadAction<FilterFormState>) => {
      state.form = action.payload;
    },
    setFilterResults: (
      state,
      action: PayloadAction<{
        results: SuggestedMatch[];
        total: number;
        fallbackUsed?: boolean;
        hasExactMatches?: boolean;
      }>,
    ) => {
      state.results = action.payload.results;
      state.total = action.payload.total;
      state.applied = true;
      state.fallbackUsed = Boolean(action.payload.fallbackUsed);
      state.hasExactMatches = Boolean(action.payload.hasExactMatches);
    },
    clearFilterResults: state => {
      state.results = [];
      state.total = 0;
      state.applied = false;
      state.fallbackUsed = false;
      state.hasExactMatches = false;
    },
    clearFilter: () => initialState,
  },
});

export const {
  setFilterForm,
  setFilterResults,
  clearFilterResults,
  clearFilter,
} = filterSlice.actions;

export const selectFilterForm = (state: { filter: FilterState }) =>
  state.filter.form;
export const selectFilterResults = (state: { filter: FilterState }) =>
  state.filter.results;
export const selectFilterTotal = (state: { filter: FilterState }) =>
  state.filter.total;
export const selectFilterApplied = (state: { filter: FilterState }) =>
  state.filter.applied;
export const selectFilterHasExactMatches = (state: { filter: FilterState }) =>
  state.filter.hasExactMatches;
export const selectFilterFallbackUsed = (state: { filter: FilterState }) =>
  state.filter.fallbackUsed;

export default filterSlice.reducer;
