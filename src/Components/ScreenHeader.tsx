import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';
import BackButton from './BackButton';

type Props = {
  title?: string;
  subtitle?: string;
  subtitleLayout?: 'inline' | 'below';
  onBack?: () => void;
  backVariant?: 'default' | 'gray' | 'pink';
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  centerElement?: React.ReactNode;
  align?: 'center' | 'flex-start';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ScreenHeader = ({
  title,
  subtitle,
  subtitleLayout = 'inline',
  onBack,
  backVariant = 'pink',
  leftElement,
  rightElement,
  centerElement,
  align = 'center',
  compact = false,
  style,
}: Props) => {
  const renderLeft = () => {
    if (leftElement) {
      return leftElement;
    }

    if (onBack) {
      return <BackButton variant={backVariant} compact onPress={onBack} />;
    }

    return <View style={styles.sideSlot} />;
  };

  const renderRight = () => {
    if (rightElement) {
      return <View style={styles.rightSlot}>{rightElement}</View>;
    }

    return <View style={styles.sideSlot} />;
  };

  const renderTitle = () => {
    if (!title) {
      return null;
    }

    return (
      <Text
        style={[styles.title, compact && styles.titleCompact]}
        numberOfLines={1}
      >
        {title}
      </Text>
    );
  };

  const renderCenter = () => {
    if (centerElement) {
      return <View style={styles.center}>{centerElement}</View>;
    }

    if (subtitle && subtitleLayout === 'inline') {
      return (
        <View
          style={[styles.center, align === 'flex-start' && styles.centerTop]}
        >
          {renderTitle()}
          <Text style={styles.subtitleInline}>{subtitle}</Text>
        </View>
      );
    }

    return <View style={styles.center}>{renderTitle()}</View>;
  };

  if (subtitle && subtitleLayout === 'below') {
    return (
      <View style={[styles.wrapper, style]}>
        <View style={[styles.rowInner, { alignItems: align }]}>
          <View style={styles.leftSlot}>{renderLeft()}</View>
          {renderCenter()}
          {renderRight()}
        </View>
        <Text style={styles.subtitleBelow}>{subtitle}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, { alignItems: align }, style]}>
      <View style={styles.leftSlot}>{renderLeft()}</View>
      {renderCenter()}
      {renderRight()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    marginBottom: hp('1.5%'),
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: AuthStyles.horizontalPadding,
    marginBottom: hp('1.5%'),
  },
  rowInner: {
    flexDirection: 'row',
    marginBottom: hp('0.5%'),
  },
  leftSlot: {
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('1%'),
  },
  centerTop: {
    paddingTop: hp('0.3%'),
  },
  rightSlot: {
    minWidth: AuthStyles.backButtonSize,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sideSlot: {
    width: AuthStyles.backButtonSize,
  },
  title: {
    fontSize: fs(18),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: fs(18),
    letterSpacing: -0.4,
  },
  subtitleInline: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: hp('0.3%'),
    textAlign: 'center',
  },
  subtitleBelow: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2.1%'),
    paddingHorizontal: wp('8%'),
  },
});

export default ScreenHeader;
