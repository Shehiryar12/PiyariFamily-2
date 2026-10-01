import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import BackButton from '../../Components/BackButton';
import PrimaryButton from '../../Components/PrimaryButton';
import SetupProgressBar from '../../Components/SetupProgressBar';
import {
  Api,
  getApiErrorMessage,
  saveProfileCache,
  extractProfilePhotoSlots,
  type ApiErrorResponse,
} from '../../API';
import { normalizeUploadFile, type UploadFile } from '../../API/formData';
import { accountStorage } from '../../API/accountStorage';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import {
  PROFILE_PHOTO_SLOTS,
  PROFILE_PHOTO_MAX_BYTES,
  PROFILE_PHOTO_PICKER_MAX_SIZE,
  PROFILE_PHOTO_PICKER_QUALITY,
  PROFILE_SETUP_TOTAL_STEPS,
} from '../../Constant/ProfileSetup';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import { setAuthSession, setSetupComplete, store } from '../../Redux';

type Props = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
};

const createEmptyPhotos = () =>
  Array.from({ length: PROFILE_PHOTO_SLOTS }, () => null as UploadFile | null);

const isSupportedPhoto = (type?: string | null) =>
  !type ||
  ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
    type.toLowerCase(),
  );

const AddPhotosScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [localPhotos, setLocalPhotos] =
    useState<(UploadFile | null)[]>(createEmptyPhotos);
  const [remotePhotos, setRemotePhotos] =
    useState<(string | null)[]>(createEmptyPhotos);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const profile = store.getState().profile.profile;
    setRemotePhotos(extractProfilePhotoSlots(profile));
  }, []);

  const getSlotUri = (index: number) =>
    localPhotos[index]?.uri ?? remotePhotos[index] ?? null;

  const hasAtLeastOnePhoto =
    localPhotos.some(photo => photo !== null) ||
    remotePhotos.some(photo => photo !== null);

  const handlePickPhoto = (index: number) => {
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

        if (!isSupportedPhoto(asset.type)) {
          Toast.show('Please select JPEG, PNG, or WEBP image', Toast.LONG);
          return;
        }

        if (asset.fileSize && asset.fileSize > PROFILE_PHOTO_MAX_BYTES) {
          Toast.show(Strings.photoTooLarge, Toast.LONG);
          return;
        }

        const photo = normalizeUploadFile(
          asset.uri,
          asset.fileName,
          asset.type,
        );

        setLocalPhotos(prev => {
          const next = [...prev];
          next[index] = photo;
          return next;
        });
        setRemotePhotos(prev => {
          const next = [...prev];
          next[index] = null;
          return next;
        });
      },
    );
  };

  const handleRemovePhoto = (index: number) => {
    setLocalPhotos(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setRemotePhotos(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const finishCompleteProfile = async () => {
    const res = await Api.completeProfile();

    console.log('POST /profile/complete response:', res);

    if (res?.status == 200 || res?.success === true || res?.success == 200) {
      const cached = saveProfileCache(res);
      const accountStatus =
        cached.status === 'inactive' ? 'inactive' : 'active';

      accountStorage.setStatus(accountStatus);
      if (cached.profile_completed !== false) {
        store.dispatch(setSetupComplete(true));
        const userId = Number(cached.id);
        store.dispatch(
          setAuthSession({
            user: {
              id: Number.isFinite(userId) ? userId : 0,
              name: cached.name || '',
              email: cached.email || '',
              phone: cached.phone || '',
              is_verified: cached.is_verified,
            },
          }),
        );
      }

      Toast.show(
        res?.message ?? 'Congratulations! Your profile is ready.',
        Toast.LONG,
      );
      navigation.navigate('ProfileReady');
      return true;
    }

    Toast.show(res?.message ?? 'Failed to complete profile', Toast.LONG);
    return false;
  };

  const handleContinue = async () => {
    if (!hasAtLeastOnePhoto) {
      Toast.show(Strings.addPhotoRequired);
      return;
    }
    if (saving) {
      return;
    }

    const selectedSlots = localPhotos
      .map((photo, index) => ({ photo, index }))
      .filter(
        (item): item is { photo: UploadFile; index: number } =>
          item.photo !== null,
      );
    const selectedPhotos = selectedSlots.map(item => item.photo);
    const mainPhotoIndex = Math.max(
      selectedSlots.findIndex(item => item.index === 0),
      0,
    );

    setSaving(true);

    try {
      if (selectedPhotos.length) {
        const res = await Api.uploadProfilePhotos(
          selectedPhotos,
          mainPhotoIndex,
        );
        const uploaded = res?.status == 200 || res?.success === true;
        
        if (!uploaded) {
          Toast.show(res?.message ?? 'Failed to upload photos', Toast.LONG);
          return;
        }

        const uploadedSlotUrls = Array.from(
          { length: PROFILE_PHOTO_SLOTS },
          (_, index) => localPhotos[index]?.uri ?? remotePhotos[index] ?? null,
        ).filter((url): url is string => Boolean(url));

        let cached = saveProfileCache(res?.data ?? res);

        try {
          const profileRes = await Api.getProfile();
          if (profileRes?.status == 200) {
            cached = saveProfileCache(profileRes.data);
          }
        } catch (refreshError) {}

        const cachedSlots = extractProfilePhotoSlots(cached);
        if (!cachedSlots.some(Boolean) && uploadedSlotUrls.length > 0) {
          cached = saveProfileCache({
            ...cached,
            profile_photo: uploadedSlotUrls[0],
            image: uploadedSlotUrls[0],
            photos: uploadedSlotUrls.map((url, index) => ({
              url,
              is_main: index === 0,
            })),
          });
        } else if (
          uploadedSlotUrls.length > 0 &&
          (!Array.isArray(cached.photos) || cached.photos.length === 0)
        ) {
          cached = saveProfileCache({
            ...cached,
            photos: uploadedSlotUrls.map((url, index) => ({
              url,
              is_main: index === 0,
            })),
            profile_photo: cached.profile_photo ?? uploadedSlotUrls[0],
            image: cached.image ?? uploadedSlotUrls[0],
          });
        }

        setRemotePhotos(extractProfilePhotoSlots(cached));
        setLocalPhotos(createEmptyPhotos());
      }

      await finishCompleteProfile();
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      Toast.show(getApiErrorMessage(axiosError), Toast.LONG);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <BackButton variant="pink" onPress={() => navigation.goBack()} />

        <SetupProgressBar
          currentStep={6}
          totalSteps={PROFILE_SETUP_TOTAL_STEPS}
          label={Strings.profilePhotosStep}
        />

        <Text style={styles.title}>{Strings.addPhotosTitle}</Text>
        <Text style={styles.subtitle}>{Strings.addPhotosSubtitle}</Text>

        <View style={styles.photoGrid}>
          {localPhotos.map((photo, index) => {
            const isMain = index === 0;
            const slotUri = getSlotUri(index);

            if (slotUri) {
              return (
                <View key={index} style={styles.photoSlot}>
                  {isMain ? (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>
                        {Strings.mainPhoto}
                      </Text>
                    </View>
                  ) : null}
                  <Image source={{ uri: slotUri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    activeOpacity={0.85}
                    onPress={() => handleRemovePhoto(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={fs(14)} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.photoSlot, styles.photoSlotEmpty]}
                activeOpacity={0.85}
                onPress={() => handlePickPhoto(index)}
              >
                {isMain ? (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>
                      {Strings.mainPhoto}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.emptyContent}>
                  <Icon
                    name={isMain ? 'camera-outline' : 'plus'}
                    size={fs(isMain ? 22 : 20)}
                    color={Colors.focusBorder}
                  />
                  {!isMain ? (
                    <Text style={styles.addPhotoText}>{Strings.addPhoto}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.noticeBox}>
          <Icon
            name="shield-check-outline"
            size={fs(18)}
            color={Colors.primary}
            style={styles.noticeIcon}
          />
          <Text style={styles.noticeText}>{Strings.photosReviewNotice}</Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: getFooterBottomPadding(insets.bottom) },
        ]}
      >
        <PrimaryButton
          title={Strings.completeProfile}
          onPress={handleContinue}
          loading={saving}
          showArrow
          disabled={!hasAtLeastOnePhoto || saving}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('2%'),
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.6%'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('2.5%'),
    lineHeight: hp('2.4%'),
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: wp('2%'),
    rowGap: hp('1.2%'),
    marginBottom: hp('2.2%'),
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: wp('3%'),
    overflow: 'hidden',
    backgroundColor: Colors.tabActiveBg,
    position: 'relative',
  },
  photoSlotEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.focusBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
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
  removeBtn: {
    position: 'absolute',
    top: hp('0.5%'),
    right: wp('1%'),
    zIndex: 2,
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.redish,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp('0.6%'),
  },
  addPhotoText: {
    fontSize: fs(9),
    fontFamily: Fonts.medium,
    color: Colors.focusBorder,
    textAlign: 'center',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: AuthStyles.inputRadius,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
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
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});

export default AddPhotosScreen;
