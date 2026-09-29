import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Images } from '../../../Assets';
import { FontSizes } from '../../../Constant/AuthStyles';
import { Colors } from '../../../Constant/Colors';
import { Fonts } from '../../../Constant/Fonts';
import { Strings } from '../../../Constant/Strings';
import { fs, hp, wp } from '../../../Functions/responsive';

type Props = {
  onOpenFilters: () => void;
};

const SearchHeader = ({ onOpenFilters }: Props) => (
  <View style={styles.titleRow}>
    <Text style={styles.title}>{Strings.findYourMatch}</Text>
    <TouchableOpacity
      style={styles.filterBtn}
      activeOpacity={0.85}
      onPress={onOpenFilters}
    >
      <Image
        source={Images.filterIcon}
        style={styles.filterIcon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  filterBtn: {
    width: wp('10.7%'),
    height: wp('10.7%'),
    borderRadius: wp('5.35%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    width: fs(18),
    height: fs(18),
    tintColor: Colors.primary,
  },
});

export default SearchHeader;
