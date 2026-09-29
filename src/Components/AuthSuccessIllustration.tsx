import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStyles } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  iconName: string;
  iconSize?: number;
};

const starPositions = [
  { top: hp('1%'), left: wp('6%'), size: fs(14) },
  { top: hp('2.5%'), right: wp('5%'), size: fs(10) },
  { top: hp('8.5%'), right: wp('2%'), size: fs(12) },
  { bottom: hp('3.5%'), left: wp('4%'), size: fs(10) },
  { bottom: hp('2%'), right: wp('7%'), size: fs(14) },
];

const AuthSuccessIllustration = ({
  iconName,
  iconSize = fs(36),
}: Props) => {
  return (
    <View style={styles.wrapper}>
      {starPositions.map((star, index) => (
        <Icon
          key={index}
          name="star-four-points"
          size={star.size}
          color={Colors.gold}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              right: star.right,
              bottom: star.bottom,
            },
          ]}
        />
      ))}
      <View style={styles.circle}>
        <Icon name={iconName} size={iconSize} color={Colors.white} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    width: wp('43%'),
    height: wp('43%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('3%'),
    position: 'relative',
  },
  circle: {
    width: wp('29%'),
    height: wp('29%'),
    borderRadius: wp('14.5%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
  },
});

export default AuthSuccessIllustration;
