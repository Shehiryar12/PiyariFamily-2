import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../Constant/Colors';
import { hp, wp } from '../Functions/responsive';

type Props = {
  total?: number;
  activeIndex?: number;
  style?: ViewStyle;
};

const OnboardingDots = ({ total = 3, activeIndex = 0, style }: Props) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === activeIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    marginVertical: hp('2.2%'),
  },
  dot: {
    borderRadius: wp('1%'),
  },
  activeDot: {
    width: wp('7.5%'),
    height: hp('1%'),
    backgroundColor: Colors.gold,
  },
  inactiveDot: {
    width: wp('2%'),
    height: wp('2%'),
    backgroundColor: Colors.gradientStart,
  },
});

export default OnboardingDots;
