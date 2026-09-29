import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../../Constant/Colors';
import { hp } from '../../../Functions/responsive';

const SearchLoading = () => (
  <View style={styles.wrap}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    minHeight: hp('18%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchLoading;
