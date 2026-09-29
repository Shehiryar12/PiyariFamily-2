import React from 'react';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { hp } from '../Functions/responsive';

type Props = React.ComponentProps<typeof KeyboardAwareScrollView>;

const KeyboardScrollView = ({ children, ...props }: Props) => {
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      bounces={false}
      keyboardOpeningTime={0}
      {...props}
      enableOnAndroid={false}
      extraHeight={0}
      extraScrollHeight={
        Platform.OS === 'ios' ? props.extraScrollHeight ?? hp('1.5%') : 0
      }
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

export default KeyboardScrollView;
