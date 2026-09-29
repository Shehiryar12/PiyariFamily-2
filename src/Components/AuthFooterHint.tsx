import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, wp } from '../Functions/responsive';

type Props = {
  text: string;
  style?: ViewStyle;
};

const AuthFooterHint = ({ text, style }: Props) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Icon
          name="information-outline"
          size={fs(14)}
          color={Colors.textLight}
          style={styles.icon}
        />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: wp('3.2%'),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
  },
  icon: {
    marginRight: wp('1.2%'),
    marginTop: fs(1),
  },
  text: {
    fontSize: FontSizes.caption,
    color: Colors.textLight,
    fontFamily: Fonts.regular,
    textAlign: 'left',
    flexShrink: 1,
  },
});

export default AuthFooterHint;
