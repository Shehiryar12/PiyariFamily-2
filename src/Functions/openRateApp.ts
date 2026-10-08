import { Linking, Platform } from 'react-native';
import Toast from 'react-native-simple-toast';
import { Strings } from '../Constant/Strings';

const ANDROID_PACKAGE = 'com.piyarifamily';
const IOS_APP_ID = '';

export const openRateApp = async () => {
  const url =
    Platform.OS === 'ios'
      ? IOS_APP_ID
        ? `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`
        : 'https://apps.apple.com/search?term=PiyariFamily'
      : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

  try {
    await Linking.openURL(url);
  } catch {
    Toast.show(Strings.rateAppError, Toast.LONG);
  }
};
