import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStyles, FontSizes } from '../../../Constant/AuthStyles';
import { Colors } from '../../../Constant/Colors';
import { Fonts } from '../../../Constant/Fonts';
import { Strings } from '../../../Constant/Strings';
import { fs, hp, wp } from '../../../Functions/responsive';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
};

const SearchBar = ({ value, onChangeText, onSubmit }: Props) => (
  <View style={styles.searchRow}>
    <Pressable onPress={onSubmit} hitSlop={8}>
      <Icon name="magnify" size={fs(20)} color={Colors.textLight} />
    </Pressable>
    <TextInput
      style={styles.searchInput}
      placeholder={Strings.searchPlaceholder}
      placeholderTextColor={Colors.placeholder}
      value={value}
      returnKeyType="search"
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      blurOnSubmit
    />
  </View>
);

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: AuthStyles.inputRadius,
    paddingHorizontal: wp('3.8%'),
    height: AuthStyles.inputHeight,
    gap: wp('2.5%'),
    marginBottom: hp('2.2%'),
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
});

export default SearchBar;
