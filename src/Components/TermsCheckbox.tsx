import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { Strings } from '../Constant/Strings';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  checked: boolean;
  onToggle: (value: boolean) => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
};

const TermsCheckbox = ({
  checked,
  onToggle,
  onTermsPress,
  onPrivacyPress,
}: Props) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onToggle(!checked)}
        activeOpacity={0.8}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && <Icon name="check" size={fs(12)} color={Colors.white} />}
        </View>
      </TouchableOpacity>
      <Text style={styles.text}>
        {Strings.termsPrefix}
        <Text style={styles.link} onPress={onTermsPress}>
          {Strings.termsOfService}
        </Text>
        {Strings.termsAnd}
        <Text style={styles.link} onPress={onPrivacyPress}>
          {Strings.privacyPolicy}
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('3%'),
    paddingRight: wp('2%'),
  },
  box: {
    width: wp('4.8%'),
    height: wp('4.8%'),
    borderRadius: wp('1%'),
    borderWidth: 1.5,
    borderColor: Colors.checkboxBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('0.25%'),
  },
  boxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    flex: 1,
    marginLeft: wp('2.7%'),
    fontSize: FontSizes.bodySmall,
    color: Colors.textSecondary,
    lineHeight: hp('2.5%'),
    fontFamily: Fonts.regular,
  },
  link: {
    color: Colors.gold,
    fontFamily: Fonts.semiBold,
  },
});

export default TermsCheckbox;
