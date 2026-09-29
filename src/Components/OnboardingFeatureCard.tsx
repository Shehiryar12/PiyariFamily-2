import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  iconName?: string;
  iconSource?: ImageSourcePropType;
  label: string;
};

const OnboardingFeatureCard = ({ iconName, iconSource, label }: Props) => {
  return (
    <View style={styles.card}>
      {iconSource ? (
        <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
      ) : (
        <Icon name={iconName!} size={fs(22)} color={Colors.primary} />
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    borderRadius: AuthStyles.featureCardRadius,
    paddingVertical: hp('2%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp('1.3%'),
  },
  iconImage: {
    width: fs(22),
    height: fs(22),
  },
  label: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
    marginTop: hp('1%'),
  },
});

export default OnboardingFeatureCard;
