import { useEffect } from 'react';
import { Linking } from 'react-native';
import { pendingReferralStorage } from '../API/pendingReferralStorage';
import { selectIsAuthenticated, useAppSelector } from '../Redux';

export const usePendingReferralCapture = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    const capture = (url?: string | null) => {
      if (!url) {
        return;
      }

      void pendingReferralStorage.setFromUrl(url);
    };

    void Linking.getInitialURL().then(capture);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      capture(url);
    });

    return () => subscription.remove();
  }, [isAuthenticated]);
};
