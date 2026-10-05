import { Alert } from 'react-native';
import Toast from 'react-native-simple-toast';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  resolvePhotoAccessRespond,
} from '../API';
import { Strings } from '../Constant/Strings';

export const sendPhotoAccessRequest = async (userId: string) => {
  const targetId = String(userId ?? '').trim();
  if (!targetId) {
    return false;
  }

  try {
    const res = await Api.requestPhotoAccess(targetId);

    if (isApiSuccess(res?.status, res?.data?.success)) {
      const resolved = resolvePhotoAccessRespond(res?.data);
      Toast.show(resolved.message || Strings.photoAccessRequested, Toast.LONG);
      return true;
    }

    Toast.show(res?.data?.message ?? Strings.photoAccessRequestError, Toast.LONG);
  } catch (error) {
    Toast.show(
      getApiErrorMessage(error, Strings.photoAccessRequestError),
      Toast.LONG,
    );
  }

  return false;
};

export const confirmPhotoAccessRequest = (userId: string) => {
  Alert.alert(Strings.requestPhotoAccess, Strings.photoAccessRequestPrompt, [
    { text: Strings.cancelAction, style: 'cancel' },
    {
      text: Strings.sendRequest,
      onPress: () => {
        sendPhotoAccessRequest(userId);
      },
    },
  ]);
};
