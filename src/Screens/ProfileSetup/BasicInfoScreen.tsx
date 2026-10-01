import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ScrollView as RNScrollView,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import Modal from 'react-native-modal';
import { Calendar, type DateData } from 'react-native-calendars';
import { AxiosError } from 'axios';
import { Images } from '../../Assets';
import AuthInput from '../../Components/AuthInput';
import BackButton from '../../Components/BackButton';
import PrimaryButton from '../../Components/PrimaryButton';
import SetupProgressBar from '../../Components/SetupProgressBar';
import DropdownOptionsOverlay, {
  DropdownSafeScrollView as ScrollView,
  useGuardedDropdownPress,
} from '../../Components/DropdownOptionsOverlay';
import {
  Api,
  getApiErrorMessage,
  resolveProfileData,
  saveProfileCache,
  type ApiErrorResponse,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import {
  MARITAL_STATUS_FROM_API,
  MARITAL_STATUS_OPTIONS,
  MARITAL_STATUS_TO_API,
  MaritalStatus,
  PROFILE_SETUP_TOTAL_STEPS,
} from '../../Constant/ProfileSetup';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import { store } from '../../Redux';

type Gender = 'male' | 'female';

type Props = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
  };
};

const MIN_AGE = 18;
const MAX_AGE = 100;

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addYears = (date: Date, years: number) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return startOfDay(next);
};

const getToday = () => startOfDay(new Date());
const getMaxDob = () => addYears(getToday(), -MIN_AGE);
const getMinDob = () => addYears(getToday(), -MAX_AGE);

const createValidDate = (
  year: number,
  monthIndex: number,
  day: number,
): Date | null => {
  const date = startOfDay(new Date(year, monthIndex, day));
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const toLocalIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateOfBirth = (value: string): Date | null => {
  const cleaned = value.trim();
  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return createValidDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const slash = cleaned.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    return createValidDate(
      Number(slash[3]),
      Number(slash[2]) - 1,
      Number(slash[1]),
    );
  }

  return null;
};

const formatDateDisplay = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day} / ${month} / ${date.getFullYear()}`;
};

const calculateAge = (date: Date): number => {
  const today = getToday();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
};

const clampCalendarMonth = (date: Date) => {
  const min = getMinDob();
  const max = getMaxDob();
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const minMonth = new Date(min.getFullYear(), min.getMonth(), 1);
  const maxMonth = new Date(max.getFullYear(), max.getMonth(), 1);

  if (monthStart < minMonth) {
    return min;
  }
  if (monthStart > maxMonth) {
    return max;
  }
  return monthStart;
};

const getDefaultPickerDate = () => {
  const preferred = addYears(getToday(), -25);
  const min = getMinDob();
  const max = getMaxDob();
  if (preferred > max) {
    return max;
  }
  if (preferred < min) {
    return min;
  }
  return preferred;
};

const BasicInfoScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(
    toLocalIsoDate(getDefaultPickerDate()),
  );
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>('');
  const [siblings, setSiblings] = useState('');
  const [familyInformation, setFamilyInformation] = useState('');
  const [maritalDropdownOpen, setMaritalDropdownOpen] = useState(false);
  const maritalAnchorRef = useRef<View>(null);
  const scrollRef = useRef<RNScrollView>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const handleMaritalPress = useGuardedDropdownPress(() => {
    Keyboard.dismiss();
    setMaritalDropdownOpen(prev => !prev);
  });
  const [saving, setSaving] = useState(false);

  const scrollFieldIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === 'ios' ? 120 : 280);
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardInset(event.endCoordinates.height);
      scrollFieldIntoView();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const age = useMemo(
    () => (birthDate ? calculateAge(birthDate) : null),
    [birthDate],
  );
  const minDobIso = toLocalIsoDate(getMinDob());
  const maxDobIso = toLocalIsoDate(getMaxDob());
  const selectedDobIso = birthDate ? toLocalIsoDate(birthDate) : '';

  const openDobCalendar = () => {
    Keyboard.dismiss();
    setMaritalDropdownOpen(false);
    const visibleDate = birthDate ?? getDefaultPickerDate();
    setCalendarCursor(toLocalIsoDate(clampCalendarMonth(visibleDate)));
    setDobPickerOpen(true);
  };

  const shiftCalendarYear = (delta: number) => {
    const [year, month] = calendarCursor.split('-').map(Number);
    const next = clampCalendarMonth(new Date(year + delta, month - 1, 1));
    setCalendarCursor(toLocalIsoDate(next));
  };

  const onSelectCalendarDay = (day: DateData) => {
    const selected = createValidDate(day.year, day.month - 1, day.day);
    if (!selected) {
      Toast.show('Please select a valid date of birth');
      return;
    }

    const min = getMinDob();
    const max = getMaxDob();
    if (selected > max) {
      Toast.show('You must be at least 18 years old to register.');
      return;
    }
    if (selected < min) {
      Toast.show('Please select a valid date of birth');
      return;
    }

    setBirthDate(selected);
    setDobPickerOpen(false);
  };

  useEffect(() => {

    const cachedProfile = store.getState().profile.profile;
    const user = store.getState().auth.user;

    if (cachedProfile?.name) {
      setFullName(cachedProfile.name);
    } else if (user?.name) {
      setFullName(user.name);
    }

    if (cachedProfile?.gender === 'male' || cachedProfile?.gender === 'female') {
      setGender(cachedProfile.gender);
    }

    if (cachedProfile?.birthday) {
      const parsed = parseDateOfBirth(cachedProfile.birthday);
      if (parsed) {
        setBirthDate(parsed);
      }
    }

    const cachedMarital =
      MARITAL_STATUS_FROM_API[cachedProfile?.marital_status?.toLowerCase() ?? ''];
    if (cachedMarital) {
      setMaritalStatus(cachedMarital);
    }

    if (cachedProfile?.siblings) {
      setSiblings(cachedProfile.siblings);
    }

    if (cachedProfile?.family_information || cachedProfile?.family_info) {
      setFamilyInformation(
        cachedProfile.family_information || cachedProfile.family_info || '',
      );
    }

    let cancelled = false;

    const loadBasicInfo = async () => {
      try {
        const res = await Api.getProfile();

        if (cancelled) {
          return;
        }

        if (res?.status == 200) {
          const profile = resolveProfileData(res?.data);

          setFullName(prev => prev || profile.name || user?.name || '');

          if (profile.gender === 'male' || profile.gender === 'female') {
            setGender(profile.gender);
          }

          setBirthDate(prev => {
            if (prev) {
              return prev;
            }
            return profile.birthday
              ? parseDateOfBirth(profile.birthday)
              : null;
          });

          const marital =
            MARITAL_STATUS_FROM_API[profile.marital_status?.toLowerCase() ?? ''];
          if (marital) {
            setMaritalStatus(prev => prev || marital);
          }

          setSiblings(prev => prev || profile.siblings || '');
          setFamilyInformation(
            prev =>
              prev ||
              profile.family_information ||
              profile.family_info ||
              '',
          );
        } else {
          const savedName = user?.name;
          if (savedName) {
            setFullName(prev => prev || savedName);
          }
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const savedName = user?.name;
        if (savedName) {
          setFullName(prev => prev || savedName);
        }
      }
    };

    loadBasicInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Toast.show('Please enter your full name');
      return;
    }
    if (!birthDate) {
      Toast.show('Please select your date of birth');
      return;
    }
    const birthday = toLocalIsoDate(birthDate);
    if (age === null || age < 18) {
      Toast.show('You must be at least 18 years old to register.');
      return;
    }
    if (!maritalStatus) {
      Toast.show('Please select your marital status');
      return;
    }
    if (saving) {
      return;
    }

    setSaving(true);

    const marital = MARITAL_STATUS_TO_API[maritalStatus];
    const payload: Record<string, string> = {
      name: fullName.trim(),
      birthday,
      gender,
      marital_status: marital,
    };

    if (siblings.trim()) {
      payload.siblings = siblings.trim();
    }

    if (familyInformation.trim()) {
      payload.family_information = familyInformation.trim();
      payload.family_info = familyInformation.trim();
    }
    try {
      const res = await Api.updateProfileBasicInfo(payload);
      if (res?.status == 200 || res?.success === true || res?.success == 200) {
        saveProfileCache({
          ...(res.user ?? {}),
          name: fullName.trim(),
          birthday,
          gender,
          marital_status: marital,
          siblings: siblings.trim(),
          family_information: familyInformation.trim(),
          family_info: familyInformation.trim(),
        });
        Toast.show(res?.message ?? 'Basic info saved', Toast.LONG);
        navigation.navigate('Education');
      } else {
        Toast.show(res?.message ?? 'Failed to save basic info', Toast.LONG);
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                hp('2%') +
                (keyboardInset > 0
                  ? Math.max(keyboardInset - getFooterBottomPadding(insets.bottom), hp('8%'))
                  : 0),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          nestedScrollEnabled
          removeClippedSubviews={false}
        >
          <BackButton variant="pink" onPress={() => navigation.goBack()} />

          <SetupProgressBar
            currentStep={1}
            totalSteps={PROFILE_SETUP_TOTAL_STEPS}
            label={Strings.basicInfoStep}
          />

          <View style={styles.logoWrap}>
            <Image
              source={Images.appLogo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>{Strings.tellUsAboutYouTitle}</Text>
          <Text style={styles.subtitle}>{Strings.tellUsAboutYouSubtitle}</Text>

          <AuthInput
            label={Strings.fullNameLabel}
            iconName="account-outline"
            placeholder={Strings.fullNamePlaceholder}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>{Strings.genderLabel}</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderBtn,
                gender === 'male' && styles.genderBtnActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setGender('male')}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === 'male' && styles.genderTextActive,
                ]}
              >
                {Strings.genderMale}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderBtn,
                gender === 'female' && styles.genderBtnActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setGender('female')}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === 'female' && styles.genderTextActive,
                ]}
              >
                {Strings.genderFemale}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>{Strings.dateOfBirthLabel}</Text>
          <View style={styles.dobWrap}>
            <TouchableOpacity
              style={styles.dobRow}
              activeOpacity={0.85}
              onPress={openDobCalendar}
            >
              <Icon
                name="calendar-outline"
                size={fs(20)}
                color={Colors.primary}
                style={styles.dobIcon}
              />
              <Text
                style={[
                  styles.dobInput,
                  !birthDate && styles.dobPlaceholder,
                ]}
              >
                {birthDate
                  ? formatDateDisplay(birthDate)
                  : Strings.dateOfBirthPlaceholder}
              </Text>
              {age !== null ? (
                <View style={styles.ageBadge}>
                  <Text style={styles.ageBadgeText}>
                    Age: {age} {Strings.ageYears}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            {age !== null && age < 18 ? (
              <Text style={styles.ageErrorText}>
                You must be at least 18 years old to register.
              </Text>
            ) : null}
          </View>

          <Modal
            isVisible={dobPickerOpen}
            onBackdropPress={() => setDobPickerOpen(false)}
            onBackButtonPress={() => setDobPickerOpen(false)}
            backdropOpacity={0.45}
            useNativeDriver
            hideModalContentWhileAnimating
          >
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>
                  {Strings.dateOfBirthLabel}
                </Text>
                <TouchableOpacity
                  onPress={() => setDobPickerOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={fs(22)} color={Colors.iconMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.calendarYearRow}>
                <TouchableOpacity
                  style={styles.yearShiftBtn}
                  onPress={() => shiftCalendarYear(-1)}
                >
                  <Icon
                    name="chevron-double-left"
                    size={fs(22)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.calendarHint}>
                  Jump year to pick your birth date
                </Text>
                <TouchableOpacity
                  style={styles.yearShiftBtn}
                  onPress={() => shiftCalendarYear(1)}
                >
                  <Icon
                    name="chevron-double-right"
                    size={fs(22)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <Calendar
                key={calendarCursor.slice(0, 7)}
                current={calendarCursor}
                minDate={minDobIso}
                maxDate={maxDobIso}
                onDayPress={onSelectCalendarDay}
                onMonthChange={month => {
                  const next = createValidDate(month.year, month.month - 1, 1);
                  if (next) {
                    setCalendarCursor(toLocalIsoDate(clampCalendarMonth(next)));
                  }
                }}
                enableSwipeMonths
                markedDates={
                  selectedDobIso
                    ? {
                        [selectedDobIso]: {
                          selected: true,
                          selectedColor: Colors.primary,
                          selectedTextColor: Colors.white,
                        },
                      }
                    : undefined
                }
                theme={{
                  backgroundColor: Colors.white,
                  calendarBackground: Colors.white,
                  selectedDayBackgroundColor: Colors.primary,
                  selectedDayTextColor: Colors.white,
                  todayTextColor: Colors.gold,
                  dayTextColor: Colors.label,
                  textDisabledColor: Colors.placeholder,
                  arrowColor: Colors.primary,
                  monthTextColor: Colors.primary,
                  textMonthFontFamily: Fonts.bold,
                  textDayFontFamily: Fonts.regular,
                  textDayHeaderFontFamily: Fonts.medium,
                  textMonthFontSize: FontSizes.body,
                  textDayFontSize: FontSizes.body,
                }}
              />
            </View>
          </Modal>

          <Text style={styles.fieldLabel}>{Strings.maritalStatusDetail}</Text>
          <View
            style={[
              styles.dropdownAnchor,
              maritalDropdownOpen && styles.dropdownOpenWrap,
            ]}
          >
            <View
              ref={maritalAnchorRef}
              collapsable={false}
              style={styles.dropdownAnchorInner}
            >
              <TouchableOpacity
                style={styles.dropdownRow}
                activeOpacity={0.85}
                onPress={handleMaritalPress}
              >
                <Icon
                  name="heart-outline"
                  size={fs(20)}
                  color={Colors.primary}
                  style={styles.dropdownIcon}
                />
                <Text
                  style={[
                    styles.dropdownText,
                    !maritalStatus && styles.dropdownPlaceholder,
                  ]}
                >
                  {maritalStatus || Strings.maritalStatusPlaceholder}
                </Text>
                <Icon
                  name={maritalDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={fs(22)}
                  color={Colors.iconMuted}
                />
              </TouchableOpacity>
              <DropdownOptionsOverlay
                visible={maritalDropdownOpen}
                anchorRef={maritalAnchorRef}
                options={MARITAL_STATUS_OPTIONS}
                selectedValues={maritalStatus ? [maritalStatus] : []}
                onSelect={option => {
                  setMaritalStatus(option as MaritalStatus);
                  setMaritalDropdownOpen(false);
                }}
                onClose={() => setMaritalDropdownOpen(false)}
              />
            </View>
          </View>

          <View style={styles.offerCard}>
            <View style={styles.offerTag}>
              <Text style={styles.offerTagValue}>50%</Text>
              <Text style={styles.offerTagLabel}>OFF</Text>
            </View>
            <View style={styles.offerCopy}>
              <Text style={styles.offerTitle}>
                {Strings.setupOptionalOfferTitle}
              </Text>
              <Text style={styles.offerNote}>
                {Strings.setupOptionalOfferNote}
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>{Strings.siblingsLabel}</Text>
          <View style={styles.optionalInputRow}>
            <Icon
              name="account-group-outline"
              size={fs(20)}
              color={Colors.primary}
              style={styles.optionalIcon}
            />
            <TextInput
              style={styles.optionalInput}
              placeholder={Strings.siblingsPlaceholder}
              placeholderTextColor={Colors.placeholder}
              value={siblings}
              onChangeText={setSiblings}
              onFocus={scrollFieldIntoView}
            />
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>{Strings.optional}</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>{Strings.familyInformationLabel}</Text>
          <View style={styles.optionalInputRow}>
            <Icon
              name="home-account"
              size={fs(20)}
              color={Colors.primary}
              style={styles.optionalIcon}
            />
            <TextInput
              style={styles.optionalInput}
              placeholder={Strings.familyInformationPlaceholder}
              placeholderTextColor={Colors.placeholder}
              value={familyInformation}
              onChangeText={setFamilyInformation}
              onFocus={scrollFieldIntoView}
            />
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalBadgeText}>{Strings.optional}</Text>
            </View>
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
            disabled={age !== null && age < 18}
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
  logoWrap: {
    alignSelf: 'center',
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2.5%'),
    overflow: 'hidden',
  },
  logo: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('3%'),
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('0.6%'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: hp('3%'),
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
  genderContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FDECEC',
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.white,
    padding: wp('1%'),
    gap: wp('1.5%'),
    marginBottom: hp('2.2%'),
  },
  genderBtn: {
    flex: 1,
    height: hp('5.2%'),
    borderRadius: wp('2.4%'),
    borderWidth: 1,
    borderColor: '#FDECEC',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
  genderTextActive: {
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  dobWrap: {
    marginBottom: hp('1%'),
  },
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.7%'),
    height: AuthStyles.inputHeight,
  },
  dobIcon: {
    marginRight: wp('2.5%'),
  },
  dobInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  dobPlaceholder: {
    color: Colors.placeholder,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('2%'),
    paddingTop: hp('1.6%'),
    paddingBottom: hp('1.2%'),
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('2%'),
    marginBottom: hp('0.8%'),
  },
  calendarTitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  calendarYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('1%'),
    marginBottom: hp('0.6%'),
  },
  yearShiftBtn: {
    width: wp('10%'),
    height: wp('10%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHint: {
    flex: 1,
    textAlign: 'center',
    fontSize: fs(11),
    fontFamily: Fonts.medium,
    color: Colors.textLight,
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
  ageErrorText: {
    fontSize: fs(11),
    fontFamily: Fonts.medium,
    color: Colors.error,
    marginTop: hp('0.8%'),
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: Colors.goldLight,
    borderRadius: wp('3.5%')
    ,
    padding: wp('3%'),
    marginVertical: wp('2.4%'),
    gap: wp('3%'),
  },
  offerTag: {
    width: wp('14%'),
    minHeight: wp('14%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('0.6%'),
  },
  offerTagValue: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.white,
    lineHeight: fs(18),
  },
  offerTagLabel: {
    fontSize: fs(9),
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: 1,
  },
  offerCopy: {
    flex: 1,
  },
  offerTitle: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    marginBottom: hp('0.3%'),
  },
  offerNote: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: fs(16),
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
  optionalIcon: {
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
  dropdownIcon: {
    marginRight: wp('2.5%'),
  },
  dropdownText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  dropdownPlaceholder: {
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
  footer: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});

export default BasicInfoScreen;
