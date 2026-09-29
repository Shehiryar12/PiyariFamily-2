import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import KeyboardScrollView from '../../Components/KeyboardScrollView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import AuthBackground from '../../Components/AuthBackground';
import AuthFooterHint from '../../Components/AuthFooterHint';
import AuthIconBadge from '../../Components/AuthIconBadge';
import BackButton from '../../Components/BackButton';
import OtpCodeInput from '../../Components/OtpCodeInput';
import PrimaryButton from '../../Components/PrimaryButton';
import ResendCodeSection, {
  RESEND_COOLDOWN_SECONDS,
} from '../../Components/ResendCodeSection';
import {
  Api,
  getApiErrorMessage,
  isOtpCooldownError,
  type ApiErrorResponse,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { hp, wp, fs } from '../../Functions/responsive';

type RouteProps = RouteProp<ProfileStackParamList, 'VerifyProfileCode'>;
type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'VerifyProfileCode'
>;

const VerifyProfileCodeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCycle, setResendCycle] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Toast.show('Please enter the 6-digit code');
      return;
    }
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const res = await Api.verifyPhone({
        phone: route.params.phone,
        otp: code,
      });

      if (res?.status == 200) {
        Toast.show(res?.message ?? 'Phone verified successfully', Toast.LONG);
        navigation.navigate('ProfileVerified', { phone: route.params.phone });
      } else {
        Toast.show(res?.message ?? 'Invalid verification code', Toast.LONG);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      Toast.show(getApiErrorMessage(axiosError), Toast.LONG);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) {
      return;
    }

    setResending(true);

    try {
      const res = await Api.sendVerifyPhone({ phone: route.params.phone });

      if (res?.status == 200) {
        Toast.show(res?.message ?? 'Verification code resent');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setResendCycle(cycle => cycle + 1);
      } else if (isOtpCooldownError(res)) {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setResendCycle(cycle => cycle + 1);
      } else {
        Toast.show(res?.message ?? 'Failed to resend code', Toast.LONG);
      }
    } catch (error) {
      if (isOtpCooldownError(error)) {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        setResendCycle(cycle => cycle + 1);
        return;
      }

      const axiosError = error as AxiosError<ApiErrorResponse>;
      Toast.show(getApiErrorMessage(axiosError), Toast.LONG);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthBackground variant="white">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          <KeyboardScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scroll}
          >
            <BackButton variant="pink" onPress={() => navigation.goBack()} />

            <AuthIconBadge iconName="shield-check-outline" />

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

            <Text style={styles.title}>{Strings.enterVerificationCode}</Text>
            <Text style={styles.subtitle}>
              {Strings.verifyProfileCodeSubtitle}
            </Text>

            <OtpCodeInput value={code} onChangeText={setCode} />

            <ResendCodeSection
              key={resendCycle}
              cooldownSeconds={resendCooldown}
              loading={resending}
              onResend={handleResend}
            />

            <View style={styles.flexSpacer} />

            <View style={styles.bottomSection}>
              <PrimaryButton
                title={Strings.verifyNumber}
                onPress={handleVerify}
                loading={loading}
                showArrow
              />
              <AuthFooterHint
                text={Strings.verificationTrustHint}
                style={styles.footerHint}
              />
            </View>
          </KeyboardScrollView>
        </View>
      </TouchableWithoutFeedback>
    </AuthBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1%'),
  },
  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
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
    marginBottom: hp('2%'),
  },
  title: {
    fontSize: FontSizes.h2,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    marginBottom: hp('1%'),
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: hp('3.5%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.5%'),
    textAlign: 'left',
    // paddingHorizontal: wp( '2%'),
  },
  flexSpacer: {
    flex: 1,
    minHeight: hp('2%'),
  },
  bottomSection: {
    width: '100%',
    paddingBottom: AuthStyles.bottomSectionPadding,
  },
  footerHint: {
    marginTop: AuthStyles.footerHintTop,
  },
});

export default VerifyProfileCodeScreen;
