import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AuthBackground from '../../Components/AuthBackground';
import AuthWelcomeGlow from '../../Components/AuthWelcomeGlow';
import PrimaryButton from '../../Components/PrimaryButton';
import { Images } from '../../Assets';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { AuthStackParamList } from '../../Navigation/AuthNavigator';
import { fs, hp, wp } from '../../Functions/responsive';
import {
  clearAuth,
  clearHomeMatches,
  clearProfile,
  clearReferral,
  clearShortlist,
  useAppDispatch,
} from '../../Redux';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'WelcomeBack'
>;

const WelcomeBackScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <AuthBackground>
      <AuthWelcomeGlow />
      <View style={styles.root}>
        <View style={styles.centerArea}>
          <View style={styles.brandSection}>
            <LinearGradient
              colors={[Colors.goldLight, Colors.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.logoBadge}
            >
              <Image
                source={Images.handshakeIcon}
                style={styles.handshakeIcon}
                resizeMode="contain"
              />
            </LinearGradient>

            <Text style={styles.appName}>{Strings.appName}</Text>

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
          </View>

          <Text style={styles.title}>{Strings.welcomeBackTitle}</Text>
          <Text style={styles.subtitle}>{Strings.welcomeBackSubtitle}</Text>

          <View style={styles.successBox}>
            <Image
              source={Images.resetSuccessCheck}
              style={styles.successIcon}
              resizeMode="contain"
            />
            <Text style={styles.successText}>
              {Strings.passwordResetSuccessMessage}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <PrimaryButton
            title={Strings.logInNow}
            onPress={handleLogin}
            showArrow
            style={styles.button}
          />

          <TouchableOpacity activeOpacity={0.7} style={styles.supportBtn}>
            <Text style={styles.supportText}>
              {Strings.needHelpContactSupport}
            </Text>
          </TouchableOpacity>

          <View style={styles.footerDivider}>
            <View style={styles.footerLine} />
            <Icon name="heart" size={fs(10)} color={Colors.gold} />
            <View style={styles.footerLine} />
          </View>
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
    paddingBottom: hp('2%'),
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: hp('3.5%'),
  },
  logoBadge: {
    width: AuthStyles.logoSize,
    height: AuthStyles.logoSize,
    borderRadius: AuthStyles.logoRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: AuthStyles.shadowOffsetY },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  handshakeIcon: {
    width: wp('10.1%'),
    height: wp('10.1%'),
  },
  appName: {
    fontSize: FontSizes.h3,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    letterSpacing: 0.2,
    marginBottom: hp('0.25%'),
  },
  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
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
  },
  title: {
    fontSize: FontSizes.h1,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    marginBottom: hp('1.5%'),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: hp('2.75%'),
    textAlign: 'center',
    paddingHorizontal: wp('2%'),
    marginBottom: hp('3%'),
    maxWidth: AuthStyles.maxContentWidth,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    borderRadius: AuthStyles.successBoxRadius,
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    width: '100%',
  },
  successIcon: {
    width: wp('9.6%'),
    height: wp('9.6%'),
    marginRight: wp('3%'),
  },
  successText: {
    flex: 1,
    fontSize: FontSizes.bodyLarge,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    lineHeight: hp('2.5%'),
  },
  bottomSection: {
    width: '100%',
    paddingBottom: AuthStyles.bottomSectionPadding,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: AuthStyles.shadowOffsetY },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  supportBtn: {
    alignItems: 'center',
    marginTop: hp('2.25%'),
  },
  supportText: {
    fontSize: FontSizes.body,
    color: Colors.gold,
    fontFamily: Fonts.semiBold,
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('2.25%'),
    width: wp('42%'),
    alignSelf: 'center',
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.6,
    marginHorizontal: wp('2%'),
  },
});

export default WelcomeBackScreen;
