import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
import PrimaryButton from '../../Components/PrimaryButton';
import SetupDropdown from '../../Components/SetupDropdown';
import DropdownOptionsOverlay, {
  DropdownSafeScrollView as ScrollView,
  useGuardedDropdownPress,
} from '../../Components/DropdownOptionsOverlay';
import SetupProgressBar from '../../Components/SetupProgressBar';
import {
  Api,
  ENDPOINTS,
  getApiErrorMessage,
  saveProfileCache,
  type ApiErrorResponse,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import {
  MAX_OTHER_LANGUAGES,
  MOTHER_TONGUE_OPTIONS,
  MotherTongue,
  OTHER_LANGUAGE_OPTIONS,
  OtherLanguage,
  PROFILE_SETUP_TOTAL_STEPS,
  RELIGION_OPTIONS,
  RELIGION_TO_API,
  Religion,
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

const matchReligion = (value?: string | null): Religion | '' => {
  if (!value) {
    return '';
  }

  const matched = RELIGION_OPTIONS.find(
    option => option.toLowerCase() === value.toLowerCase(),
  );

  return matched ?? '';
};

const FaithCommunityScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [religion, setReligion] = useState<Religion | ''>('');
  const [community, setCommunity] = useState('');
  const [sect, setSect] = useState('');
  const [motherTongue, setMotherTongue] = useState<MotherTongue | ''>('');
  const [otherLanguages, setOtherLanguages] = useState<OtherLanguage[]>([]);
  const [openDropdown, setOpenDropdown] = useState<
    'religion' | 'motherTongue' | 'languages' | null
  >(null);
  const [saving, setSaving] = useState(false);
  const languagesAnchorRef = useRef<View>(null);
  const handleLanguagesPress = useGuardedDropdownPress(() =>
    setOpenDropdown(prev => (prev === 'languages' ? null : 'languages')),
  );

  useEffect(() => {

      const cachedProfile = store.getState().profile.profile;
      if (!cachedProfile) {
        return;
      }

      const religionValue = matchReligion(cachedProfile.religion);
      if (religionValue) {
        setReligion(religionValue);
      }
      if (cachedProfile.community) {
        setCommunity(
          cachedProfile.community.charAt(0).toUpperCase() +
            cachedProfile.community.slice(1),
        );
      }
      if (cachedProfile.sect) {
        setSect(
          cachedProfile.sect.charAt(0).toUpperCase() +
            cachedProfile.sect.slice(1),
        );
      }
      if (cachedProfile.mother_tongue) {
        const tongue = MOTHER_TONGUE_OPTIONS.find(
          option =>
            option.toLowerCase() === cachedProfile.mother_tongue?.toLowerCase(),
        );
        if (tongue) {
          setMotherTongue(tongue);
        }
      }
      if (Array.isArray(cachedProfile.other_languages)) {
        const languages = cachedProfile.other_languages.filter(
          (language): language is OtherLanguage =>
            OTHER_LANGUAGE_OPTIONS.includes(language as OtherLanguage),
        );
        if (languages.length) {
          setOtherLanguages(languages);
        }
      }
  }, []);

  const handleContinue = async () => {
    if (!religion) {
      Toast.show('Please select your religion');
      return;
    }
    if (saving) {
      return;
    }

    const communityValue = community.trim();
    const sectValue = sect.trim();

    const payload = {
      religion: RELIGION_TO_API[religion],
      ...(motherTongue ? { mother_tongue: motherTongue } : {}),
      community: communityValue,
      sect: sectValue,
      other_languages: otherLanguages,
    };

    setSaving(true);

    try {
      const res = await Api.updateProfileFaith(payload);

      if (res?.status == 200) {
        saveProfileCache({
          religion: RELIGION_TO_API[religion],
          ...(motherTongue ? { mother_tongue: motherTongue } : {}),
          community: communityValue,
          sect: sectValue,
          other_languages: otherLanguages,
        });
        Toast.show(res?.message ?? 'Faith details saved', Toast.LONG);
        navigation.navigate('AddPhotos');
      } else {
        Toast.show(res?.message ?? 'Failed to save faith details', Toast.LONG);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      Toast.show(getApiErrorMessage(axiosError), Toast.LONG);
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (language: OtherLanguage) => {
    setOtherLanguages(prev => {
      if (prev.includes(language)) {
        return prev.filter(item => item !== language);
      }
      if (prev.length >= MAX_OTHER_LANGUAGES) {
        Toast.show(Strings.maxLanguagesHint);
        return prev;
      }
      return [...prev, language];
    });
  };

  const removeLanguage = (language: OtherLanguage) => {
    setOtherLanguages(prev => prev.filter(item => item !== language));
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
            currentStep={5}
            totalSteps={PROFILE_SETUP_TOTAL_STEPS}
            label={Strings.faithCommunityStep}
          />

          <Text style={styles.title}>{Strings.faithCommunityTitle}</Text>
          <Text style={styles.subtitle}>{Strings.faithCommunitySubtitle}</Text>

          <SetupDropdown
            label={Strings.religionLabel}
            iconSource={Images.religionIcon}
            placeholder={Strings.selectReligionPlaceholder}
            value={religion}
            options={RELIGION_OPTIONS}
            isOpen={openDropdown === 'religion'}
            onToggle={() =>
              setOpenDropdown(prev => (prev === 'religion' ? null : 'religion'))
            }
            onSelect={value => {
              setReligion(value as Religion);
              setOpenDropdown(null);
            }}
            style={styles.fieldSpacing}
          />

          <Text style={styles.fieldLabel}>{Strings.communityCasteLabel}</Text>
          <View style={styles.optionalInputRow}>
            <Image
              source={Images.communityIcon}
              style={styles.inputIconImage}
              resizeMode="contain"
            />
            <TextInput
              style={styles.optionalInput}
              placeholder={Strings.communityCastePlaceholder}
              placeholderTextColor={Colors.placeholder}
              value={community}
              onChangeText={setCommunity}
            />
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>{Strings.optional}</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>{Strings.sectLabel}</Text>
          <View style={styles.optionalInputRow}>
            <Icon
              name="tag-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.optionalInput}
              placeholder={Strings.sectPlaceholder}
              placeholderTextColor={Colors.placeholder}
              value={sect}
              onChangeText={setSect}
            />
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>{Strings.optional}</Text>
            </View>
          </View>

          <SetupDropdown
            label={Strings.motherTongueDetail}
            iconSource={Images.msgTextIcon}
            placeholder={Strings.selectMotherTonguePlaceholder}
            value={motherTongue}
            options={MOTHER_TONGUE_OPTIONS}
            isOpen={openDropdown === 'motherTongue'}
            onToggle={() =>
              setOpenDropdown(prev =>
                prev === 'motherTongue' ? null : 'motherTongue',
              )
            }
            onSelect={value => {
              setMotherTongue(value as MotherTongue);
              setOpenDropdown(null);
            }}
            style={styles.fieldSpacing}
          />

          <Text style={styles.fieldLabel}>{Strings.otherLanguages}</Text>
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
                  style={styles.inputIconImage}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.dropdownPlaceholderText,
                    otherLanguages.length > 0 && styles.dropdownValueText,
                  ]}
                >
                  {otherLanguages.length > 0
                    ? otherLanguages.join(', ')
                    : Strings.selectLanguagesPlaceholder}
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
                selectedValues={otherLanguages}
                closeOnSelect={false}
                onSelect={option => toggleLanguage(option as OtherLanguage)}
                onClose={() => setOpenDropdown(null)}
              />
            </View>
          </View>
          <Text style={styles.hintText}>{Strings.maxLanguagesHint}</Text>
          {otherLanguages.length > 0 ? (
            <View style={styles.languagePillRow}>
              {otherLanguages.map(language => (
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

          <View style={styles.noticeBox}>
            <Icon
              name="shield-check-outline"
              size={fs(18)}
              color={Colors.primary}
              style={styles.noticeIcon}
            />
            <Text style={styles.noticeText}>
              {Strings.faithCommunityNotice}
            </Text>
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
  fieldSpacing: {
    marginBottom: hp('1.2%'),
  },
  optionalInputRow: {
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
  inputIcon: {
    marginRight: wp('2.5%'),
  },
  inputIconImage: {
    width: fs(20),
    height: fs(20),
    marginRight: wp('2.5%'),
  },
  optionalInput: {
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
  dropdownPlaceholderText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.placeholder,
  },
  dropdownValueText: {
    color: Colors.text,
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
    marginBottom: hp('1.2%'),
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

export default FaithCommunityScreen;
