import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Images } from '../Assets';
import { AuthStyles } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { fs, hp } from '../Functions/responsive';

type Props = {
  onPress: () => void;
  variant?: 'default' | 'gray' | 'pink';
  compact?: boolean;
};

const BackButton = ({ onPress, variant = 'default', compact = false }: Props) => {
  const isPink = variant === 'pink';
  const isGray = variant === 'gray';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPink && styles.buttonPink,
        isGray && styles.buttonGray,
        compact && styles.buttonCompact,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Image
        source={Images.backArrowIcon}
        style={styles.icon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: AuthStyles.backButtonSize,
    height: AuthStyles.backButtonSize,
    borderRadius: AuthStyles.backButtonSize / 2,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2.5%'),
  },
  buttonPink: {
    backgroundColor: Colors.backButtonPink,
    borderColor: Colors.backButtonPink,
  },
  buttonGray: {
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  buttonCompact: {
    marginBottom: 0,
  },
  icon: {
    width: fs(22),
    height: fs(22),
  },
});

export default BackButton;
