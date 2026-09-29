import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  classifyLocationQuickFilter,
  type FilterQuickOption,
} from '../../../API';
import { Colors } from '../../../Constant/Colors';
import { Fonts } from '../../../Constant/Fonts';
import { Strings } from '../../../Constant/Strings';
import { fs, hp, wp } from '../../../Functions/responsive';

type Props = {
  filters: FilterQuickOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

const iconForFilter = (id: string, label = '') => {
  const kind = classifyLocationQuickFilter(id, label);
  const text = `${id} ${label}`.toLowerCase();

  if (
    kind === 'same_city' ||
    kind === 'near_me' ||
    kind === 'nearby' ||
    text.includes('near') ||
    text.includes('city')
  ) {
    return 'map-marker-outline';
  }
  if (text.includes('phone')) {
    return 'cellphone';
  }
  if (text.includes('verif')) {
    return 'shield-check-outline';
  }
  if (text.includes('new') || text.includes('join') || text.includes('day')) {
    return 'creation';
  }
  return 'filter-variant';
};

const SearchFilters = ({ filters, selectedIds, onToggle }: Props) => {
  if (!filters.length) {
    return null;
  }

  return (
    <>
      <Text style={styles.sectionLabel}>{Strings.quickFilters}</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {filters.map(filter => {
          const selected = selectedIds.includes(filter.id);

          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.chip, selected && styles.chipSelected]}
              activeOpacity={0.85}
              onPress={() => onToggle(filter.id)}
            >
              <Icon
                name={iconForFilter(filter.id, filter.label)}
                size={fs(14)}
                color={selected ? Colors.white : Colors.primary}
              />
              <Text
                numberOfLines={1}
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('1.2%'),
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: wp('2%'),
    paddingRight: wp('2%'),
    marginBottom: hp('2.2%'),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: wp('1.5%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('0.9%'),
    borderRadius: wp('4%'),
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1,
    borderColor: Colors.focusBorder,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
});

export default SearchFilters;
