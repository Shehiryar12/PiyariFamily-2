import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import { Images } from '../../Assets';
import BackButton from '../../Components/BackButton';
import FilterChip from '../../Components/FilterChip';
import PrimaryButton from '../../Components/PrimaryButton';
import SetupDropdown from '../../Components/SetupDropdown';
import {
  DropdownSafeScrollView as ScrollView,
} from '../../Components/DropdownPortal';
import SetupProgressBar from '../../Components/SetupProgressBar';
import {
  Api,
  ENDPOINTS,
  getApiErrorMessage,
  resolveProfileData,
  saveProfileCache,
  type ApiErrorResponse,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import {
  BODY_TYPE_OPTIONS,
  BODY_TYPE_TO_API,
  BodyType,
  COMPLEXION_OPTIONS,
  COMPLEXION_TO_API,
  Complexion,
  HEIGHT_FEET_OPTIONS,
  HEIGHT_INCHES_OPTIONS,
  PROFILE_SETUP_TOTAL_STEPS,
} from '../../Constant/ProfileSetup';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import { store } from '../../Redux';

type Props = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
};

const formatWeightForApi = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return /kg$/i.test(trimmed) ? trimmed : `${trimmed}kg`;
};

const parseHeight = (value?: string | null) => {
  if (!value) {
    return { feet: '', inches: '' };
  }

  const [feetPart, inchesPart] = value.split('.');
  return {
    feet: feetPart ?? '',
    inches: inchesPart ?? '',
  };
};

const PhysicalDetailsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyType, setBodyType] = useState<BodyType | ''>('');
  const [complexion, setComplexion] = useState<Complexion | ''>('');
  const [hasDisability, setHasDisability] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'feet' | 'inches' | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {

      const applyPhysical = (profile: {
        height?: string | null;
        weight?: string | null;
      }) => {
        const heightParts = parseHeight(profile.height);
        if (heightParts.feet) {
          setFeet(heightParts.feet);
        }
        if (heightParts.inches) {
          setInches(heightParts.inches);
        }
        if (profile.weight) {
          setWeight(String(profile.weight).replace(/kg$/i, ''));
        }
      };

      const cachedProfile = store.getState().profile.profile;
      if (cachedProfile) {
        applyPhysical(cachedProfile);
      }

      let cancelled = false;

      const loadPhysical = async () => {
        try {
          const res = await Api.getProfile();

          if (cancelled) {
            return;
          }

          if (res?.status == 200) {
            applyPhysical(resolveProfileData(res?.data));
          } else {
          }
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
        }
      };

      loadPhysical();

      return () => {
        cancelled = true;
      };
  }, []);

  const handleContinue = async () => {
    if (!feet || !inches) {
      Toast.show('Please select your height');
      return;
    }
    if (saving) {
      return;
    }

    const height = `${feet}.${inches}`;
    const formattedWeight = formatWeightForApi(weight);
    const payload: Record<string, string> = {
      height,
      physical_disability: hasDisability ? '1' : '0',
    };

    if (formattedWeight) {
      payload.weight = formattedWeight;
    }
    if (bodyType) {
      payload.body_type = BODY_TYPE_TO_API[bodyType];
    }
    if (complexion) {
      payload.complexion = COMPLEXION_TO_API[complexion];
    }

    setSaving(true);

    try {
      const res = await Api.updateProfilePhysical(payload);

      if (res?.status == 200 || res?.success === true || res?.success == 200) {
        saveProfileCache({
          ...(res.user ?? {}),
          height,
          weight: formattedWeight || undefined,
          body_type: bodyType ? BODY_TYPE_TO_API[bodyType] : undefined,
          complexion: complexion ? COMPLEXION_TO_API[complexion] : undefined,
          physical_disability: hasDisability,
        });
        Toast.show(res?.message ?? 'Physical details saved', Toast.LONG);
        navigation.navigate('FaithCommunity');
      } else {
        Toast.show(res?.message ?? 'Failed to save physical details', Toast.LONG);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      Toast.show(getApiErrorMessage(axiosError), Toast.LONG);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
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
          <BackButton variant="pink" onPress={() => navigation.goBack()} />

          <SetupProgressBar
            currentStep={4}
            totalSteps={PROFILE_SETUP_TOTAL_STEPS}
            label={Strings.physicalDetailsStep}
          />

          <Text style={styles.title}>{Strings.physicalDetailsTitle}</Text>
          <Text style={styles.subtitle}>{Strings.physicalDetailsSubtitle}</Text>

          <Text style={styles.fieldLabel}>{Strings.heightLabel}</Text>
          <View style={styles.heightRow}>
            <SetupDropdown
              iconText="'"
              placeholder={Strings.selectFeetPlaceholder}
              value={feet ? `${feet} ft` : ''}
              options={HEIGHT_FEET_OPTIONS.map(option => `${option} ft`)}
              isOpen={openDropdown === 'feet'}
              onToggle={() =>
                setOpenDropdown(prev => (prev === 'feet' ? null : 'feet'))
              }
              onSelect={value => {
                setFeet(value.replace(' ft', ''));
                setOpenDropdown(null);
              }}
              style={styles.heightDropdown}
            />
            <SetupDropdown
              iconSource={Images.inchesIcon}
              placeholder={Strings.selectInchesPlaceholder}
              value={inches ? `${inches} in` : ''}
              options={HEIGHT_INCHES_OPTIONS.map(option => `${option} in`)}
              isOpen={openDropdown === 'inches'}
              onToggle={() =>
                setOpenDropdown(prev => (prev === 'inches' ? null : 'inches'))
              }
              onSelect={value => {
                setInches(value.replace(' in', ''));
                setOpenDropdown(null);
              }}
              style={styles.heightDropdown}
            />
          </View>

          <Text style={styles.fieldLabel}>{Strings.weightLabel}</Text>
          <View style={styles.weightRow}>
            <Image
              source={Images.weightIcon}
              style={styles.weightIconImage}
              resizeMode="contain"
            />
            <TextInput
              style={styles.weightInput}
              placeholder={Strings.weightPlaceholder}
              placeholderTextColor={Colors.placeholder}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>{Strings.optional}</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>{Strings.bodyTypeLabel}</Text>
          <View style={styles.chipRow}>
            {BODY_TYPE_OPTIONS.map(option => (
              <FilterChip
                key={option}
                label={option}
                selected={bodyType === option}
                unselectedBackgroundColor={Colors.white}
                onPress={() => setBodyType(option)}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>{Strings.complexionLabel}</Text>
          <View style={styles.chipRow}>
            {COMPLEXION_OPTIONS.map(option => (
              <FilterChip
                key={option}
                label={option}
                selected={complexion === option}
                unselectedBackgroundColor={Colors.white}
                onPress={() => setComplexion(option)}
              />
            ))}
          </View>

          <View style={styles.disabilityRow}>
            <Icon
              name="wheelchair-accessibility"
              size={fs(20)}
              color={Colors.primary}
              style={styles.disabilityIcon}
            />
            <Text style={styles.disabilityText}>
              {Strings.physicalDisabilityLabel}
            </Text>
            <Switch
              value={hasDisability}
              onValueChange={setHasDisability}
              trackColor={{
                false: Colors.divider,
                true: Colors.focusBorder,
              }}
              thumbColor={hasDisability ? Colors.primary : Colors.white}
            />
          </View>

          <View style={styles.noticeBox}>
            <Icon
              name="heart-outline"
              size={fs(18)}
              color={Colors.primary}
              style={styles.noticeIcon}
            />
            <Text style={styles.noticeText}>{Strings.physicalDetailsNotice}</Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <PrimaryButton
            title={Strings.continueBtn}
            onPress={handleContinue}
            loading={saving}
            showArrow
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  fieldLabel: {
    fontSize: FontSizes.body,
    color: Colors.label,
    marginBottom: AuthStyles.fieldLabelGap,
    fontFamily: Fonts.medium,
    includeFontPadding: false,
    lineHeight: FontSizes.body + 2,
  },
  heightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp('3%'),
    marginBottom: hp('2%'),
    zIndex: 50,
    elevation: 50,
    overflow: 'visible',
  },
  heightDropdown: {
    flex: 1,
    overflow: 'visible',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.7%'),
    height: AuthStyles.inputHeight,
    marginBottom: hp('2.2%'),
  },
  weightIconImage: {
    width: fs(20),
    height: fs(20),
    marginRight: wp('2.5%'),
  },
  weightInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  optionalBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: wp('2.2%'),
    paddingVertical: hp('0.45%'),
    borderRadius: wp('3%'),
    marginLeft: wp('1.5%'),
  },
  optionalBadgeText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2.5%'),
    marginBottom: hp('2.2%'),
  },
  disabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.7%'),
    height: AuthStyles.inputHeight,
    marginBottom: hp('2.2%'),
  },
  disabilityIcon: {
    marginRight: wp('2.5%'),
  },
  disabilityText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
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

export default PhysicalDetailsScreen;
