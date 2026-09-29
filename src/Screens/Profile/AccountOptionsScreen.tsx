import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import ScreenHeader from '../../Components/ScreenHeader';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import {
  Api,
  isApiSuccess,
} from '../../API';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { resetToLogin } from '../../Functions/authNavigation';
import { fs, hp, wp } from '../../Functions/responsive';
import {
  clearHomeMatches,
  clearReferral,
  clearSession,
  clearShortlist,
  setAccountStatus,
  useAppDispatch,
} from '../../Redux';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'AccountOptions'
>;

const LOSS_ITEMS = [
  Strings.loseProfilePhotos,
  Strings.loseMatchesChats,
  Strings.loseSubscription,
  Strings.loseVerifiedBadge,
];

const AccountOptionsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const goToLogin = () => {
    resetToLogin(navigation, { forgetAccount: true });
  };

  const handleDeactivate = async () => {
    if (loading) {
      return;
    } else {
      setLoading(true);

      try {

        const res = await Api.updateAccountStatus('deactivate');


        if (res?.isSuccess || res?.status == 200 || res?.success == 200) {
          dispatch(setAccountStatus(res?.accountStatus ?? 'inactive'));
          dispatch(clearHomeMatches());
          dispatch(clearShortlist());
          dispatch(clearReferral());
          Toast.show(res?.message || 'Account deactivated', Toast.LONG);
          navigation.getParent()?.navigate('Home');
        } else {
          Toast.show(res?.message || 'Failed to deactivate account', Toast.LONG);
        }
      } catch (error: any) {
        Toast.show(
          error?.response?.data?.message || 'Failed to deactivate account',
          Toast.LONG,
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (loading || deleting) {
      return;
    } else {
      setDeleting(true);

      try {

        const res = await Api.deleteAccount();


        if (isApiSuccess(res?.status, res?.success)) {
          await clearSession({ rememberAccount: false });
          Toast.show(res?.message || 'Account deleted successfully', Toast.LONG);
          goToLogin();
        } else {
          Toast.show(res?.message || 'Failed to delete account', Toast.LONG);
        }
      } catch (error: any) {
        Toast.show(
          error?.response?.data?.message || 'Failed to delete account',
          Toast.LONG,
        );
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#FFE5EC', '#FFF8FA', Colors.background]}
        style={styles.topGlow}
      />

      <ScreenHeader
        title={Strings.accountOptions}
        onBack={() => navigation.goBack()}
        style={styles.screenHeader}
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <View style={styles.warningIconWrap}>
            <Icon name="alert-outline" size={fs(36)} color={Colors.white} />
          </View>

          <Text style={styles.title}>{Strings.wellMissYou}</Text>
          <Text style={styles.subtitle}>{Strings.accountOptionsSubtitle}</Text>
        </View>

        <View style={styles.optionCard}>
          <View style={[styles.optionIconBox, styles.deactivateIconBox]}>
            <Icon name="pause" size={fs(18)} color={Colors.white} />
          </View>

          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>
              {Strings.deactivateAccountTitle}
            </Text>
            <Text style={styles.optionDesc}>{Strings.deactivateAccountDesc}</Text>
          </View>

          <TouchableOpacity
            style={styles.deactivateAction}
            activeOpacity={0.85}
            onPress={handleDeactivate}
            disabled={loading || deleting}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <Text style={styles.deactivateLink}>
                {Strings.deactivateAction} →
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.optionCard}>
          <View style={[styles.optionIconBox, styles.deleteIconBox]}>
            <Icon name="delete-outline" size={fs(18)} color={Colors.primary} />
          </View>

          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>{Strings.deleteAccountTitle}</Text>
            <Text style={styles.optionDesc}>{Strings.deleteAccountDesc}</Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.85}
            onPress={handleDelete}
            disabled={loading || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.redish} />
            ) : (
              <Text style={styles.deleteBtnText}>{Strings.deleteAction} →</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.lossBox}>
          <Text style={styles.lossTitle}>{Strings.whatYouLoseTitle}</Text>
          {LOSS_ITEMS.map(item => (
            <View key={item} style={styles.lossRow}>
              <Icon name="close" size={fs(13)} color={Colors.primary} />
              <Text style={styles.lossText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.safetyTip}>
          <Icon name="shield-check" size={fs(16)} color={Colors.gold} />
          <Text style={styles.safetyTipText}>{Strings.deactivateSafetyTip}</Text>
        </View>

        <TouchableOpacity
          style={styles.supportBtn}
          activeOpacity={0.88}
          onPress={() => Toast.show('Opening support')}
        >
          <Icon
            name="message-text-outline"
            size={fs(18)}
            color={Colors.primary}
          />
          <Text style={styles.supportBtnText}>
            {Strings.contactSupportBeforeLeaving}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.goBackWrap}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>{Strings.changedMindGoBack}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('20%'),
  },
  screenHeader: {
    marginBottom: hp('0.5%'),
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('3%'),
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: hp('2%'),
    paddingTop: hp('0.5%'),
  },
  warningIconWrap: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },
  title: {
    fontSize: fs(22),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('0.5%'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2.2%'),
    paddingHorizontal: wp('4%'),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F7',
    borderWidth: 1,
    borderColor: '#F3DDE3',
    borderRadius: wp('4%'),
    padding: wp('3.5%'),
    marginBottom: hp('1.2%'),
    gap: wp('2.5%'),
  },
  optionIconBox: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('2.8%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('0.1%'),
  },
  deactivateIconBox: {
    backgroundColor: Colors.gold,
  },
  deleteIconBox: {
    backgroundColor: '#FFE8EE',
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: wp('1%'),
  },
  optionTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.35%'),
  },
  optionDesc: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: hp('1.75%'),
  },
  deactivateAction: {
    alignSelf: 'center',
    paddingLeft: wp('1%'),
  },
  deactivateLink: {
    fontSize: fs(12),
    fontFamily: Fonts.bold,
    color: Colors.gold,
  },
  deleteBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.redish,
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.55%'),
  },
  deleteBtnText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.redish,
  },
  lossBox: {
    backgroundColor: '#FFF5F7',
    borderWidth: 1,
    borderColor: '#F3DDE3',
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginTop: hp('0.3%'),
    marginBottom: hp('1.2%'),
  },
  lossTitle: {
    fontSize: fs(13),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('1%'),
  },
  lossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('0.55%'),
  },
  lossText: {
    flex: 1,
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  safetyTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2.5%'),
    backgroundColor: '#FEFCE8',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#F5E6B8',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.1%'),
    marginBottom: hp('1.8%'),
  },
  safetyTipText: {
    flex: 1,
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: '#8A6D1D',
    lineHeight: hp('1.85%'),
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: wp('3.5%'),
    height: AuthStyles.buttonHeight,
    marginBottom: hp('1.8%'),
  },
  supportBtnText: {
    fontSize: fs(13),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  goBackWrap: {
    alignItems: 'center',
    paddingBottom: hp('0.5%'),
  },
  goBackText: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.gold,
  },
});

export default AccountOptionsScreen;
