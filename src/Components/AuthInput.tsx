import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

type Props = TextInputProps & {
  label: string;
  iconName?: string;
  iconSource?: ImageSourcePropType;
  showToggle?: boolean;
  iconColor?: string;
  compact?: boolean;
};

const AuthInput = ({
  label,
  iconName,
  iconSource,
  showToggle = false,
  iconColor = Colors.primary,
  compact = false,
  secureTextEntry,
  ...rest
}: Props) => {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>
        {label}
      </Text>
      <View style={[styles.inputRow, compact && styles.inputRowCompact]}>
        {iconSource ? (
          <Image
            source={iconSource}
            style={[styles.leftIcon, styles.iconImage]}
            resizeMode="contain"
          />
        ) : (
          <Icon
            name={iconName!}
            size={fs(20)}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={showToggle ? hidden : secureTextEntry}
          {...rest}
        />
        {showToggle && (
          <TouchableOpacity
            onPress={() => setHidden(prev => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.eyeBtn}
          >
            <Icon
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={fs(20)}
              color={Colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: wp('2.2%'),
  },
  wrapperCompact: {
    marginBottom: wp('1.2%'),
  },
  label: {
    fontSize: FontSizes.body,
    color: Colors.label,
    marginBottom: AuthStyles.fieldLabelGap,
    fontFamily: Fonts.medium,
    includeFontPadding: false,
    lineHeight: FontSizes.body + 2,
  },
  labelCompact: {
    marginBottom: hp('0.4%'),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.7%'),
    height: AuthStyles.inputHeight,
  },
  inputRowCompact: {
    height: hp('5.4%'),
  },
  leftIcon: {
    marginRight: wp('2.7%'),
  },
  iconImage: {
    width: fs(20),
    height: fs(20),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.body,
    color: Colors.text,
    fontFamily: Fonts.regular,
    paddingVertical: 0,
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: wp('2%'),
  },
});

export default AuthInput;
