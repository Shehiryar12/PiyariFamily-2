import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Images } from '../Assets';
import { AuthStyles } from '../Constant/AuthStyles';

const AppLogo = () => {
  return (
    <Image
      source={Images.appLogo}
      style={styles.logoImage}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logoImage: {
    width: AuthStyles.logoSize,
    height: AuthStyles.logoSize,
    borderRadius: AuthStyles.logoRadius,
  },
});

export default AppLogo;
