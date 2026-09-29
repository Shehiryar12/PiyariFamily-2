import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
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
import ScreenHeader from '../../Components/ScreenHeader';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  mapSubscriptions,
  type SubscriptionPlansData,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { PREMIUM_PERKS } from '../../Constant/Subscription';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { popStackOrGoHome } from '../../Functions/tabNavigation';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ChooseYourPlan'
>;

const ChooseYourPlanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  useHideTabBar();
  const [plans, setPlans] = useState<SubscriptionPlansData>(mapSubscriptions());
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);

    try {
      const res = await Api.getSubscriptions();

      if (isApiSuccess(res?.status, res?.data?.success)) {
        setPlans(mapSubscriptions(res?.data));
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
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [fetchSubscriptions]),
  );

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        popStackOrGoHome(navigation);
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [navigation]),
  );

  const openPayment = (plan: 'VIP' | 'VVIP') => {
    const selected = plan === 'VIP' ? plans.vipPlan : plans.vvipPlan;
    if (!selected.apiId && !selected.priceLabel) {
      return;
    }

    navigation.navigate('CompletePayment', {
      plan,
      price: selected.price,
      priceLabel: selected.priceLabel,
    });
  };

  const renderPlanFeature = (text: string, light = false) => (
    <View key={text} style={styles.featureRow}>
      <View
        style={[
          styles.checkCircle,
          light ? styles.checkCircleLight : styles.checkCircleMuted,
        ]}
      >
        <Icon
          name="check"
          size={fs(10)}
          color={light ? Colors.white : Colors.textLight}
        />
      </View>
      <Text style={[styles.featureText, light && styles.featureTextLight]}>
        {text}
      </Text>
    </View>
  );

  const renderPlanCardHeader = (
    icon: string,
    title: string,
    duration: string,
    lightIcon = false,
  ) => (
    <View style={styles.planTopRow}>
      <View style={styles.planIconBadge}>
        <Icon
          name={icon}
          size={fs(16)}
          color={lightIcon ? Colors.white : Colors.gold}
        />
      </View>
      <View style={styles.planTitleWrap}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planDuration}>{duration}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={Strings.chooseYourPlan}
        compact
        onBack={() => popStackOrGoHome(navigation)}
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
        <Text style={styles.title}>{Strings.unlockPremiumLuck}</Text>
        <Text style={styles.subtitle}>{Strings.choosePlanSubtitle}</Text>

        <View style={styles.freeCard}>
          <View style={styles.freeTopRow}>
            <View style={styles.freeIconBadge}>
              <Icon
                name="medal-outline"
                size={fs(16)}
                color={Colors.textLight}
              />
            </View>
            <Text style={styles.freeTitle}>
              {(plans.freePlan.badge || plans.freePlan.title || Strings.freePlan).toUpperCase()}
            </Text>
          </View>
          {plans.freePlan.features.map(item => renderPlanFeature(item))}
        </View>

        {plans.vipPlan.apiId ? (
          <LinearGradient
            colors={plans.vipPlan.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.premiumCard}
          >
            {renderPlanCardHeader(
              'star',
              plans.vipPlan.title,
              plans.vipPlan.durationLabel,
              true,
            )}
            <Text style={styles.planPrice}>{plans.vipPlan.priceLabel}</Text>
            {plans.vipPlan.features.map(item => renderPlanFeature(item, true))}
            <TouchableOpacity
              style={styles.selectBtn}
              activeOpacity={0.85}
              onPress={() => openPayment('VIP')}
            >
              <Text style={styles.selectBtnText}>{Strings.selectPlan}</Text>
              <Icon name="arrow-right" size={fs(16)} color={Colors.goldLight} />
            </TouchableOpacity>
          </LinearGradient>
        ) : null}

        {plans.vvipPlan.apiId ? (
          <LinearGradient
            colors={plans.vvipPlan.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.premiumCard}
          >
            {renderPlanCardHeader(
              'crown',
              plans.vvipPlan.title,
              plans.vvipPlan.durationLabel,
              true,
            )}
            <Text style={styles.planPrice}>{plans.vvipPlan.priceLabel}</Text>
            {plans.vvipPlan.features.map(item => renderPlanFeature(item, true))}
            <TouchableOpacity
              style={styles.selectBtn}
              activeOpacity={0.85}
              onPress={() => openPayment('VVIP')}
            >
              <Text style={styles.selectBtnText}>{Strings.selectPlan}</Text>
              <Icon name="arrow-right" size={fs(16)} color={Colors.white} />
            </TouchableOpacity>
          </LinearGradient>
        ) : null}

        <View style={styles.perksGrid}>
          {PREMIUM_PERKS.map(perk => (
            <View key={perk.label} style={styles.perkCard}>
              <View style={styles.perkIconWrap}>
                <Icon name={perk.icon} size={fs(20)} color={Colors.primary} />
              </View>
              <Text style={styles.perkTitle}>{perk.label}</Text>
              <Text style={styles.perkSubtitle}>{perk.subtitle}</Text>
            </View>
          ))}
        </View>

        <View style={styles.socialProof}>
          <Icon name="crown" size={fs(14)} color={Colors.gold} />
          <Text style={styles.socialProofText}>
            {Strings.premiumSocialProof}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.viewFeaturesWrap}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ComparePlans')}
        >
          <Text style={styles.viewFeaturesText}>
            {Strings.viewAllFeatures} →
          </Text>
        </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: getFooterBottomPadding(insets.bottom) },
        ]}
      >
        <PrimaryButton
          title={Strings.getPremiumNow}
          onPress={() => openPayment('VIP')}
          showArrow
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loaderWrap: {
    minHeight: hp('50%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('1.5%'),
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.5%'),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('2.2%'),
    lineHeight: hp('2.4%'),
  },
  freeCard: {
    backgroundColor: '#ECECEC',
    borderRadius: wp('4.5%'),
    padding: wp('4.5%'),
    marginBottom: hp('1.5%'),
  },
  freeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1.2%'),
  },
  freeIconBadge: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.textLight,
    letterSpacing: 0.6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('0.7%'),
  },
  checkCircle: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    borderRadius: wp('2.25%'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.white,
  },
  checkCircleMuted: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  checkCircleLight: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  featureText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    flex: 1,
  },
  featureTextLight: {
    color: Colors.white,
    fontFamily: Fonts.medium,
  },
  premiumCard: {
    borderRadius: wp('4.5%'),
    padding: wp('4.5%'),
    marginBottom: hp('1.5%'),
    overflow: 'hidden',
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
    marginBottom: hp('1%'),
  },
  planIconBadge: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('2%'),
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  planTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  planDuration: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.85)',
  },
  planPrice: {
    fontSize: fs(26),
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginBottom: hp('1.2%'),
    letterSpacing: -0.5,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: wp('3.5%'),
    paddingVertical: hp('1.3%'),
    marginTop: hp('0.5%'),
    gap: wp('1.5%'),
  },
  selectBtnText: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: hp('0.8%'),
    marginBottom: hp('1.5%'),
  },
  perkCard: {
    width: '48%',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    padding: wp('3.5%'),
    marginBottom: hp('1.2%'),
  },
  perkIconWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('0.8%'),
  },
  perkTitle: {
    fontSize: fs(12),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.3%'),
  },
  perkSubtitle: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: hp('1.6%'),
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
    marginBottom: hp('1.2%'),
  },
  socialProofText: {
    flex: 1,
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: Colors.textLight,
    lineHeight: hp('1.6%'),
  },
  viewFeaturesWrap: {
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  viewFeaturesText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  footer: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});

export default ChooseYourPlanScreen;
