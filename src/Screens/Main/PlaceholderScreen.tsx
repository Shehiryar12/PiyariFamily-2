import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { resolveInsets } from '../../Functions/safeArea';
import { hp } from '../../Functions/responsive';

type Props = {
  title: string;
};

const PlaceholderScreen = ({ title }: Props) => {
  const insets = resolveInsets(useSafeAreaInsets());

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + hp('2%'), paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{Strings.appName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('1%'),
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
});

export default PlaceholderScreen;
