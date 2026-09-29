import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../Constant/Colors';
import { Fonts } from '../../../Constant/Fonts';
import { Strings } from '../../../Constant/Strings';
import { fs, hp, wp } from '../../../Functions/responsive';

type Props = {
  title: string;
  query?: string;
};

const SearchEmptyState = ({ title, query }: Props) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <Icon name="account-search-outline" size={fs(32)} color={Colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {query ? (
      <View style={styles.emptyQueryChip}>
        <Icon name="magnify" size={fs(14)} color={Colors.gold} />
        <Text style={styles.emptyQueryText} numberOfLines={1}>
          {query}
        </Text>
      </View>
    ) : null}
    <Text style={styles.emptyHint}>{Strings.noExactMatchesHint}</Text>
  </View>
);

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('2%'),
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('4.5%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
  },
  emptyIconWrap: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.8%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
  },
  emptyTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('1.2%'),
  },
  emptyQueryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    maxWidth: '100%',
    backgroundColor: Colors.white,
    borderRadius: wp('5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.7%'),
    marginBottom: hp('1.2%'),
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  emptyQueryText: {
    flexShrink: 1,
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  emptyHint: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: fs(20),
  },
});

export default SearchEmptyState;
