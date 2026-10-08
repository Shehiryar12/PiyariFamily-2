export type FormValue = string | number | string[];

export type UploadFile = {
  uri: string;
  type?: string;
  name?: string;
  blob?: Blob;
};

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const extensionFromMime = (mimeType: string) => {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/jpg':
    case 'image/jpeg':
    default:
      return 'jpg';
  }
};

const normalizeFileUri = (uri: string) => {
  if (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    uri.startsWith('file://')
  ) {
    return uri;
  }

  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }

  return uri;
};

export const isLocalUploadUri = (uri?: string | null) => {
  if (!uri) {
    return false;
  }

  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    (uri.startsWith('/') && !uri.startsWith('//'))
  );
};

export const normalizeUploadFile = (
  uri: string,
  fileName?: string | null,
  mimeType?: string | null,
): UploadFile => {
  const safeName = fileName?.trim() || `photo-${Date.now()}.jpg`;
  const extension = safeName.split('.').pop()?.toLowerCase();
  const typeFromName =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : extension === 'jpg' || extension === 'jpeg'
          ? 'image/jpeg'
          : '';

  const type = mimeType?.toLowerCase() || typeFromName || 'image/jpeg';
  const normalizedType = ALLOWED_IMAGE_TYPES.has(type) ? type : 'image/jpeg';
  const normalizedName = safeName.includes('.')
    ? safeName
    : `${safeName}.${extensionFromMime(normalizedType)}`;

  return {
    uri: normalizeFileUri(uri),
    type: normalizedType,
    name: normalizedName,
  };
};

const fileNameFromUrl = (uri: string) => {
  const name = uri.split('/').pop()?.split('?')[0]?.trim();
  return name || `photo-${Date.now()}.jpg`;
};

const mimeFromUrl = (uri: string) => {
  const extension = fileNameFromUrl(uri).split('.').pop()?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
};

export const toPhotosUploadFile = (uri: string, fileName?: string | null, mimeType?: string | null) =>
  normalizeUploadFile(
    uri,
    fileName || fileNameFromUrl(uri),
    mimeType || mimeFromUrl(uri),
  );

const toNativeFilePart = (photo: UploadFile) => {
  const file = normalizeUploadFile(photo.uri, photo.name, photo.type);

  return {
    uri: file.uri,
    type: file.type,
    name: file.name,
  };
};

const appendPhotosFile = (formData: FormData, photo: UploadFile) => {
  formData.append(
    'photos',
    toNativeFilePart(photo) as unknown as Blob,
  );
};

export const createPhotosPart = async (uri: string): Promise<UploadFile> => {
  const base = toPhotosUploadFile(uri);

  if (isLocalUploadUri(uri)) {
    return base;
  }

  try {
    const response = await fetch(uri);
    if (!response.ok) {
      return base;
    }

    const blob = await response.blob();
    const blobData = (blob as { _data?: { path?: string; blobId?: string } })
      ._data;
    const type = blob.type || base.type;

    if (blobData?.path) {
      const path = blobData.path.startsWith('file://')
        ? blobData.path
        : `file://${blobData.path}`;
      return toPhotosUploadFile(path, base.name, type);
    }

    const objectUrl =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : uri;

    return {
      uri: objectUrl,
      name: base.name,
      type,
      blob,
    };
  } catch {
    return base;
  }
};

const resolvePhotosParts = async (
  photo?: UploadFile | UploadFile[] | null,
  allowRemote = false,
) => {
  const files = (Array.isArray(photo) ? photo : photo ? [photo] : []).filter(
    file =>
      Boolean(
        file?.blob ||
          isLocalUploadUri(file?.uri) ||
          (allowRemote && file?.uri),
      ),
  );

  if (!files.length) {
    return [];
  }

  const parts: UploadFile[] = [];

  for (const file of files) {
    if (file.blob || isLocalUploadUri(file.uri)) {
      parts.push(
        file.blob
          ? file
          : toPhotosUploadFile(file.uri, file.name, file.type),
      );
      continue;
    }

    parts.push(await createPhotosPart(file.uri));
  }

  return parts;
};

export const toFormData = (data: Record<string, FormValue>) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        formData.append(`${key}[]`, item);
      });
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};

export const toProfileUpdateFormData = async (
  data: Record<string, FormValue>,
  photo?: UploadFile | UploadFile[] | null,
  additionalPhotos?: UploadFile | UploadFile[] | null,
) => {
  const formData = new FormData();
  const photoKeys = new Set(['photos', 'photo', 'image', 'profile_photo']);

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (photoKeys.has(key)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => {
        formData.append(`${key}[]`, String(item));
      });
      return;
    }

    formData.append(key, String(value));
  });

  const parts = await resolvePhotosParts(photo, true);
  parts.forEach(part => appendPhotosFile(formData, part));

  const extraParts = await resolvePhotosParts(additionalPhotos);
  extraParts.forEach(part => {
    formData.append(
      'additional_photos',
      toNativeFilePart(part) as unknown as Blob,
    );
  });

  return formData;
};

export const toProfilePhotoActionFormData = async (
  data: Record<string, FormValue>,
  photos?: UploadFile | UploadFile[] | null,
) => {
  const formData = toFormData(data);
  const parts = await resolvePhotosParts(photos);
  parts.forEach(part => appendPhotosFile(formData, part));

  return formData;
};

export const toSetupPhotosFormData = async (
  photos: UploadFile[],
  mainIndex = 0,
) => {
  const formData = new FormData();
  const parts = await resolvePhotosParts(photos);
  parts.forEach(part => {
    formData.append(
      'photos[]',
      toNativeFilePart(part) as unknown as Blob,
    );
  });
  formData.append('main_index', String(mainIndex));
  return formData;
};

export const toPaymentScreenshotFormData = (
  userSubscriptionId: string,
  screenshot: UploadFile,
) => {
  const formData = new FormData();
  formData.append('user_subscription_id', userSubscriptionId);
  formData.append(
    'payment_screenshot',
    toNativeFilePart(screenshot) as unknown as Blob,
  );
  return formData;
};
