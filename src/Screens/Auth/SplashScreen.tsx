import React, { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../../Assets';
import { AuthStyles } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { hp } from '../../Functions/responsive';
import { isProfileSetupComplete } from '../../Functions/authNavigation';
import { clearSession, store, waitForPersistor } from '../../Redux';

type Props = {
  navigation: {
    replace: (screen: string) => void;
    reset: (state: {
      index: number;
      routes: Array<{ name: string; params?: object; state?: object }>;
    }) => void;
  };
};

const SplashScreen = ({ navigation }: Props) => {
  useEffect(() => {
    let cancelled = false;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;

    const openSavedSession = async () => {
      await waitForPersistor();

      if (cancelled) {
        return;
      }

      await new Promise<void>(resolve => {
        delayTimer = setTimeout(resolve, 3500);
      });

      if (cancelled) {
        return;
      }

      const { auth, profile, app } = store.getState();
      const hasToken = Boolean(auth.accessToken);
      const setupComplete = isProfileSetupComplete(profile.profile);

      if (hasToken && setupComplete) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }

      if (hasToken && !setupComplete) {
        await clearSession({ rememberAccount: true });
      }

      if (store.getState().app.hasSeenWelcome || app.hasSeenWelcome) {
        navigation.replace('Login');
        return;
      }

      navigation.replace('Onboarding');
    };

    void openSavedSession();

    return () => {
      cancelled = true;
      if (delayTimer) {
        clearTimeout(delayTimer);
      }
    };
  }, [navigation]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.content}>
          <Image
            source={Images.splashIllustration}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AuthStyles.horizontalPadding,
    backgroundColor: Colors.white,
  },
  splashImage: {
    width: '100%',
    height: hp('85%'),
  },
});

export default SplashScreen;
