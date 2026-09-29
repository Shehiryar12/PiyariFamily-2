import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import {
  Api,
  applyReferralRedeem,
  getApiErrorMessage,
  isApiSuccess,
  mapReferralHistory,
  mergeReferralData,
  type ReferralHistoryItem,
  type ReferralRedeemOption,
  type ReferralStats,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { fs, hp, wp } from '../../Functions/responsive';
import {
  selectReferralStats,
  setReferralStats,
  useAppDispatch,
  useAppSelector,
} from '../../Redux';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'MyRewards'
>;

const DEFAULT_STATS: ReferralStats = {
  referralCode: '',
  referralLink: '',
  registered: 0,
  pointsEarned: 0,
  pointValuePkr: 0,
  totalValuePkr: 0,
  conversionRate: '',
  rewardsTable: [],
  shareMessage: '',
  redeemOptions: [],
  redeemed: 0,
};

const MyRewardsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const cachedStats = useAppSelector(selectReferralStats);
  const stats = cachedStats ?? DEFAULT_STATS;
  const cachedStatsRef = useRef(cachedStats);
  cachedStatsRef.current = cachedStats;
  const [referralHistory, setReferralHistory] = useState<ReferralHistoryItem[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(!cachedStats);
  const [redeemingType, setRedeemingType] = useState<string | null>(null);

  const fetchReferralStats = useCallback(async () => {
    setRewardsLoading(true);

    try {
      const [linkResult, rewardsResult, statsResult] = await Promise.allSettled([
        Api.getReferralLink(),
        Api.getReferralRewards(),
        Api.getReferralStats(),
      ]);
      const linkRes =
        linkResult.status === 'fulfilled' ? linkResult.value : null;
      const rewardsRes =
        rewardsResult.status === 'fulfilled' ? rewardsResult.value : null;
      const statsRes =
        statsResult.status === 'fulfilled' ? statsResult.value : null;
      const linkOk = isApiSuccess(linkRes?.status, linkRes?.data?.success);
      const rewardsOk = isApiSuccess(
        rewardsRes?.status,
        rewardsRes?.data?.success,
      );
      const statsOk = isApiSuccess(statsRes?.status, statsRes?.data?.success);

      console.log(
        '[Referral] GET /referrals/link',
        JSON.stringify(
          {
            status: linkResult.status,
            httpStatus: linkRes?.status,
            data:
              linkRes?.data ??
              (linkResult.status === 'rejected' ? String(linkResult.reason) : null),
          },
          null,
          2,
        ),
      );
      console.log(
        '[Referral] GET /referrals/rewards',
        JSON.stringify(
          {
            status: rewardsResult.status,
            httpStatus: rewardsRes?.status,
            data:
              rewardsRes?.data ??
              (rewardsResult.status === 'rejected'
                ? String(rewardsResult.reason)
                : null),
          },
          null,
          2,
        ),
      );
      console.log(
        '[Referral] GET /referrals/stats',
        JSON.stringify(
          {
            status: statsResult.status,
            httpStatus: statsRes?.status,
            data:
              statsRes?.data ??
              (statsResult.status === 'rejected' ? String(statsResult.reason) : null),
          },
          null,
          2,
        ),
      );

      if (linkOk || rewardsOk || statsOk) {
        dispatch(
          setReferralStats(
            mergeReferralData(
              linkOk ? linkRes?.data : null,
              rewardsOk ? rewardsRes?.data : null,
              statsOk ? statsRes?.data : null,
              cachedStatsRef.current,
            ),
          ),
        );
      }

      if (linkResult.status === 'rejected') {
        Toast.show(
          getApiErrorMessage(linkResult.reason, 'Failed to load referral link'),
          Toast.LONG,
        );
      } else if (!linkOk) {
        Toast.show(
          linkRes?.data?.message ?? 'Failed to load referral link',
          Toast.LONG,
        );
      }

      if (rewardsResult.status === 'rejected') {
        Toast.show(
          getApiErrorMessage(
            rewardsResult.reason,
            'Failed to load referral rewards',
          ),
          Toast.LONG,
        );
      } else if (!rewardsOk) {
        Toast.show(
          rewardsRes?.data?.message ?? 'Failed to load referral rewards',
          Toast.LONG,
        );
      }

      if (statsResult.status === 'rejected') {
        Toast.show(
          getApiErrorMessage(
            statsResult.reason,
            'Failed to load referral stats',
          ),
          Toast.LONG,
        );
      } else if (!statsOk) {
        Toast.show(
          statsRes?.data?.message ?? 'Failed to load referral stats',
          Toast.LONG,
        );
      }
    } catch (error) {
      console.log(
        '[Referral] My Rewards fetch error',
        getApiErrorMessage(error, 'Failed to load referral rewards'),
      );
      Toast.show(
        getApiErrorMessage(error, 'Failed to load referral rewards'),
        Toast.LONG,
      );
    } finally {
      setRewardsLoading(false);
    }
  }, [dispatch]);

  const fetchReferralHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const res = await Api.getReferralHistory();

      if (isApiSuccess(res?.status, res?.data?.success)) {
        setReferralHistory(mapReferralHistory(res?.data));
      } else {
        const message =
          res?.data?.message ?? 'Failed to load referral history';
        setReferralHistory([]);
        setHistoryError(message);
        Toast.show(message, Toast.LONG);
      }
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Failed to load referral history',
      );
      setReferralHistory([]);
      setHistoryError(message);
      Toast.show(message, Toast.LONG);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReferralStats();
      fetchReferralHistory();
    }, [fetchReferralStats, fetchReferralHistory]),
  );

  const handleRedeem = useCallback(
    async (option: ReferralRedeemOption) => {
      if (!option.type || redeemingType) {
        return;
      }

      setRedeemingType(option.type);

      try {
        const res = await Api.redeemReferralReward(option.type);

        if (isApiSuccess(res?.status, res?.data?.success)) {
          dispatch(setReferralStats(applyReferralRedeem(stats, res?.data)));
          Toast.show(
            res?.data?.message ?? Strings.rewardRedeemed,
            Toast.LONG,
          );
          fetchReferralStats();
          fetchReferralHistory();
        } else {
          Toast.show(
            res?.data?.message ?? 'Failed to redeem reward',
            Toast.LONG,
          );
        }
      } catch (error) {
        Toast.show(
          getApiErrorMessage(error, 'Failed to redeem reward'),
          Toast.LONG,
        );
      } finally {
        setRedeemingType(null);
      }
    },
    [dispatch, fetchReferralHistory, fetchReferralStats, redeemingType, stats],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#FFE5EC', '#FFF8FA', Colors.background]}
        style={styles.topGlow}
      />

      <ScreenHeader
        title={Strings.myRewards}
        onBack={() => navigation.goBack()}
        style={styles.screenHeader}
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {rewardsLoading && !cachedStats ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : null}

        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.heroCard}
        >
          <Icon name="crown" size={fs(26)} color={Colors.gold} />
          <Text style={styles.heroLabel}>{Strings.totalPoints}</Text>
          <Text style={styles.heroPoints}>{stats.pointsEarned} pts</Text>
          <Text style={styles.heroPkr}>
            1 pt = PKR {stats.pointValuePkr}
            {stats.totalValuePkr
              ? `  ·  Total PKR ${stats.totalValuePkr}`
              : ''}
          </Text>
        </LinearGradient>

        <Text style={styles.sectionLabel}>{Strings.rewardsBreakdown}</Text>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCard}>
            <Icon name="account-outline" size={fs(18)} color={Colors.primary} />
            <Text style={styles.breakdownValue}>{stats.registered}</Text>
            <Text style={styles.breakdownLabel}>{Strings.registrations}</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Icon name="star-outline" size={fs(18)} color={Colors.primary} />
            <Text style={styles.breakdownValue}>{stats.pointsEarned}</Text>
            <Text style={styles.breakdownLabel}>{Strings.points}</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Icon name="gift-outline" size={fs(18)} color={Colors.primary} />
            <Text style={styles.breakdownValue}>{stats.redeemed}</Text>
            <Text style={styles.breakdownLabel}>{Strings.redeemed}</Text>
          </View>
        </View>

        {stats.redeemOptions.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{Strings.howToRedeem}</Text>
            {stats.redeemOptions.map(option => (
          <View key={option.id} style={styles.redeemCard}>
            <View style={styles.redeemIconWrap}>
              <Icon name={option.icon} size={fs(18)} color={Colors.primary} />
            </View>
            <View style={styles.redeemTextWrap}>
              <Text style={styles.redeemTitle}>{option.title}</Text>
              <Text style={styles.redeemPoints}>{option.pointsRequired}</Text>
            </View>
            <TouchableOpacity
              style={styles.redeemBtn}
              activeOpacity={0.88}
              disabled={Boolean(redeemingType)}
              onPress={() => handleRedeem(option)}
            >
              {redeemingType === option.type ? (
                <ActivityIndicator size="small" color={Colors.gold} />
              ) : (
                <>
                  <Text style={styles.redeemBtnText}>{Strings.redeem}</Text>
                  <Icon name="arrow-right" size={fs(14)} color={Colors.gold} />
                </>
              )}
            </TouchableOpacity>
          </View>
            ))}
          </>
        ) : null}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionLabelInline}>
            {Strings.referralHistory}
          </Text>
        </View>

        {historyLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : historyError ? (
          <Text style={styles.emptyText}>{historyError}</Text>
        ) : referralHistory.length > 0 ? (
          referralHistory.map(item => (
            <View key={item.id} style={styles.historyRow}>
              <Image source={item.image} style={styles.historyAvatar} />
              <View style={styles.historyTextWrap}>
                <Text style={styles.historyName}>{item.name}</Text>
                {item.subtitle ? (
                  <Text style={styles.historySubtext}>{item.subtitle}</Text>
                ) : null}
              </View>
              <View style={styles.historyRight}>
                {item.isRegistered ? (
                  <View style={styles.registeredBadge}>
                    <Icon name="check" size={fs(10)} color="#22C55E" />
                    <Text style={styles.registeredBadgeText}>
                      {item.statusLabel || Strings.registeredBadge}
                    </Text>
                  </View>
                ) : item.statusLabel ? (
                  <Text style={styles.historySubtext}>{item.statusLabel}</Text>
                ) : null}
                <Text style={styles.historyPoints}>{item.points}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{Strings.referralHistoryEmpty}</Text>
        )}
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
    height: hp('18%'),
  },
  screenHeader: {
    marginBottom: hp('1%'),
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('3%'),
  },
  loaderWrap: {
    minHeight: hp('12%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: hp('2%'),
  },
  heroCard: {
    borderRadius: wp('4.5%'),
    paddingVertical: hp('2.2%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  heroLabel: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.9)',
    marginTop: hp('0.8%'),
    marginBottom: hp('0.3%'),
  },
  heroPoints: {
    fontSize: fs(30),
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  heroPkr: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.9)',
    marginTop: hp('0.4%'),
  },
  sectionLabel: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: hp('0.8%'),
  },
  sectionLabelInline: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F3DDE3',
    paddingVertical: hp('1.2%'),
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.gold,
    marginTop: hp('0.4%'),
    marginBottom: hp('0.15%'),
  },
  breakdownLabel: {
    fontSize: fs(9),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    textAlign: 'center',
  },
  redeemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: wp('3.5%'),
    marginBottom: hp('1%'),
  },
  redeemIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2.5%'),
  },
  redeemTextWrap: {
    flex: 1,
    marginRight: wp('2%'),
  },
  redeemTitle: {
    fontSize: fs(12),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  redeemPoints: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    backgroundColor: '#FFF8E7',
    borderRadius: wp('2.5%'),
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.55%'),
  },
  redeemBtnText: {
    fontSize: fs(11),
    fontFamily: Fonts.bold,
    color: Colors.gold,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: wp('3%'),
    marginBottom: hp('0.8%'),
  },
  historyAvatar: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    marginRight: wp('2.5%'),
  },
  historyTextWrap: {
    flex: 1,
  },
  historyName: {
    fontSize: fs(13),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.15%'),
  },
  historySubtext: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    backgroundColor: '#ECFDF3',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('1.8%'),
    paddingVertical: hp('0.2%'),
    marginBottom: hp('0.3%'),
  },
  registeredBadgeText: {
    fontSize: fs(9),
    fontFamily: Fonts.semiBold,
    color: '#22C55E',
  },
  historyPoints: {
    fontSize: fs(12),
    fontFamily: Fonts.bold,
    color: Colors.gold,
  },
});

export default MyRewardsScreen;
