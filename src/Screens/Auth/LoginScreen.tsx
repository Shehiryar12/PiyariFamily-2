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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import AuthBackground from '../../Components/AuthBackground';
import AuthFooter from '../../Components/AuthFooter';
import AuthHeader from '../../Components/AuthHeader';
import AuthInput from '../../Components/AuthInput';
import DividerOr from '../../Components/DividerOr';
import PrimaryButton from '../../Components/PrimaryButton';
import SocialButton from '../../Components/SocialButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import {
  authService,
  getApiErrorMessage,
  isApiSuccess,
  pickAuthToken,
} from '../../API';
import { finishAuthNavigation } from '../../Functions/authNavigation';
import { pickDisplayFirstName } from '../../Functions/welcomeGreeting';
import { hp, wp } from '../../Functions/responsive';
import {
  useAppSelector,
  selectLastAccountName,
  selectProfile,
  selectUser,
} from '../../Redux';

type Props = {
  navigation: {
    navigate: (screen: string) => void;
    replace: (
      screen: string,
      params?: {
        email?: string;
        autoSend?: boolean;
        password?: string;
      },
    ) => void;
    reset: (state: {
      index: number;
      routes: Array<{ name: string; params?: object; state?: object }>;
    }) => void;
  };
};

const isLoginSuccess = (
  response?: {
    status?: number;
    success?: boolean | number;
  } | null,
) =>
  Boolean(
    response &&
      isApiSuccess(response.status, response.success) &&
      pickAuthToken(response),
  );

const LoginScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const lastAccountName = useAppSelector(selectLastAccountName);
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectProfile);
  const welcomeName = pickDisplayFirstName(
    lastAccountName,
    profile?.name,
    user?.name,
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });

      if (isLoginSuccess(response)) {
        Toast.show(response.message || 'Logged in successfully', Toast.LONG);
        await finishAuthNavigation(navigation);
        return;
      }

      Toast.show(response.message || 'Login failed. Please try again.');
    } catch (error) {
      const errorData = (error as any)?.response?.data;

      if (isLoginSuccess(errorData)) {
        Toast.show(errorData?.message || 'Logged in successfully', Toast.LONG);
        await finishAuthNavigation(navigation);
        return;
      }

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
            <AuthHeader />

            <View style={styles.formSection}>
              <Text style={styles.title}>
                {Strings.welcomeBack}
                {welcomeName ? `, ${welcomeName} !` : ' !'}
              </Text>
              <Text style={styles.subtitle} >
                {Strings.loginSubtitle}
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

              <AuthInput
                label={Strings.passwordLabel}
                iconName="lock-outline"
                placeholder={Strings.passwordPlaceholder}
                value={password}
                onChangeText={setPassword}
                showToggle
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.forgotBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>{Strings.forgotPassword}</Text>
              </TouchableOpacity>

              <PrimaryButton
                title={Strings.logIn}
                onPress={handleLogin}
                loading={loading}
              />

              <DividerOr />

              <SocialButton
                provider="google"
                title={Strings.continueGoogle}
                onPress={() => Toast.show('Google login coming soon')}
              />
              <SocialButton
                provider="apple"
                title={Strings.continueApple}
                onPress={() => Toast.show('Apple login coming soon')}
                style={styles.lastSocialButton}
              />
            </View>

            <AuthFooter
              prefix={Strings.noAccount}
              linkText={Strings.createAccount}
              onPress={() => navigation.navigate('SignUp')}
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
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  formSection: {
    width: '100%',
  },
  title: {
    fontSize: FontSizes.h1,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    marginBottom: hp('0.75%'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: hp('2%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.5%'),

  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: hp('-0.75%'),
    marginBottom: hp('2.5%'),
  },
  forgotText: {
    fontSize: FontSizes.body,
    color: Colors.gold,
    fontFamily: Fonts.medium,
  },
  lastSocialButton: {
    marginBottom: hp('0.5%'),
  },
  footer: {
    marginTop: wp('1%'),
    marginBottom: hp('2%'),
  },
  bottomSpacer: {
    height: hp('3%'),
  },
});

export default LoginScreen;
