import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthBackground from '../../Components/AuthBackground';
import AuthSoftGlow from '../../Components/AuthSoftGlow';
import PrimaryButton from '../../Components/PrimaryButton';
import { Images } from '../../Assets';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { AuthStackParamList } from '../../Navigation/AuthNavigator';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'PasswordResetSuccess'
>;

const STATUS_CARDS = [
  { icon: 'shield-check', label: Strings.secured, color: Colors.primary },
  { icon: 'lock', label: Strings.protected, color: Colors.gold },
] as const;

const PasswordResetSuccessScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleGoToLogin = () => {
    navigation.replace('WelcomeBack');
  };

  return (
    <AuthBackground variant="white">
      <AuthSoftGlow />
      <View style={styles.root}>
        <View style={styles.centerArea}>
          <Image
            source={Images.passwordResetIllustration}
            style={styles.illustration}
            resizeMode="contain"
          />

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

          <Text style={styles.title}>{Strings.passwordResetTitle}</Text>
          <Text style={styles.subtitle}>{Strings.passwordResetSubtitle}</Text>

          <View style={styles.statusRow}>
            {STATUS_CARDS.map(card => (
              <View key={card.label} style={styles.statusCard}>
                <Icon name={card.icon} size={fs(22)} color={card.color} />
                <Text style={styles.statusLabel}>{card.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <PrimaryButton
            title={Strings.goToLogIn}
            onPress={handleGoToLogin}
            showArrow
            style={styles.button}
          />
        </View>
      </View>
    </AuthBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: hp('2%'),
  },
  illustration: {
    width: AuthStyles.illustrationSize,
    height: AuthStyles.illustrationSize,
    marginBottom: hp('1%'),
  },
  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: hp('2.5%'),
  },
  title: {
    fontSize: FontSizes.h2,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    marginBottom: hp('1.2%'),
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: hp('2.75%'),
    textAlign: 'center',
    paddingHorizontal: wp('4%'),
    maxWidth: AuthStyles.maxContentWidth,
    marginBottom: hp('2.5%'),
  },
  statusRow: {
    flexDirection: 'row',
    gap: wp('3%'),
    width: '100%',
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: AuthStyles.featureCardRadius,
    paddingVertical: hp('2%'),
    gap: hp('0.8%'),
  },
  statusLabel: {
    fontSize: FontSizes.bodySmall,
    color: Colors.label,
    fontFamily: Fonts.semiBold,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: AuthStyles.bottomSectionPadding,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: AuthStyles.shadowOffsetY },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default PasswordResetSuccessScreen;
