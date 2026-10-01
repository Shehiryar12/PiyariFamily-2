import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import { Images } from '../../Assets';
import ScreenHeader from '../../Components/ScreenHeader';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { Api, authService, getApiErrorMessage, isApiSuccess, mapProfileToSettings, parseVisibilityFlag, saveProfileCache, type ApiErrorResponse, type PhotoVisibilityFlags } from '../../API';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { resetToLogin } from '../../Functions/authNavigation';
import { navigateToHomeTab, useTabRootBackToHome } from '../../Functions/tabNavigation';
import { fs, hp, wp } from '../../Functions/responsive';
import { useAppSelector, selectProfilePhoto, selectUser, store } from '../../Redux';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'Settings'
>;

type SettingItemProps = {
  icon: string;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  danger?: boolean;
};

const SettingItem = ({
  icon,
  iconBg = Colors.tabActiveBg,
  iconColor = Colors.primary,
  title,
  subtitle,
  onPress,
  danger = false,
}: SettingItemProps) => (
  <TouchableOpacity
    style={styles.settingItem}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <View style={[styles.settingIconWrap, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={fs(20)} color={iconColor} />
    </View>
    <View style={styles.settingTextWrap}>
      <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
        {title}
      </Text>
      <Text style={styles.settingSubtitle}>{subtitle}</Text>
    </View>
    <Icon name="chevron-right" size={fs(22)} color={Colors.primary} />
  </TouchableOpacity>
);

const VISIBILITY_SAVE_DELAY_MS = 700;

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  useTabRootBackToHome(navigation);
  const user = useAppSelector(selectUser);
  const profilePhoto = useAppSelector(selectProfilePhoto);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileMeta, setProfileMeta] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [profilePictureVisible, setProfilePictureVisible] = useState(true);
  const [additionalPhotosVisible, setAdditionalPhotosVisible] = useState(true);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const visibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const visibilityInFlightRef = useRef(false);
  const pendingVisibilityRef = useRef<{
    profilePictureVisible: boolean;
    additionalPhotosVisible: boolean;
  } | null>(null);
  const savedVisibilityRef = useRef({
    profilePictureVisible: true,
    additionalPhotosVisible: true,
  });
  const visibilityRetryRef = useRef(0);

  const applyProfile = useCallback((rawProfile: ReturnType<typeof saveProfileCache>) => {
    const profile = mapProfileToSettings(rawProfile);
    setProfileName(profile.name);
    setProfileMeta(profile.meta);
    setIsVerified(profile.isVerified);
    if (!pendingVisibilityRef.current && !visibilityInFlightRef.current) {
      setProfilePictureVisible(profile.profilePictureVisible);
      setAdditionalPhotosVisible(profile.additionalPhotosVisible);
      savedVisibilityRef.current = {
        profilePictureVisible: profile.profilePictureVisible,
        additionalPhotosVisible: profile.additionalPhotosVisible,
      };
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    const cachedProfile = store.getState().profile.profile;
    if (cachedProfile) {
      applyProfile(cachedProfile);
    }

    try {
      const res = await Api.getProfile();
console.log('res', res);
      if (res?.status == 200) {
        applyProfile(saveProfileCache(res?.data));
      } else if (!cachedProfile) {
        Toast.show(res?.data?.message || 'Failed to load profile', Toast.LONG);
      }
    } catch (error: any) {
      if (!cachedProfile) {
        Toast.show(
          getApiErrorMessage(error, 'Failed to load profile'),
          Toast.LONG,
        );
      }
    }
  }, [applyProfile]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const flushPhotoVisibility = useCallback(async () => {
    const pending = pendingVisibilityRef.current;
    if (!pending || visibilityInFlightRef.current) {
      return;
    }

    if (
      pending.profilePictureVisible ===
        savedVisibilityRef.current.profilePictureVisible &&
      pending.additionalPhotosVisible ===
        savedVisibilityRef.current.additionalPhotosVisible
    ) {
      pendingVisibilityRef.current = null;
      return;
    }

    pendingVisibilityRef.current = null;
    visibilityInFlightRef.current = true;
    setSavingVisibility(true);

    try {
      const res = await Api.updatePhotoVisibility({
        profile_photo_visible: pending.profilePictureVisible,
        additional_photos_visible: pending.additionalPhotosVisible,
      });

      if (isApiSuccess(res?.status, res?.success)) {
        const flags: PhotoVisibilityFlags =
          res.data && typeof res.data === 'object' ? res.data : res;
        visibilityRetryRef.current = 0;
        savedVisibilityRef.current = pending;
        applyProfile(
          saveProfileCache({
            ...store.getState().profile.profile,
            profile_photo_visible:
              parseVisibilityFlag(flags?.profile_photo_visible) ??
              pending.profilePictureVisible,
            additional_photos_visible:
              parseVisibilityFlag(flags?.additional_photos_visible) ??
              pending.additionalPhotosVisible,
          }),
        );
        Toast.show(res?.message || 'Photo visibility updated', Toast.LONG);
      } else if (
        `${res?.message ?? ''}`.toLowerCase().includes('too many') &&
        visibilityRetryRef.current < 1
      ) {
        visibilityRetryRef.current += 1;
        pendingVisibilityRef.current = pendingVisibilityRef.current ?? pending;
        visibilityInFlightRef.current = false;
        setSavingVisibility(false);
        visibilityTimerRef.current = setTimeout(() => {
          visibilityTimerRef.current = null;
          flushPhotoVisibility();
        }, 2000);
        return;
      } else {
        setProfilePictureVisible(savedVisibilityRef.current.profilePictureVisible);
        setAdditionalPhotosVisible(
          savedVisibilityRef.current.additionalPhotosVisible,
        );
        Toast.show(
          res?.message || 'Failed to update photo visibility',
          Toast.LONG,
        );
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const retryAfter = Number(axiosError.response?.headers?.['retry-after']);
      const tooManyAttempts =
        axiosError.response?.status === 429 ||
        `${axiosError.response?.data?.message ?? ''}`
          .toLowerCase()
          .includes('too many');

      if (tooManyAttempts && visibilityRetryRef.current < 1) {
        visibilityRetryRef.current += 1;
        pendingVisibilityRef.current = pendingVisibilityRef.current ?? pending;
        visibilityInFlightRef.current = false;
        setSavingVisibility(false);
        visibilityTimerRef.current = setTimeout(
          () => {
            visibilityTimerRef.current = null;
            flushPhotoVisibility();
          },
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 2000,
        );
        return;
      }

      setProfilePictureVisible(savedVisibilityRef.current.profilePictureVisible);
      setAdditionalPhotosVisible(
        savedVisibilityRef.current.additionalPhotosVisible,
      );
      Toast.show(
        getApiErrorMessage(error, 'Failed to update photo visibility'),
        Toast.LONG,
      );
    } finally {
      if (visibilityInFlightRef.current) {
        visibilityInFlightRef.current = false;
        setSavingVisibility(false);
        if (pendingVisibilityRef.current) {
          flushPhotoVisibility();
        }
      }
    }
  }, [applyProfile]);

  const persistPhotoVisibility = (
    nextProfileVisible: boolean,
    nextAdditionalVisible: boolean,
  ) => {
    setProfilePictureVisible(nextProfileVisible);
    setAdditionalPhotosVisible(nextAdditionalVisible);
    pendingVisibilityRef.current = {
      profilePictureVisible: nextProfileVisible,
      additionalPhotosVisible: nextAdditionalVisible,
    };

    if (visibilityTimerRef.current) {
      clearTimeout(visibilityTimerRef.current);
    }

    visibilityTimerRef.current = setTimeout(() => {
      visibilityTimerRef.current = null;
      flushPhotoVisibility();
    }, VISIBILITY_SAVE_DELAY_MS);
  };

  useEffect(
    () => () => {
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    },
    [],
  );

  const closeLogoutModal = () => {
    if (loggingOut) {
      return;
    }
    setLogoutModalVisible(false);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const res = await authService.logout();
      Toast.show(res?.message ?? 'Logged out successfully', Toast.LONG);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      Toast.show('Logged out successfully', Toast.LONG);
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
      resetToLogin(navigation, { forgetAccount: true });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={Strings.settings}
        onBack={() => navigateToHomeTab(navigation)}
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <Image
            source={
              profilePhoto ? { uri: profilePhoto } : Images.femaleProfile
            }
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileName || '-'}</Text>
            <Text style={styles.profileMeta}>{profileMeta || '-'}</Text>
            {isVerified ? (
              <View style={styles.verifiedBadge}>
                <Icon name="shield-check" size={fs(11)} color={Colors.gold} />
                <Text style={styles.verifiedText}>{Strings.verifiedLabel}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileLink}>
              {Strings.editProfile} →
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.referCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ReferralProgram')}
        >
          <View style={styles.referIconWrap}>
            <View style={styles.referIconBox}>
              <Icon name="gift-outline" size={fs(22)} color={Colors.white} />
            </View>
            <View style={styles.coinBadge}>
              <Icon name="circle" size={fs(10)} color={Colors.gold} />
            </View>
          </View>
          <View style={styles.referTextWrap}>
            <View style={styles.referTitleRow}>
              <Text style={styles.referTitle}>{Strings.referAndEarn}</Text>
              <View style={styles.rewardsBadge}>
                <Text style={styles.rewardsText}>{Strings.rewards}</Text>
              </View>
            </View>
            <Text style={styles.referSubtitle}>{Strings.referSubtitle}</Text>
          </View>
          <View style={styles.referArrowWrap}>
            <Icon name="chevron-right" size={fs(18)} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>
          {Strings.profilePhotosVisibility}
        </Text>
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{Strings.profilePicture}</Text>
            <Switch
              value={profilePictureVisible}
              onValueChange={value =>
                persistPhotoVisibility(value, additionalPhotosVisible)
              }
              trackColor={{
                false: Colors.divider,
                true: Colors.focusBorder,
              }}
              thumbColor={
                profilePictureVisible ? Colors.primary : Colors.white
              }
            />
          </View>
          <View style={styles.toggleDivider} />
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{Strings.additionalPhotos}</Text>
            <Switch
              value={additionalPhotosVisible}
              onValueChange={value =>
                persistPhotoVisibility(profilePictureVisible, value)
              }
              trackColor={{
                false: Colors.divider,
                true: Colors.focusBorder,
              }}
              thumbColor={
                additionalPhotosVisible ? Colors.primary : Colors.white
              }
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>{Strings.accountSection}</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="account-outline"
            title={Strings.editProfile}
            subtitle={Strings.updatePersonalDetails}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="shield-check-outline"
            title={Strings.verifyYourProfile}
            subtitle={Strings.verifyProfileSubtitle}
            onPress={() => navigation.navigate('VerifyProfile')}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="account-eye-outline"
            title={Strings.viewProfileRequest}
            subtitle={Strings.viewProfileRequestSubtitle}
            onPress={() => navigation.navigate('ViewProfileRequests')}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="history"
            title={Strings.requestHistory}
            subtitle={Strings.requestHistorySubtitle}
            onPress={() => navigation.navigate('RequestHistory')}
          />
        </View>

        <Text style={styles.sectionLabel}>{Strings.securitySection}</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="lock-outline"
            title={Strings.changePassword}
            subtitle={Strings.updateLoginPassword}
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>

        <Text style={styles.sectionLabel}>{Strings.subscriptionSection}</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="crown-outline"
            iconBg="#FFF8E7"
            iconColor={Colors.gold}
            title={Strings.myPlan}
            subtitle={Strings.vipPlanActive}
            onPress={() => navigation.navigate('ManageSubscription')}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="star-outline"
            iconBg={Colors.tabActiveBg}
            iconColor={Colors.gold}
            title={Strings.chooseYourPlan}
            subtitle={Strings.premiumBannerSubtitle}
            onPress={() => navigation.navigate('ChooseYourPlan')}
          />
        </View>

        <Text style={styles.sectionLabel}>{Strings.supportSection}</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="help-circle-outline"
            title={Strings.helpCenter}
            subtitle={Strings.helpCenterSubtitle}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="message-text-outline"
            title={Strings.contactSupport}
            subtitle={Strings.contactSupportSubtitle}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="file-document-outline"
            title={Strings.termsAndConditions}
            subtitle={Strings.termsSubtitle}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="star-outline"
            title={Strings.rateTheApp}
            subtitle={Strings.rateAppSubtitle}
          />
        </View>

        <Text style={styles.sectionLabel}>{Strings.dangerZone}</Text>
        <View style={styles.settingGroup}>
          <SettingItem
            icon="logout"
            title={Strings.logOut}
            subtitle={loggingOut ? 'Logging out...' : Strings.logOutSubtitle}
            danger
            onPress={() => setLogoutModalVisible(true)}
          />
          <View style={styles.itemDivider} />
          <SettingItem
            icon="alert-outline"
            title={Strings.deactivateAccount}
            subtitle={Strings.deactivateSubtitle}
            danger
            onPress={() => navigation.navigate('AccountOptions')}
          />
        </View>
      </ScrollView>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLogoutModal}
      >
        <View style={styles.logoutBackdrop}>
          <Pressable style={styles.logoutBackdropPress} onPress={closeLogoutModal} />
          <View style={styles.logoutDialog}>
            <View style={styles.logoutIconWrap}>
              <Icon name="logout" size={fs(18)} color={Colors.white} />
            </View>
            <Text style={styles.logoutTitle}>{Strings.logOutConfirmTitle}</Text>
            <Text style={styles.logoutMessage}>{Strings.logOutConfirmMessage}</Text>

            <View style={styles.logoutActions}>
              <TouchableOpacity
                style={[styles.logoutActionBtn, styles.logoutNoBtn]}
                activeOpacity={0.85}
                disabled={loggingOut}
                onPress={closeLogoutModal}
              >
                <Text style={styles.logoutNoText}>{Strings.no}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutActionBtn, styles.logoutYesBtn]}
                activeOpacity={0.85}
                disabled={loggingOut}
                onPress={handleLogout}
              >
                <Text style={styles.logoutYesText}>
                  {loggingOut ? '...' : Strings.yes}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('3%'),
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('4.5%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
  },
  profileImage: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: wp('3.5%'),
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  profileMeta: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('0.5%'),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: wp('1%'),
    backgroundColor: '#FFF8E7',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.25%'),
    borderRadius: wp('2.5%'),
  },
  verifiedText: {
    fontSize: fs(10),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  editProfileLink: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  referCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: wp('3.5%'),
    marginBottom: hp('2.5%'),
  },
  referIconWrap: {
    position: 'relative',
    marginRight: wp('3%'),
  },
  referIconBox: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinBadge: {
    position: 'absolute',
    top: -hp('0.4%'),
    right: -wp('1%'),
    width: wp('4.5%'),
    height: wp('4.5%'),
    borderRadius: wp('2.25%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  referTextWrap: {
    flex: 1,
  },
  referTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('0.3%'),
  },
  referTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  rewardsBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.2%'),
    borderRadius: wp('2%'),
  },
  rewardsText: {
    fontSize: fs(9),
    fontFamily: Fonts.bold,
    color: Colors.gold,
    letterSpacing: 0.3,
  },
  referSubtitle: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  referArrowWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.textLight,
    letterSpacing: 0.6,
    marginBottom: hp('1%'),
  },
  toggleCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: hp('2.2%'),
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.4%'),
  },
  toggleLabel: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: wp('4%'),
  },
  settingGroup: {
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: hp('2.2%'),
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.4%'),
  },
  settingIconWrap: {
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('2.8%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  settingTextWrap: {
    flex: 1,
    marginRight: wp('2%'),
  },
  settingTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  settingTitleDanger: {
    color: Colors.primary,
  },
  settingSubtitle: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: hp('1.8%'),
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: wp('17%'),
  },
  logoutBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('10%'),
  },
  logoutBackdropPress: {
    ...StyleSheet.absoluteFill,
  },
  logoutDialog: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('1.8%'),
    alignItems: 'center',
    width: '100%',
  },
  logoutIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.1%'),
  },
  logoutTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.5%'),
    textAlign: 'center',
  },
  logoutMessage: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2%'),
    marginBottom: hp('1.8%'),
  },
  logoutActions: {
    flexDirection: 'row',
    width: '100%',
    gap: wp('2.5%'),
  },
  logoutActionBtn: {
    flex: 1,
    height: hp('4.6%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutNoBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
  },
  logoutYesBtn: {
    backgroundColor: Colors.primary,
  },
  logoutNoText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  logoutYesText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});

export default SettingsScreen;
