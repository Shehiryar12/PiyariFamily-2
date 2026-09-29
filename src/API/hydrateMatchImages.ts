import { ImageSourcePropType } from 'react-native';
import { Images } from '../Assets';
import { Api } from './Api';
import { mapMatchProfileDetail } from './mappers/matchMapper';

type MatchWithImage = {
  id: string;
  image: ImageSourcePropType;
  pictureHidden?: boolean;
};

export const isRemoteImage = (image: ImageSourcePropType) =>
  typeof image === 'object' &&
  image !== null &&
  !Array.isArray(image) &&
  'uri' in image &&
  typeof image.uri === 'string' &&
  Boolean(image.uri);

export const getImageCacheKey = (
  image: ImageSourcePropType,
  fallback: string,
) => {
  if (isRemoteImage(image) && typeof image === 'object' && 'uri' in image) {
    return String(image.uri);
  }

  return fallback;
};

const withHydratedImage = async <T extends MatchWithImage>(item: T): Promise<T> => {
  if (item.pictureHidden) {
    return { ...item, image: Images.hiddenProfile, pictureHidden: true };
  }

  if (isRemoteImage(item.image)) {
    return item;
  }

  try {
    const res = await Api.getMatchProfile(item.id);
    if (res?.status != 200) {
      return item;
    }

    const detail = mapMatchProfileDetail(res.data, item.id, {
      image: item.image,
    });

    if (detail.pictureHidden) {
      return { ...item, image: Images.hiddenProfile, pictureHidden: true };
    }

    if (isRemoteImage(detail.image)) {
      return { ...item, image: detail.image };
    }
  } catch {
    return item;
  }

  return item;
};

const runWithLimit = async <T,>(
  items: T[],
  worker: (item: T) => Promise<T>,
  limit = 3,
) => {
  if (!items.length) {
    return items;
  }

  const results = new Array<T>(items.length);
  let cursor = 0;

  const run = async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );

  return results;
};

export const hydrateMatchImages = async <T extends MatchWithImage>(
  items: T[],
) => runWithLimit(items, withHydratedImage, 3);
