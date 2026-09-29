import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { SuggestedMatch } from '../../../API';
import { Colors } from '../../../Constant/Colors';
import { Fonts } from '../../../Constant/Fonts';
import { fs, hp } from '../../../Functions/responsive';
import SearchMatchCard from './SearchMatchCard';

type Props = {
  title: string;
  matches: SuggestedMatch[];
  onPressMatch: (match: SuggestedMatch) => void;
};

const SearchMatchList = ({ title, matches, onPressMatch }: Props) => {
  if (!matches.length) {
    return null;
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.grid}>
        {matches.map(match => (
          <SearchMatchCard
            key={match.id}
            match={match}
            onPress={() => onPressMatch(match)}
          />
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('2%'),
    marginBottom: hp('1.5%'),
  },
  title: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default SearchMatchList;
