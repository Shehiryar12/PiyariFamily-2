import { useCallback, useState } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import { Strings } from '../Constant/Strings';

const { ScreenSecurity } = NativeModules;
const captureEmitter = ScreenSecurity
  ? new NativeEventEmitter(ScreenSecurity)
  : null;

export const useSecurePhotoScreen = () => {
  const [isRecording, setIsRecording] = useState(false);

  useFocusEffect(
    useCallback(() => {
      ScreenSecurity?.setSecure?.(true);

      const subscription = captureEmitter?.addListener(
        'ScreenSecurityCapture',
        (type: string) => {
          if (type === 'recording') {
            setIsRecording(true);
            Toast.show(Strings.photoCaptureBlocked, Toast.LONG);
            return;
          }

          if (type === 'recording-end') {
            setIsRecording(false);
            return;
          }

          Toast.show(Strings.photoCaptureBlocked, Toast.LONG);
        },
      );

      return () => {
        subscription?.remove();
        setIsRecording(false);
        ScreenSecurity?.setSecure?.(false);
      };
    }, []),
  );

  return { isRecording };
};
