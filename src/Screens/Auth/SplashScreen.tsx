import React, { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../../Assets';
import { AuthStyles } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { hp } from '../../Functions/responsive';
import {
  isProfileSetupComplete,
  leaveDeactivatedForLogin,
  resetToAccountDeactivated,
} from '../../Functions/authNavigation';
import { clearSession, store, waitForPersistor } from '../../Redux';
import { refreshAccountStatus } from '../../API';

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

      const hasToken = Boolean(store.getState().auth.accessToken);
      const wasInactive =
        store.getState().profile.accountStatus === 'inactive';
      const statusPromise = hasToken
        ? refreshAccountStatus().catch(() => store.getState().profile.accountStatus)
        : Promise.resolve(null);

      await new Promise<void>(resolve => {
        delayTimer = setTimeout(resolve, 3500);
      });

      if (cancelled) {
        return;
      }

      const remoteStatus = await statusPromise;

      if (cancelled) {
        return;
      }

      if (
        remoteStatus === 'unauthenticated' ||
        (wasInactive && remoteStatus === 'active')
      ) {
        await leaveDeactivatedForLogin();
        return;
      }

      const { auth, profile, app } = store.getState();
      const setupComplete = isProfileSetupComplete(profile.profile);
      const stillLoggedIn = Boolean(auth.accessToken);
      const isInactive =
        wasInactive ||
        remoteStatus === 'inactive' ||
        profile.accountStatus === 'inactive';

      if (stillLoggedIn && isInactive) {
        resetToAccountDeactivated();
        return;
      }

      if (stillLoggedIn && setupComplete) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }

      if (stillLoggedIn && !setupComplete) {
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
