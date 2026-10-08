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
  getApiErrorMessage,
  hydrateMatchImages,
  isApiSuccess,
  mapFilterSetup,
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
  selectQuickFilterCatalog,
  setFilterMatchLiked,
  setHomeMatchLiked,
  setQuickFilterCatalog,
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
  const storedQuickFilters = useAppSelector(selectQuickFilterCatalog);
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
  const [likingId, setLikingId] = useState<string | null>(null);
  const searchGenerationRef = useRef(0);
  const lastSearchKeyRef = useRef('');
  const inFlightKeyRef = useRef('');
  const catalogsRef = useRef(searchCatalogs);
  const quickFiltersRef = useRef(quickFilters);
  const matchesRef = useRef(suggestedMatches);

  const appliedQuickFilterIds = Object.entries(
    filterForm?.activeQuickFilters ?? {},
  )
    .filter(([, enabled]) => Boolean(enabled))
    .map(([id]) => id);
  const visibleQuickFilters = quickFilters.length
    ? quickFilters
    : storedQuickFilters;
  const resultQuickFilterIds = [
    ...appliedQuickFilterIds,
    ...(activeQuickFilter && !appliedQuickFilterIds.includes(activeQuickFilter)
      ? [activeQuickFilter]
      : []),
  ];
  const appliedQuickFilterKey = resultQuickFilterIds.join('|');
  const showingFilterResults = filterApplied && !submittedQuery.trim();

  catalogsRef.current = searchCatalogs;
  quickFiltersRef.current = visibleQuickFilters;
  matchesRef.current = suggestedMatches;

  const applySearchMeta = useCallback(
    (setup: FilterSetupData) => {
      const nextFilters = setup.quickFilters;
      if (nextFilters.length) {
        dispatch(setQuickFilterCatalog(nextFilters));
        setQuickFilters(current => {
          const unchanged =
            current.length === nextFilters.length &&
            current.every(
              (item, index) =>
                item.id === nextFilters[index]?.id &&
                item.label === nextFilters[index]?.label,
            );
          return unchanged ? current : nextFilters;
        });
      }

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
    },
    [dispatch],
  );

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
      if (!matchesRef.current.length) {
        setLoading(true);
      }

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
        setLoading(false);

        if (trimmedQuery.length >= MIN_SEARCH_LENGTH) {
          dispatch(clearFilterResults());
        }

        try {
          const hydrated = await hydrateMatchImages(result.matches);
          if (generation !== searchGenerationRef.current) {
            return;
          }
          setSuggestedMatches(hydrated);
        } catch {
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
      setRecentSearches(current =>
        [trimmed, ...current.filter(item => item !== trimmed)].slice(0, 8),
      );
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

  useFocusEffect(
    useCallback(() => {
      if (!route.params?.fromFilter) {
        return;
      }

      setSearchQuery('');
      setSubmittedQuery('');
      setActiveQuickFilter(null);
      searchGenerationRef.current += 1;
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
                const meta = visibleQuickFilters.find(item => item.id === id);
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
    visibleQuickFilters,
    showingFilterResults,
  ]);

  const loadSearchCatalog = useCallback(async () => {
    if (quickFiltersRef.current.length || storedQuickFilters.length) {
      return;
    }

    try {
      const res = await Api.getMatchSearch();
      if (isApiSuccess(res?.status, res?.data?.success)) {
        applySearchMeta(mapFilterSetup(res?.data));
      }
    } catch {
    }
  }, [applySearchMeta, storedQuickFilters.length]);

  useEffect(() => {
    if (filterApplied) {
      return;
    }

    lastSearchKeyRef.current = '';
  }, [filterApplied]);

  useEffect(() => {
    if (showingFilterResults) {
      loadSearchCatalog();
      return;
    }

    fetchMatchSearch(submittedQuery, activeQuickFilter);
  }, [
    activeQuickFilter,
    fetchMatchSearch,
    loadSearchCatalog,
    showingFilterResults,
    submittedQuery,
  ]);

  const selectedFilterIds = showingFilterResults
    ? resultQuickFilterIds
    : activeQuickFilter
      ? [activeQuickFilter]
      : [];

  const matchesTitle =
    (showingFilterResults && filterHasExactMatches) ||
    submittedQuery.trim().length >= MIN_SEARCH_LENGTH
      ? Strings.exactMatches
      : Strings.suggestedMatches;
  const hasSubmittedSearch = submittedQuery.trim().length >= MIN_SEARCH_LENGTH;

  const handleLikeMatch = async (match: SuggestedMatch) => {
    if (likingId) {
      return;
    }

    const alreadyLiked = Boolean(match.isLiked);
    setLikingId(match.id);

    try {
      const res = await Api.sendShortlistInterest(match.id);

      if (res?.status == 200) {
        setSuggestedMatches(current =>
          current.map(item =>
            item.id === match.id ? { ...item, isLiked: !alreadyLiked } : item,
          ),
        );
        dispatch(setHomeMatchLiked({ id: match.id, isLiked: !alreadyLiked }));
        dispatch(setFilterMatchLiked({ id: match.id, isLiked: !alreadyLiked }));
        Toast.show(
          alreadyLiked ? Strings.profileUnliked : Strings.profileLiked,
          Toast.SHORT,
        );

        if (!alreadyLiked) {
          navigation.navigate('MatchSuccess', {
            name: match.name.split(' ')[0],
            fullName: match.name,
            matchId: match.id,
            matchImage: match.image,
            mutualMatch: Boolean(res.mutual_match),
          });
        }
        return;
      }

      Toast.show(res?.message ?? 'Failed to send interest', Toast.LONG);
    } catch (error) {
      Toast.show(getApiErrorMessage(error, 'Failed to send interest'), Toast.LONG);
    } finally {
      setLikingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
          filters={visibleQuickFilters}
          selectedIds={selectedFilterIds}
          onToggle={id => {
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
            likingId={likingId}
            onLikeMatch={handleLikeMatch}
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
