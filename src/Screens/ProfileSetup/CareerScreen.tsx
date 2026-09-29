import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  EMPLOYMENT_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_TO_API,
  EmploymentType,
  INCOME_RANGE_OPTIONS,
  INCOME_RANGE_TO_API,
  IncomeRange,
  PROFILE_SETUP_TOTAL_STEPS,
  RESIDENCE_STATUS_FROM_API,
  RESIDENCE_STATUS_OPTIONS,
  RESIDENCE_STATUS_TO_API,
  ResidenceStatus,
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

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  Employed: Strings.employed,
  'Self-Employed': Strings.selfEmployed,
  Business: Strings.business,
};

const EMPLOYMENT_FROM_API: Record<string, EmploymentType> = {
  employed: 'Employed',
  self_employed: 'Self-Employed',
  business: 'Business',
};

const matchIncomeRange = (
  value?: string | number | null,
): IncomeRange | '' => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const normalized = String(value).trim();
  const byLabel = INCOME_RANGE_OPTIONS.find(
    option => option.toLowerCase() === normalized.toLowerCase(),
  );
  if (byLabel) {
    return byLabel;
  }

  const byApi = (
    Object.entries(INCOME_RANGE_TO_API) as Array<[IncomeRange, string]>
  ).find(([, apiValue]) => apiValue === normalized);

  return byApi?.[0] ?? '';
};

const CareerScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [incomeRange, setIncomeRange] = useState<IncomeRange | ''>('');
  const [residenceStatus, setResidenceStatus] = useState<ResidenceStatus | ''>(
    '',
  );
  const [openDropdown, setOpenDropdown] = useState<
    'income' | 'residence' | null
  >(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {

      const applyCareer = (profile: {
        employment_type?: string | null;
        job_title?: string | null;
        profession?: string | null;
        company?: string | null;
        monthly_income?: string | number | null;
        annual_income?: string | number | null;
        residential_status?: string | null;
        residence_status?: string | null;
      }) => {
        const employment =
          EMPLOYMENT_FROM_API[profile.employment_type?.toLowerCase() ?? ''];
        if (employment) {
          setEmploymentType(employment);
        }
        if (profile.job_title) {
          setJobTitle(profile.job_title);
        } else if (profile.profession) {
          setJobTitle(profile.profession);
        }
        if (profile.company) {
          setCompany(profile.company);
        }

        const income = matchIncomeRange(
          profile.monthly_income ?? profile.annual_income,
        );
        if (income) {
          setIncomeRange(income);
        }

        const residence =
          RESIDENCE_STATUS_FROM_API[
            (profile.residential_status ?? profile.residence_status ?? '')
              .toLowerCase()
              .replace(/_/g, ' ')
          ] ??
          RESIDENCE_STATUS_FROM_API[
            (profile.residential_status ?? profile.residence_status ?? '')
              .toLowerCase()
          ];
        if (residence) {
          setResidenceStatus(residence);
        }
      };

      const cachedProfile = store.getState().profile.profile;
      if (cachedProfile) {
        applyCareer(cachedProfile);
      }

      let cancelled = false;

      const loadCareer = async () => {
        try {
          const res = await Api.getProfile();

          if (cancelled) {
            return;
          }

          if (res?.status == 200) {
            applyCareer(resolveProfileData(res?.data));
          } else {
          }
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
        }
      };

      loadCareer();

      return () => {
        cancelled = true;
      };
  }, []);

  const handleContinue = async () => {
    if (!employmentType) {
      Toast.show('Please select your employment type');
      return;
    }
    if (!jobTitle.trim()) {
      Toast.show('Please enter your job title');
      return;
    }
    if (!company.trim()) {
      Toast.show('Please enter your company name');
      return;
    }
    if (!incomeRange) {
      Toast.show('Please select your income range');
      return;
    }
    if (!residenceStatus) {
      Toast.show('Please select your residence status');
      return;
    }
    if (saving) {
      return;
    }

    const incomeValue = INCOME_RANGE_TO_API[incomeRange];
    const residenceValue = RESIDENCE_STATUS_TO_API[residenceStatus];

    setSaving(true);

    try {
      const res = await Api.updateProfileCareer({
        job_title: jobTitle.trim(),
        employment_type: EMPLOYMENT_TYPE_TO_API[employmentType],
        company: company.trim(),
        annual_income: incomeValue,
        monthly_income: incomeValue,
        residential_status: residenceValue,
        residence_status: residenceValue,
      });

      if (res?.status == 200 || res?.success === true || res?.success == 200) {
        saveProfileCache({
          ...(res.user ?? {}),
          job_title: jobTitle.trim(),
          employment_type: EMPLOYMENT_TYPE_TO_API[employmentType],
          company: company.trim(),
          profession: jobTitle.trim(),
          annual_income: incomeValue,
          monthly_income: incomeValue,
          residential_status: residenceValue,
          residence_status: residenceValue,
        });
        Toast.show(res?.message ?? 'Career details saved', Toast.LONG);
        navigation.navigate('PhysicalDetails');
      } else {
        Toast.show(res?.message ?? 'Failed to save career details', Toast.LONG);
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
            currentStep={3}
            totalSteps={PROFILE_SETUP_TOTAL_STEPS}
            label={Strings.careerStep}
          />

          <Text style={styles.title}>{Strings.yourCareerTitle}</Text>
          <Text style={styles.subtitle}>{Strings.yourCareerSubtitle}</Text>

          <Text style={styles.fieldLabel}>{Strings.employmentTypeLabel}</Text>
          <View style={styles.segmentContainer}>
            <View style={styles.segmentRow}>
              {EMPLOYMENT_TYPE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.segmentBtn,
                    employmentType === option && styles.segmentBtnActive,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setEmploymentType(option)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      employmentType === option && styles.segmentTextActive,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {EMPLOYMENT_LABELS[option]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <AuthInput
            label={Strings.jobTitleLabel}
            iconName="briefcase-outline"
            placeholder={Strings.jobTitlePlaceholder}
            value={jobTitle}
            onChangeText={setJobTitle}
          />

          <AuthInput
            label={Strings.companyLabel}
            iconSource={Images.companyIcon}
            placeholder={Strings.companyPlaceholder}
            value={company}
            onChangeText={setCompany}
          />

          <SetupDropdown
            label={Strings.monthlyIncomeLabel}
            iconSource={Images.incomeIcon}
            placeholder={Strings.selectIncomeRangePlaceholder}
            value={incomeRange}
            options={INCOME_RANGE_OPTIONS}
            isOpen={openDropdown === 'income'}
            onToggle={() =>
              setOpenDropdown(prev => (prev === 'income' ? null : 'income'))
            }
            onSelect={value => {
              setIncomeRange(value as IncomeRange);
              setOpenDropdown(null);
            }}
            style={styles.fieldSpacing}
          />

          <SetupDropdown
            label={Strings.residentialStatusLabel}
            iconName="home-outline"
            placeholder={Strings.residenceStatusPlaceholder}
            value={residenceStatus}
            options={RESIDENCE_STATUS_OPTIONS}
            isOpen={openDropdown === 'residence'}
            onToggle={() =>
              setOpenDropdown(prev =>
                prev === 'residence' ? null : 'residence',
              )
            }
            onSelect={value => {
              setResidenceStatus(value as ResidenceStatus);
              setOpenDropdown(null);
            }}
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
  fieldLabel: {
    fontSize: FontSizes.body,
    color: Colors.label,
    marginBottom: AuthStyles.fieldLabelGap,
    fontFamily: Fonts.medium,
    includeFontPadding: false,
    lineHeight: FontSizes.body + 2,
  },
  segmentContainer: {
    backgroundColor: Colors.white,
    borderRadius: AuthStyles.inputRadius,
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    padding: wp('1.5%'),
    marginBottom: hp('2.2%'),
  },
  segmentRow: {
    flexDirection: 'row',
    gap: wp('1.5%'),
  },
  segmentBtn: {
    flex: 1,
    minHeight: hp('5.2%'),
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('1%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.focusBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: Colors.white,
  },
  fieldSpacing: {
    marginBottom: hp('1.2%'),
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

export default CareerScreen;
