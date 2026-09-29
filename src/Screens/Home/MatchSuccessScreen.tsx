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
import { Images } from '../../Assets';
import {
  Api,
  mapBestMatch,
  hydrateMatchImages,
  pickImageUrl,
  toRemoteImageSource,
  type BestMatchData,
} from '../../API';
import { FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { HomeStackParamList } from '../../Navigation/HomeStackNavigator';
import { fs, hp, wp } from '../../Functions/responsive';
import { navigateToChat } from '../../Functions/matchNavigation';
import {
  selectProfile,
  selectProfilePhoto,
  selectSuggestedMatches,
  selectUser,
  useAppSelector,
} from '../../Redux';
type RouteProps = RouteProp<HomeStackParamList, 'MatchSuccess'>;
type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'MatchSuccess'
>;

const MatchSuccessScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { name, fullName, matchImage, matchId, mutualMatch = false } =
    route.params;
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectProfile);
  const profilePhoto = useAppSelector(selectProfilePhoto);
  const suggestedMatches = useAppSelector(selectSuggestedMatches);
  const fallbackUserAvatar = profilePhoto
    ? toRemoteImageSource(profilePhoto)
    : user?.gender === 'female'
      ? Images.femaleProfile
      : Images.maleProfile;
  const [userAvatar, setUserAvatar] = useState(fallbackUserAvatar);
  const [displayMatchImage, setDisplayMatchImage] = useState(matchImage);
  const [bestMatch, setBestMatch] = useState<BestMatchData | null>(null);
  const [loadingBestMatch, setLoadingBestMatch] = useState(true);

  const fetchBestMatch = useCallback(async () => {
    setLoadingBestMatch(true);

    try {

      const res = await Api.getBestMatch();
      if (res?.status == 200) {

        const mapped = mapBestMatch(res?.data);
        if (mapped) {
          const [hydrated] = await hydrateMatchImages([mapped]);
          setBestMatch(hydrated);
        } else {
          setBestMatch(null);
        }
      } else {

        setBestMatch(null);
      }
    } catch (error) {
      setBestMatch(null);
    } finally {
      setLoadingBestMatch(false);
    }
  }, []);

  const hydrateSuccessPhotos = useCallback(async () => {
    const userUrl = pickImageUrl(profile) || profilePhoto;
    if (userUrl) {
      setUserAvatar(toRemoteImageSource(userUrl));
    }
    if (!matchId) {
      return;
    }
    try {
      const res = await Api.getMatchProfile(matchId);
      const photo = pickImageUrl(res?.data);
      if (photo) {
        setDisplayMatchImage(toRemoteImageSource(photo));
      }
    } catch {
      // Keep fallback match photo from route params.
    }
  }, [matchId, profile, profilePhoto]);
  useFocusEffect(
    useCallback(() => {

      hydrateSuccessPhotos();
      fetchBestMatch();
    }, [fetchBestMatch, hydrateSuccessPhotos]),
  );
  const fallbackBestMatch =
    bestMatch ??
    (suggestedMatches[0]
      ? {
          id: suggestedMatches[0].id,
          name: suggestedMatches[0].name,
          age: suggestedMatches[0].age,
          location: suggestedMatches[0].location,
          matchScore: 0,
          image: suggestedMatches[0].image,
        }
      : null);
  const matchSubtitle = Strings.matchSubtitle.replace('{name}', name);
  const interestNotice = Strings.interestSentNotice.replace('{name}', fullName);

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.background]}
      locations={[0, 0.48, 0]}
      style={styles.root}
    >
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + hp('2%'),
            paddingBottom: insets.bottom + hp('2%'),
          },
        ]}
      >
        <Text style={styles.title}>{Strings.itsAMatch}</Text>
        {mutualMatch ? (
          <Text style={styles.subtitle}>{matchSubtitle}</Text>
        ) : null}

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarRing, styles.avatarRingLeft]}>
              <Image
                source={userAvatar}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <View style={styles.heartBadge}>
              <Icon name="heart" size={fs(22)} color={Colors.white} />
            </View>
            <View style={[styles.avatarRing, styles.avatarRingRight]}>
              <Image
                source={displayMatchImage}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
          </View>

          <Icon
            name="star-four-points"
            size={fs(16)}
            color={Colors.gold}
            style={styles.sparkleLeft}
          />
          <Icon
            name="star-four-points"
            size={fs(14)}
            color={Colors.gold}
            style={styles.sparkleRight}
          />
          <Icon
            name="star-four-points"
            size={fs(12)}
            color={Colors.goldLight}
            style={styles.sparkleTop}
          />
        </View>

        <View style={styles.starDivider}>
          <View style={styles.starDividerLine} />
          <Icon
            name="heart"
            size={fs(10)}
            color={Colors.primaryDark}
            style={styles.starIcon}
          />
          <View style={styles.starDividerLine} />
        </View>

        <Text style={styles.tagline}>{Strings.tagline}</Text>

        <TouchableOpacity
          style={styles.messageBtn}
          activeOpacity={0.88}
          onPress={() =>
            navigateToChat(navigation, {
              chatId: matchId || name,
              name: fullName || name,
            })
          }
        >
          <Icon
            name="message-text-outline"
            size={fs(20)}
            color={Colors.white}
          />
          <Text style={styles.messageBtnText}>{Strings.sendAMessage}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.keepFindingBtn}
          activeOpacity={0.88}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.keepFindingText}>{Strings.keepFinding}</Text>
          <Icon name="arrow-right" size={fs(20)} color={Colors.primary} />
        </TouchableOpacity>

        {!mutualMatch ? (
          <View style={styles.noticeBox}>
            <Image
              source={Images.verifiedIcon}
              style={styles.noticeIcon}
              resizeMode="contain"
            />
            <Text style={styles.noticeText}>{interestNotice}</Text>
          </View>
        ) : null}

        <View style={styles.potentialHeader}>
          <Text style={styles.potentialTitle}>{Strings.potentialMatches}</Text>
          <Icon name="chevron-right" size={fs(20)} color={Colors.gold} />
        </View>

        {loadingBestMatch ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : fallbackBestMatch ? (
          <TouchableOpacity
            style={styles.potentialRow}
            activeOpacity={0.88}
            onPress={() =>
              navigation.navigate('ProfileDetail', {
                profileId: fallbackBestMatch.id,
                name: fallbackBestMatch.name,
                age: fallbackBestMatch.age,
                location: fallbackBestMatch.location,
                image: fallbackBestMatch.image,
              })
            }
          >
            <Image
              source={fallbackBestMatch.image}
              style={styles.potentialAvatar}
              resizeMode="cover"
            />
            <View style={styles.potentialInfo}>
              <Text style={styles.potentialName}>
                {fallbackBestMatch.name}
                {fallbackBestMatch.age ? `, ${fallbackBestMatch.age}` : ''}
              </Text>
              <Text style={styles.potentialScore}>
                {fallbackBestMatch.matchScore
                  ? `${fallbackBestMatch.matchScore}% ${Strings.bestMatchTitle}`
                  : Strings.bestMatchTitle}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.potentialEmpty}>No potential matches right now</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
  },
  title: {
    fontSize: fs(28),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.8%'),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fs(14),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: hp('3%'),
    lineHeight: hp('2.4%'),
  },
  avatarSection: {
    width: wp('70%'),
    height: hp('18%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2%'),
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: wp('28%'),
    height: wp('28%'),
    borderRadius: wp('14%'),
    borderWidth: 3,
    padding: 3,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  avatarRingLeft: {
    borderColor: Colors.primary,
    marginRight: -wp('6%'),
    zIndex: 1,
  },
  avatarRingRight: {
    borderColor: Colors.gradientStart,
    marginLeft: -wp('6%'),
    zIndex: 1,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: wp('12%'),
  },
  heartBadge: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  sparkleLeft: {
    position: 'absolute',
    left: wp('2%'),
    top: hp('2%'),
  },
  sparkleRight: {
    position: 'absolute',
    right: wp('2%'),
    bottom: hp('2%'),
  },
  sparkleTop: {
    position: 'absolute',
    right: wp('18%'),
    top: 0,
  },
  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
    marginBottom: hp('0.7%'),
    width: wp('42%'),
  },
  starDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.primaryDark,
    opacity: 0.75,
  },
  starIcon: {
    marginHorizontal: wp('2%'),
  },
  tagline: {
    fontSize: FontSizes.bodySmall,
    color: Colors.primaryDark,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginBottom: hp('2.5%'),
  },
  messageBtn: {
    width: '100%',
    height: hp('6.2%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  messageBtnText: {
    fontSize: fs(15),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  keepFindingBtn: {
    width: '100%',
    height: hp('6.2%'),
    borderRadius: wp('3%'),
    borderWidth: 1.2,
    borderColor: Colors.focusBorder,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    marginBottom: hp('2.5%'),
  },
  keepFindingText: {
    fontSize: fs(15),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  noticeBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    marginBottom: hp('3%'),
  },
  noticeIcon: {
    width: fs(18),
    height: fs(18),
    tintColor: Colors.primary,
    marginTop: hp('0.2%'),
  },
  noticeText: {
    flex: 1,
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: hp('2.2%'),
  },
  potentialHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.5%'),
  },
  potentialTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.gold,
    fontStyle: 'italic',
  },
  potentialRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    padding: wp('3%'),
  },
  potentialAvatar: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    borderWidth: 2,
    borderColor: Colors.gold,
    overflow: 'hidden',
    backgroundColor: Colors.inputBg,
  },
  potentialInfo: {
    flex: 1,
  },
  potentialName: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.3%'),
  },
  potentialScore: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  potentialEmpty: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
});

export default MatchSuccessScreen;
