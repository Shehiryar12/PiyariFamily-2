import React from 'react';
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from '../../Assets';
import PrimaryButton from '../../Components/PrimaryButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { navigateToHomeTab } from '../../Functions/tabNavigation';
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { fs, hp, wp } from '../../Functions/responsive';

type RouteProps = RouteProp<ProfileStackParamList, 'PremiumSuccess'>;
type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'PremiumSuccess'
>;

type SuccessPerk = {
  label: string;
  icon?: string;
  iconSource?: ImageSourcePropType;
  iconColor?: string;
};

const SPARKLE_POSITIONS = [
  { top: hp('0.5%'), left: wp('6%') },
  { top: hp('2%'), right: wp('8%') },
  { top: hp('7%'), left: wp('2%') },
  { top: hp('5%'), right: wp('3%') },
  { top: hp('10%'), left: wp('14%') },
  { top: hp('9%'), right: wp('15%') },
];

const SUCCESS_PERKS: SuccessPerk[] = [
  {
    icon: 'message-text-outline',
    label: 'Unlimited Chats',
    iconColor: Colors.primary,
  },
  { iconSource: Images.profileBoostIcon, label: 'Profile Boost' },
  { icon: 'star', label: 'Super Likes', iconColor: Colors.gold },
  { icon: 'eye-outline', label: 'See Likes', iconColor: Colors.primary },
];

const PremiumSuccessScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { plan, priceLabel, nextBilling } = route.params;
  useHideTabBar();

  const planLabel = plan === 'VIP' ? Strings.vipPlan : Strings.vvipPlan;

  const renderPerkIcon = (perk: SuccessPerk) => {
    if (perk.iconSource) {
      return (
        <Image
          source={perk.iconSource}
          style={styles.perkCustomIcon}
          resizeMode="contain"
        />
      );
    }

    return (
      <Icon
        name={perk.icon!}
        size={fs(24)}
        color={perk.iconColor ?? Colors.primary}
      />
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        locations={[0, 0.42, 0]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroWrap}>
            {SPARKLE_POSITIONS.map((pos, index) => (
              <Icon
                key={index}
                name="star-four-points"
                size={fs(index % 2 === 0 ? 10 : 8)}
                color={Colors.goldLight}
                style={[styles.sparkle, pos]}
              />
            ))}

            <View style={styles.crownCircle}>
              <Icon name="crown-outline" size={fs(44)} color={Colors.white} />
            </View>
          </View>

          <Text style={styles.title}>{Strings.yourePremiumNow}</Text>

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

          <Text style={styles.subtitle}>{Strings.premiumWelcomeMessage}</Text>

          <View style={styles.detailsCard}>
            <View style={styles.activeCheckWrap}>
              <Icon name="check" size={fs(20)} color={Colors.white} />
            </View>

            <View style={styles.detailsTextWrap}>
              <Text style={styles.activeTitle}>
                {Strings.subscriptionActive}
              </Text>
              <Text style={styles.planDetail}>
                {planLabel} · {priceLabel}
                {Strings.perMonth}
              </Text>
              {nextBilling ? (
                <Text style={styles.billingText}>
                  {Strings.nextBillingDate.replace('{date}', nextBilling)}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.perksGrid}>
            {SUCCESS_PERKS.map(perk => (
              <View key={perk.label} style={styles.perkCard}>
                {renderPerkIcon(perk)}
                <Text style={styles.perkLabel}>{perk.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.boostText}>
            {Strings.profileBoostedFor24Hours}
          </Text>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <PrimaryButton
            title={Strings.startExploringMatches}
            onPress={() => navigateToHomeTab(navigation)}
            showArrow
          />
          <TouchableOpacity
            style={styles.manageLinkWrap}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ManageSubscription')}
          >
            <Text style={styles.manageLink}>{Strings.manageSubscription}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('2%'),
    paddingBottom: hp('2%'),
    alignItems: 'center',
  },
  heroWrap: {
    width: wp('40%'),
    height: wp('40%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.5%'),
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
    opacity: 0.9,
  },
  crownCircle: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: hp('0.8%') },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
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
    marginBottom: hp('1.2%'),
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2.4%'),
    marginBottom: hp('2.2%'),
    paddingHorizontal: wp('2%'),
  },
  detailsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    padding: wp('4%'),
    marginBottom: hp('2%'),
    gap: wp('3.5%'),
  },
  activeCheckWrap: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsTextWrap: {
    flex: 1,
  },
  activeTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.3%'),
  },
  planDetail: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('0.2%'),
  },
  billingText: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  perksGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  perkCard: {
    width: '48%',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
    alignItems: 'center',
    marginBottom: hp('1.2%'),
    gap: hp('0.8%'),
  },
  perkCustomIcon: {
    width: wp('7%'),
    height: wp('7%'),
  },
  perkLabel: {
    fontSize: fs(12),
    fontFamily: Fonts.bold,
    color: Colors.label,
    textAlign: 'center',
  },
  boostText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: Colors.gold,
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },
  footer: {
    width: '100%',
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1%'),
    backgroundColor: 'transparent',
  },
  manageLinkWrap: {
    alignItems: 'center',
    marginTop: hp('1.2%'),
  },
  manageLink: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
});

export default PremiumSuccessScreen;
