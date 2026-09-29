import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import KeyboardScrollView from '../../Components/KeyboardScrollView';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import ScreenHeader from '../../Components/ScreenHeader';
import PasswordRequirements from '../../Components/PasswordRequirements';
import PasswordStrengthMeter from '../../Components/PasswordStrengthMeter';
import PrimaryButton from '../../Components/PrimaryButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import {
  authService,
  ENDPOINTS,
} from '../../API';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ChangePassword'
>;

const isPasswordValid = (password: string) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  icon: string;
  value: string;
  onChangeText: (text: string) => void;
};

const PasswordField = ({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
}: PasswordFieldProps) => {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Icon name={icon} size={fs(20)} color={Colors.primary} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setHidden(prev => !prev)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={fs(20)}
            color={Colors.textLight}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChangePasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show('Please fill in all fields');
    } else if (newPassword !== confirmPassword) {
      Toast.show('Passwords do not match');
    } else if (currentPassword === newPassword) {
      Toast.show('New password must be different from current password');
    } else if (!isPasswordValid(newPassword)) {
      Toast.show('Please meet all password requirements');
    } else {
      setLoading(true);

      try {

        const res = await authService.changePassword({
          current_password: currentPassword,
          password: newPassword,
        });

        if (res?.status == 200) {
          Toast.show(res?.message || Strings.passwordUpdated, Toast.LONG);
          navigation.goBack();
        } else {
          Toast.show(res?.message || 'Failed to update password', Toast.LONG);
        }
      } catch (error: any) {
        Toast.show(
          error?.response?.data?.message || 'Failed to update password',
          Toast.LONG,
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#FFE5EC', '#FFF8FA', Colors.background]}
        style={styles.topGlow}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <ScreenHeader
            title={Strings.changePassword}
            onBack={() => navigation.goBack()}
            style={styles.screenHeader}
          />

          <KeyboardScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: getFooterBottomPadding(insets.bottom) },
            ]}
          >
            <View style={styles.iconBadge}>
              <LinearGradient
                colors={[Colors.goldLight, Colors.gold]}
                style={styles.iconGradient}
              >
                <Icon name="key-variant" size={fs(28)} color={Colors.white} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>{Strings.updateYourPassword}</Text>
            <Text style={styles.subtitle}>
              {Strings.changePasswordSubtitle}
            </Text>

            <PasswordField
              label={Strings.currentPasswordLabel}
              placeholder={Strings.currentPasswordPlaceholder}
              icon="lock-outline"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <PasswordField
              label={Strings.newPasswordLabel}
              placeholder={Strings.newPasswordPlaceholder}
              icon="shield-check-outline"
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <PasswordStrengthMeter password={newPassword} />
            <PasswordRequirements password={newPassword} />

            <PasswordField
              label={Strings.confirmNewPasswordLabel}
              placeholder={Strings.confirmNewPasswordPlaceholder}
              icon="shield-check-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.securityNote}>
              <Icon
                name="shield-check-outline"
                size={fs(18)}
                color={Colors.primary}
              />
              <Text style={styles.securityNoteText}>
                {Strings.passwordSecurityNote}
              </Text>
            </View>

            <PrimaryButton
              title={Strings.updatePassword}
              onPress={handleUpdate}
              loading={loading}
              showArrow
            />

            <TouchableOpacity
              style={styles.forgotWrap}
              activeOpacity={0.85}
              onPress={() => Toast.show('Password reset link sent')}
            >
              <Text style={styles.forgotText}>
                {Strings.forgotYourPassword}
              </Text>
            </TouchableOpacity>
          </KeyboardScrollView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('18%'),
  },
  screenHeader: {
    marginBottom: hp('1%'),
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('0.5%'),
  },
  iconBadge: {
    alignSelf: 'center',
    marginBottom: hp('1.8%'),
    marginTop: hp('0.5%'),
  },
  iconGradient: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('4.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('0.6%'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: hp('2.4%'),
    marginBottom: hp('2.5%'),
    paddingHorizontal: wp('2%'),
  },
  fieldWrap: {
    marginBottom: hp('1.4%'),
  },
  fieldLabel: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: Colors.textLight,
    marginBottom: hp('0.6%'),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1,
    borderColor: '#F0D0D8',
    borderRadius: wp('3.2%'),
    paddingHorizontal: wp('3.5%'),
    height: AuthStyles.inputHeight,
    gap: wp('2.5%'),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.label,
    paddingVertical: 0,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2.5%'),
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1,
    borderColor: '#F0D0D8',
    borderRadius: wp('3%'),
    padding: wp('3.5%'),
    marginBottom: hp('2%'),
    marginTop: hp('0.5%'),
  },
  securityNoteText: {
    flex: 1,
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: Colors.primary,
    lineHeight: hp('2%'),
  },
  forgotWrap: {
    alignItems: 'center',
    marginTop: hp('1.5%'),
  },
  forgotText: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.gold,
  },
});

export default ChangePasswordScreen;
