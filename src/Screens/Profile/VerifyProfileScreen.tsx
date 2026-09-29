import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import KeyboardScrollView from '../../Components/KeyboardScrollView';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import AuthBackground from '../../Components/AuthBackground';
import AuthFooterHint from '../../Components/AuthFooterHint';
import AuthIconBadge from '../../Components/AuthIconBadge';
import AuthInput from '../../Components/AuthInput';
import BackButton from '../../Components/BackButton';
import PrimaryButton from '../../Components/PrimaryButton';
import {
  Api,
  ENDPOINTS,
  getApiErrorMessage,
  resolveProfileData,
  type ApiErrorResponse,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { hp, wp, fs } from '../../Functions/responsive';
import { useAppSelector, selectProfile, selectUser } from '../../Redux';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'VerifyProfile'
>;

const VerifyProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const cachedProfile = useAppSelector(selectProfile);
  const user = useAppSelector(selectUser);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);

  const fetchProfilePhone = useCallback(async () => {
    setPrefilling(true);

    try {
      const res = await Api.getProfile();

      if (res?.status == 200) {
        const profile = resolveProfileData(res?.data);
        const savedPhone =
          profile.phone ??
          cachedProfile?.phone ??
          user?.phone ??
          '';

        if (savedPhone) {
          setPhone(savedPhone);
        }

        if (profile.phone_verified) {
          navigation.replace('ProfileVerified', { phone: savedPhone });
        }
      } else {
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
    } finally {
      setPrefilling(false);
    }
  }, [cachedProfile?.phone, navigation, user?.phone]);

  useFocusEffect(
    useCallback(() => {
      fetchProfilePhone();
    }, [fetchProfilePhone]),
  );

  const handleSendCode = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Toast.show('Please enter your phone number');
      return;
    }
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const res = await Api.sendVerifyPhone({ phone: trimmed });

      if (res?.status == 200) {
        Toast.show(res?.message ?? 'Verification code sent', Toast.LONG);
        navigation.navigate('VerifyProfileCode', { phone: trimmed });
      } else {
        Toast.show(res?.message ?? 'Failed to send verification code', Toast.LONG);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      Toast.show(getApiErrorMessage(axiosError), Toast.LONG);
    } finally {
      setLoading(false);
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

            <Text style={styles.title}>{Strings.verifyYourProfile}</Text>
            <Text style={styles.subtitle}>
              {Strings.verifyProfilePhoneSubtitle}
            </Text>

            <AuthInput
              label={Strings.phoneNumberLabel}
              iconName="phone-outline"
              placeholder={Strings.phoneNumberPlaceholder}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.hintRow}>
              <Icon
                name="shield-check-outline"
                size={FontSizes.bodyLarge}
                color={Colors.gold}
                style={styles.hintIcon}
              />
              <Text style={styles.hintText}>{Strings.securePhoneOtpHint}</Text>
            </View>

            <View style={styles.flexSpacer} />

            <View style={styles.bottomSection}>
              <PrimaryButton
                title={Strings.sendVerificationCode}
                onPress={handleSendCode}
                loading={loading || prefilling}
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
    marginBottom: hp('3%'),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.5%'),
    textAlign: 'left',
    paddingHorizontal: wp('2%'),
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.5%'),
    paddingRight: wp('2%'),
  },
  hintIcon: {
    marginRight: wp('2%'),
  },
  hintText: {
    flex: 1,
    fontSize: FontSizes.bodySmall,
    color: Colors.textLight,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    lineHeight: hp('2%'),
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

export default VerifyProfileScreen;
