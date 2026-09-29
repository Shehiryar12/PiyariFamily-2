import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  unselectedBackgroundColor?: string;
};

const FilterChip = ({
  label,
  selected = false,
  onPress,
  style,
  unselectedBackgroundColor,
}: Props) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        !selected && unselectedBackgroundColor
          ? { backgroundColor: unselectedBackgroundColor }
          : null,
        selected && styles.chipSelected,
        style,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.9%'),
    borderRadius: wp('4%'),
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1,
    borderColor: Colors.focusBorder,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
});

export default FilterChip;
