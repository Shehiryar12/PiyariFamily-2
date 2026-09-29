import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FontSizes } from '../Constant/AuthStyles';
import { Fonts } from '../Constant/Fonts';
import { hp, wp } from '../Functions/responsive';

type Props = {
  password: string;
};

type StrengthLevel = {
  filled: number;
  label: string;
};

const BAR_GRADIENT = ['#6B041D', '#E8953C'];
const EMPTY_BAR = '#FDE8E9';
const LABEL_COLOR = '#D7A03B';

const getStrength = (password: string): StrengthLevel | null => {
  if (!password) {
    return null;
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { filled: 1, label: 'Weak' };
  }

  if (score === 2) {
    return { filled: 2, label: 'Good' };
  }

  return { filled: score >= 4 ? 4 : 3, label: 'Strong' };
};

const PasswordStrengthMeter = ({ password }: Props) => {
  const strength = getStrength(password);

  if (!strength) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {[0, 1, 2, 3].map(index =>
          index < strength.filled ? (
            <LinearGradient
              key={index}
              colors={BAR_GRADIENT}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.bar}
            />
          ) : (
            <View key={index} style={[styles.bar, styles.barEmpty]} />
          ),
        )}
      </View>
      <Text style={styles.label}>{strength.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
    marginTop: hp('0.5%'),
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    gap: wp('1.6%'),
  },
  bar: {
    flex: 1,
    height: hp('0.7%'),
    borderRadius: wp('2%'),
  },
  barEmpty: {
    backgroundColor: EMPTY_BAR,
  },
  label: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.semiBold,
    color: LABEL_COLOR,
    marginLeft: wp('2.7%'),
    minWidth: wp('16%'),
    textAlign: 'right',
  },
});

export default PasswordStrengthMeter;
