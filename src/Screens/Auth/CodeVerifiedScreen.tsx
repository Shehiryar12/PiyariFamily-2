import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
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

type Props = {
  navigation: {
    navigate: (screen: string, params?: { email: string }) => void;
  };
};

type CodeVerifiedRoute = RouteProp<AuthStackParamList, 'CodeVerified'>;

const CodeVerifiedScreen = ({ navigation }: Props) => {
  const route = useRoute<CodeVerifiedRoute>();
  const email = route.params.email;
  return (
    <AuthBackground variant="white">
      <AuthSoftGlow />
      <View style={styles.root}>
        <View style={styles.centerArea}>
          <Image
            source={Images.codeVerifiedIllustration}
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

          <Text style={styles.title}>{Strings.codeVerifiedTitle}</Text>
          <Text style={styles.subtitle}>{Strings.codeVerifiedSubtitle}</Text>
        </View>

        <View style={styles.bottomSection}>
          <PrimaryButton
            title={Strings.setNewPassword}
            onPress={() => navigation.navigate('SetNewPassword', { email })}
            showArrow
            style={styles.button}
          />
          <Text style={styles.stepText}>{Strings.codeVerifiedStep}</Text>
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
    marginBottom: hp('1.5%'),
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
  stepText: {
    fontSize: FontSizes.bodySmall,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: hp('2%'),
  },
});

export default CodeVerifiedScreen;
