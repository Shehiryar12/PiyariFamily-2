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
import Toast from 'react-native-simple-toast';
import AuthBackground from '../../Components/AuthBackground';
import AuthIconBadge from '../../Components/AuthIconBadge';
import AuthInput from '../../Components/AuthInput';
import BackButton from '../../Components/BackButton';
import PasswordRequirements from '../../Components/PasswordRequirements';
import PasswordStrengthMeter from '../../Components/PasswordStrengthMeter';
import PrimaryButton from '../../Components/PrimaryButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { authService, getApiErrorMessage } from '../../API';
import { clearSession } from '../../Redux';
import { AuthStackParamList } from '../../Navigation/AuthNavigator';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SetNewPassword'
>;

type SetNewPasswordRoute = RouteProp<AuthStackParamList, 'SetNewPassword'>;

const isPasswordValid = (password: string) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const SetNewPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SetNewPasswordRoute>();
  const email = route.params.email;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Toast.show('Please fill in all fields');
      return;
    }
    if (!isPasswordValid(password)) {
      Toast.show('Please meet all password requirements');
      return;
    }
    if (password !== confirmPassword) {
      Toast.show('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.setNewPassword({
        email,
        password,
      });

      if (response?.status == 200) {
        clearSession();
        Toast.show(response.message || 'Password updated successfully');
        navigation.replace('PasswordResetSuccess');
        return;
      }

      Toast.show(response.message || 'Failed to reset password. Please try again.');
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
            contentContainerStyle={styles.scroll}
          >
            <BackButton variant="pink" onPress={() => navigation.goBack()} />

            <AuthIconBadge iconName="hand-heart" iconSize={fs(32)} />

            <Text style={styles.title}>{Strings.setNewPasswordTitle}</Text>
            <Text style={styles.subtitle}>
              {Strings.setNewPasswordSubtitle}
            </Text>

            <AuthInput
              label={Strings.newPasswordLabel}
              iconName="lock-outline"
              placeholder={Strings.newPasswordPlaceholder}
              value={password}
              onChangeText={setPassword}
              showToggle
              secureTextEntry
            />

            <AuthInput
              label={Strings.confirmNewPasswordLabel}
              iconName="shield-check-outline"
              placeholder={Strings.confirmNewPasswordPlaceholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              showToggle
              secureTextEntry
            />

            <PasswordStrengthMeter password={password} />
            <PasswordRequirements password={password} />

            <View style={styles.flexSpacer} />

            <View style={styles.bottomSection}>
              <PrimaryButton
                title={Strings.resetPassword}
                onPress={handleReset}
                loading={loading}
                showArrow
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
    marginBottom: hp('3%'),
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
});

export default SetNewPasswordScreen;
