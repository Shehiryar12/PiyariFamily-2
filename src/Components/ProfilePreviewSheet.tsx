import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from '../Assets';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { ProfileDetail } from '../Constant/MatchProfiles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { Strings } from '../Constant/Strings';
import { getFooterBottomPadding } from '../Functions/safeArea';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  visible: boolean;
  profile: ProfileDetail;
  onClose: () => void;
  onViewFullProfile: () => void;
};

const PREVIEW_ABOUT =
  'A passionate traveler and avid reader who loves exploring new cultures. Family-oriented at heart and';

const ProfilePreviewSheet = ({
  visible,
  profile,
  onClose,
  onViewFullProfile,
}: Props) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const quickChips = profile.quickInfo.slice(0, 3);
  const previewInterests = profile.interests.slice(0, 3);
  const height =
    profile.basicDetails.find(item => item.label === 'Height')?.value ??
    '5 ft 4 inches';
  const motherTongue =
    profile.basicDetails.find(item => item.label === 'Mother Tongue')?.value ??
    'Urdu';

  const detailItems = [
    { icon: 'cake-variant-outline', label: 'Age', value: `${profile.age} yrs` },
    { icon: 'human-male-height', label: 'Height', value: height },
    { icon: 'account-group-outline', label: 'Community', value: 'Sunni' },
    { icon: 'earth', label: 'Mother Tongue', value: motherTongue },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      propagateSwipe
      scrollTo={offset => scrollViewRef.current?.scrollTo(offset)}
      scrollOffset={scrollOffset}
      scrollOffsetMax={hp('45%')}
      style={styles.modal}
      backdropOpacity={0.45}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{Strings.profilePreview}</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Icon name="close" size={fs(16)} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          bounces={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarRing}>
              <Image
                source={profile.image}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>

            <Text style={styles.name}>{profile.fullName}</Text>

            <View style={styles.metaRow}>
              <View style={styles.tierBadge}>
                <Icon
                  name={profile.tier === 'VIP' ? 'star' : 'crown'}
                  size={fs(10)}
                  color={Colors.white}
                />
                <Text style={styles.tierText}>{profile.tier}</Text>
              </View>

              {profile.isVerified ? (
                <View style={styles.verifiedBadge}>
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
                <Icon name="map-marker" size={fs(14)} color={Colors.gold} />
                <Text style={styles.locationText}>
                  {profile.location}, Pakistan
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.quickInfoRow}>
            {quickChips.map(item => (
              <View key={item.title} style={styles.quickInfoCard}>
                {item.iconSource ? (
                  <Image
                    source={item.iconSource}
                    style={styles.quickInfoIconImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Icon
                    name={item.icon ?? 'circle-outline'}
                    size={fs(20)}
                    color={Colors.primary}
                    style={styles.quickInfoIcon}
                  />
                )}
                <Text style={styles.quickInfoText}>{item.title}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{Strings.aboutPrefix}</Text>
          <Text style={styles.aboutText}>
            {PREVIEW_ABOUT}{' '}
            <Text style={styles.readMore}>{Strings.readMore} →</Text>
          </Text>

          <View style={styles.detailsGrid}>
            {detailItems.map(item => (
              <View key={item.label} style={styles.detailCard}>
                <Icon name={item.icon} size={fs(17)} color={Colors.primary} />
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{Strings.interests}</Text>
          <View style={styles.interestsRow}>
            {previewInterests.map(item => (
              <View key={item} style={styles.interestTag}>
                <Text style={styles.interestText}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={onViewFullProfile}
          >
            <Text style={styles.primaryBtnText}>{Strings.viewFullProfile}</Text>
            <Icon name="arrow-right" size={fs(18)} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.88}
            onPress={onClose}
          >
            <Text style={styles.secondaryBtnText}>{Strings.backToChat}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: wp('7%'),
    borderTopRightRadius: wp('7%'),
    maxHeight: hp('88%'),
  },
  handle: {
    alignSelf: 'center',
    width: wp('11%'),
    height: hp('0.45%'),
    borderRadius: wp('1%'),
    backgroundColor: '#F0D0D8',
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AuthStyles.horizontalPadding,
    marginBottom: hp('1%'),
  },
  sheetTitle: {
    fontSize: fs(18),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: wp('8.5%'),
    height: wp('8.5%'),
    borderRadius: wp('4.25%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('1%'),
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: hp('1.6%'),
  },
  avatarRing: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: wp('0.5%'),
    backgroundColor: Colors.white,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: wp('14.5%'),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: wp('2.5%'),
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    backgroundColor: Colors.gold,
    paddingHorizontal: wp('2.2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2.5%'),
  },
  tierText: {
    fontSize: fs(9),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: '#FFF3D0',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.35%'),
    borderRadius: wp('5.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  verifiedIcon: {
    width: fs(11),
    height: fs(11),
    tintColor: '#DD9314',
  },
  verifiedText: {
    fontSize: fs(9),
    fontFamily: Fonts.medium,
    color: '#DD9314',
  },
  name: {
    fontSize: fs(20),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.35%'),
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
  },
  locationText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: '#A08A7A',
  },
  quickInfoRow: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('1.6%'),
  },
  quickInfoCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('1.5%'),
    minHeight: hp('8%'),
  },
  quickInfoIconImage: {
    width: wp('5%'),
    height: wp('5%'),
    marginBottom: hp('0.5%'),
  },
  quickInfoIcon: {
    marginBottom: hp('0.5%'),
  },
  quickInfoText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.6%'),
  },
  aboutText: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: Colors.textLight,
    lineHeight: hp('2.1%'),
    marginBottom: hp('1.6%'),
  },
  readMore: {
    fontFamily: Fonts.semiBold,
    fontStyle: 'normal',
    color: Colors.gold,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: hp('1.6%'),
  },
  detailCard: {
    width: '48%',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('1%'),
  },
  detailLabel: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: hp('0.45%'),
    marginBottom: hp('0.15%'),
  },
  detailValue: {
    fontSize: fs(13),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('0.5%'),
  },
  interestTag: {
    borderWidth: 1,
    borderColor: '#E8D4A0',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.55%'),
    backgroundColor: Colors.white,
  },
  interestText: {
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  footer: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1%'),
    gap: hp('0.9%'),
    borderTopWidth: 1,
    borderTopColor: '#F3E8EB',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: wp('3.5%'),
    height: AuthStyles.buttonHeight,
    gap: wp('1.5%'),
  },
  primaryBtnText: {
    fontSize: FontSizes.button,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    height: AuthStyles.buttonHeight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    fontSize: FontSizes.button,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
});

export default ProfilePreviewSheet;
