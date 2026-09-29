import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import KeyboardScrollView from '../../Components/KeyboardScrollView';
import Toast from 'react-native-simple-toast';
import AuthBackground from '../../Components/AuthBackground';
import AuthFooterHint from '../../Components/AuthFooterHint';
import AuthIconBadge from '../../Components/AuthIconBadge';
import BackButton from '../../Components/BackButton';
import OtpCodeInput from '../../Components/OtpCodeInput';
import PrimaryButton from '../../Components/PrimaryButton';
import ResendCodeSection, {
  RESEND_COOLDOWN_SECONDS,
} from '../../Components/ResendCodeSection';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import {
  authService,
  getApiErrorMessage,
  isApiSuccess,
  resolveOtpResendResult,
} from '../../API';
import { AuthStackParamList } from '../../Navigation/AuthNavigator';
import { hp, wp } from '../../Functions/responsive';

type Props = {
  navigation: {
    goBack: () => void;
    navigate: (
      screen: string,
      params?: { email: string; resendAfterSeconds?: number },
    ) => void;
  };
};

type CheckEmailRoute = RouteProp<AuthStackParamList, 'CheckEmail'>;

const CheckEmailScreen = ({ navigation }: Props) => {
  const route = useRoute<CheckEmailRoute>();
  const email = route.params.email;
  const initialCooldown =
    route.params.resendAfterSeconds && route.params.resendAfterSeconds > 0
      ? Math.min(route.params.resendAfterSeconds, RESEND_COOLDOWN_SECONDS)
      : RESEND_COOLDOWN_SECONDS;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(initialCooldown);
  const [resendCycle, setResendCycle] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);

  const applyResendResult = (source: unknown) => {
    const result = resolveOtpResendResult(source);

    if (result.sent) {
      setOtpExpired(false);
      setCode('');
      setResendCooldown(result.seconds || RESEND_COOLDOWN_SECONDS);
      setResendCycle(cycle => cycle + 1);
      Toast.show(result.message, Toast.LONG);
      return result;
    }

    if (result.cooldown) {
      setResendCooldown(result.seconds || RESEND_COOLDOWN_SECONDS);
      setResendCycle(cycle => cycle + 1);
    }

    return result;
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Toast.show('Please enter the 6-digit code');
      return;
    }

    if (otpExpired) {
      Toast.show('OTP expired. Please resend a new code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyResetOtp({
        email,
        otp: code,
      });

      if (isApiSuccess(response.status, response.success)) {
        Toast.show(response.message || 'OTP verified successfully');
        navigation.navigate('CodeVerified', { email });
        return;
      }

      Toast.show(response.message || 'Verification failed. Please try again.');
    } catch (error) {
      Toast.show(getApiErrorMessage(error));
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
      const source = await authService.forgotResendOtp({ email });
      const result = applyResendResult(source);

      if (!result.sent && result.message) {
        Toast.show(result.message, Toast.LONG);
      }
    } catch (error) {
      const result = applyResendResult(error);

      if (!result.sent && result.message) {
        Toast.show(result.message, Toast.LONG);
      } else if (!result.sent) {
        Toast.show(getApiErrorMessage(error));
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          <KeyboardScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scroll}
          >
            <BackButton variant="pink" onPress={() => navigation.goBack()} />

            <AuthIconBadge iconName="lock-outline" />

            <Text style={styles.title}>{Strings.checkYourEmail}</Text>
            <Text style={styles.subtitle}>{Strings.checkEmailSubtitle}</Text>

            <OtpCodeInput value={code} onChangeText={setCode} />

            <ResendCodeSection
              key={resendCycle}
              cooldownSeconds={resendCooldown}
              loading={resending}
              onResend={handleResend}
              onCooldownEnd={() => {
                setOtpExpired(true);
                setCode('');
              }}
            />

            <View style={styles.flexSpacer} />

            <View style={styles.bottomSection}>
              <PrimaryButton
                title={Strings.verifyCode}
                onPress={handleVerify}
                loading={loading}
                showArrow
              />
              <AuthFooterHint
                text={Strings.spamFolderHint}
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
  title: {
    fontSize: FontSizes.h2,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    marginBottom: hp('1%'),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: hp('3.5%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.5%'),
    textAlign: 'center',
    paddingHorizontal: wp('2%'),
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

export default CheckEmailScreen;
