import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { Images } from '../../Assets';
import HiddenPhotoOverlay from '../../Components/HiddenPhotoOverlay';
import {
  Api,
  getApiErrorMessage,
  getImageCacheKey,
  isApiSuccess,
  mapMatchProfileDetail,
  resolvePhotoAccessRespond,
} from '../../API';
import { type ProfileDetail } from '../../Constant/MatchProfiles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { HomeStackParamList } from '../../Navigation/HomeStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { popStackOrGoHome } from '../../Functions/tabNavigation';
import { confirmPhotoAccessRequest } from '../../Functions/photoAccessRequest';
import { fs, hp, wp } from '../../Functions/responsive';
import {
  removeFeaturedMatch,
  removeShortlistedProfile,
  selectIsAccountInactive,
  useAppDispatch,
  useAppSelector,
} from '../../Redux';

type RouteProps = RouteProp<HomeStackParamList, 'ProfileDetail'>;
type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'ProfileDetail'
>;

const ProfileDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const dispatch = useAppDispatch();
  const isAccountInactive = useAppSelector(selectIsAccountInactive);
  const { profileId, name, age, location, image, isVerified, pictureHidden } =
    route.params;
  const preview = {
    name,
    age,
    location,
    image: pictureHidden ? Images.hiddenProfile : image,
    isVerified,
    pictureHidden: Boolean(pictureHidden),
  };
  const [profile, setProfile] = useState<ProfileDetail | null>(
    name ? mapMatchProfileDetail(null, profileId, preview) : null,
  );
  const [loading, setLoading] = useState(!name);
  const [requestingPhotos, setRequestingPhotos] = useState(false);
  const [photoRequestSent, setPhotoRequestSent] = useState(false);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!name) {
      setLoading(true);
    }

    try {
      const res = await Api.getMatchProfile(profileId);
      if (isApiSuccess(res?.status, res?.data?.success)) {
        const mapped = mapMatchProfileDetail(res?.data, profileId, preview);
        setProfile(mapped);
        setLiked(Boolean(mapped.isLiked));
      } else {
        if (!name) {
          setProfile(null);
        }
        Toast.show(res?.data?.message ?? 'Failed to load profile', Toast.LONG);
      }
    } catch (error) {
      if (!name) {
        setProfile(null);
      }
      Toast.show(getApiErrorMessage(error, 'Failed to load profile'), Toast.LONG);
    } finally {
      setLoading(false);
    }
  }, [profileId, name, age, location, image, isVerified, pictureHidden]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  if (loading) {
    return (
      <View style={styles.loaderRoot}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loaderRoot}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.85}
          onPress={() => popStackOrGoHome(navigation)}
        >
          <Icon name="chevron-left" size={fs(26)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.emptyText}>Profile not found</Text>
      </View>
    );
  }

  const pictureLocked = Boolean(pictureHidden || profile?.pictureHidden);
  const photosHidden = Boolean(
    pictureLocked || profile?.additionalPhotosHidden,
  );

  const handleSendPhotoRequest = async () => {
    if (isAccountInactive) {
      Toast.show(Strings.inactiveAdminHint, Toast.LONG);
      return;
    }

    if (!profile || requestingPhotos || photoRequestSent) {
      return;
    }

    setRequestingPhotos(true);

    try {
      const res = await Api.requestPhotoAccess(profileId);

      if (isApiSuccess(res?.status, res?.data?.success)) {
        const resolved = resolvePhotoAccessRespond(res?.data);
        setPhotoRequestSent(true);
        Toast.show(
          resolved.message || Strings.photoAccessRequested,
          Toast.LONG,
        );
      } else {
        Toast.show(
          res?.data?.message ?? Strings.photoAccessRequestError,
          Toast.LONG,
        );
      }
    } catch (error) {
      Toast.show(
        getApiErrorMessage(error, Strings.photoAccessRequestError),
        Toast.LONG,
      );
    } finally {
      setRequestingPhotos(false);
    }
  };

  const handleLike = async () => {
    if (!profile || liking) {
      return;
    }

    const wasLiked = liked;
    setLiking(true);

    try {
      const res = await Api.sendShortlistInterest(profile.id);

      if (res?.status == 200) {
        if (wasLiked) {
          setLiked(false);
          dispatch(removeShortlistedProfile(profile.id));
          Toast.show(Strings.profileUnliked, Toast.SHORT);
          return;
        }

        setLiked(true);
        Toast.show(Strings.profileLiked, Toast.SHORT);
        dispatch(removeFeaturedMatch(profile.id));
        navigation.navigate('MatchSuccess', {
          name: profile.fullName.split(' ')[0],
          fullName: profile.fullName,
          matchId: profile.id,
          matchImage: profile.image,
          mutualMatch: Boolean(res.mutual_match),
        });
        return;
      }

      Toast.show(res?.message ?? 'Failed to send interest', Toast.LONG);
    } catch (error) {
      Toast.show(getApiErrorMessage(error, 'Failed to send interest'), Toast.LONG);
    } finally {
      setLiking(false);
    }
  };

  const openPhotoGallery = () => {
    navigation.navigate('ViewProfileGallery', {
      userId: profile.id,
      name: profile.fullName,
      accessGranted:
        !profile.photosNeedAccess &&
        !profile.pictureHidden &&
        !profile.additionalPhotosHidden,
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: photosHidden
              ? hp('6%') +
                hp('1.5%') +
                getFooterBottomPadding(insets.bottom) +
                hp('2.5%')
              : hp('3%') + insets.bottom,
          },
        ]}
      >
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.heroPress}
            activeOpacity={0.92}
            onPress={
              pictureLocked
                ? () => confirmPhotoAccessRequest(profile.id)
                : openPhotoGallery
            }
          >
            <Image
              key={getImageCacheKey(profile.image, profile.id)}
              source={profile.image}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {pictureLocked ? <HiddenPhotoOverlay /> : null}
          </TouchableOpacity>

          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.75)']}
            locations={[0, 0.35, 1]}
            style={styles.heroGradient}
          />

          <View
            style={[styles.heroTopBar, { paddingTop: insets.top + hp('1%') }]}
          >
            <TouchableOpacity
              style={styles.heroIconBtn}
              activeOpacity={0.85}
              onPress={() => popStackOrGoHome(navigation)}
            >
              <Icon name="chevron-left" size={fs(26)} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroIconBtn}
              activeOpacity={0.85}
              disabled={liking}
              onPress={handleLike}
            >
              {liking ? (
                <ActivityIndicator
                  size="small"
                  color={liked ? Colors.redish : Colors.white}
                />
              ) : (
                <Icon
                  name={liked ? 'heart' : 'heart-outline'}
                  size={fs(22)}
                  color={liked ? Colors.redish : Colors.white}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>
              {profile.fullName}, {profile.age}
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroTierBadge}>
                <Icon
                  name={profile.tier === 'VIP' ? 'star' : 'crown'}
                  size={fs(10)}
                  color={Colors.white}
                />
                <Text style={styles.heroTierText}>{profile.tier}</Text>
              </View>

              {profile.isVerified ? (
                <View style={styles.verifiedRow}>
                  <Image
                    source={Images.verifiedIcon}
                    style={styles.verifiedIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.verifiedText}>
                    {Strings.verifiedBadge}
                  </Text>
                </View>
              ) : null}

              <View style={styles.locationRow}>
                <Icon name="map-marker" size={fs(13)} color={Colors.white} />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.quickInfoRow}>
          {profile.quickInfo.map(item => (
            <View key={item.subtitle} style={styles.quickInfoCard}>
              {item.iconSource ? (
                <Image
                  source={item.iconSource}
                  style={styles.quickInfoIconImage}
                  resizeMode="contain"
                />
              ) : (
                <Icon name={item.icon!} size={fs(18)} color={Colors.primary} />
              )}
              <Text style={styles.quickInfoTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.quickInfoSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {Strings.aboutPrefix} {profile.fullName}
          </Text>
          <Text style={styles.aboutText}>{profile.about}</Text>
        </View>

        <TouchableOpacity
          style={styles.galleryBtn}
          activeOpacity={0.88}
          onPress={openPhotoGallery}
        >
          <Icon name="image-multiple-outline" size={fs(18)} color={Colors.gold} />
          <Text style={styles.galleryBtnText}>{Strings.viewPhotos}</Text>
          <Icon name="chevron-right" size={fs(18)} color={Colors.gold} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.basicDetails}</Text>
          <View style={styles.detailsGrid}>
            {profile.basicDetails.map(detail => (
              <View key={detail.label} style={styles.detailCard}>
                {detail.iconSource ? (
                  <Image
                    source={detail.iconSource}
                    style={styles.detailIconImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Icon
                    name={detail.icon!}
                    size={fs(18)}
                    color={Colors.primary}
                  />
                )}
                <View style={styles.detailTextWrap}>
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {profile.languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{Strings.otherLanguages}</Text>
            <View style={styles.chipRow}>
              {profile.languages.map(lang => (
                <View key={lang} style={styles.chip}>
                  <Text style={styles.chipText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {profile.interests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{Strings.interests}</Text>
            <View style={styles.chipRow}>
              {profile.interests.map(interest => (
                <View key={interest} style={styles.chip}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {photosHidden ? (
      <View
        style={[
          styles.footer,
          { paddingBottom: getFooterBottomPadding(insets.bottom) },
        ]}
      >
        <TouchableOpacity
          style={styles.nextBtn}
          activeOpacity={0.85}
          onPress={() => popStackOrGoHome(navigation)}
        >
          <Icon name="close" size={fs(18)} color={Colors.primary} />
          <Text style={styles.nextBtnText}>{Strings.nextBtn}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.interestBtn,
            isAccountInactive && styles.interestBtnDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleSendPhotoRequest}
          disabled={requestingPhotos || photoRequestSent || isAccountInactive}
        >
          {requestingPhotos ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Icon
                name={photoRequestSent ? 'check' : 'lock-open-outline'}
                size={fs(18)}
                color={Colors.white}
              />
              <Text style={styles.interestBtnText}>
                {photoRequestSent
                  ? Strings.photoAccessRequestSent
                  : Strings.sendRequest}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF1F2',
  },
  loaderRoot: {
    flex: 1,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: hp('6%'),
    left: wp('4%'),
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('5.25%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fs(14),
    fontFamily: Fonts.medium,
    color: Colors.textLight,
  },
  scrollContent: {
    backgroundColor: '#FFF1F2',
  },
  hero: {
    width: '100%',
    height: hp('48%'),
    position: 'relative',
    backgroundColor: Colors.primary,
  },
  heroPress: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
  },
  heroIconBtn: {
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('5.25%'),
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    position: 'absolute',
    left: wp('4.5%'),
    right: wp('4.5%'),
    bottom: hp('2%'),
    zIndex: 2,
  },
  heroName: {
    fontSize: fs(24),
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginBottom: hp('0.6%'),
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp('2.5%'),
  },
  heroTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    backgroundColor: Colors.gold,
    paddingHorizontal: wp('2.2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2.5%'),
  },
  heroTierText: {
    fontSize: fs(9),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  verifiedIcon: {
    width: fs(14),
    height: fs(14),
    tintColor: Colors.gold,
  },
  verifiedText: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: Colors.white,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
  },
  locationText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.white,
  },
  quickInfoRow: {
    flexDirection: 'row',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
    gap: wp('2%'),
    backgroundColor: '#FFF1F2',
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('1.5%'),
    alignItems: 'center',
    borderWidth: wp('0.1%'),

    gap: hp('0.3%'),
  },
  quickInfoIconImage: {
    width: fs(18),
    height: fs(18),
  },
  quickInfoTitle: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  quickInfoSubtitle: {
    fontSize: fs(9),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('2.2%'),
    backgroundColor: '#FFF1F2',
  },
  sectionTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('1.2%'),
  },
  aboutText: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: hp('2.4%'),
  },
  galleryBtn: {
    marginHorizontal: wp('5%'),
    marginBottom: hp('2%'),
    height: hp('5.6%'),
    borderRadius: wp('3%'),
    borderWidth: 1.2,
    borderColor: Colors.gold,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.5%'),
    paddingHorizontal: wp('4%'),
  },
  galleryBtnText: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
  },
  detailCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    borderWidth: wp('0.1%'),
    paddingVertical: hp('1.4%'),
    paddingHorizontal: wp('3%'),
  },
  detailIconImage: {
    width: fs(18),
    height: fs(18),
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('0.2%'),
  },
  detailValue: {
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    paddingBottom: hp('0.6%'),
  },
  chip: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    backgroundColor: Colors.white,
  },
  chipText: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: wp('3%'),
    paddingHorizontal: wp('5%'),
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  nextBtn: {
    flex: 1,
    height: hp('6%'),
    borderRadius: wp('3%'),
    borderWidth: 1.2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  nextBtnText: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  interestBtn: {
    flex: 1.4,
    height: hp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  interestBtnDisabled: {
    opacity: 0.45,
  },
  interestBtnText: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});

export default ProfileDetailScreen;
