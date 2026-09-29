import React, { useEffect, useRef, useState } from 'react';
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
  resolveOtpResendResult,
} from '../../API';
import { AuthStackParamList } from '../../Navigation/AuthNavigator';
import { navigateAfterLogin } from '../../Functions/authNavigation';
import { hp, wp } from '../../Functions/responsive';
import { setAuthSession, store, clearProfile } from '../../Redux';
import { pickPersonName } from '../../Functions/welcomeGreeting';

type Props = {
  navigation: {
    goBack: () => void;
    replace: (
      screen: string,
      params?: {
        email?: string;
      },
    ) => void;
    reset: (state: { index: number; routes: Array<{ name: string }> }) => void;
  };
};

type VerifyEmailRoute = RouteProp<AuthStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen = ({ navigation }: Props) => {
  const route = useRoute<VerifyEmailRoute>();
  const email = (route.params.email || '').trim();
  const autoSend = Boolean(route.params.autoSend);
  const signupPassword = route.params.password || '';
  const signupName = route.params.name?.trim() || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendCycle, setResendCycle] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const autoSendStarted = useRef(false);

  const goToNextScreen = async (token?: string | null) => {
    let nextToken = token || store.getState().auth.accessToken;
    const isNewAccount = Boolean(signupPassword || signupName);

    if (!nextToken && signupPassword) {
      try {
        const loginResponse = await authService.login({
          email,
          password: signupPassword,
        });
        nextToken =
          loginResponse.token ||
          loginResponse.access_token ||
          loginResponse.data?.token ||
          store.getState().auth.accessToken;
      } catch (loginError) {
      }
    }

    if (isNewAccount) {
      store.dispatch(clearProfile());
    }

    const existingUser = store.getState().auth.user;
    const accountName =
      pickPersonName(signupName, existingUser?.name) || signupName;

    store.dispatch(
      setAuthSession({
        user: {
          id: existingUser?.id ?? 0,
          name: accountName,
          email: existingUser?.email || email,
          phone: existingUser?.phone || '',
          is_verified: true,
        },
        accessToken: nextToken || store.getState().auth.accessToken,
      }),
    );

    Toast.show('Email verified successfully');
    navigateAfterLogin(navigation, 'SelectCountry');
  };

  const applyResendResult = (source: unknown, showToast: boolean) => {
    const result = resolveOtpResendResult(source);

    if (result.sent) {
      setOtpExpired(false);
      setCode('');
      setResendCooldown(result.seconds || RESEND_COOLDOWN_SECONDS);
      setResendCycle(cycle => cycle + 1);

      if (showToast) {
        Toast.show(result.message, Toast.LONG);
      }

      return result;
    }

    if (result.cooldown) {
      setResendCooldown(result.seconds || RESEND_COOLDOWN_SECONDS);
      setResendCycle(cycle => cycle + 1);
    }

    return result;
  };

  const requestResend = async (force: boolean) => {
    try {
      return await authService.resendEmailOtp({
        email,
        resend: force,
      });
    } catch (error) {
      return error;
    }
  };

  const sendOtp = async (showToast = true, userRequested = false) => {
    if (resending) {
      return;
    }

    setResending(true);

    try {
      const source = await requestResend(userRequested);
      const result = applyResendResult(source, showToast);

      if (!result.sent && !result.cooldown && result.message) {
        Toast.show(result.message, Toast.LONG);
      }
    } catch (error) {
      Toast.show(getApiErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!autoSend || autoSendStarted.current) {
      return;
    }

    autoSendStarted.current = true;
    sendOtp(true);
    // Register already emails an OTP. Auto-send only for login → verify.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, email]);

  const handleVerify = async () => {
    const otp = code.replace(/\D/g, '');

    if (otp.length !== 6) {
      Toast.show('Please enter the 6-digit code');
      return;
    }

    if (otpExpired) {
      Toast.show('OTP expired. Please resend a new code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyEmailOtp({
        email,
        otp,
      });

      if (
        response?.status == 200 ||
        response?.success === true ||
        response?.success == 200
      ) {
        await goToNextScreen(
          response.token ||
            response.access_token ||
            store.getState().auth.accessToken,
        );
        return;
      }

      Toast.show(response.message || 'Verification failed. Please try again.');
    } catch (error) {
      Toast.show(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    sendOtp(true, true);
  };

  return (
    <AuthBackground variant="white">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          <KeyboardScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scroll}
          >
            <BackButton variant="gray" onPress={() => navigation.goBack()} />

            <AuthIconBadge iconName="email-check-outline" />

            <Text style={styles.title}>{Strings.verifyYourEmail}</Text>
            <Text style={styles.subtitle}>{Strings.verifyEmailSubtitle}</Text>

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
                title={Strings.verifyAndContinue}
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

export default VerifyEmailScreen;
