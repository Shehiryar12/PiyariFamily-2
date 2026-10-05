import { useCallback, useState } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import { Strings } from '../Constant/Strings';

const { ScreenSecurity } = NativeModules;

let captureEmitter: NativeEventEmitter | null = null;

try {
  if (ScreenSecurity?.addListener) {
    captureEmitter = new NativeEventEmitter(ScreenSecurity);
  }
} catch {
  captureEmitter = null;
}

export const useSecurePhotoScreen = () => {
  const [isRecording, setIsRecording] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'ios') {
        try {
          ScreenSecurity?.setSecure?.(true);
        } catch {
        }
      }

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
        if (Platform.OS === 'ios') {
          try {
            ScreenSecurity?.setSecure?.(false);
          } catch {
          }
        }
      };
    }, []),
  );

  return { isRecording };
};
