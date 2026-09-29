import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import { Images } from '../../Assets';
import {
  Api,
  getApiErrorMessage,
  getImageCacheKey,
  hydrateMatchImages,
  mapHomeGreeting,
  mapHomeMatches,
  type ApiErrorResponse,
  type FeaturedMatch,
  type SuggestedMatch,
} from '../../API';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { HomeStackParamList } from '../../Navigation/HomeStackNavigator';
import { navigateToSubscription } from '../../Functions/subscriptionNavigation';
import { navigateToProfileScreen } from '../../Functions/profileNavigation';
import {
  buildWelcomeGreeting,
  greetingHasEmail,
} from '../../Functions/welcomeGreeting';
import { fs, hp, wp } from '../../Functions/responsive';
import {
  useAppDispatch,
  useAppSelector,
  clearHomeMatches,
  removeFeaturedMatch,
  dismissFeaturedMatch,
  selectFeaturedMatches,
  selectHomeGreeting,
  selectHomeSubtitle,
  selectIsAccountInactive,
  selectProfile,
  selectSuggestedMatches,
  selectUser,
  setAccountStatus,
  setHomeMatches,
} from '../../Redux';

type HomeNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'HomeMain'
>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = wp('5.5%');
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const FEATURED_CARD_HEIGHT = Math.max(hp('48%'), CARD_WIDTH * 1.18);

const INACTIVE_INFO_ITEMS = [
  {
    icon: 'eye-off-outline',
    text: Strings.inactiveHiddenFromOthers,
  },
  {
    icon: 'heart-off-outline',
    text: Strings.inactiveMatchesPaused,
  },
  {
    icon: 'shield-check-outline',
    text: Strings.inactiveDataSafe,
  },
] as const;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectProfile);
  const isAccountInactive = useAppSelector(selectIsAccountInactive);
  const greeting = useAppSelector(selectHomeGreeting);
  const subtitle = useAppSelector(selectHomeSubtitle);
  const featuredMatches = useAppSelector(selectFeaturedMatches);
  const suggestedMatches = useAppSelector(selectSuggestedMatches);
  const displayFeatured = featuredMatches;
  const displaySuggested = suggestedMatches;
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showAllSuggested, setShowAllSuggested] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<FlatList<FeaturedMatch>>(null);
  const fetchingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const welcomeGreeting = buildWelcomeGreeting(profile?.name, user?.name);
  const displayGreeting =
    greeting && !greetingHasEmail(greeting) ? greeting : welcomeGreeting;
  const displaySubtitle = subtitle || Strings.homeSubtitle;

  const fetchHomeMatches = useCallback(async () => {
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    if (isAccountInactive) {
      dispatch(clearHomeMatches());
      hasLoadedRef.current = true;
      fetchingRef.current = false;
      setLoading(false);
      return;
    }

    const fallbackGreeting = buildWelcomeGreeting(profile?.name, user?.name);

    const applyHomePayload = (
      featured: FeaturedMatch[],
      suggested: SuggestedMatch[],
      greetingText?: string,
      subtitleText?: string,
      totalMatches = featured.length + suggested.length,
    ) => {
      const homePayload = {
        greeting: greetingText || fallbackGreeting,
        subtitle: subtitleText || Strings.homeSubtitle,
        featuredMatches: featured,
        suggestedMatches: suggested,
        totalMatches,
      };
      dispatch(setHomeMatches(homePayload));
      setActiveIndex(0);
      return homePayload;
    };

    try {
      const res = await Api.getHomeMatches();
      const isSuccess =
        res?.status == 200 ||
        res?.status == 201 ||
        res?.data?.success === true ||
        res?.data?.success == 200;

      if (!isSuccess) {
        applyHomePayload([], []);
        return;
      }

      const mapped = mapHomeMatches(res?.data);
      const greetingParts = mapHomeGreeting(mapped.greeting);
      const title =
        greetingParts.title && !greetingHasEmail(greetingParts.title)
          ? greetingParts.title
          : fallbackGreeting;
      const homePayload = applyHomePayload(
        mapped.featuredMatches,
        mapped.suggestedMatches,
        title,
        greetingParts.subtitle || Strings.homeSubtitle,
        mapped.totalMatches,
      );

      try {
        const [hydratedFeatured, hydratedSuggested] = await Promise.all([
          hydrateMatchImages(mapped.featuredMatches),
          hydrateMatchImages(mapped.suggestedMatches),
        ]);

        dispatch(
          setHomeMatches({
            ...homePayload,
            featuredMatches: hydratedFeatured,
            suggestedMatches: hydratedSuggested,
          }),
        );
      } catch (hydrateError) {
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const status = axiosError?.response?.status;
      const message = `${axiosError?.response?.data?.message ?? ''}`.toLowerCase();

      applyHomePayload([], []);

      const isEmptyResult =
        status === 404 ||
        message.includes('no match') ||
        message.includes('not found');

      if (!isEmptyResult) {
        Toast.show(
          getApiErrorMessage(error, 'Failed to load matches'),
          Toast.LONG,
        );
      }
    } finally {
      hasLoadedRef.current = true;
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [dispatch, isAccountInactive, profile?.name, user?.name]);

  const handleReactivate = async () => {
    if (reactivating) {
      return;
    } else {
      setReactivating(true);

      try {

        const res = await Api.updateAccountStatus('activate');

        if (res?.isSuccess || res?.status == 200 || res?.success == 200) {
          dispatch(setAccountStatus(res?.accountStatus ?? 'active'));
          Toast.show(res?.message || 'Account activated', Toast.LONG);
          fetchHomeMatches();
        } else {
          Toast.show(res?.message || 'Failed to activate account', Toast.LONG);
        }
      } catch (error: any) {
        Toast.show(
          error?.response?.data?.message || 'Failed to activate account',
          Toast.LONG,
        );
      } finally {
        setReactivating(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomeMatches();
    }, [fetchHomeMatches]),
  );

  useEffect(() => {
    if (!displayFeatured.length) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex >= displayFeatured.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, displayFeatured.length]);

  const goToIndex = useCallback(
    (index: number) => {
      if (!displayFeatured.length) {
        return;
      }

      const nextIndex =
        ((index % displayFeatured.length) + displayFeatured.length) %
        displayFeatured.length;

      setActiveIndex(nextIndex);

      try {
        sliderRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      } catch (error) {
      }
    },
    [displayFeatured.length],
  );

  const handleDislike = () => {
    const current = displayFeatured[activeIndex];
    if (!current) {
      return;
    }

    dispatch(dismissFeaturedMatch(current.id));
  };

  const handleLike = async () => {
    const current = displayFeatured[activeIndex];

    if (!current || liking) {
      return;
    } else {
      setLiking(true);

      try {

        const res = await Api.sendShortlistInterest(current.id);

        if (res?.status == 200) {
          dispatch(removeFeaturedMatch(current.id));
          navigation.navigate('MatchSuccess', {
            name: current.name.split(' ')[0],
            fullName: current.name,
            matchId: current.id,
            matchImage: current.image,
            mutualMatch: Boolean(res.mutual_match),
          });
        } else {
          Toast.show(res?.message ?? 'Failed to send interest', Toast.LONG);
          goToIndex(activeIndex + 1);
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        Toast.show(
          getApiErrorMessage(error, 'Failed to send interest'),
          Toast.LONG,
        );
        goToIndex(activeIndex + 1);
      } finally {
        setLiking(false);
      }
    }
  };

  const onFeaturedScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!displayFeatured.length) {
      return;
    }

    const rawIndex = Math.round(
      event.nativeEvent.contentOffset.x / CARD_WIDTH,
    );
    const nextIndex =
      ((rawIndex % displayFeatured.length) + displayFeatured.length) %
      displayFeatured.length;
    setActiveIndex(nextIndex);
  };

  const onFeaturedScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (displayFeatured.length < 2) {
      return;
    }

    const velocityX = event.nativeEvent.velocity?.x ?? 0;
    const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);

    if (index >= displayFeatured.length - 1 && velocityX < -0.25) {
      goToIndex(0);
      return;
    }

    if (index <= 0 && velocityX > 0.25) {
      goToIndex(displayFeatured.length - 1);
    }
  };

  const openProfileDetail = useCallback(
    (match: FeaturedMatch | SuggestedMatch) => {
      navigation.navigate('ProfileDetail', {
        profileId: match.id,
        name: match.name,
        age: match.age,
        location: match.location,
        image: match.pictureHidden ? Images.hiddenProfile : match.image,
        isVerified: match.isVerified,
        pictureHidden: Boolean(match.pictureHidden),
      });
    },
    [navigation],
  );

  const renderSuggestedCard = (match: SuggestedMatch) => (
    <TouchableOpacity
      key={match.id}
      style={styles.suggestedCard}
      activeOpacity={0.9}
      onPress={() => openProfileDetail(match)}
    >
      <View style={styles.suggestedImageWrap}>
        <Image
          key={getImageCacheKey(match.image, match.id)}
          source={match.image}
          style={styles.suggestedImage}
          resizeMode="cover"
        />

        <View style={styles.suggestedBadgeColumn}>
          <View style={styles.suggestedTierBadge}>
            <Icon
              name={match.tier === 'VIP' ? 'star' : 'crown'}
              size={fs(10)}
              color={Colors.white}
            />
            <Text style={styles.suggestedTierText}>{match.tier}</Text>
          </View>
        </View>

        {match.isVerified ? (
          <View style={styles.suggestedVerifiedRow}>
            <Image
              source={Images.verifiedIcon}
              style={styles.suggestedVerifiedIcon}
              resizeMode="contain"
            />
            <Text style={styles.suggestedVerifiedText}>
              {Strings.verifiedBadge}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.suggestedBody}>
        <Text style={styles.suggestedName}>
          {match.name}, {match.age}
        </Text>
        <View style={styles.suggestedLocationRow}>
          <Icon
            name="map-marker-outline"
            size={fs(11)}
            color={Colors.textLight}
          />
          <Text style={styles.suggestedLocation}>{match.location}</Text>
        </View>
        <View style={styles.suggestedBottomRow}>
          <View style={styles.professionTag}>
            <Text style={styles.professionText}>{match.profession}</Text>
          </View>
          <TouchableOpacity
            style={styles.suggestedLikeBtn}
            activeOpacity={0.85}
          >
            <Icon
              name="heart-outline"
              size={fs(16)}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedCard = ({ item }: { item: FeaturedMatch }) => (
    <TouchableOpacity
      style={[styles.featuredCard, { width: CARD_WIDTH }]}
      activeOpacity={0.92}
      onPress={() => openProfileDetail(item)}
    >
      <Image
        key={getImageCacheKey(item.image, item.id)}
        source={item.image}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
        style={styles.featuredGradient}
      />

      <View style={styles.featuredBadges}>
        {item.isNew ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{Strings.newBadge}</Text>
          </View>
        ) : (
          <View />
        )}
        {item.isVerified ? (
          <View style={styles.suggestedVerifiedRow}>
            <Image
              source={Images.verifiedIcon}
              style={styles.suggestedVerifiedIcon}
              resizeMode="contain"
            />
            <Text style={styles.suggestedVerifiedText}>
              {Strings.verifiedBadge}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName}>
          {item.name} {item.age}
        </Text>
        <View style={styles.locationRow}>
          <Icon name="map-marker" size={fs(13)} color={Colors.white} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <View style={styles.tagRow}>
          {item.tags.map(tag => (
            <View key={tag.label} style={styles.tagChip}>
              <Icon name={tag.icon} size={fs(11)} color={Colors.white} />
              <Text style={styles.tagText}>{tag.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderInactiveState = () => (
    <View style={styles.inactiveSection}>
      <LinearGradient
        colors={['#FFE5EC', '#FFF8FA', Colors.white]}
        style={styles.inactiveCard}
      >
        <View style={styles.inactiveHero}>
          <View style={styles.inactiveIconOuter}>
            <View style={styles.inactiveIconInner}>
              <Icon name="pause" size={fs(28)} color={Colors.white} />
            </View>
          </View>

          <Text style={styles.inactiveBadge}>{Strings.accountDeactivatedSubtitle}</Text>
          <Text style={styles.inactiveTitle}>
            {Strings.accountDeactivatedTitle}
          </Text>
          <Text style={styles.inactiveDesc}>
            {Strings.accountDeactivatedDesc}
          </Text>
        </View>

        <View style={styles.inactiveInfoBox}>
          {INACTIVE_INFO_ITEMS.map(item => (
            <View key={item.text} style={styles.inactiveInfoRow}>
              <View style={styles.inactiveInfoIconWrap}>
                <Icon name={item.icon} size={fs(16)} color={Colors.primary} />
              </View>
              <Text style={styles.inactiveInfoText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.inactiveTip}>
          <Icon name="information-outline" size={fs(16)} color={Colors.gold} />
          <Text style={styles.inactiveTipText}>
            {Strings.inactiveReactivateHint}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.reactivateBtn}
          activeOpacity={0.88}
          onPress={handleReactivate}
          disabled={reactivating}
        >
          {reactivating ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Icon name="play-circle-outline" size={fs(20)} color={Colors.white} />
              <Text style={styles.reactivateBtnText}>
                {Strings.reactivateAccount}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerLogoWrap}>
            <Image
              source={Images.appLogo}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.headerTitle} pointerEvents="none">
            {Strings.appName}
          </Text>

          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.8}
            onPress={() => navigateToProfileScreen(navigation, 'Notifications')}
          >
            <Icon name="bell-outline" size={fs(20)} color={Colors.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : isAccountInactive ? (
          renderInactiveState()
        ) : (
          <>
        <Text style={styles.greeting}>{displayGreeting}</Text>
        <Text style={styles.subtitle}>{displaySubtitle}</Text>

        <TouchableOpacity
          style={styles.premiumBanner}
          activeOpacity={0.88}
          onPress={() => navigateToSubscription(navigation, 'ChooseYourPlan')}
        >
          <View style={styles.premiumBannerLeft}>
            <View style={styles.premiumIconWrap}>
              <Icon name="crown" size={fs(20)} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.premiumBannerTitle}>
                {Strings.premiumBannerTitle}
              </Text>
              <Text style={styles.premiumBannerSubtitle}>
                {Strings.premiumBannerSubtitle}
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={fs(22)} color={Colors.primary} />
        </TouchableOpacity>

        {displayFeatured.length > 0 ? (
          <>
        <FlatList
          ref={sliderRef}
          data={displayFeatured}
          renderItem={renderFeaturedCard}
          keyExtractor={item => item.id}
          extraData={activeIndex}
          horizontal
          pagingEnabled
          bounces={false}
          nestedScrollEnabled
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onFeaturedScrollEnd}
          onScrollEndDrag={onFeaturedScrollEndDrag}
          onScrollToIndexFailed={info => {
            const safeIndex = Math.max(
              0,
              Math.min(info.index, displayFeatured.length - 1),
            );
            setTimeout(() => {
              sliderRef.current?.scrollToOffset({
                offset: safeIndex * CARD_WIDTH,
                animated: false,
              });
            }, 80);
          }}
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH,
            offset: CARD_WIDTH * index,
            index,
          })}
          style={styles.featuredSlider}
          contentContainerStyle={{ height: FEATURED_CARD_HEIGHT }}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.dislikeBtn}
            activeOpacity={0.85}
            onPress={handleDislike}
          >
            <Icon name="close" size={fs(30)} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.likeBtn}
            activeOpacity={0.85}
            onPress={handleLike}
          >
            <Icon name="heart" size={fs(28)} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.pagination}>
          {displayFeatured.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex
                  ? styles.paginationDotActive
                  : styles.paginationDotInactive,
              ]}
            />
          ))}
        </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{Strings.suggestedMatches}</Text>
          {displaySuggested.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAllSuggested(prev => !prev)}
            >
              <Text style={styles.seeAll}>
                {showAllSuggested ? Strings.hide : `${Strings.seeAll} →`}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {displaySuggested.length > 0 ? (
          <View style={styles.suggestedGrid}>
            {(showAllSuggested ? displaySuggested : displaySuggested.slice(0, 2)).map(renderSuggestedCard)}
          </View>
        ) : (
          <Text style={styles.emptyText}>No suggested matches found</Text>
        )}
          </>
        )}

        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: wp('5.5%'),
    paddingTop: hp('0.5%'),
    paddingBottom: hp('1.5%'),
  },
  loaderWrap: {
    minHeight: hp('30%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    paddingVertical: hp('1%'),
  },
  inactiveSection: {
    marginTop: hp('1%'),
  },
  inactiveCard: {
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: '#F3DDE3',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    overflow: 'hidden',
  },
  inactiveHero: {
    alignItems: 'center',
    marginBottom: hp('2.2%'),
  },
  inactiveIconOuter: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('12%'),
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },
  inactiveIconInner: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBadge: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#F5E6B8',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.45%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1%'),
    overflow: 'hidden',
  },
  inactiveTitle: {
    fontSize: fs(22),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('0.8%'),
    letterSpacing: -0.3,
  },
  inactiveDesc: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2.4%'),
    paddingHorizontal: wp('2%'),
  },
  inactiveInfoBox: {
    backgroundColor: '#FFF5F7',
    borderWidth: 1,
    borderColor: '#F3DDE3',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('1.5%'),
    gap: hp('1%'),
  },
  inactiveInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  inactiveInfoIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.2%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveInfoText: {
    flex: 1,
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: hp('2%'),
  },
  inactiveTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2.5%'),
    backgroundColor: '#FEFCE8',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#F5E6B8',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.1%'),
    marginBottom: hp('2%'),
  },
  inactiveTipText: {
    flex: 1,
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: '#8A6D1D',
    lineHeight: hp('1.9%'),
  },
  reactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    backgroundColor: Colors.primary,
    borderRadius: wp('3.5%'),
    minHeight: hp('6%'),
    paddingHorizontal: wp('6%'),
  },
  reactivateBtnText: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
    minHeight: wp('12%'),
  },
  headerLogoWrap: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3.5%'),
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerLogo: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: fs(22),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  notificationBtn: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: Colors.notificationBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: hp('1.2%'),
    right: wp('2.8%'),
    width: wp('2.2%'),
    height: wp('2.2%'),
    borderRadius: wp('1.1%'),
    backgroundColor: Colors.gold,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  greeting: {
    fontSize: fs(20),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.4%'),
  },
  subtitle: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('1.5%'),
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.4%'),
    marginBottom: hp('2%'),
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    flex: 1,
  },
  premiumIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('3%'),
    backgroundColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBannerTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  premiumBannerSubtitle: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  featuredSlider: {
    width: CARD_WIDTH,
    height: FEATURED_CARD_HEIGHT,
  },
  featuredCard: {
    height: FEATURED_CARD_HEIGHT,
    borderRadius: wp('7%'),
    overflow: 'hidden',
    backgroundColor: Colors.gradientStart,
  },
  featuredImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFill,
  },
  featuredBadges: {
    position: 'absolute',
    top: hp('1.6%'),
    left: wp('3.2%'),
    right: wp('3.2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: wp('3.2%'),
    paddingVertical: hp('0.45%'),
    borderRadius: wp('3%'),
  },
  newBadgeText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  featuredInfo: {
    position: 'absolute',
    left: wp('4.5%'),
    right: wp('4.5%'),
    bottom: hp('2%'),
  },
  featuredName: {
    fontSize: fs(26),
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginBottom: hp('0.5%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    marginBottom: hp('1.2%'),
  },
  locationText: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.white,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: wp('1.5%'),
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    paddingHorizontal: wp('2.2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('3.5%'),
  },
  tagText: {
    fontSize: fs(10),
    fontFamily: Fonts.medium,
    color: Colors.white,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('10%'),
    marginTop: hp('2.2%'),
  },
  dislikeBtn: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  likeBtn: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.8%'),
    marginTop: hp('1.8%'),
    marginBottom: hp('2.5%'),
  },
  paginationDot: {
    borderRadius: wp('1%'),
  },
  paginationDotActive: {
    width: wp('6.5%'),
    height: hp('0.75%'),
    backgroundColor: Colors.primary,
    borderRadius: wp('1.5%'),
  },
  paginationDotInactive: {
    width: wp('1.8%'),
    height: wp('1.8%'),
    borderRadius: wp('0.9%'),
    backgroundColor: Colors.gradientStart,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  seeAll: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  suggestedList: {
    gap: wp('3%'),
    paddingRight: wp('2%'),
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
  },
  suggestedCard: {
    width: wp('43%'),
    backgroundColor: Colors.white,
    borderRadius: wp('4.5%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  suggestedImageWrap: {
    width: '100%',
    height: hp('15.5%'),
    position: 'relative',
    backgroundColor: Colors.gradientStart,
  },
  suggestedImage: {
    width: '100%',
    height: '100%',
  },
  suggestedTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    backgroundColor: Colors.gold,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2.5%'),
  },
  suggestedTierText: {
    fontSize: fs(9),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  suggestedBody: {
    paddingHorizontal: wp('3%'),
    paddingTop: hp('1%'),
    paddingBottom: hp('1.1%'),
  },
  suggestedName: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  suggestedBadgeColumn: {
    position: 'absolute',
    top: hp('0.8%'),
    right: wp('2%'),
    alignItems: 'flex-end',
    gap: hp('0.35%'),
  },
  suggestedVerifiedRow: {
    position: 'absolute',
    left: wp('2%'),
    bottom: hp('0.8%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: Colors.white,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.35%'),
    borderRadius: wp('5.5%'),
  },
  suggestedVerifiedIcon: {
    width: fs(11),
    height: fs(11),
    tintColor: Colors.gold,
  },
  suggestedVerifiedText: {
    fontSize: fs(10),
    fontFamily: Fonts.medium,
    color: Colors.black,
  },
  suggestedLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.5%'),
    marginBottom: hp('0.9%'),
  },
  suggestedLocation: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  suggestedBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  professionTag: {
    backgroundColor: Colors.suggestedTagBg,
    paddingHorizontal: wp('2.8%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('3%'),
    maxWidth: '68%',
  },
  professionText: {
    fontSize: fs(10),
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  suggestedLikeBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: hp('0.5%'),
  },
});

export default HomeScreen;
