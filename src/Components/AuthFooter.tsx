import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { hp } from '../Functions/responsive';

type Props = {
  prefix: string;
  linkText: string;
  onPress: () => void;
  style?: ViewStyle;
};

const AuthFooter = ({ prefix, linkText, onPress, style }: Props) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.prefix}>{prefix} </Text>
      <TouchableOpacity
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Text style={styles.link}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp('1.6%'),
    flexWrap: 'wrap',
  },
  prefix: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  link: {
    fontSize: FontSizes.body,
    color: Colors.gold,
    fontFamily: Fonts.semiBold,
  },
});

export default AuthFooter;
