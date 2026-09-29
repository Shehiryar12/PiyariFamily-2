import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Toast from 'react-native-simple-toast';
import { AxiosError } from 'axios';
import { Images } from '../../Assets';
import AuthInput from '../../Components/AuthInput';
import BackButton from '../../Components/BackButton';
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
  PROFILE_SETUP_TOTAL_STEPS,
  QUALIFICATION_OPTIONS,
  Qualification,
} from '../../Constant/ProfileSetup';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { hp } from '../../Functions/responsive';
import { store } from '../../Redux';

type Props = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
};

const matchQualification = (value?: string | null): Qualification | '' => {
  if (!value) {
    return '';
  }

  const normalized = value.toLowerCase();
  const matched = QUALIFICATION_OPTIONS.find(
    option => option.toLowerCase() === normalized,
  );

  return matched ?? '';
};

const EducationScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [qualification, setQualification] = useState<Qualification | ''>('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [openDropdown, setOpenDropdown] = useState<'qualification' | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {

      const applyEducation = (profile: {
        qualification?: string | null;
        highest_education?: string | null;
        education?: string | null;
        field_of_study?: string | null;
        university?: string | null;
        graduation_year?: string | number | null;
      }) => {
        const qualificationValue = matchQualification(
          profile.qualification ??
            profile.highest_education ??
            profile.education,
        );
        if (qualificationValue) {
          setQualification(qualificationValue);
        }
        if (profile.field_of_study) {
          setFieldOfStudy(profile.field_of_study);
        }
        if (profile.university) {
          setUniversity(profile.university);
        }
        if (profile.graduation_year) {
          setGraduationYear(String(profile.graduation_year));
        }
      };

      const cachedProfile = store.getState().profile.profile;
      if (cachedProfile) {
        applyEducation(cachedProfile);
      }

      let cancelled = false;

      const loadEducation = async () => {
        try {
          const res = await Api.getProfile();

          if (cancelled) {
            return;
          }

          if (res?.status == 200) {
            applyEducation(resolveProfileData(res?.data));
          } else {
          }
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
        }
      };

      loadEducation();

      return () => {
        cancelled = true;
      };
  }, []);

  const handleContinue = async () => {
    if (!qualification) {
      Toast.show('Please select your highest qualification');
      return;
    }
    if (!fieldOfStudy.trim()) {
      Toast.show('Please enter your field of study');
      return;
    }
    if (!university.trim()) {
      Toast.show('Please enter your university or college name');
      return;
    }
    if (!graduationYear.trim()) {
      Toast.show('Please enter your graduation year');
      return;
    }
    if (saving) {
      return;
    }

    const qualificationValue = qualification.toLowerCase();

    setSaving(true);

    try {
      const res = await Api.updateProfileEducation({
        highest_education: qualificationValue,
        university: university.trim(),
        field_of_study: fieldOfStudy.trim(),
        qualification: qualificationValue,
        graduation_year: graduationYear.trim(),
      });

      if (res?.status == 200 || res?.success === true || res?.success == 200) {
        saveProfileCache({
          ...(res.user ?? {}),
          qualification: qualificationValue,
          highest_education: qualificationValue,
          education: qualificationValue,
          field_of_study: fieldOfStudy.trim(),
          university: university.trim(),
          graduation_year: graduationYear.trim(),
        });
        Toast.show(res?.message ?? 'Education saved', Toast.LONG);
        navigation.navigate('Career');
      } else {
        Toast.show(res?.message ?? 'Failed to save education', Toast.LONG);
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
            currentStep={2}
            totalSteps={PROFILE_SETUP_TOTAL_STEPS}
            label={Strings.educationStep}
          />

          <Text style={styles.title}>{Strings.yourEducationTitle}</Text>
          <Text style={styles.subtitle}>{Strings.yourEducationSubtitle}</Text>

          <SetupDropdown
            label={Strings.highestQualificationLabel}
            iconName="school-outline"
            placeholder={Strings.selectQualificationPlaceholder}
            value={qualification}
            options={QUALIFICATION_OPTIONS}
            isOpen={openDropdown === 'qualification'}
            onToggle={() =>
              setOpenDropdown(prev =>
                prev === 'qualification' ? null : 'qualification',
              )
            }
            onSelect={value => {
              setQualification(value as Qualification);
              setOpenDropdown(null);
            }}
            style={styles.fieldSpacing}
          />

          <AuthInput
            label={Strings.fieldOfStudyLabel}
            iconSource={Images.fieldStudyIcon}
            placeholder={Strings.fieldOfStudyPlaceholder}
            value={fieldOfStudy}
            onChangeText={setFieldOfStudy}
          />

          <AuthInput
            label={Strings.universityLabel}
            iconSource={Images.universityIcon}
            placeholder={Strings.universityPlaceholder}
            value={university}
            onChangeText={setUniversity}
          />

          <AuthInput
            label={Strings.graduationYearLabel}
            iconSource={Images.calendarIcon}
            placeholder={Strings.graduationYearPlaceholder}
            value={graduationYear}
            onChangeText={setGraduationYear}
            keyboardType="number-pad"
            maxLength={4}
          />
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
  fieldSpacing: {
    marginBottom: hp('1.2%'),
  },
  footer: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});

export default EducationScreen;
