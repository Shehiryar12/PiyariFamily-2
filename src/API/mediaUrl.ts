import { ImageURISource } from 'react-native';
import { API_CONFIG } from './config';

export const resolveMediaUrl = (value?: string | null): string => {
  const url = typeof value === 'string' ? value.trim() : '';

  if (!url) {
    return '';
  }

  if (/^(https?:|file:|content:|data:)/i.test(url)) {
    return url;
  }

  const origin = API_CONFIG.BASE_URL.replace(/\/api\/?$/i, '');
  const path = url.startsWith('/') ? url : `/${url}`;

  return `${origin}${path}`;
};

export const toRemoteImageSource = (url: string): ImageURISource => ({
  uri: url,
  headers: {
    Accept: 'image/jpeg,image/png,image/webp,image/*',
  },
});
