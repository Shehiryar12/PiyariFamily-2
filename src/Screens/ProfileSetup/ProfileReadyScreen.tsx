import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import { setLastAccount, setSetupComplete, store } from '../../Redux';
import { pickPersonName } from '../../Functions/welcomeGreeting';

type Props = {
  navigation: {
    replace: (screen: string) => void;
    reset: (state: { index: number; routes: Array<{ name: string }> }) => void;
  };
};

const ProfileReadyScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  const goToLogin = () => {
    const { auth, profile } = store.getState();
    store.dispatch(setSetupComplete(true));
    store.dispatch(
      setLastAccount({
        name: pickPersonName(profile.profile?.name, auth.user?.name),
        email: auth.user?.email || profile.profile?.email,
      }),
    );
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView
      style={styles.root}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.content}>
        <View style={styles.centerArea}>
          <Image
            source={Images.profileReadyIllustration}
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

          <Text style={styles.title}>
            {Strings.profileReadyTitle}{' '}
            <Text style={styles.titleHighlight}>
              {Strings.profileReadyHighlight}
            </Text>
          </Text>
          <Text style={styles.subtitle}>{Strings.profileReadySubtitle}</Text>
        </View>

        <View
          style={[
            styles.footer,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <PrimaryButton
            title={Strings.continueBtn}
            onPress={goToLogin}
            showArrow
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp('2%'),
  },
  illustration: {
    width: wp('55%'),
    height: wp('55%'),
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
    fontFamily: Fonts.bold,
    color: Colors.label,
    textAlign: 'center',
    marginBottom: hp('1.5%'),
    letterSpacing: -0.3,
    lineHeight: hp('3.2%'),
    paddingHorizontal: wp('2%'),
  },
  titleHighlight: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2.4%'),
    paddingHorizontal: wp('4%'),
  },
  footer: {
    paddingTop: hp('1.5%'),
  },
});

export default ProfileReadyScreen;
