import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import { Images } from '../../Assets';
import ScreenHeader from '../../Components/ScreenHeader';
import PrimaryButton from '../../Components/PrimaryButton';
import SetupDropdown from '../../Components/SetupDropdown';
import DropdownOptionsOverlay, {
  DropdownSafeScrollView as ScrollView,
  useGuardedDropdownPress,
} from '../../Components/DropdownOptionsOverlay';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import {
  COMMUNITY_OPTIONS,
  EDIT_MARITAL_STATUS_OPTIONS,
  HEIGHT_FEET_OPTIONS,
  HEIGHT_INCHES_OPTIONS,
  MAX_OTHER_LANGUAGES,
  MOTHER_TONGUE_OPTIONS,
  OTHER_LANGUAGE_OPTIONS,
  OtherLanguage,
  PROFILE_PHOTO_MAX_BYTES,
  PROFILE_PHOTO_PICKER_MAX_SIZE,
  PROFILE_PHOTO_PICKER_QUALITY,
  RESIDENCE_STATUS_OPTIONS,
} from '../../Constant/ProfileSetup';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import {
  Api,
  extractProfileGalleryPhotos,
  getApiErrorMessage,
  isApiSuccess,
  mapFormToProfilePayload,
  mapProfileToForm,
  saveProfileCache,
  toApiMaritalStatus,
  type ApiErrorResponse,
  type EditProfileFormData,
  type ProfileGalleryPhoto,
} from '../../API';
import { normalizeUploadFile, isLocalUploadUri, type UploadFile } from '../../API/formData';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import {
  selectProfile,
  selectProfilePhoto,
  store,
  useAppSelector,
} from '../../Redux';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'EditProfile'
>;


const ABOUT_MAX_LENGTH = 300;

const EMPTY_FORM: EditProfileFormData = {
  fullName: '',
  birthday: '',
  dateOfBirth: '',
  gender: 'female',
  aboutMe: '',
  email: '',
  phone: '',
  city: '',
  country: '',
  heightFeet: '',
  heightInches: '',
  motherTongue: '',
  otherLanguages: [],
  maritalStatus: '',
  community: '',
  residenceStatus: '',
  age: null,
  profilePhoto: null,
};

const remainingToApiPhotos = (photos: ProfileGalleryPhoto[]) => {
  const ordered = [
    ...photos.filter(item => item.isMain),
    ...photos.filter(item => !item.isMain),
  ];

  return ordered.map((item, position) => ({
    index: item.isMain ? 0 : item.index ?? Math.max(position, 1),
    path: item.path,
    url: item.url,
    is_main: item.isMain,
  }));
};

/** Remote keep_photos only — device picker URIs must not go to the API. */
const isDeviceLocalPhotoUri = (uri?: string | null) => {
  if (!uri) {
    return false;
  }
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
};

const toRemoteKeepPhotos = (
  photos: ReturnType<typeof remainingToApiPhotos>,
) =>
  photos.filter(item => {
    const url = typeof item.url === 'string' ? item.url.trim() : '';
    const path = typeof item.path === 'string' ? item.path.trim() : '';
    // Keep http(s) and server-relative paths; drop only device local URIs.
    if (url && !isDeviceLocalPhotoUri(url)) {
      return true;
    }
    if (path && !isDeviceLocalPhotoUri(path)) {
      return true;
    }
    return false;
  });

const nextGalleryPhotoIndex = (photos: ProfileGalleryPhoto[]) => {
  const indexes = photos
    .map(item => item.index)
    .filter((index): index is number => index != null && Number.isFinite(index));
  const next = indexes.length ? Math.max(...indexes) + 1 : 1;
  return next < 1 ? 1 : next;
};

const EditProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const reduxProfile = useAppSelector(selectProfile);
  const cachedPhoto = useAppSelector(selectProfilePhoto);

  const [form, setForm] = useState<EditProfileFormData>(EMPTY_FORM);
  const [openDropdown, setOpenDropdown] = useState<
    | 'feet'
    | 'inches'
    | 'motherTongue'
    | 'languages'
    | 'marital'
    | 'community'
    | 'residence'
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPhoto, setNewPhoto] = useState<UploadFile | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<ProfileGalleryPhoto[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [showAllAdditional, setShowAllAdditional] = useState(false);
  const [galleryGridWidth, setGalleryGridWidth] = useState(0);
  const languagesAnchorRef = useRef<View>(null);
  const handleLanguagesPress = useGuardedDropdownPress(() =>
    setOpenDropdown(prev => (prev === 'languages' ? null : 'languages')),
  );
  const newPhotoRef = useRef<UploadFile | null>(null);
  const pendingGalleryFilesRef = useRef<UploadFile[]>([]);
  const galleryDirtyRef = useRef(false);
  const maritalDirtyRef = useRef(false);
  const removedPhotoIndexesRef = useRef<number[]>([]);
  newPhotoRef.current = newPhoto;

  const profileFieldsFromForm = (data: EditProfileFormData) => {
    const marital =
      toApiMaritalStatus(data.maritalStatus) ||
      store.getState().profile.profile?.marital_status ||
      '';
    return {
      ...(marital ? { marital_status: marital } : {}),
      ...(data.community.trim() ? { community: data.community.trim() } : {}),
    };
  };

  useFocusEffect(
    useCallback(() => {
      const latestProfile = reduxProfile ?? store.getState().profile.profile;
      if (!latestProfile) {
        return;
      }

      if (!galleryDirtyRef.current) {
        setGalleryPhotos(extractProfileGalleryPhotos(latestProfile));
      }
      if (!loading && !newPhotoRef.current) {
        const mapped = mapProfileToForm(latestProfile);
        setForm(prev => ({
          ...prev,
          profilePhoto:
            newPhotoRef.current || galleryDirtyRef.current
              ? prev.profilePhoto
              : mapped.profilePhoto ?? prev.profilePhoto,
          maritalStatus: maritalDirtyRef.current
            ? prev.maritalStatus
            : mapped.maritalStatus || prev.maritalStatus,
          community: prev.community || mapped.community,
        }));
      }
    }, [loading, reduxProfile]),
  );

  const updateForm = <K extends keyof EditProfileFormData>(
    key: K,
    value: EditProfileFormData[K],
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const applyProfile = (profile: Parameters<typeof mapProfileToForm>[0]) => {
    const mapped = mapProfileToForm(profile);
    setForm(prev => ({
      ...mapped,
      profilePhoto: newPhotoRef.current
        ? prev.profilePhoto
        : galleryDirtyRef.current
          ? prev.profilePhoto
          : mapped.profilePhoto,
      maritalStatus: maritalDirtyRef.current
        ? prev.maritalStatus
        : mapped.maritalStatus,
    }));
    if (!galleryDirtyRef.current) {
      setGalleryPhotos(extractProfileGalleryPhotos(profile));
    }
  };

  const fetchProfile = useCallback(async () => {
    const cachedProfile = reduxProfile ?? store.getState().profile.profile;
    if (cachedProfile) {
      applyProfile(cachedProfile);
    } else if (cachedPhoto) {
      setForm(prev => ({
        ...prev,
        profilePhoto: cachedPhoto,
      }));
      setGalleryPhotos([
        {
          id: null,
          index: 0,
          url: cachedPhoto,
          path: null,
          isMain: true,
        },
      ]);
    }

    setLoading(!cachedProfile);

    try {
      const res = await Api.getProfile();

      if (res?.status == 200) {
        applyProfile(saveProfileCache(res?.data));
      } else {
        if (!cachedProfile) {
          Toast.show(res?.data?.message || 'Failed to load profile', Toast.LONG);
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (!cachedProfile) {
        Toast.show(getApiErrorMessage(axiosError, 'Failed to load profile'), Toast.LONG);
      }
    } finally {
      setLoading(false);
    }
  }, [cachedPhoto]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleLanguage = (language: OtherLanguage) => {
    setForm(prev => {
      if (prev.otherLanguages.includes(language)) {
        return {
          ...prev,
          otherLanguages: prev.otherLanguages.filter(item => item !== language),
        };
      }

      if (prev.otherLanguages.length >= MAX_OTHER_LANGUAGES) {
        Toast.show(Strings.maxLanguagesHint);
        return prev;
      }

      return {
        ...prev,
        otherLanguages: [...prev.otherLanguages, language],
      };
    });
  };

  const removeLanguage = (language: OtherLanguage) => {
    setForm(prev => ({
      ...prev,
      otherLanguages: prev.otherLanguages.filter(item => item !== language),
    }));
  };

  const handlePickPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: PROFILE_PHOTO_PICKER_MAX_SIZE,
        maxHeight: PROFILE_PHOTO_PICKER_MAX_SIZE,
        quality: PROFILE_PHOTO_PICKER_QUALITY,
      },
      response => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          return;
        }

        if (
          asset.type &&
          !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
            asset.type.toLowerCase(),
          )
        ) {
          Toast.show('Please select JPEG, PNG, or WEBP image', Toast.LONG);
          return;
        }

        if (asset.fileSize && asset.fileSize > PROFILE_PHOTO_MAX_BYTES) {
          Toast.show(Strings.photoTooLarge, Toast.LONG);
          return;
        }

        setNewPhoto(
          normalizeUploadFile(asset.uri, asset.fileName ?? 'avatar.png', asset.type),
        );
        setForm(prev => ({
          ...prev,
          profilePhoto: asset.uri ?? prev.profilePhoto,
        }));
        setGalleryPhotos(prev => {
          const localPhoto: ProfileGalleryPhoto = {
            id: null,
            index: 0,
            url: asset.uri as string,
            path: null,
            isMain: true,
          };
          const mainIndex = prev.findIndex(item => item.isMain);
          if (mainIndex >= 0) {
            const next = [...prev];
            next[mainIndex] = {
              ...next[mainIndex],
              ...localPhoto,
              index: next[mainIndex].index ?? 0,
            };
            return next;
          }
          return [localPhoto, ...prev.map(item => ({ ...item, isMain: false }))];
        });
      },
    );
  };

  const handlePickGalleryPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: PROFILE_PHOTO_PICKER_MAX_SIZE,
        maxHeight: PROFILE_PHOTO_PICKER_MAX_SIZE,
        quality: PROFILE_PHOTO_PICKER_QUALITY,
      },
      response => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          return;
        }

        if (
          asset.type &&
          !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
            asset.type.toLowerCase(),
          )
        ) {
          Toast.show('Please select JPEG, PNG, or WEBP image', Toast.LONG);
          return;
        }

        if (asset.fileSize && asset.fileSize > PROFILE_PHOTO_MAX_BYTES) {
          Toast.show(Strings.photoTooLarge, Toast.LONG);
          return;
        }

        const file = normalizeUploadFile(
          asset.uri,
          asset.fileName ?? `gallery-${Date.now()}.jpg`,
          asset.type,
        );

        galleryDirtyRef.current = true;
        pendingGalleryFilesRef.current = [
          ...pendingGalleryFilesRef.current.filter(item => item.uri !== file.uri),
          file,
        ];
        setShowAllAdditional(true);
        setGalleryPhotos(prev => {
          if (prev.some(item => item.url === file.uri)) {
            return prev;
          }

          return [
            ...prev,
            {
              id: null,
              index: nextGalleryPhotoIndex(prev),
              url: file.uri,
              path: null,
              isMain: false,
            },
          ];
        });
      },
    );
  };

  const persistGalleryToProfile = async (
    photos: ProfileGalleryPhoto[],
    removedIndexes: number[],
    data: EditProfileFormData,
  ) => {
    const didChangeMainPhoto = Boolean(newPhoto);
    const remainingPhotos = remainingToApiPhotos(
      photos.some(item => item.isMain)
        ? photos
        : form.profilePhoto
          ? [
              {
                id: null,
                index: 0,
                url: form.profilePhoto,
                path: null,
                isMain: true,
              },
              ...photos,
            ]
          : photos,
    );
    const keepPhotos = toRemoteKeepPhotos(remainingPhotos);
    const remainingFiles: UploadFile[] = [];

    if (
      didChangeMainPhoto &&
      newPhoto &&
      isLocalUploadUri(newPhoto.uri) &&
      remainingPhotos.some(item => item.is_main && item.url === newPhoto.uri)
    ) {
      remainingFiles.push(newPhoto);
    }

    const galleryUploads: UploadFile[] = [];
    const uploadIndexes: string[] = [];

    pendingGalleryFilesRef.current.forEach(file => {
      const photo = remainingPhotos.find(
        item => item.url === file.uri && !item.is_main,
      );
      if (
        photo &&
        !galleryUploads.some(item => item.uri === file.uri)
      ) {
        galleryUploads.push(file);
        const index =
          typeof photo.index === 'number' && photo.index > 0 ? photo.index : 1;
        uploadIndexes.push(String(index));
      }
    });

    const payload = {
      ...mapFormToProfilePayload(data),
      keep_photos: JSON.stringify(keepPhotos),
      ...(didChangeMainPhoto ? { main_photo_index: 0 } : {}),
      ...(uploadIndexes.length ? { photo_indexes: uploadIndexes } : {}),
      ...(removedIndexes.length
        ? { removed_indexes: removedIndexes.map(String) }
        : {}),
    };

    return Api.updateProfile(
      payload,
      remainingFiles.length ? remainingFiles : null,
      galleryUploads.length ? galleryUploads : null,
    );
  };

  const cacheRemainingPhotos = (
    source: unknown,
    photos: ProfileGalleryPhoto[],
    removedIndexes: number[] = [],
  ) => {
    const remainingApiPhotos = remainingToApiPhotos(photos).map(item => ({
      ...item,
      // Never cache a pending local gallery URI as main.
      is_main:
        item.is_main &&
        !(typeof item.url === 'string' && isLocalUploadUri(item.url) && !newPhotoRef.current),
    }));
    const base =
      source && typeof source === 'object'
        ? { ...(source as Record<string, unknown>) }
        : {};
    const nestedUser =
      base.user && typeof base.user === 'object'
        ? { ...(base.user as Record<string, unknown>), photos: remainingApiPhotos }
        : undefined;
    const cached = store.getState().profile.profile;
    const mainPhoto = photos.find(item => item.isMain);
    const keepMainPhoto =
      newPhotoRef.current == null
        ? cached?.profile_photo ||
          (mainPhoto?.url && !isLocalUploadUri(mainPhoto.url)
            ? mainPhoto.url
            : form.profilePhoto && !isLocalUploadUri(form.profilePhoto)
              ? form.profilePhoto
              : cached?.profile_photo)
        : mainPhoto?.url && !isLocalUploadUri(mainPhoto.url)
          ? mainPhoto.url
          : cached?.profile_photo;

    return saveProfileCache({
      ...base,
      ...(nestedUser
        ? {
            user: {
              ...nestedUser,
              photos: remainingApiPhotos,
              ...(keepMainPhoto ? { profile_photo: keepMainPhoto } : {}),
            },
          }
        : {}),
      photos: remainingApiPhotos,
      removed_photo_indexes: removedIndexes,
      ...(newPhotoRef.current ? { main_photo_index: 0 } : {}),
      ...(keepMainPhoto ? { profile_photo: keepMainPhoto } : {}),
      ...profileFieldsFromForm(form),
    });
  };

  const persistMaritalAndCommunity = async (data: EditProfileFormData) => {
    const cached = store.getState().profile.profile;
    const marital =
      toApiMaritalStatus(data.maritalStatus) ||
      cached?.marital_status ||
      '';
    const community = data.community.trim();
    const requests: Array<Promise<unknown>> = [];

    if (marital && data.fullName.trim() && data.birthday) {
      requests.push(
        Api.updateProfileBasicInfo({
          name: data.fullName.trim(),
          birthday: data.birthday,
          gender: data.gender,
          marital_status: marital,
          'marital status': marital,
        }),
      );
    }

    const religion = cached?.religion?.trim();
    const motherTongue =
      data.motherTongue.trim() || cached?.mother_tongue?.trim() || '';
    if (community && religion && motherTongue) {
      requests.push(
        Api.updateProfileFaith({
          religion,
          community,
          ...(cached?.sect ? { sect: cached.sect } : {}),
          mother_tongue: motherTongue,
          other_languages: data.otherLanguages,
        }),
      );
    }

    saveProfileCache({
      ...(cached ?? {}),
      ...(marital ? { marital_status: marital } : {}),
      ...(community ? { community } : {}),
    });

    if (requests.length) {
      await Promise.all(requests);
    }
  };

  const handleDeleteGalleryPhoto = () => {
    if (viewerIndex == null || deletingPhoto) {
      return;
    }

    const photo = visibleGalleryPhotos[viewerIndex];
    if (!photo) {
      return;
    }

    const remaining = galleryPhotos.filter(item =>
      photo.index != null && item.index != null
        ? item.index !== photo.index
        : item.isMain || item.url !== photo.url,
    );
    const removedIndexes =
      photo.index != null
        ? [...removedPhotoIndexesRef.current, photo.index]
        : removedPhotoIndexesRef.current;

    galleryDirtyRef.current = true;
    removedPhotoIndexesRef.current = removedIndexes;
    pendingGalleryFilesRef.current = pendingGalleryFilesRef.current.filter(
      file => remaining.some(item => item.url === file.uri),
    );
    setGalleryPhotos(remaining);
    setViewerIndex(null);
    cacheRemainingPhotos(
      store.getState().profile.profile,
      remaining,
      removedIndexes,
    );
    Toast.show(Strings.photoDeleted, Toast.LONG);
  };

  const handleSave = async () => {
    if (saving || loading) {
      return;
    } else if (!form.fullName.trim()) {
      Toast.show('Please enter your name');
    } else {
      setSaving(true);

      try {
        const cachedMarital = store.getState().profile.profile?.marital_status;
        const didChangeMainPhoto = Boolean(newPhoto);
        const existingMainPhoto = didChangeMainPhoto
          ? null
          : store.getState().profile.profile?.profile_photo ||
            cachedPhoto ||
            form.profilePhoto ||
            null;
        const dataToSave: EditProfileFormData = {
          ...form,
          maritalStatus:
            form.maritalStatus ||
            mapProfileToForm({ marital_status: cachedMarital }).maritalStatus,
        };
        const res = await persistGalleryToProfile(
          galleryPhotos,
          removedPhotoIndexesRef.current,
          dataToSave,
        );

        if (isApiSuccess(res?.status, res?.success) && res?.success !== false) {
          galleryDirtyRef.current = false;
          pendingGalleryFilesRef.current = [];
          await persistMaritalAndCommunity(dataToSave);
          cacheRemainingPhotos(
            res?.user ?? res,
            galleryPhotos,
            removedPhotoIndexesRef.current,
          );

          if (didChangeMainPhoto) {
            try {
              const profileRes = await Api.getProfile();
              if (profileRes?.status == 200) {
                saveProfileCache({
                  ...(profileRes.data ?? {}),
                  ...profileFieldsFromForm(dataToSave),
                });
              }
            } catch (refreshError) {
            }
          } else if (existingMainPhoto) {
            saveProfileCache({
              ...(store.getState().profile.profile ?? {}),
              profile_photo: existingMainPhoto,
            });
            setForm(prev => ({
              ...prev,
              profilePhoto:
                typeof existingMainPhoto === 'string'
                  ? existingMainPhoto
                  : prev.profilePhoto,
            }));
          }

          maritalDirtyRef.current = false;
          Toast.show(res?.message ?? Strings.profileSaved, Toast.LONG);
          navigation.goBack();
        } else {
          Toast.show(res?.message ?? 'Failed to save profile', Toast.LONG);
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        Toast.show(getApiErrorMessage(axiosError, 'Failed to save profile'), Toast.LONG);
      } finally {
        setSaving(false);
      }
    }
  };

  const additionalPhotos = galleryPhotos.filter(photo => !photo.isMain);
  const visibleGalleryPhotos = showAllAdditional ? additionalPhotos : [];
  const showGalleryAddSlot =
    showAllAdditional || additionalPhotos.length === 0;
  const gallerySlotSize =
    galleryGridWidth > 0
      ? Math.floor((galleryGridWidth - GALLERY_SLOT_GAP * 2) / 3)
      : GALLERY_SLOT_SIZE;

  const handleToggleAdditionalPhotos = () => {
    if (additionalPhotos.length === 0) {
      return;
    }

    setShowAllAdditional(current => !current);
  };

  const renderSectionHeader = (
    icon: string,
    title: string,
    rightElement?: React.ReactNode,
  ) => (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={fs(16)} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightElement}
    </View>
  );

  const renderFieldLabel = (label: string) => (
    <Text style={styles.fieldLabel}>{label}</Text>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={Strings.editProfileTitle}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving || loading}
          >
            <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
              {Strings.save}
            </Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          removeClippedSubviews={false}
        >
          <View style={styles.photoSection}>
            <View style={styles.photoWrap}>
              <Image
                source={
                  newPhoto?.uri || form.profilePhoto
                    ? { uri: newPhoto?.uri ?? form.profilePhoto ?? undefined }
                    : Images.femaleProfile
                }
                style={styles.profilePhoto}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.cameraBtn}
                activeOpacity={0.85}
                onPress={handlePickPhoto}
              >
                <Icon name="camera" size={fs(14)} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={handlePickPhoto}>
              <Text style={styles.changePhotoText}>
                {Strings.changePhoto}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.galleryCard}>
            <View style={styles.galleryHeader}>
              <View style={styles.galleryHeaderLeft}>
                <Icon
                  name="image-multiple-outline"
                  size={fs(16)}
                  color={Colors.primary}
                />
                <Text style={styles.galleryTitle} numberOfLines={1}>
                  {Strings.photoGallery}
                </Text>
              </View>
              {additionalPhotos.length > 0 ? (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  activeOpacity={0.85}
                  onPress={handleToggleAdditionalPhotos}
                >
                  <Icon
                    name={
                      showAllAdditional
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={fs(18)}
                    color={Colors.redish}
                  />
                  <Text style={styles.viewAllText} numberOfLines={1}>
                    {showAllAdditional ? Strings.hideAll : Strings.viewAll}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.galleryHint}>
              {additionalPhotos.length > 0 && !showAllAdditional
                ? Strings.viewAllHint
                : Strings.photoGalleryHint}
            </Text>
            {showGalleryAddSlot ? (
              <View
                style={styles.photoGrid}
                onLayout={event => {
                  const nextWidth = Math.round(event.nativeEvent.layout.width);
                  setGalleryGridWidth(current =>
                    current === nextWidth ? current : nextWidth,
                  );
                }}
              >
                {visibleGalleryPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={`${photo.id ?? photo.url}-${index}`}
                    style={[
                      styles.photoSlot,
                      {
                        width: gallerySlotSize,
                        height: gallerySlotSize,
                        marginRight: (index + 1) % 3 === 0 ? 0 : GALLERY_SLOT_GAP,
                      },
                    ]}
                    activeOpacity={0.9}
                    onPress={() => setViewerIndex(index)}
                  >
                    <View style={styles.photoSlotImageWrap}>
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.galleryImage}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.photoSlot,
                    styles.photoSlotAdd,
                    {
                      width: gallerySlotSize,
                      height: gallerySlotSize,
                      marginRight:
                        (visibleGalleryPhotos.length + 1) % 3 === 0
                          ? 0
                          : GALLERY_SLOT_GAP,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={handlePickGalleryPhoto}
                >
                  <Icon name="plus" size={fs(28)} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {renderSectionHeader('account-outline', Strings.personalInfoSection)}

          {renderFieldLabel(Strings.fullNameLabel)}
          <View style={styles.inputRow}>
            <Icon
              name="account-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={value => updateForm('fullName', value)}
              placeholderTextColor={Colors.placeholder}
            />
          </View>

          {renderFieldLabel(Strings.dateOfBirthLabel)}
          <View style={styles.inputRow}>
            <Icon
              name="calendar-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <Text style={styles.inputText}>{form.dateOfBirth || '-'}</Text>
            {form.age != null ? (
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeText}>Age: {form.age}</Text>
              </View>
            ) : null}
          </View>

          {renderFieldLabel(Strings.genderLabel)}
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderBtn,
                form.gender === 'male' && styles.genderBtnActive,
              ]}
              activeOpacity={0.85}
              onPress={() => updateForm('gender', 'male')}
            >
              <Text
                style={[
                  styles.genderText,
                  form.gender === 'male' && styles.genderTextActive,
                ]}
              >
                {Strings.genderMale}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderBtn,
                form.gender === 'female' && styles.genderBtnActive,
              ]}
              activeOpacity={0.85}
              onPress={() => updateForm('gender', 'female')}
            >
              <Text
                style={[
                  styles.genderText,
                  form.gender === 'female' && styles.genderTextActive,
                ]}
              >
                {Strings.genderFemale}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.aboutHeader}>
            {renderFieldLabel(Strings.aboutMe)}
            <Text style={styles.charCount}>
              {form.aboutMe.length}/{ABOUT_MAX_LENGTH}
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Icon
              name="file-document-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.aboutIcon}
            />
            <TextInput
              style={styles.aboutInput}
              value={form.aboutMe}
              onChangeText={value =>
                updateForm('aboutMe', value.slice(0, ABOUT_MAX_LENGTH))
              }
              placeholder={Strings.aboutMePlaceholder}
              placeholderTextColor={Colors.placeholder}
              multiline
              textAlignVertical="top"
            />
          </View>

          {renderSectionHeader('email-outline', Strings.contactInfoSection)}

          {renderFieldLabel(Strings.emailLabel)}
          <View style={styles.inputRow}>
            <Icon
              name="email-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={value => updateForm('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={Colors.placeholder}
            />
          </View>

          {renderFieldLabel(Strings.phoneNumberLabel)}
          <View style={styles.inputRow}>
            <Icon
              name="phone-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={value => updateForm('phone', value)}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.placeholder}
            />
          </View>

          {renderFieldLabel(Strings.countryDetail)}
          <View style={styles.inputRow}>
            <Icon
              name="earth"
              size={fs(20)}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={form.country}
              onChangeText={value => updateForm('country', value)}
              placeholder={Strings.countryPlaceholder}
              placeholderTextColor={Colors.placeholder}
            />
          </View>

          {renderFieldLabel(Strings.cityDetail)}
          <View style={styles.inputRow}>
            <Icon
              name="map-marker-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={value => updateForm('city', value)}
              placeholder={Strings.cityPlaceholder}
              placeholderTextColor={Colors.placeholder}
            />
          </View>

          {renderSectionHeader('heart-outline', Strings.lifestyleSection)}

          {renderFieldLabel(Strings.heightLabel)}
          <View style={styles.heightRow}>
            <SetupDropdown
              iconText="'"
              placeholder={Strings.selectFeetPlaceholder}
              value={form.heightFeet ? `${form.heightFeet} ft` : ''}
              options={HEIGHT_FEET_OPTIONS.map(option => `${option} ft`)}
              isOpen={openDropdown === 'feet'}
              onToggle={() =>
                setOpenDropdown(prev => (prev === 'feet' ? null : 'feet'))
              }
              onSelect={value => {
                updateForm('heightFeet', value.replace(' ft', ''));
                setOpenDropdown(null);
              }}
              style={styles.heightDropdown}
            />
            <SetupDropdown
              iconSource={Images.inchesIcon}
              iconImageSize={fs(11)}
              placeholder={Strings.selectInchesPlaceholder}
              value={form.heightInches ? `${form.heightInches} in` : ''}
              options={HEIGHT_INCHES_OPTIONS.map(option => `${option} in`)}
              isOpen={openDropdown === 'inches'}
              onToggle={() =>
                setOpenDropdown(prev => (prev === 'inches' ? null : 'inches'))
              }
              onSelect={value => {
                updateForm('heightInches', value.replace(' in', ''));
                setOpenDropdown(null);
              }}
              style={styles.heightDropdown}
            />
          </View>

          <SetupDropdown
            label={Strings.motherTongueDetail}
            iconSource={Images.msgTextIcon}
            placeholder={Strings.selectMotherTonguePlaceholder}
            value={form.motherTongue}
            options={MOTHER_TONGUE_OPTIONS}
            isOpen={openDropdown === 'motherTongue'}
            onToggle={() =>
              setOpenDropdown(prev =>
                prev === 'motherTongue' ? null : 'motherTongue',
              )
            }
            onSelect={value => {
              updateForm('motherTongue', value);
              setOpenDropdown(null);
            }}
            style={styles.fieldSpacing}
          />

          {renderFieldLabel(Strings.otherLanguages)}
          <View
            style={[
              styles.dropdownAnchor,
              openDropdown === 'languages' && styles.dropdownOpenWrap,
            ]}
          >
            <View
              ref={languagesAnchorRef}
              collapsable={false}
              style={styles.dropdownAnchorInner}
            >
              <TouchableOpacity
                style={styles.dropdownRow}
                activeOpacity={0.85}
                onPress={handleLanguagesPress}
              >
                <Image
                  source={Images.msgTextIcon}
                  style={styles.dropdownIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.dropdownPlaceholder}>
                  {Strings.selectLanguage}
                </Text>
                <Icon
                  name={
                    openDropdown === 'languages' ? 'chevron-up' : 'chevron-down'
                  }
                  size={fs(22)}
                  color={Colors.iconMuted}
                />
              </TouchableOpacity>
              <DropdownOptionsOverlay
                visible={openDropdown === 'languages'}
                anchorRef={languagesAnchorRef}
                options={OTHER_LANGUAGE_OPTIONS}
                selectedValues={form.otherLanguages}
                closeOnSelect={false}
                onSelect={option => toggleLanguage(option as OtherLanguage)}
                onClose={() => setOpenDropdown(null)}
              />
            </View>
          </View>
          <Text style={styles.hintText}>{Strings.maxLanguagesHint}</Text>
          {form.otherLanguages.length > 0 ? (
            <View style={styles.languagePillRow}>
              {form.otherLanguages.map(language => (
                <TouchableOpacity
                  key={language}
                  style={styles.languagePill}
                  activeOpacity={0.85}
                  onPress={() => removeLanguage(language)}
                >
                  <Text style={styles.languagePillText}>{language}</Text>
                  <Icon name="close" size={fs(14)} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <SetupDropdown
            label={Strings.maritalStatusDetail}
            iconName="heart-outline"
            placeholder={Strings.maritalStatusPlaceholder}
            value={form.maritalStatus}
            options={EDIT_MARITAL_STATUS_OPTIONS}
            isOpen={openDropdown === 'marital'}
            onToggle={() =>
              setOpenDropdown(prev => (prev === 'marital' ? null : 'marital'))
            }
            onSelect={value => {
              updateForm('maritalStatus', value);
              maritalDirtyRef.current = true;
              const marital = toApiMaritalStatus(value);
              if (marital) {
                saveProfileCache({
                  ...(store.getState().profile.profile ?? {}),
                  marital_status: marital,
                });
              }
              setOpenDropdown(null);
            }}
            style={styles.fieldSpacing}
          />

          <SetupDropdown
            label={Strings.community}
            iconSource={Images.communityIcon}
            placeholder={Strings.community}
            value={form.community}
            options={
              form.community &&
              !(COMMUNITY_OPTIONS as readonly string[]).includes(form.community)
                ? [...COMMUNITY_OPTIONS, form.community]
                : COMMUNITY_OPTIONS
            }
            isOpen={openDropdown === 'community'}
            onToggle={() =>
              setOpenDropdown(prev =>
                prev === 'community' ? null : 'community',
              )
            }
            onSelect={value => {
              updateForm('community', value);
              setOpenDropdown(null);
            }}
            style={styles.fieldSpacing}
          />

          <SetupDropdown
            label={Strings.residentialStatusLabel}
            iconName="home-outline"
            placeholder={Strings.residenceStatusPlaceholder}
            value={form.residenceStatus}
            options={RESIDENCE_STATUS_OPTIONS}
            isOpen={openDropdown === 'residence'}
            onToggle={() =>
              setOpenDropdown(prev =>
                prev === 'residence' ? null : 'residence',
              )
            }
            onSelect={value => {
              updateForm('residenceStatus', value);
              setOpenDropdown(null);
            }}
          />

          <View style={styles.noticeBox}>
            <Icon
              name="shield-check-outline"
              size={fs(18)}
              color={Colors.primary}
              style={styles.noticeIcon}
            />
            <Text style={styles.noticeText}>{Strings.editProfileNotice}</Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <PrimaryButton
            title={Strings.saveChanges}
            onPress={handleSave}
            loading={saving}
            showArrow
          />
        </View>
      </KeyboardAvoidingView>
      )}

      <Modal
        visible={viewerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingPhoto) {
            setViewerIndex(null);
          }
        }}
      >
        <View style={styles.lightbox}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!deletingPhoto) {
                setViewerIndex(null);
              }
            }}
          />
          {viewerIndex !== null && visibleGalleryPhotos[viewerIndex] ? (
            <Image
              source={{ uri: visibleGalleryPhotos[viewerIndex].url }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          ) : null}
          <TouchableOpacity
            style={styles.lightboxClose}
            activeOpacity={0.85}
            disabled={deletingPhoto}
            onPress={() => setViewerIndex(null)}
          >
            <Icon name="close" size={fs(20)} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.lightboxDelete}
            activeOpacity={0.85}
            disabled={deletingPhoto}
            onPress={handleDeleteGalleryPhoto}
          >
            {deletingPhoto ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Icon name="delete-outline" size={fs(18)} color={Colors.white} />
                <Text style={styles.lightboxDeleteText}>
                  {Strings.deletePhoto}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const GALLERY_CARD_PADDING = wp('3.2%');
const GALLERY_SLOT_GAP = wp('2%');
const GALLERY_SLOT_SIZE =
  (wp('100%') -
    AuthStyles.horizontalPadding * 2 -
    GALLERY_CARD_PADDING * 2 -
    GALLERY_SLOT_GAP * 2) /
  3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
    minWidth: wp('12%'),
    textAlign: 'right',
  },
  saveTextDisabled: {
    opacity: 0.45,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('2%'),
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: hp('1.6%'),
  },
  photoWrap: {
    position: 'relative',
    marginBottom: hp('1%'),
  },
  profilePhoto: {
    width: wp('28%'),
    height: wp('28%'),
    borderRadius: wp('14%'),
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  changePhotoText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  hiddenPhotoCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: Colors.goldLight,
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('4%'),
    gap: hp('0.6%'),
  },
  hiddenPhotoText: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: Colors.primary,
    textAlign: 'center',
  },
  galleryCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: Colors.goldLight,
    paddingHorizontal: GALLERY_CARD_PADDING,
    paddingTop: hp('1.2%'),
    paddingBottom: hp('1.4%'),
    marginBottom: hp('1.8%'),
    overflow: 'visible',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
    gap: wp('2%'),
  },
  galleryHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  galleryTitle: {
    flexShrink: 1,
    fontSize: fs(12),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  galleryHint: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('1.2%'),
  },
  galleryEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    paddingVertical: hp('0.4%'),
  },
  galleryEmptyText: {
    flex: 1,
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    overflow: 'visible',
  },
  photoSlot: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: GALLERY_SLOT_GAP,
    borderRadius: wp('3%'),
    backgroundColor: Colors.tabActiveBg,
    position: 'relative',
  },
  photoSlotAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1.2,
    borderColor: Colors.goldLight,
    overflow: 'visible',
  },
  photoSlotImageWrap: {
    width: '100%',
    height: '100%',
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    top: hp('0.5%'),
    left: wp('1%'),
    zIndex: 2,
    backgroundColor: Colors.primary,
    borderRadius: wp('1.5%'),
    paddingHorizontal: wp('1.5%'),
    paddingVertical: hp('0.2%'),
  },
  mainBadgeText: {
    fontSize: fs(8),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: wp('92%'),
    height: hp('70%'),
  },
  lightboxClose: {
    position: 'absolute',
    top: hp('7%'),
    right: wp('6%'),
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxDelete: {
    position: 'absolute',
    bottom: hp('8%'),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    backgroundColor: Colors.redish,
    borderRadius: wp('8%'),
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('1.2%'),
  },
  lightboxDeleteText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
    marginTop: hp('0.5%'),
  },
  sectionTitle: {
    flex: 1,
    fontSize: fs(12),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: wp('1%'),
    backgroundColor: '#FDE8EE',
    borderRadius: wp('5%'),
    paddingHorizontal: wp('2.4%'),
    paddingVertical: hp('0.45%'),
  },
  viewAllText: {
    fontSize: fs(11),
    fontFamily: Fonts.bold,
    color: Colors.redish,
    includeFontPadding: false,
  },
  fieldLabel: {
    fontSize: FontSizes.body,
    color: Colors.label,
    marginBottom: AuthStyles.fieldLabelGap,
    fontFamily: Fonts.medium,
    includeFontPadding: false,
    lineHeight: FontSizes.body + 2,
  },
  fieldSpacing: {
    marginBottom: hp('1.2%'),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.7%'),
    height: AuthStyles.inputHeight,
    marginBottom: hp('2%'),
  },
  inputRowMuted: {
    backgroundColor: Colors.tabActiveBg,
  },
  inputIcon: {
    marginRight: wp('2.5%'),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  ageBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: wp('2.2%'),
    paddingVertical: hp('0.45%'),
    borderRadius: wp('3%'),
    marginLeft: wp('1.5%'),
  },
  ageBadgeText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  genderRow: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('1.2%'),
  },
  genderBtn: {
    flex: 1,
    height: hp('5%'),
    borderRadius: AuthStyles.inputRadius,
    borderWidth: 1.2,
    borderColor: Colors.focusBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('1%'),
  },
  genderBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  genderTextActive: {
    color: Colors.white,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  charCount: {
    fontSize: fs(11),
    fontFamily: Fonts.medium,
    color: Colors.gold,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.tabActiveBg,
    paddingHorizontal: wp('3.7%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('2.2%'),
    minHeight: hp('12%'),
  },
  aboutIcon: {
    marginRight: wp('2.5%'),
    marginTop: hp('0.2%'),
  },
  aboutInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    minHeight: hp('10%'),
    paddingVertical: 0,
  },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('2.5%'),
    marginBottom: hp('2%'),
    zIndex: 50,
    elevation: 50,
    overflow: 'visible',
  },
  heightDropdown: {
    flex: 1,
    overflow: 'visible',
  },
  dropdownAnchor: {
    position: 'relative',
    zIndex: 1,
    marginBottom: hp('0.5%'),
    overflow: 'visible',
  },
  dropdownAnchorInner: {
    position: 'relative',
    overflow: 'visible',
  },
  dropdownOpenWrap: {
    zIndex: 200,
    elevation: 200,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.7%'),
    height: AuthStyles.inputHeight,
  },
  dropdownIconImage: {
    width: fs(20),
    height: fs(20),
    marginRight: wp('2.5%'),
  },
  dropdownPlaceholder: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.placeholder,
  },
  dropdownMenu: {
    position: 'absolute',
    top: AuthStyles.inputHeight + hp('0.4%'),
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 24,
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownScroll: {
    maxHeight: hp('28%'),
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.4%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerPink,
  },
  dropdownOptionSelected: {
    backgroundColor: Colors.inputBg,
  },
  dropdownOptionText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  dropdownOptionTextSelected: {
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  hintText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('1%'),
  },
  languagePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.6%'),
  },
  languagePillText: {
    fontSize: fs(12),
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: AuthStyles.inputRadius,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
  },
  noticeIcon: {
    marginRight: wp('2.5%'),
    marginTop: hp('0.2%'),
  },
  noticeText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: Colors.primary,
    lineHeight: hp('2.2%'),
  },
  footer: {
    zIndex: 1,
    elevation: 2,
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});

export default EditProfileScreen;
