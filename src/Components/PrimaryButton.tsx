import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../Constant/Colors';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Fonts } from '../Constant/Fonts';
import { fs, wp } from '../Functions/responsive';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  leftIcon?: string;
  style?: ViewStyle;
};

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  showArrow = false,
  leftIcon,
  style,
}: Props) => {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={Colors.white}
            size="small"
            style={styles.loader}
          />
        ) : leftIcon ? (
          <Icon
            name={leftIcon}
            size={fs(20)}
            color={Colors.white}
            style={styles.leftIcon}
          />
        ) : null}
        <Text style={styles.text}>{title}</Text>
        {!loading && showArrow ? (
          <Icon
            name="arrow-right"
            size={fs(20)}
            color={Colors.white}
            style={styles.arrow}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: AuthStyles.buttonRadius,
    height: AuthStyles.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: wp('2.5%'),
  },
  leftIcon: {
    marginRight: wp('2%'),
  },
  arrow: {
    marginLeft: wp('2%'),
  },
  text: {
    color: Colors.white,
    fontSize: FontSizes.button,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.2,
  },
});

export default PrimaryButton;
