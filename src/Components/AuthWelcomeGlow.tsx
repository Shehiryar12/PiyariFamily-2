import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { hp, wp } from '../Functions/responsive';

const AuthWelcomeGlow = () => {
  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={['rgba(255, 205, 217, 0.5)', 'rgba(255, 255, 255, 0)']}
        style={styles.glowTop}
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 235, 180, 0.45)']}
        style={styles.glowBottom}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('38%'),
  },
  glowBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp('32%'),
  },
});

export default AuthWelcomeGlow;
