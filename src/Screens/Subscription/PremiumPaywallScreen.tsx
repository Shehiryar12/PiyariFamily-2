import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import PrimaryButton from '../../Components/PrimaryButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  mapSubscriptions,
  type SubscriptionPlanData,
} from '../../API';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'PremiumPaywall'
>;

const SPARKLE_POSITIONS = [
  { top: hp('1%'), left: wp('18%') },
  { top: hp('2%'), right: wp('20%') },
  { top: hp('4%'), left: wp('28%') },
];

const PremiumPaywallScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  useHideTabBar();
  const [vipPlan, setVipPlan] = useState<SubscriptionPlanData | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await Api.getSubscriptions();

      if (isApiSuccess(res?.status, res?.data?.success)) {
        const mapped = mapSubscriptions(res?.data);
        setVipPlan(
          mapped.vipPlan.apiId ? mapped.vipPlan : mapped.vvipPlan.apiId
            ? mapped.vvipPlan
            : mapped.vipPlan,
        );
      } else {
        Toast.show(
          res?.data?.message ?? 'Failed to load subscription plans',
          Toast.LONG,
        );
      }
    } catch (error) {
      Toast.show(
        getApiErrorMessage(error, 'Failed to load subscription plans'),
        Toast.LONG,
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [fetchSubscriptions]),
  );

  const openPayment = () => {
    if (!vipPlan?.apiId && !vipPlan?.priceLabel) {
      return;
    }

    navigation.navigate('CompletePayment', {
      plan: vipPlan.id,
      price: vipPlan.price,
      priceLabel: vipPlan.priceLabel,
    });
  };

  const lockedFeatures = vipPlan?.features ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.hero}
      >
        {SPARKLE_POSITIONS.map((pos, index) => (
          <Icon
            key={index}
            name="star-four-points"
            size={fs(10)}
            color={Colors.goldLight}
            style={[styles.sparkle, pos]}
          />
        ))}

        <View style={styles.crownRing}>
          <Icon name="crown" size={fs(36)} color={Colors.gold} />
        </View>

        <Text style={styles.heroTitle}>{Strings.featureIsPremium}</Text>
        <Text style={styles.heroSubtitle}>
          {Strings.featurePremiumSubtitle}
        </Text>
      </LinearGradient>

      <View style={styles.contentSheet}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.limitTitle}>{Strings.paywallTitle}</Text>
          <Text style={styles.limitSubtitle}>{Strings.paywallSubtitle}</Text>

          {lockedFeatures.map(label => (
            <View key={label} style={styles.lockRow}>
              <View style={styles.lockIconWrap}>
                <Icon name="lock-outline" size={fs(18)} color={Colors.gold} />
              </View>
              <View style={styles.lockTextWrap}>
                <Text style={styles.lockLabel}>{label}</Text>
              </View>
              <TouchableOpacity style={styles.unlockBtn} activeOpacity={0.85}>
                <Text style={styles.unlockBtnText}>{Strings.unlockPremium}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.trustBar}>
            <Icon name="shield-check" size={fs(16)} color={Colors.gold} />
            <Text style={styles.trustText}>{Strings.paywallTrustNotice}</Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <PrimaryButton
            title={Strings.unlockPremium}
            onPress={openPayment}
            leftIcon="crown"
          />
          <TouchableOpacity
            style={styles.laterWrap}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.laterText}>{Strings.maybeLater}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  hero: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('2.5%'),
    paddingBottom: hp('5%'),
    alignItems: 'center',
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    opacity: 0.85,
  },
  crownRing: {
    width: wp('22%'),
    height: wp('22%'),
    borderRadius: wp('11%'),
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
  },
  heroTitle: {
    fontSize: FontSizes.h3,
    fontFamily: Fonts.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: hp('0.5%'),
  },
  heroSubtitle: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    marginTop: -hp('2.5%'),
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('2.5%'),
    paddingBottom: hp('1%'),
  },
  limitTitle: {
    fontSize: FontSizes.h3,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.5%'),
  },
  limitSubtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: hp('2.2%'),
    marginBottom: hp('2%'),
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    padding: wp('3.5%'),
    marginBottom: hp('1%'),
  },
  lockIconWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2.5%'),
  },
  lockTextWrap: {
    flex: 1,
    marginRight: wp('2%'),
  },
  lockLabel: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  lockDesc: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  unlockBtn: {
    backgroundColor: '#FFF8E7',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
  },
  unlockBtnText: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    color: Colors.gold,
  },
  trustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.1%'),
    marginTop: hp('0.5%'),
  },
  trustText: {
    flex: 1,
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  footer: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  laterWrap: {
    alignItems: 'center',
    marginTop: hp('1.2%'),
  },
  laterText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
});

export default PremiumPaywallScreen;
