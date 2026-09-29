import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import KeyboardScrollView from '../../Components/KeyboardScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { Images } from '../../Assets';
import AuthBackground from '../../Components/AuthBackground';
import AuthFooter from '../../Components/AuthFooter';
import AuthInput from '../../Components/AuthInput';
import BackButton from '../../Components/BackButton';
import PrimaryButton from '../../Components/PrimaryButton';
import TermsCheckbox from '../../Components/TermsCheckbox';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import {
  authService,
  getApiErrorMessage,
  isApiSuccess,
} from '../../API';
import { hp, wp } from '../../Functions/responsive';

type Props = {
  navigation: {
    goBack: () => void;
    canGoBack?: () => boolean;
    replace: (
      screen: string,
      params?: {
        email?: string;
        autoSend?: boolean;
        password?: string;
        name?: string;
        resendAfterSeconds?: number;
      },
    ) => void;
    navigate: (
      screen: string,
      params?: {
        email: string;
        autoSend?: boolean;
        password?: string;
        name?: string;
        resendAfterSeconds?: number;
      },
    ) => void;
  };
};

const SignUpScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.replace('Login');
  };

  const handleSignUp = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      Toast.show('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Toast.show('Passwords do not match');
      return;
    }
    if (!agreed) {
      Toast.show('Please agree to Terms & Privacy Policy');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        name: fullName.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        password,
        password_confirmation: confirmPassword,
      });

      if (
        isApiSuccess(response.status, response.success) &&
        response.success !== false
      ) {
        Toast.show(response.message || 'Account created successfully', Toast.LONG);
        navigation.replace('VerifyEmail', {
          email: email.trim(),
          password,
          name: fullName.trim(),
        });
        return;
      }

      Toast.show(response.message || 'Registration failed. Please try again.');
    } catch (error) {
      Toast.show(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.root}>
          <KeyboardScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Math.max(insets.bottom + hp('2%'), hp('4%')) },
            ]}
          >
            <BackButton onPress={handleBack} />

            <View style={styles.formSection}>
              <Text style={styles.title}>{Strings.createYourAccount}</Text>
              <Text style={styles.subtitle}>{Strings.signUpSubtitle}</Text>

              <AuthInput
                label={Strings.fullNameLabel}
                iconName="account-outline"
                placeholder={Strings.fullNamePlaceholder}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              <AuthInput
                label={Strings.emailLabel}
                iconName="email-outline"
                placeholder={Strings.signUpEmailPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <AuthInput
                label={Strings.phoneNumberLabel}
                iconName="phone-outline"
                placeholder={Strings.phoneNumberPlaceholder}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />

              <AuthInput
                label={Strings.passwordLabel}
                iconName="lock-outline"
                placeholder={Strings.createPasswordPlaceholder}
                value={password}
                onChangeText={setPassword}
                showToggle
                secureTextEntry
              />

              <AuthInput
                label={Strings.confirmPasswordLabel}
                iconSource={Images.confirmPasswordIcon}
                placeholder={Strings.confirmPasswordPlaceholder}
                value={confirmPassword}
                showToggle
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TermsCheckbox checked={agreed} onToggle={setAgreed} />

              <PrimaryButton
                title={Strings.createAccount}
                onPress={handleSignUp}
                loading={loading}
                style={styles.submitButton}
              />
            </View>

            <AuthFooter
              prefix={Strings.alreadyHaveAccount}
              linkText={Strings.logInLink}
              onPress={() => navigation.navigate('Login')}
              style={styles.footer}
            />

            <View style={styles.bottomSpacer} />
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
  formSection: {
    width: '100%',
  },
  title: {
    fontSize: FontSizes.h2,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    marginBottom: wp('0.75%'),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    textAlign: 'center',
    color: Colors.gold,
    marginBottom: wp('3%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.5%'),
  },
  submitButton: {
    marginTop: hp('0.5%'),
  },
  footer: {
    marginTop: wp('2.5%'),
    marginBottom: hp('1%'),
  },
  bottomSpacer: {
    height: hp('3%'),
  },
});

export default SignUpScreen;
