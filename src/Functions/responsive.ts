import { Dimensions } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

export { wp, hp };

export const normalize = (size: number): number => {
  const baseWidth = 375;
  const screenWidth = Dimensions.get('window').width;
  return Math.round((size * screenWidth) / baseWidth);
};

export const fs = normalize;

export const FontSizes = {
  h1: normalize(28),
  h2: normalize(26),
  h3: normalize(24),
  body: normalize(14),
  bodyLarge: normalize(15),
  bodySmall: normalize(13),
  caption: normalize(12),
  button: normalize(16),
  otp: normalize(22),
};
