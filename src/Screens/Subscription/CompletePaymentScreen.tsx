import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../Components/ScreenHeader';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { fs, hp, wp } from '../../Functions/responsive';

type RouteProps = RouteProp<ProfileStackParamList, 'CompletePayment'>;
type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'CompletePayment'
>;

type PaymentMethod = 'google' | 'apple' | 'card';

type MethodConfig = {
  id: PaymentMethod;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  subtext?: string;
  recommended?: boolean;
};

const PAYMENT_METHODS: MethodConfig[] = [
  {
    id: 'google',
    label: Strings.googlePay,
    icon: 'wallet-outline',
    iconBg: '#E0F7FA',
    iconColor: '#00838F',
    recommended: true,
  },
  {
    id: 'apple',
    label: Strings.applePay,
    icon: 'apple',
    iconBg: '#F0F0F0',
    iconColor: Colors.black,
    subtext: Strings.applePaySubtext,
  },
  {
    id: 'card',
    label: Strings.cardPayment,
    icon: 'credit-card-outline',
    iconBg: Colors.tabActiveBg,
    iconColor: Colors.primary,
    subtext: Strings.cardPaySubtext,
  },
];

const CompletePaymentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { plan, priceLabel } = route.params;
  const [method, setMethod] = useState<PaymentMethod>('google');
  const [cardExpanded, setCardExpanded] = useState(true);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  useHideTabBar();

  const handlePay = () => {
    navigation.navigate('PremiumSuccess', {
      plan,
      priceLabel,
    });
  };

  const renderInput = (
    icon: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    options?: { secure?: boolean; keyboard?: 'number-pad' },
  ) => (
    <View style={styles.inputRow}>
      <Icon name={icon} size={fs(18)} color={Colors.primary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={options?.secure}
        keyboardType={options?.keyboard}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={Strings.completePayment}
        onBack={() => navigation.goBack()}
        compact
        rightElement={
          <TouchableOpacity activeOpacity={0.85} style={styles.bellBtn}>
            <Icon name="bell-outline" size={fs(20)} color={Colors.primary} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.secureBar}
            activeOpacity={0.9}
            onPress={handlePay}
          >
            <View style={styles.secureBarContent}>
              <Icon name="lock-outline" size={fs(18)} color={Colors.white} />
              <Text style={styles.secureBarText}>
                {Strings.paySecurely.replace(
                  '{amount}',
                  priceLabel.replace('PKR ', ''),
                )}
              </Text>
              <Icon name="arrow-right" size={fs(18)} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.planSummary}>
            <View style={styles.crownBadge}>
              <Icon name="crown" size={fs(20)} color={Colors.white} />
            </View>
            <Text style={styles.planName}>
              {plan === 'VIP' ? Strings.vipPlan : Strings.vvipPlan}
            </Text>
            <Text style={styles.planPrice}>
              {priceLabel}
              {Strings.perMonth}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>{Strings.choosePaymentMethod}</Text>
          {PAYMENT_METHODS.map(item => {
            const selected = method === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.methodRow}
                activeOpacity={0.85}
                onPress={() => setMethod(item.id)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    !selected && styles.radioOuterInactive,
                  ]}
                >
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <View
                  style={[
                    styles.methodIconWrap,
                    { backgroundColor: item.iconBg },
                  ]}
                >
                  <Icon name={item.icon} size={fs(20)} color={item.iconColor} />
                </View>
                <View style={styles.methodTextWrap}>
                  <Text style={styles.methodLabel}>{item.label}</Text>
                  {item.subtext ? (
                    <Text style={styles.methodSubtext}>{item.subtext}</Text>
                  ) : null}
                </View>
                {item.recommended ? (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>
                      {Strings.recommended}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}

          <View style={styles.cardDetailsCard}>
            <TouchableOpacity
              style={styles.cardAccordionHeader}
              activeOpacity={0.85}
              onPress={() => setCardExpanded(prev => !prev)}
            >
              <Text style={styles.cardAccordionTitle}>
                {Strings.cardDetails}
              </Text>
              <Icon
                name={cardExpanded ? 'chevron-down' : 'chevron-up'}
                size={fs(22)}
                color={Colors.primary}
              />
            </TouchableOpacity>

            {cardExpanded ? (
              <View style={styles.cardForm}>
                {renderInput(
                  'account-outline',
                  Strings.cardHolderName,
                  cardHolder,
                  setCardHolder,
                )}
                {renderInput(
                  'credit-card-outline',
                  Strings.cardNumber,
                  cardNumber,
                  setCardNumber,
                  { keyboard: 'number-pad' },
                )}
                {renderInput(
                  'calendar-outline',
                  Strings.expiryDate,
                  expiry,
                  setExpiry,
                )}
                {renderInput('lock-outline', Strings.cvv, cvv, setCvv, {
                  secure: true,
                  keyboard: 'number-pad',
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.secureNotice}>
            <Icon name="shield-check" size={fs(18)} color={Colors.gold} />
            <Text style={styles.secureNoticeText}>
              {Strings.paymentSecureNotice}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  bellBtn: {
    width: AuthStyles.backButtonSize,
    height: AuthStyles.backButtonSize,
    borderRadius: wp('2.8%'),
    backgroundColor: Colors.backButtonPink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: hp('0.6%'),
    right: wp('1.8%'),
    width: wp('2.2%'),
    height: wp('2.2%'),
    borderRadius: wp('1.1%'),
    backgroundColor: '#FF9800',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('3%'),
  },
  secureBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4.5%'),
    paddingVertical: hp('1.6%'),
    marginBottom: hp('2%'),
  },
  secureBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
  },
  secureBarText: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  planSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    marginBottom: hp('2.2%'),
    gap: wp('3%'),
  },
  crownBadge: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('2.8%'),
    backgroundColor: '#E59500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    flex: 1,
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.label,
  },
  planPrice: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  sectionLabel: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('1.2%'),
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: wp('3.5%'),
    padding: wp('3.5%'),
    marginBottom: hp('1%'),
    gap: wp('2.5%'),
    backgroundColor: Colors.white,
  },
  radioOuter: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterInactive: {
    borderColor: Colors.focusBorder,
  },
  radioInner: {
    width: wp('2.4%'),
    height: wp('2.4%'),
    borderRadius: wp('1.2%'),
    backgroundColor: Colors.primary,
  },
  methodIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextWrap: {
    flex: 1,
  },
  methodLabel: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.label,
  },
  methodSubtext: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: hp('0.2%'),
  },
  recommendedBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.3%'),
    borderRadius: wp('2%'),
  },
  recommendedText: {
    fontSize: fs(9),
    fontFamily: Fonts.bold,
    color: '#E59500',
  },
  cardDetailsCard: {
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('4%'),
    padding: wp('4%'),
    marginTop: hp('0.8%'),
    marginBottom: hp('1.5%'),
  },
  cardAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1.2%'),
  },
  cardAccordionTitle: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.label,
  },
  cardForm: {
    gap: hp('1%'),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    gap: wp('2.5%'),
    minHeight: AuthStyles.inputHeight,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: hp('1.2%'),
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2.5%'),
    backgroundColor: '#FEF9E7',
    borderRadius: wp('3%'),
    borderWidth: 1,
    borderColor: '#F5E6A8',
    padding: wp('3.5%'),
  },
  secureNoticeText: {
    flex: 1,
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: Colors.textLight,
    lineHeight: hp('1.9%'),
  },
});

export default CompletePaymentScreen;
