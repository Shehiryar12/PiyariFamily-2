import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { Images } from '../../Assets';
import ScreenHeader from '../../Components/ScreenHeader';
import {
  Api,
  extractShortlistProfiles,
  getApiErrorMessage,
  getImageCacheKey,
  hydrateMatchImages,
  isApiSuccess,
  mapShortlistProfiles,
  pickShortlistTotal,
  type ShortlistTab,
  type ShortlistedProfile,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { LikeStackParamList } from '../../Navigation/LikeStackNavigator';
import { fs, hp, wp } from '../../Functions/responsive';
import { navigateToHomeTab, useTabRootBackToHome } from '../../Functions/tabNavigation';
import {
  selectShortlistLiked,
  selectShortlistLikedMe,
  setShortlistData,
  useAppDispatch,
  useAppSelector,
} from '../../Redux';

type TabKey = 'liked' | 'likedMe';
type NavigationProp = NativeStackNavigationProp<
  LikeStackParamList,
  'Shortlisted'
>;

const AVATAR_SIZE = wp('27%');

const ShortlistedScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  useTabRootBackToHome(navigation);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabKey>('liked');
  const cachedLiked = useAppSelector(selectShortlistLiked);
  const cachedLikedMe = useAppSelector(selectShortlistLikedMe);
  const bucket = activeTab === 'liked' ? cachedLiked : cachedLikedMe;
  const [loading, setLoading] = useState(
    bucket.profiles.length === 0 && bucket.total === 0,
  );

  const profiles = bucket.profiles;
  const total = bucket.total;
  const hasCacheRef = useRef(
    cachedLiked.profiles.length > 0 || cachedLikedMe.profiles.length > 0,
  );
  hasCacheRef.current =
    cachedLiked.profiles.length > 0 || cachedLikedMe.profiles.length > 0;

  const loadShortlistTab = useCallback(async (tab: ShortlistTab) => {
    try {
      const res = await Api.getShortlist(tab);
      const body = res?.data;
      const ok = isApiSuccess(res?.status, body?.success);

      if (!ok) {
        dispatch(
          setShortlistData({
            tab,
            profiles: [],
            total: 0,
          }),
        );
        Toast.show(
          body?.message ?? 'Failed to load shortlisted profiles',
          Toast.LONG,
        );
        return;
      }

      const rawProfiles = extractShortlistProfiles(body, tab);
      const mapped = await hydrateMatchImages(mapShortlistProfiles(rawProfiles));

      dispatch(
        setShortlistData({
          tab,
          profiles: mapped,
          total: pickShortlistTotal(body, mapped.length),
        }),
      );
    } catch (error) {
      dispatch(
        setShortlistData({
          tab,
          profiles: [],
          total: 0,
        }),
      );
      Toast.show(
        getApiErrorMessage(error, 'Failed to load shortlisted profiles'),
        Toast.LONG,
      );
    }
  }, [dispatch]);

  const fetchShortlist = useCallback(async () => {
    if (!hasCacheRef.current) {
      setLoading(true);
    }

    try {
      await Promise.all([
        loadShortlistTab('liked_me'),
        loadShortlistTab('i_liked'),
      ]);
    } catch (error) {
      if (!hasCacheRef.current) {
        Toast.show(
          getApiErrorMessage(error, 'Failed to load shortlisted profiles'),
          Toast.LONG,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [loadShortlistTab]);

  useFocusEffect(
    useCallback(() => {
      fetchShortlist();
    }, [fetchShortlist]),
  );

  const renderProfile = ({ item }: { item: ShortlistedProfile }) => (
    <View style={styles.card}>
      <Image
        key={getImageCacheKey(item.image, item.id)}
        source={item.image}
        style={styles.avatar}
        resizeMode="cover"
      />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}, {item.age}
            </Text>
            <Icon name="heart" size={fs(20)} color={Colors.primary} />
          </View>

          <View style={styles.locationRow}>
            <Icon name="map-marker" size={fs(12)} color={Colors.textLight} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <View style={styles.tagColumn}>
            <View style={styles.infoTag}>
              <Icon
                name="school-outline"
                size={fs(11)}
                color={Colors.primary}
              />
              <Text style={styles.infoTagText}>{item.education}</Text>
            </View>
            <View style={styles.infoTag}>
              <Icon
                name="briefcase-outline"
                size={fs(11)}
                color={Colors.primary}
              />
              <Text style={styles.infoTagText}>{item.profession}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.isVerified ? (
            <View style={styles.verifiedTag}>
              <Image
                source={Images.verifiedIcon}
                style={styles.verifiedIcon}
                resizeMode="contain"
              />
              <Text style={styles.verifiedText}>{Strings.verifiedLabel}</Text>
              <Icon name="check" size={fs(10)} color={Colors.gold} />
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity
            style={styles.viewProfileBtn}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('ProfileDetail', {
                profileId: item.id,
                name: item.name,
                age: item.age,
                location: item.location,
                image: item.pictureHidden ? undefined : item.image,
                isVerified: item.isVerified,
                pictureHidden: Boolean(item.pictureHidden),
              })
            }
          >
            <Text style={styles.viewProfileText}>{Strings.viewProfile}</Text>
            <Icon name="arrow-right" size={fs(15)} color={Colors.gold} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={Strings.shortlisted}
        onBack={() => navigateToHomeTab(navigation)}
        rightElement={
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FilterMatches')}
          >
            <Image
              source={Images.filterIcon}
              style={styles.filterIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        }
      />

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
          activeOpacity={0.85}
          onPress={() => setActiveTab('liked')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'liked' && styles.tabTextActive,
            ]}
          >
            {cachedLiked.total
              ? `${Strings.profilesILiked} (${cachedLiked.total})`
              : Strings.profilesILiked}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'likedMe' && styles.tabActive]}
          activeOpacity={0.85}
          onPress={() => setActiveTab('likedMe')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'likedMe' && styles.tabTextActive,
            ]}
          >
            {cachedLikedMe.total
              ? `${Strings.likedMe} (${cachedLikedMe.total})`
              : Strings.likedMe}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.profileCount}>
        {Strings.showingProfiles.replace('{count}', String(total))}
      </Text>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={item => item.id}
          renderItem={renderProfile}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={[
            styles.listContent,
            profiles.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No shortlisted profiles found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: wp('10.7%'),
    height: wp('10.7%'),
    borderRadius: wp('5.35%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    width: fs(18),
    height: fs(18),
    tintColor: Colors.primary,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: AuthStyles.horizontalPadding,
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    padding: wp('1%'),
    marginBottom: hp('1.2%'),
  },
  tab: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  profileCount: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginHorizontal: AuthStyles.horizontalPadding,
    marginBottom: hp('1.5%'),
  },
  listContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('2%'),
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: wp('4.5%'),
    borderWidth: 1,
    borderColor: '#EEEEEE',
    padding: wp('3.5%'),
    marginBottom: hp('1.6%'),
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: wp('3.8%'),
  },
  cardBody: {
    flex: 1,
    marginLeft: wp('3%'),
    minHeight: AVATAR_SIZE,
    justifyContent: 'space-between',
  },
  cardTop: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('0.35%'),
    gap: wp('2%'),
  },
  cardName: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    marginBottom: hp('0.8%'),
  },
  locationText: {
    flex: 1,
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  tagColumn: {
    alignItems: 'flex-start',
    gap: hp('0.45%'),
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    backgroundColor: Colors.tabActiveBg,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('4%'),
  },
  infoTagText: {
    fontSize: fs(10),
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: hp('0.9%'),
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: '#FFF9E6',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.45%'),
    borderRadius: wp('4%'),
  },
  verifiedIcon: {
    width: fs(11),
    height: fs(11),
    tintColor: Colors.gold,
  },
  verifiedText: {
    fontSize: fs(10),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.6%'),
  },
  viewProfileText: {
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
});

export default ShortlistedScreen;
