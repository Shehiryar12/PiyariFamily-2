import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../Constant/Colors';
import { hp, wp } from '../Functions/responsive';

const AuthSoftGlow = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={['rgba(255, 205, 217, 0.45)', 'rgba(255, 255, 255, 0)']}
        style={styles.glowTopRight}
      />
      <LinearGradient
        colors={['rgba(255, 229, 180, 0.35)', 'rgba(255, 255, 255, 0)']}
        style={styles.glowBottomLeft}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  glowTopRight: {
    position: 'absolute',
    top: -hp('4%'),
    right: -wp('10%'),
    width: wp('55%'),
    height: hp('22%'),
    borderRadius: wp('28%'),
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: hp('18%'),
    left: -wp('12%'),
    width: wp('50%'),
    height: hp('18%'),
    borderRadius: wp('25%'),
  },
});

export default AuthSoftGlow;
