import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import ScreenHeader from '../../Components/ScreenHeader';
import PrimaryButton from '../../Components/PrimaryButton';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  mapSubscriptions,
  type SubscriptionPlansData,
} from '../../API';
import { AuthStyles } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ComparePlans'
>;

type ColumnTier = 'free' | 'vip' | 'vvip';

const FEATURE_COL_WIDTH = wp('34%');
const PLAN_GAP = wp('1.8%');

const COLUMN_COLORS: Record<ColumnTier, string> = {
  free: Colors.label,
  vip: '#D4A017',
  vvip: Colors.primary,
};

const ComparePlansScreen = () => {
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

  const renderCell = (value: boolean | string, tier: ColumnTier) => {
    const color = COLUMN_COLORS[tier];

    if (value === true) {
      return <Icon name="check-circle" size={fs(17)} color={color} />;
    }
    if (value === false) {
      return <Icon name="close-circle" size={fs(17)} color={Colors.label} />;
    }

    return (
      <Text
        style={[styles.valueText, { color }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
    );
  };

  const renderPlanTabs = () => (
    <View style={styles.planTabsRow}>
      <View style={styles.tabFree}>
        <Text style={styles.tabFreeText}>{plans.freePlan.badge || plans.freePlan.title || 'Free'}</Text>
      </View>
      <View style={styles.tabVip}>
        <Text style={styles.tabVipText}>{plans.vipPlan.badge || plans.vipPlan.title || 'VIP'}</Text>
      </View>
      <View style={styles.tabVvip}>
        <Text style={styles.tabVvipText}>{plans.vvipPlan.badge || plans.vvipPlan.title || 'VVIP'}</Text>
      </View>
    </View>
  );

  const renderPlanValues = (
    free: boolean | string,
    vip: boolean | string,
    vvip: boolean | string,
  ) => (
    <View style={styles.planValuesRow}>
      <View style={styles.planValueCell}>{renderCell(free, 'free')}</View>
      <View style={styles.planValueCell}>{renderCell(vip, 'vip')}</View>
      <View style={styles.planValueCell}>{renderCell(vvip, 'vvip')}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFE5EC', '#FFF8FA', Colors.background]}
          style={styles.topGlow}
        />

        <ScreenHeader
          title={Strings.comparePlansTitle}
          onBack={() => navigation.goBack()}
          compact
          style={styles.header}
          rightElement={
            <TouchableOpacity activeOpacity={0.85} style={styles.helpBtn}>
              <Text style={styles.helpLink}>{Strings.helpQuestion}</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
          <View style={styles.tableHeaderRow}>
            <View style={styles.featureColSpacer} />
            {renderPlanTabs()}
          </View>

          <View style={styles.compareCard}>
            {plans.compareRows.map((row, index) => (
              <View
                key={row.label}
                style={[
                  styles.compareRow,
                  index > 0 && styles.compareRowBorder,
                ]}
              >
                <Text style={styles.featureLabel}>{row.label}</Text>
                {renderPlanValues(row.free, row.vip, row.vvip)}
              </View>
            ))}
          </View>

          <View style={styles.actionButtons}>
            <PrimaryButton
              title={Strings.upgradeToPremium}
              onPress={() => {
                if (!plans.vipPlan.apiId && !plans.vipPlan.priceLabel) {
                  return;
                }

                navigation.navigate('CompletePayment', {
                  plan: 'VIP',
                  price: plans.vipPlan.price,
                  priceLabel: plans.vipPlan.priceLabel,
                });
              }}
              showArrow
            />
            <TouchableOpacity
              style={styles.freeBtn}
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.freeBtnText}>{Strings.startWithFree}</Text>
              <Icon name="arrow-right" size={fs(18)} color={Colors.gold} />
            </TouchableOpacity>
          </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('18%'),
  },
  header: {
    marginVertical: hp('2.2%'),
    zIndex: 1,
  },
  helpBtn: {
    minWidth: AuthStyles.backButtonSize,
    alignItems: 'flex-end',
  },
  helpLink: {
    fontSize: fs(13),
    fontFamily: Fonts.medium,
    fontStyle: 'italic',
    color: Colors.gold,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  loaderWrap: {
    minHeight: hp('40%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  featureColSpacer: {
    width: FEATURE_COL_WIDTH,
  },
  planTabsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: PLAN_GAP,
  },
  tabFree: {
    flex: 1,
    paddingVertical: wp('1.15%'),
    borderRadius: wp('4%'),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabFreeText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.label,
  },
  tabVip: {
    flex: 1,
    paddingVertical: wp('1.15%'),
    borderRadius: wp('4%'),
    backgroundColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabVipText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  tabVvip: {
    flex: 1,
    paddingVertical: wp('1.15%'),
    borderRadius: wp('4%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabVvipText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  compareCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: '#F0E6E8',
    paddingVertical: hp('0.5%'),
    paddingRight: wp('2.5%'),
    overflow: 'hidden',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.65%'),
    paddingLeft: wp('4%'),
  },
  compareRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  featureLabel: {
    width: FEATURE_COL_WIDTH - wp('4%'),
    fontSize: fs(13),
    fontFamily: Fonts.medium,
    color: '#3A3A3A',
    lineHeight: hp('2%'),
  },
  planValuesRow: {
    flex: 1,
    flexDirection: 'row',
    gap: PLAN_GAP,
  },
  planValueCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp('3%'),
    paddingHorizontal: wp('0.5%'),
  },
  valueText: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    textAlign: 'center',
    lineHeight: hp('1.6%'),
  },
  actionButtons: {
    marginTop: hp('2.5%'),
    gap: hp('1.2%'),
    alignSelf: 'stretch',
  },
  freeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: AuthStyles.buttonHeight,
    gap: wp('1.5%'),
  },
  freeBtnText: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.gold,
  },
});

export default ComparePlansScreen;
