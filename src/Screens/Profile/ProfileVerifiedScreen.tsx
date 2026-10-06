import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthBackground from '../../Components/AuthBackground';
import AuthFooterHint from '../../Components/AuthFooterHint';
import AuthSoftGlow from '../../Components/AuthSoftGlow';
import PrimaryButton from '../../Components/PrimaryButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { Api, isApiSuccess, isPhoneVerifiedPayload, saveProfileCache } from '../../API';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ProfileVerified'
>;

const SPARKLE_POSITIONS = [
  { top: hp('1%'), left: wp('8%') },
  { top: hp('3%'), right: wp('10%') },
  { top: hp('8%'), left: wp('18%') },
  { top: hp('6%'), right: wp('20%') },
];

const ProfileVerifiedScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const syncVerifiedStatus = async () => {
        try {
          const statusRes = await Api.getVerifyPhoneStatus();
          if (
            !cancelled &&
            isApiSuccess(statusRes?.status, statusRes?.data?.success) &&
            isPhoneVerifiedPayload(statusRes?.data)
          ) {
            saveProfileCache(statusRes.data);
          }
        } catch {
        }

        try {
          const profileRes = await Api.getProfile();
          if (!cancelled && profileRes?.status == 200) {
            saveProfileCache(profileRes.data);
          }
        } catch {
        }
      };

      syncVerifiedStatus();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleReturn = () => {
    navigation.popToTop();
  };

  return (
    <AuthBackground variant="white">
      <AuthSoftGlow />
      <View style={styles.root}>
        <View style={styles.centerArea}>
          <View style={styles.illustrationWrap}>
            <LinearGradient
              colors={['rgba(255, 205, 217, 0.55)', 'rgba(255, 255, 255, 0)']}
              style={styles.glowRing}
            />

            {SPARKLE_POSITIONS.map((pos, index) => (
              <Icon
                key={index}
                name="star-four-points"
                size={fs(10)}
                color={Colors.goldLight}
                style={[styles.sparkle, pos]}
              />
            ))}

            <View style={styles.successCore}>
              <View style={styles.checkRing}>
                <Icon name="check" size={fs(34)} color={Colors.white} />
              </View>
            </View>
          </View>

          <View style={styles.starDivider}>
            <View style={styles.dividerLine} />
            <Icon
              name="heart"
              size={fs(10)}
              color={Colors.primaryDark}
              style={styles.starIcon}
            />
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.tagline}>{Strings.tagline}</Text>

          <Text style={styles.title}>{Strings.numberVerifiedTitle}</Text>
          <Text style={styles.subtitle}>{Strings.numberVerifiedSubtitle}</Text>
        </View>

        <View
          style={[
            styles.bottomSection,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <PrimaryButton
            title={Strings.returnToSettings}
            onPress={handleReturn}
            style={styles.button}
          />
          <AuthFooterHint
            text={Strings.verificationTrustHint}
            style={styles.footerHint}
          />
        </View>
      </View>
    </AuthBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: hp('1%'),
  },
  illustrationWrap: {
    width: wp('44%'),
    height: wp('44%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.6%'),
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: wp('20%'),
  },
  sparkle: {
    position: 'absolute',
    opacity: 0.9,
  },
  successCore: {
    width: wp('26%'),
    height: wp('26%'),
    borderRadius: wp('13%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: hp('0.8%') },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  checkRing: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    borderWidth: 2.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.7%'),
    width: wp('42%'),
  },
  dividerLine: {
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
  title: {
    fontSize: FontSizes.h2,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    marginBottom: hp('1.2%'),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: hp('2.6%'),
    textAlign: 'center',
    paddingHorizontal: wp('2%'),
    maxWidth: AuthStyles.maxContentWidth,
  },
  bottomSection: {
    width: '100%',
    paddingTop: hp('1.5%'),
    flexShrink: 0,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: AuthStyles.shadowOffsetY },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  footerHint: {
    marginTop: hp('1.6%'),
  },
});

export default ProfileVerifiedScreen;
