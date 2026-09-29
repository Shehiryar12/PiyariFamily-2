import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStyles } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  iconName: string;
  iconSize?: number;
};

const AuthIconBadge = ({ iconName, iconSize = fs(34) }: Props) => {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[Colors.goldLight, Colors.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.badge}>
        <Icon name={iconName} size={iconSize} color={Colors.white} />
      </LinearGradient>
      <View style={styles.starBadge}>
        <Icon name="star-four-points" size={fs(9)} color={Colors.white} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    marginBottom: hp('2.5%'),
    position: 'relative',
  },
  badge: {
    width: AuthStyles.iconBadgeSize,
    height: AuthStyles.iconBadgeSize,
    borderRadius: AuthStyles.iconBadgeRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: -wp('1%'),
    right: -wp('1%'),
    width: AuthStyles.starBadgeSize,
    height: AuthStyles.starBadgeSize,
    borderRadius: AuthStyles.starBadgeSize / 2,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

export default AuthIconBadge;
