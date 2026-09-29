import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import KeyboardScrollView from '../../Components/KeyboardScrollView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import AuthBackground from '../../Components/AuthBackground';
import AuthIconBadge from '../../Components/AuthIconBadge';
import AuthInput from '../../Components/AuthInput';
import BackButton from '../../Components/BackButton';
import PrimaryButton from '../../Components/PrimaryButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { authService, isApiSuccess, isOtpCooldownError, pickOtpCooldownSeconds } from '../../API';
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

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Toast.show('Please enter your email address');
    } else {
      setLoading(true);

      try {

        const res = await authService.forgotPassword({
          email: email.trim(),
        });

        if (isApiSuccess(res?.status, res?.success) || isOtpCooldownError(res)) {
          Toast.show(
            isApiSuccess(res?.status, res?.success)
              ? res?.message || 'Reset code sent to your email'
              : 'Reset code sent to your email',
            Toast.LONG,
          );
          navigation.navigate('CheckEmail', {
            email: email.trim(),
            resendAfterSeconds: pickOtpCooldownSeconds(res),
          });
        } else {
          Toast.show(res?.message || 'Failed to send reset code. Please try again.');
        }
      } catch (error: any) {
        if (isOtpCooldownError(error)) {
          Toast.show('Reset code sent to your email', Toast.LONG);
          navigation.navigate('CheckEmail', {
            email: email.trim(),
            resendAfterSeconds: pickOtpCooldownSeconds(error),
          });
          return;
        }

        Toast.show(
          error?.response?.data?.message ||
            'Failed to send reset code. Please try again.',
        );
      } finally {
        setLoading(false);
      }
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

            <AuthIconBadge iconName="lock-outline" />

            <Text style={styles.title}>{Strings.forgotPasswordTitle}</Text>
            <Text style={styles.subtitle}>
              {Strings.forgotPasswordSubtitle}
            </Text>

            <AuthInput
              label={Strings.emailLabel}
              iconName="email-outline"
              placeholder={Strings.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.hintRow}>
              <Icon
                name="shield-check-outline"
                size={FontSizes.bodyLarge}
                color={Colors.gold}
                style={styles.hintIcon}
              />
              <Text style={styles.hintText}>{Strings.secureOtpHint}</Text>
            </View>

            <View style={styles.flexSpacer} />

            <View style={styles.bottomSection}>
              <PrimaryButton
                title={Strings.sendResetCode}
                onPress={handleSendCode}
                loading={loading}
                showArrow
              />

              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLoginText}>
                  {Strings.backToLogIn}
                </Text>
              </TouchableOpacity>
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
    textAlign: 'left',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: hp('3.5%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.5%'),
    textAlign: 'left',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: wp('1%'),
  },
  hintIcon: {
    marginRight: wp('1.5%'),
  },
  hintText: {
    flex: 1,
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    lineHeight: hp('2.1%'),
  },
  flexSpacer: {
    flex: 1,
    minHeight: hp('2%'),
  },
  bottomSection: {
    width: '100%',
    paddingBottom: AuthStyles.bottomSectionPadding,
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: AuthStyles.bottomLinkTop,
  },
  backToLoginText: {
    fontSize: FontSizes.bodyLarge,
    color: Colors.gold,
    fontFamily: Fonts.semiBold,
  },
});

export default ForgotPasswordScreen;
