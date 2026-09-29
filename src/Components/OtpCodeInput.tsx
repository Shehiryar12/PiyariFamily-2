import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { hp } from '../Functions/responsive';

const CELL_COUNT = 6;

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

const OtpCodeInput = ({ value, onChangeText }: Props) => {
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue: onChangeText,
  });

  return (
    <CodeField
      ref={ref}
      {...props}
      value={value}
      onChangeText={onChangeText}
      cellCount={CELL_COUNT}
      rootStyle={styles.codeFieldRoot}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      renderCell={({ index, symbol, isFocused }) => (
        <View
          key={index}
          style={[styles.cell, isFocused && styles.focusCell]}
          onLayout={getCellOnLayoutHandler(index)}
        >
          <Text style={styles.cellText}>
            {symbol || (isFocused ? <Cursor /> : null)}
          </Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  codeFieldRoot: {
    marginBottom: hp('3%'),
    justifyContent: 'space-between',
  },
  cell: {
    width: AuthStyles.otpCellWidth,
    height: AuthStyles.otpCellHeight,
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCell: {
    borderColor: Colors.dividerPink,
    borderWidth: 1.2,
  },
  cellText: {
    fontSize: FontSizes.otp,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
});

export default OtpCodeInput;
