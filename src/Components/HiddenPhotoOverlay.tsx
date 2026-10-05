import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../Constant/Colors';
import { fs } from '../Functions/responsive';

const HiddenPhotoOverlay = () => (
  <View style={styles.overlay} pointerEvents="none">
    <View style={styles.badge}>
      <Icon name="lock" size={fs(16)} color={Colors.white} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  badge: {
    width: fs(36),
    height: fs(36),
    borderRadius: fs(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});

export default HiddenPhotoOverlay;
