import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import {
  Api,
  getApiErrorMessage,
  refreshAccountStatus,
  type ApiErrorResponse,
} from '../../API';
import CredentialsConfirmModal from '../../Components/CredentialsConfirmModal';
import { ACCOUNT_DEACTIVATED_INFO_ITEMS } from '../../Constant/AccountDeactivated';
import { AuthStyles } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { leaveDeactivatedForLogin } from '../../Functions/authNavigation';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import {
  selectAdminReactivateRequested,
  selectProfile,
  selectUser,
  setAdminReactivateRequested,
  useAppDispatch,
  useAppSelector,
} from '../../Redux';

const AccountDeactivatedScreen = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const requestSent = useAppSelector(selectAdminReactivateRequested);
  const user = useAppSelector(selectUser);
  const profile = useAppSelector(selectProfile);
  const savedEmail = user?.email || profile?.email || '';
  const [sending, setSending] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const leaveIfAdminApproved = async () => {
      try {
        const status = await refreshAccountStatus();
        if (cancelled) {
          return;
        }

        if (status === 'unauthenticated') {
          await leaveDeactivatedForLogin();
          return;
        }

        if (status === 'active' && requestSent) {
          await leaveDeactivatedForLogin();
        }
      } catch {
      }
    };

    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void leaveIfAdminApproved();
      }
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [requestSent]);

  const handleRequestAdmin = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    if (sending) {
      return;
    }

    if (requestSent) {
      Toast.show(Strings.adminRequestAlreadySent, Toast.LONG);
      return;
    }

    if (!email.trim() || !password) {
      Toast.show('Please enter email and password');
      return;
    }

    setSending(true);

    try {
      const res = await Api.updateAccountStatus('activate', {
        email,
        password,
      });
      const sent =
        res?.isSuccess ||
        res?.status == 200 ||
        res?.status == 201 ||
        res?.success === true;

      if (!sent) {
        Toast.show(res?.message ?? 'Failed to send request', Toast.LONG);
        return;
      }

      dispatch(setAdminReactivateRequested(true));
      setShowRequestModal(false);
      Toast.show(res?.message ?? Strings.adminRequestSentDesc, Toast.LONG);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = String(
        axiosError.response?.data?.message ?? '',
      ).toLowerCase();

      if (
        axiosError.response?.status === 401 ||
        message.includes('unauthenticated')
      ) {
        await leaveDeactivatedForLogin();
        return;
      }

      Toast.show(
        getApiErrorMessage(axiosError, 'Failed to send request to admin'),
        Toast.LONG,
      );
    } finally {
      setSending(false);
    }
  };

  const handleGoToLogin = () => {
    void leaveDeactivatedForLogin();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getFooterBottomPadding(insets.bottom) },
        ]}
      >
        <LinearGradient
          colors={['#FFE5EC', '#FFF8FA', Colors.white]}
          style={styles.card}
        >
          <View style={styles.hero}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Icon name="account-lock" size={fs(28)} color={Colors.white} />
              </View>
            </View>

            <Text style={styles.badge}>{Strings.accountDeactivatedSubtitle}</Text>
            <Text style={styles.title}>{Strings.accountDeactivatedTitle}</Text>
            <Text style={styles.desc}>{Strings.accountDeactivatedDesc}</Text>
          </View>

          <View style={styles.infoBox}>
            {ACCOUNT_DEACTIVATED_INFO_ITEMS.map(item => (
              <View key={item.text} style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Icon name={item.icon} size={fs(16)} color={Colors.primary} />
                </View>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <Icon name="information-outline" size={fs(16)} color={Colors.gold} />
            <Text style={styles.tipText}>
              {requestSent
                ? Strings.adminRequestSentDesc
                : Strings.inactiveAdminHint}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.requestBtn}
            activeOpacity={0.88}
            onPress={() =>
              requestSent ? handleGoToLogin() : setShowRequestModal(true)
            }
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Icon
                  name={requestSent ? 'login' : 'send'}
                  size={fs(18)}
                  color={Colors.white}
                />
                <Text style={styles.requestBtnText}>
                  {requestSent
                    ? Strings.goToLogin
                    : Strings.requestAdminAccess}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>

      <CredentialsConfirmModal
        visible={showRequestModal}
        title={Strings.confirmReactivateTitle}
        message={Strings.confirmReactivateDesc}
        confirmLabel={Strings.requestAdminAccess}
        loading={sending}
        initialEmail={savedEmail}
        iconName="email-outline"
        onClose={() => {
          if (!sending) {
            setShowRequestModal(false);
          }
        }}
        onConfirm={handleRequestAdmin}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  card: {
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: '#F3DDE3',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    overflow: 'hidden',
  },
  hero: {
    alignItems: 'center',
    marginBottom: hp('2.2%'),
  },
  iconOuter: {
    width: wp('24%'),
    height: wp('24%'),
    borderRadius: wp('12%'),
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },
  iconInner: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#F5E6B8',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.45%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1%'),
    overflow: 'hidden',
  },
  title: {
    fontSize: fs(22),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('0.8%'),
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2.4%'),
    paddingHorizontal: wp('2%'),
  },
  infoBox: {
    backgroundColor: '#FFF5F7',
    borderWidth: 1,
    borderColor: '#F3DDE3',
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('1.5%'),
    gap: hp('1%'),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  infoIconWrap: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2.2%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: hp('2%'),
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2.5%'),
    backgroundColor: '#FEFCE8',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#F5E6B8',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.1%'),
    marginBottom: hp('2%'),
  },
  tipText: {
    flex: 1,
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: '#8A6D1D',
    lineHeight: hp('1.9%'),
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    backgroundColor: Colors.primary,
    borderRadius: wp('3.5%'),
    minHeight: hp('6%'),
    paddingHorizontal: wp('6%'),
  },
  requestBtnText: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
});

export default AccountDeactivatedScreen;
