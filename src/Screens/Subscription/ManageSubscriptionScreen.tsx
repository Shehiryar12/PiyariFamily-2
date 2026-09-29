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
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import ScreenHeader from '../../Components/ScreenHeader';
import { AuthStyles } from '../../Constant/AuthStyles';
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
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ManageSubscription'
>;

type ManageItemProps = {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

const ManageItem = ({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
}: ManageItemProps) => (
  <TouchableOpacity
    style={styles.optionCard}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <View style={[styles.manageIconWrap, { backgroundColor: iconBg }]}>
      <Icon name={icon} size={fs(20)} color={iconColor} />
    </View>
    <View style={styles.manageTextWrap}>
      <Text style={styles.manageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.manageSubtitle}>{subtitle}</Text> : null}
    </View>
    <View style={styles.chevronWrap}>
      <Icon name="chevron-right" size={fs(18)} color={Colors.primary} />
    </View>
  </TouchableOpacity>
);

const ManageSubscriptionScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  useHideTabBar();
  const [upgradePlan, setUpgradePlan] = useState<SubscriptionPlanData | null>(
    null,
  );
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentMeta, setCurrentMeta] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await Api.getSubscriptions();

      if (isApiSuccess(res?.status, res?.data?.success)) {
        const mapped = mapSubscriptions(res?.data);
        setUpgradePlan(
          mapped.vvipPlan.apiId ? mapped.vvipPlan : mapped.vipPlan,
        );
        const current = mapped.currentPlan;
        setCurrentTitle(
          current.title
            ? `${current.title}${current.isPaid ? ` — ${Strings.activeStatus}` : ''}`
            : '',
        );
        setCurrentMeta(
          [current.priceLabel, current.period, current.renewsAt ? `Renews ${current.renewsAt}` : '']
            .filter(Boolean)
            .join(' · '),
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

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#FFE5EC', Colors.background]}
        style={styles.topGlow}
      />

      <ScreenHeader
        title={Strings.manageSubscriptionTitle}
        onBack={() => navigation.goBack()}
        compact
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.currentPlanCard}>
          <View style={styles.crownCircle}>
            <Icon name="crown" size={fs(22)} color={Colors.gold} />
          </View>

          <View style={styles.planInfo}>
            <Text style={styles.planName}>
              {currentTitle || Strings.freePlan}
            </Text>
            {currentMeta ? (
              <Text style={styles.planMeta}>{currentMeta}</Text>
            ) : null}
          </View>

          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>{Strings.activeStatus}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{Strings.planOptions}</Text>

        <ManageItem
          icon="trending-up"
          iconBg="#FFF8E7"
          iconColor={Colors.gold}
          title={Strings.upgradeToPlatinum}
          subtitle={Strings.upgradeToPlatinumSubtitle}
          onPress={() => {
            if (!upgradePlan?.apiId && !upgradePlan?.priceLabel) {
              return;
            }

            navigation.navigate('CompletePayment', {
              plan: upgradePlan.id,
              price: upgradePlan.price,
              priceLabel: upgradePlan.priceLabel,
            });
          }}
        />

        <ManageItem
          icon="calendar-refresh"
          iconBg={Colors.tabActiveBg}
          iconColor={Colors.primary}
          title={Strings.changeBillingCycle}
          subtitle={Strings.changeBillingSubtitle}
        />

        <ManageItem
          icon="close-circle-outline"
          iconBg={Colors.tabActiveBg}
          iconColor="#E8889A"
          title={Strings.cancelSubscription}
        />

        <View style={styles.supportInfoBox}>
          <Icon name="shield-check" size={fs(18)} color={Colors.gold} />
          <Text style={styles.supportInfoText}>
            {Strings.subscriptionSupportTitle}
          </Text>
        </View>

        <TouchableOpacity style={styles.supportBtn} activeOpacity={0.85}>
          <Icon name="whatsapp" size={fs(20)} color={Colors.primary} />
          <Text style={styles.supportBtnText}>
            {Strings.contactSupportWhatsapp}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('14%'),
  },
  header: {
    marginBottom: hp('2%'),
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('3%'),
  },
  currentPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: wp('4.5%'),
    padding: wp('4%'),
    marginBottom: hp('2.5%'),
    gap: wp('3%'),
  },
  crownCircle: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginBottom: hp('0.3%'),
  },
  planMeta: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: hp('1.7%'),
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: wp('2.2%'),
    paddingVertical: hp('0.45%'),
    borderRadius: wp('4%'),
    gap: wp('1.2%'),
  },
  activeDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: '#2E7D32',
  },
  activePillText: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  sectionLabel: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('1.2%'),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.5%'),
    marginBottom: hp('1%'),
  },
  manageIconWrap: {
    width: wp('10.5%'),
    height: wp('10.5%'),
    borderRadius: wp('2.8%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  manageTextWrap: {
    flex: 1,
    marginRight: wp('2%'),
  },
  manageTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.label,
  },
  manageSubtitle: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: hp('0.25%'),
  },
  chevronWrap: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2.5%'),
    backgroundColor: '#FFF8E7',
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F5E6A8',
    padding: wp('3.5%'),
    marginTop: hp('1.5%'),
    marginBottom: hp('1.2%'),
  },
  supportInfoText: {
    flex: 1,
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: '#7A6A5A',
    lineHeight: hp('1.8%'),
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: hp('1.4%'),
    gap: wp('2%'),
  },
  supportBtnText: {
    fontSize: fs(13),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
});

export default ManageSubscriptionScreen;
