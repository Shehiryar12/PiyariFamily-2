import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  currentStep: number;
  totalSteps: number;
  label: string;
  style?: ViewStyle;
};

const SetupProgressBar = ({
  currentStep,
  totalSteps,
  label,
  style,
}: Props) => {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.barRow}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < currentStep ? styles.segmentActive : styles.segmentInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: hp('2.5%'),
  },
  barRow: {
    flexDirection: 'row',
    gap: wp('1.2%'),
    marginBottom: hp('1%'),
  },
  segment: {
    flex: 1,
    height: hp('0.55%'),
    borderRadius: wp('1%'),
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentInactive: {
    backgroundColor: Colors.gradientStart,
  },
  label: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
  },
});

export default SetupProgressBar;
