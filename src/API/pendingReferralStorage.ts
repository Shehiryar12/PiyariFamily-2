import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeReferralLink } from './mappers/referralMapper';

const PENDING_REFERRAL_LINK_KEY = 'pending_referral_link';

export const pendingReferralStorage = {
  get: async () => {
    const stored = await AsyncStorage.getItem(PENDING_REFERRAL_LINK_KEY);
    return normalizeReferralLink(stored);
  },

  setFromUrl: async (url?: string | null) => {
    const link = normalizeReferralLink(url);

    if (!link) {
      return null;
    }

    await AsyncStorage.setItem(PENDING_REFERRAL_LINK_KEY, link);
    return link;
  },

  clear: async () => {
    await AsyncStorage.removeItem(PENDING_REFERRAL_LINK_KEY);
  },
};
