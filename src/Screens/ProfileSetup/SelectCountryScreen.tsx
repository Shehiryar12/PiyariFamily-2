import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PrimaryButton from '../../Components/PrimaryButton';
import {
  Api,
  ENDPOINTS,
  getApiErrorMessage,
  mapCountries,
  resolveProfileData,
  saveProfileCache,
  toFlagCountryCode,
  type ApiErrorResponse,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { CountryOption, PROFILE_COUNTRIES } from '../../Constant/ProfileSetup';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { AuthStackParamList } from '../../Navigation/AuthNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import { store } from '../../Redux';
import type { ProfileApiData } from '../../API/mappers/profileMapper';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SelectCountry'
>;

const getFlagEmoji = (countryCode: string) => {
  const flagCode = toFlagCountryCode(countryCode);

  if (!flagCode) {
    return '🏳️';
  }

  return flagCode
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

const CountrySeparator = () => <View style={styles.separator} />;

const applyCountryPrefill = (profile: ProfileApiData) => ({
  city: profile.city ?? '',
  state: profile.state ?? '',
});

const SelectCountryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [countries, setCountries] =
    useState<CountryOption[]>(PROFILE_COUNTRIES);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return countries;
    }

    return countries.filter(country =>
      country.name.toLowerCase().includes(query),
    );
  }, [countries, search]);

  const selectedCountry = useMemo(
    () => countries.find(country => country.id === selectedId),
    [countries, selectedId],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      const actionType = event.data.action.type;

      if (
        actionType === 'GO_BACK' ||
        actionType === 'POP' ||
        actionType === 'POP_TO_TOP'
      ) {
        event.preventDefault();
      }
    });

    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => true;
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onHardwareBack,
      );
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {

      let cancelled = false;

      const loadCountriesAndPrefill = async () => {
        setLoading(true);

        let nextCountries = PROFILE_COUNTRIES;

        try {
          const res = await Api.getCountries();

          if (cancelled) {
            return;
          }

          if (res?.status == 200) {
            nextCountries = mapCountries(res?.data);
          } else {
            nextCountries = mapCountries();
            Toast.show(
              res?.data?.message ?? 'Failed to load countries',
              Toast.LONG,
            );
          }
        } catch (error) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          nextCountries = mapCountries();
          Toast.show(
            getApiErrorMessage(error, 'Failed to load countries'),
            Toast.LONG,
          );
        }

        if (cancelled) {
          return;
        }

        setCountries(nextCountries);
        setSelectedId(null);

        const cachedProfile = store.getState().profile.profile;
        if (cachedProfile) {
          const prefill = applyCountryPrefill(cachedProfile);
          if (prefill.city) {
            setCity(prefill.city);
          }
          if (prefill.state) {
            setState(prefill.state);
          }
        }

        const token = store.getState().auth.accessToken;

        if (token) {
          try {
            const res = await Api.getProfile({ skipTokenClear: true });

            if (cancelled) {
              return;
            }

            if (res?.status == 200) {
              const profile = resolveProfileData(res?.data);
              const prefill = applyCountryPrefill(profile);
              if (prefill.city) {
                setCity(prefill.city);
              }
              if (prefill.state) {
                setState(prefill.state);
              }
            } else {
            }
          } catch (error) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
          }
        }

        if (cancelled) {
          return;
        }

        setLoading(false);
      };

      loadCountriesAndPrefill();

      return () => {
        cancelled = true;
      };
  }, []);

  const saveProfileCountry = useCallback(async () => {
    if (!selectedCountry || saving) {
      return;
    }

    setSaving(true);

    try {
      const res = await Api.updateProfileCountry({
        country: selectedCountry.name,
        country_id: selectedCountry.id,
        city: city.trim(),
        state: state.trim(),
      });

      if (res?.status == 200) {
        saveProfileCache({
          country: selectedCountry.name,
          country_id: selectedCountry.id,
          city: city.trim(),
          state: state.trim(),
        });
        Toast.show(res?.message ?? 'Country saved', Toast.LONG);
        navigation.navigate('BasicInfo');
      } else {
        Toast.show(res?.message ?? 'Failed to save country', Toast.LONG);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = `${axiosError?.response?.data?.message ?? ''}`.toLowerCase();
      if (
        axiosError?.response?.status === 401 ||
        message.includes('unauthenticated')
      ) {
        saveProfileCache({
          country: selectedCountry.name,
          country_id: selectedCountry.id,
          city: city.trim(),
          state: state.trim(),
        });
        navigation.navigate('BasicInfo');
        return;
      }
      Toast.show(
        getApiErrorMessage(error, 'Failed to save country'),
        Toast.LONG,
      );
    } finally {
      setSaving(false);
    }
  }, [city, navigation, saving, selectedCountry, state]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>{Strings.selectCountryTitle}</Text>
        <Text style={styles.subtitle}>{Strings.selectCountrySubtitle}</Text>

        <View style={styles.searchRow}>
          <Icon
            name="magnify"
            size={fs(20)}
            color={Colors.brandRed}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.searchCountryPlaceholder}
            placeholderTextColor={Colors.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredCountries}
            keyExtractor={(item: CountryOption) => String(item.id)}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={CountrySeparator}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No countries found</Text>
            }
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;

              return (
                <TouchableOpacity
                  style={[
                    styles.countryRow,
                    isSelected && styles.countryRowSelected,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(item.id)}
                >
                  <Text style={styles.countryFlag}>
                    {getFlagEmoji(item.code)}
                  </Text>
                  <Text
                    style={[
                      styles.countryName,
                      isSelected && styles.countryNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {isSelected ? (
                    <Icon name="check" size={fs(18)} color={Colors.gold} />
                  ) : (
                    <Icon
                      name="chevron-right"
                      size={fs(28)}
                      color="#FF205666"
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: getFooterBottomPadding(insets.bottom) },
        ]}
      >
        <PrimaryButton
          title={Strings.continueBtn}
          onPress={saveProfileCountry}
          loading={saving}
          disabled={!selectedCountry || loading}
          showArrow
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
  content: {
    flex: 1,
    marginTop: wp('2%'),
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  title: {
    fontSize: FontSizes.h2,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: hp('1.5%'),
    marginBottom: hp('0.6%'),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginBottom: hp('2.2%'),
    lineHeight: hp('2.4%'),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.focusBorder,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.5%'),
    height: AuthStyles.inputHeight,
    marginBottom: hp('2%'),
  },
  searchIcon: {
    marginRight: wp('2.5%'),
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: hp('1%'),
    flexGrow: 1,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    paddingVertical: hp('8%'),
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.6%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('2.5%'),
  },
  countryRowSelected: {
    backgroundColor: Colors.tabActiveBg,
  },
  countryName: {
    flex: 1,
    marginLeft: wp('3.5%'),
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  countryFlag: {
    fontSize: fs(20),
    width: wp('7%'),
    textAlign: 'center',
  },
  countryNameSelected: {
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  separator: {
    height: wp(0.2),
    backgroundColor: Colors.dividerPink,
  },
  footer: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});

export default SelectCountryScreen;
