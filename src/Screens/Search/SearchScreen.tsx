import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet } from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import {
  resolveUserCity,
  Api,
  saveProfileCache,
  type FilterQuickOption,
  type FilterSetupData,
  type SuggestedMatch,
} from '../../API';
import {
  buildSearchRequestKey,
  getSearchErrorMessage,
  MIN_SEARCH_LENGTH,
  searchMatches,
} from '../../API/services/matchSearchService';
import {
  filterMatchesByQuickFilters,
  stabilizeMatchOrder,
} from '../../API/mappers/matchLocationFilter';
import { AuthStyles } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Strings } from '../../Constant/Strings';
import { SearchStackParamList } from '../../Navigation/SearchStackNavigator';
import { hp } from '../../Functions/responsive';
import { useTabRootBackToHome } from '../../Functions/tabNavigation';
import {
  clearFilterResults,
  selectFilterApplied,
  selectFilterForm,
  selectFilterHasExactMatches,
  selectFilterResults,
  selectProfile,
  useAppDispatch,
  useAppSelector,
} from '../../Redux';
import {
  SearchBar,
  SearchEmptyState,
  SearchFilters,
  SearchHeader,
  SearchLoading,
  SearchMatchList,
  SearchRecentSearches,
} from './components';

type NavigationProp = NativeStackNavigationProp<
  SearchStackParamList,
  'SearchMain'
>;

type SearchRouteProp = RouteProp<SearchStackParamList, 'SearchMain'>;

const SearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  useTabRootBackToHome(navigation);
  const route = useRoute<SearchRouteProp>();
  const profile = useAppSelector(selectProfile);
  const dispatch = useAppDispatch();
  const filterResults = useAppSelector(selectFilterResults);
  const filterApplied = useAppSelector(selectFilterApplied);
  const filterForm = useAppSelector(selectFilterForm);
  const filterHasExactMatches = useAppSelector(selectFilterHasExactMatches);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(
    null,
  );
  const [quickFilters, setQuickFilters] = useState<FilterQuickOption[]>([]);
  const [searchCatalogs, setSearchCatalogs] = useState<{
    cities: string[];
    professions: string[];
  }>({ cities: [], professions: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestedMatches, setSuggestedMatches] = useState<SuggestedMatch[]>(
    [],
  );
  const [emptyMessage, setEmptyMessage] = useState(Strings.noMatchesFound);
  const [loading, setLoading] = useState(true);
  const searchGenerationRef = useRef(0);
  const lastSearchKeyRef = useRef('');
  const inFlightKeyRef = useRef('');
  const catalogsRef = useRef(searchCatalogs);
  const quickFiltersRef = useRef(quickFilters);

  catalogsRef.current = searchCatalogs;
  quickFiltersRef.current = quickFilters;

  const comingFromFilter = Boolean(route.params?.fromFilter);
  const appliedQuickFilterIds = Object.entries(
    filterForm?.activeQuickFilters ?? {},
  )
    .filter(([, enabled]) => Boolean(enabled))
    .map(([id]) => id);
  const appliedQuickFilterKey = appliedQuickFilterIds.join('|');
  const showingFilterResults =
    filterApplied &&
    !submittedQuery.trim() &&
    (comingFromFilter || !activeQuickFilter);

  const applySearchMeta = useCallback((setup: FilterSetupData) => {
    setQuickFilters(current => {
      const next = setup.quickFilters;
      const unchanged =
        current.length === next.length &&
        current.every(
          (item, index) =>
            item.id === next[index]?.id && item.label === next[index]?.label,
        );
      return unchanged ? current : next;
    });

    if (setup.options.cities.length || setup.options.professions.length) {
      setSearchCatalogs(current => {
        const next = {
          cities: setup.options.cities,
          professions: setup.options.professions,
        };
        const unchanged =
          current.cities.join('|') === next.cities.join('|') &&
          current.professions.join('|') === next.professions.join('|');
        return unchanged ? current : next;
      });
    }
  }, []);

  const fetchMatchSearch = useCallback(
    async (query: string, quickFilter: string | null) => {
      const trimmedQuery = query.trim();
      const activeOption = quickFiltersRef.current.find(
        item => item.id === quickFilter,
      );
      const requestKey = buildSearchRequestKey({
        searchQuery: trimmedQuery,
        quickFilter,
        profileGender: profile?.gender,
        profileCity: profile?.city,
        profileLocation: profile?.location,
        searchCatalogs: catalogsRef.current,
      });

      if (inFlightKeyRef.current === requestKey) {
        return;
      }

      if (lastSearchKeyRef.current === requestKey) {
        setLoading(false);
        return;
      }

      const generation = ++searchGenerationRef.current;
      inFlightKeyRef.current = requestKey;
      setLoading(true);

      try {
        const result = await searchMatches({
          searchQuery: trimmedQuery,
          quickFilter,
          quickFilterLabel: activeOption?.label,
          profileGender: profile?.gender,
          profileCity: profile?.city,
          profileLocation: profile?.location,
          latitude: profile?.latitude ?? profile?.lat,
          longitude: profile?.longitude ?? profile?.lng,
          searchCatalogs: catalogsRef.current,
        });

        if (generation !== searchGenerationRef.current) {
          return;
        }

        lastSearchKeyRef.current = requestKey;
        applySearchMeta(result.setup);

        setSuggestedMatches(result.matches);
        setEmptyMessage(
          result.isUserSearch ? Strings.noExactMatchesFound : result.emptyMessage,
        );

        if (trimmedQuery.length >= MIN_SEARCH_LENGTH || quickFilter) {
          dispatch(clearFilterResults());
        }
        if (trimmedQuery.length >= MIN_SEARCH_LENGTH) {
          setRecentSearches(current =>
            [trimmedQuery, ...current.filter(item => item !== trimmedQuery)].slice(
              0,
              8,
            ),
          );
        }
      } catch (error) {
        if (generation !== searchGenerationRef.current) {
          return;
        }

        setSuggestedMatches([]);
        lastSearchKeyRef.current = '';
        const message = getSearchErrorMessage(error);
        setEmptyMessage(message);
        Toast.show(message, Toast.LONG);
      } finally {
        if (generation === searchGenerationRef.current) {
          inFlightKeyRef.current = '';
          setLoading(false);
        }
      }
    },
    [
      applySearchMeta,
      dispatch,
      profile?.city,
      profile?.gender,
      profile?.lat,
      profile?.latitude,
      profile?.lng,
      profile?.location,
      profile?.longitude,
    ],
  );

  const submitSearch = useCallback((query: string) => {
    const trimmed = query.trim();

    if (trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH) {
      Toast.show('Enter at least 2 characters to search', Toast.LONG);
      return;
    }

    Keyboard.dismiss();
    lastSearchKeyRef.current = '';
    if (trimmed.length >= MIN_SEARCH_LENGTH) {
      setActiveQuickFilter(null);
    }
    setSubmittedQuery(trimmed);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (profile?.gender) {
        return;
      }

      let cancelled = false;

      const loadViewerProfile = async () => {
        try {
          const res = await Api.getProfile();
          if (!cancelled && res?.status == 200) {
            saveProfileCache(res.data);
          }
        } catch {
        }
      };

      loadViewerProfile();

      return () => {
        cancelled = true;
      };
    }, [profile?.gender]),
  );

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      return;
    }

    const timer = setTimeout(() => {
      setSubmittedQuery(current => (current === trimmed ? current : trimmed));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      if (!route.params?.fromFilter) {
        return;
      }

      setSearchQuery('');
      setSubmittedQuery('');
      setActiveQuickFilter(null);
      lastSearchKeyRef.current = '';
      inFlightKeyRef.current = '';
      navigation.setParams({
        fromFilter: undefined,
        filterMatches: undefined,
        filterTotal: undefined,
      });
    }, [navigation, route.params?.fromFilter]),
  );

  useEffect(() => {
    if (!showingFilterResults) {
      return;
    }

    setSuggestedMatches(
      stabilizeMatchOrder(
        filterMatchesByQuickFilters(
          filterResults,
          appliedQuickFilterKey
            ? appliedQuickFilterKey.split('|').map(id => {
                const meta = quickFilters.find(item => item.id === id);
                return { id, label: meta?.label ?? id };
              })
            : [],
          resolveUserCity(profile),
        ),
      ),
    );
    setLoading(false);
  }, [
    appliedQuickFilterKey,
    filterResults,
    profile?.city,
    profile?.location,
    quickFilters,
    showingFilterResults,
  ]);

  useEffect(() => {
    if (showingFilterResults) {
      return;
    }

    fetchMatchSearch(submittedQuery, activeQuickFilter);
  }, [
    activeQuickFilter,
    fetchMatchSearch,
    showingFilterResults,
    submittedQuery,
  ]);

  const selectedFilterIds = showingFilterResults
    ? appliedQuickFilterIds
    : activeQuickFilter
      ? [activeQuickFilter]
      : [];

  const matchesTitle =
    (showingFilterResults && filterHasExactMatches) ||
    submittedQuery.trim().length >= MIN_SEARCH_LENGTH
      ? Strings.exactMatches
      : Strings.suggestedMatches;
  const hasSubmittedSearch = submittedQuery.trim().length >= MIN_SEARCH_LENGTH;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SearchHeader
          onOpenFilters={() => navigation.navigate('FilterMatches')}
        />
        <SearchBar
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            if (!text.trim() && submittedQuery) {
              lastSearchKeyRef.current = '';
              setSubmittedQuery('');
            }
          }}
          onSubmit={() => submitSearch(searchQuery)}
        />
        <SearchFilters
          filters={quickFilters}
          selectedIds={selectedFilterIds}
          onToggle={id => {
            if (showingFilterResults && appliedQuickFilterIds.includes(id)) {
              return;
            }

            lastSearchKeyRef.current = '';
            setActiveQuickFilter(prev => (prev === id ? null : id));
          }}
        />
        <SearchRecentSearches
          items={recentSearches}
          onSelect={item => {
            setSearchQuery(item);
            submitSearch(item);
          }}
          onRemove={item =>
            setRecentSearches(current => current.filter(search => search !== item))
          }
          onClearAll={() => setRecentSearches([])}
        />

        {loading ? (
          <SearchLoading />
        ) : suggestedMatches.length > 0 ? (
          <SearchMatchList
            title={matchesTitle}
            matches={suggestedMatches}
            onPressMatch={match =>
              navigation.navigate('ProfileDetail', {
                profileId: match.id,
                name: match.name,
                age: match.age,
                location: match.location,
                image: match.pictureHidden ? undefined : match.image,
                isVerified: match.isVerified,
                pictureHidden: Boolean(match.pictureHidden),
              })
            }
          />
        ) : (
          <SearchEmptyState
            title={
              hasSubmittedSearch ? Strings.noExactMatchesFound : emptyMessage
            }
            query={hasSubmittedSearch ? submittedQuery : undefined}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('0.5%'),
    paddingBottom: hp('2%'),
  },
});

export default SearchScreen;
