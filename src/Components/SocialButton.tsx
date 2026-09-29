import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Images } from '../Assets';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

type Provider = 'google' | 'apple';

type Props = {
  provider: Provider;
  title: string;
  onPress: () => void;
  compact?: boolean;
  style?: ViewStyle;
};

const SocialButton = ({
  provider,
  title,
  onPress,
  compact = false,
  style,
}: Props) => {
  return (
    <TouchableOpacity
      style={[styles.button, compact && styles.buttonCompact, style]}
      onPress={onPress}
      activeOpacity={0.88}>
      <View style={styles.iconWrap}>
        {provider === 'google' ? (
          <Image source={Images.googleIcon} style={styles.googleIcon} />
        ) : (
          <Icon name="apple" size={fs(20)} color={Colors.black} brand />
        )}
      </View>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: AuthStyles.buttonRadius,
    backgroundColor: Colors.socialButtonBg,
    height: AuthStyles.buttonHeight,
    marginBottom: hp('1.5%'),
  },
  buttonCompact: {
    height: hp('5.4%'),
    marginBottom: hp('0.7%'),
  },
  iconWrap: {
    width: wp('6.4%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2.7%'),
  },
  googleIcon: {
    width: wp('5.3%'),
    height: wp('5.3%'),
    resizeMode: 'contain',
  },
  text: {
    fontSize: FontSizes.bodyLarge,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
});

export default SocialButton;
