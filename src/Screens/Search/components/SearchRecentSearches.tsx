import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontSizes } from '../../../Constant/AuthStyles';
import { Colors } from '../../../Constant/Colors';
import { Fonts } from '../../../Constant/Fonts';
import { Strings } from '../../../Constant/Strings';
import { fs, hp, wp } from '../../../Functions/responsive';

type Props = {
  items: string[];
  onSelect: (item: string) => void;
  onRemove: (item: string) => void;
  onClearAll: () => void;
};

const SearchRecentSearches = ({
  items,
  onSelect,
  onRemove,
  onClearAll,
}: Props) => {
  if (!items.length) {
    return null;
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.label}>{Strings.recentSearches}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onClearAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.clearAll}>{Strings.clearAll}</Text>
        </TouchableOpacity>
      </View>
      {items.map(item => (
        <TouchableOpacity
          key={item}
          style={styles.row}
          activeOpacity={0.85}
          onPress={() => onSelect(item)}
        >
          <Icon
            name="clock-outline"
            size={fs(18)}
            color={Colors.textLight}
            style={styles.icon}
          />
          <Text style={styles.text}>{item}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onRemove(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={fs(16)} color={Colors.textLight} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  label: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  clearAll: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  icon: {
    marginRight: wp('2.5%'),
  },
  text: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
});

export default SearchRecentSearches;
