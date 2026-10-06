import { ImageSourcePropType } from 'react-native';
import { Images } from '../Assets';
import type { PhotoGalleryData } from './mappers/photoGalleryMapper';

export type PhotoPrivacyTarget = {
  image: ImageSourcePropType;
  pictureHidden?: boolean;
  additionalPhotosHidden?: boolean;
  photosNeedAccess?: boolean;
};

export const applyViewerPhotoPrivacy = <T extends PhotoPrivacyTarget>(
  item: T,
  gallery: PhotoGalleryData,
): T => {
  const pictureHidden =
    gallery.profilePictureVisible === false
      ? true
      : gallery.photos.length > 0
        ? false
        : Boolean(item.pictureHidden);
  const additionalHidden =
    gallery.additionalPhotosVisible === false
      ? true
      : Boolean(item.additionalPhotosHidden) && !gallery.accessGranted;

  return {
    ...item,
    image: pictureHidden
      ? Images.hiddenProfile
      : gallery.photos[0] ?? item.image,
    pictureHidden,
    additionalPhotosHidden: additionalHidden,
    photosNeedAccess: pictureHidden || additionalHidden,
  };
};
