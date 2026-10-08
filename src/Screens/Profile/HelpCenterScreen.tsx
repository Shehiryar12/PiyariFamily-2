import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import ScreenHeader from '../../Components/ScreenHeader';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  mapFaqs,
  type HelpFaqItem,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'HelpCenter'
>;

const HelpCenterScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<HelpFaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHelp = useCallback(async () => {
    setLoading(true);

    try {
      const res = await Api.getFaqs();
      if (isApiSuccess(res?.status, res?.data?.success)) {
        const mapped = mapFaqs(res.data);
        setFaqs(mapped);
        setOpenId(mapped[0]?.id ?? null);
      } else {
        setFaqs([]);
        Toast.show(res?.data?.message ?? 'Failed to load FAQs', Toast.LONG);
      }
    } catch (error) {
      setFaqs([]);
      Toast.show(getApiErrorMessage(error, 'Failed to load FAQs'), Toast.LONG);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHelp();
    }, [fetchHelp]),
  );

  const categories = useMemo(() => {
    const labels = Array.from(
      new Set(faqs.map(item => item.category).filter(Boolean)),
    );
    return ['all', ...labels];
  }, [faqs]);

  const articles = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return faqs.filter(item => {
      const inCategory = category === 'all' || item.category === category;
      if (!inCategory) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return (
        item.question.toLowerCase().includes(needle) ||
        item.answer.toLowerCase().includes(needle)
      );
    });
  }, [category, faqs, query]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#FFE5EC', '#FFF8FA', Colors.background]}
        style={styles.topGlow}
      />

      <ScreenHeader
        title={Strings.helpCenter}
        onBack={() => navigation.goBack()}
        style={styles.screenHeader}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIcon}>
            <Icon name="lifebuoy" size={fs(22)} color={Colors.gold} />
          </View>
          <Text style={styles.heroTitle}>{Strings.helpCenterHeroTitle}</Text>
          <Text style={styles.heroSubtitle}>{Strings.helpCenterHeroSubtitle}</Text>
        </LinearGradient>

        <View style={styles.searchBar}>
          <Icon name="magnify" size={fs(20)} color={Colors.gold} />
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.helpCenterSearchPlaceholder}
            placeholderTextColor={Colors.placeholder}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close-circle" size={fs(18)} color={Colors.iconMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {categories.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {categories.map(item => {
              const active = category === item;
              const label = item === 'all' ? 'All' : item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.85}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : articles.length ? (
          articles.map(item => {
            const open = openId === item.id;
            return (
              <View key={item.id} style={styles.articleCard}>
                <TouchableOpacity
                  style={styles.articleHeader}
                  activeOpacity={0.85}
                  onPress={() => setOpenId(open ? null : item.id)}
                >
                  <View style={styles.articleIconWrap}>
                    <Icon
                      name="help-circle-outline"
                      size={fs(18)}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.articleQuestion}>{item.question}</Text>
                  <Icon
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={fs(20)}
                    color={Colors.gold}
                  />
                </TouchableOpacity>
                {open ? (
                  <Text style={styles.articleAnswer}>{item.answer}</Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Icon name="text-search" size={fs(28)} color={Colors.gold} />
            <Text style={styles.emptyText}>{Strings.helpCenterNoResults}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('16%'),
  },
  screenHeader: {
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('4%'),
  },
  heroCard: {
    borderRadius: wp('4.5%'),
    padding: wp('5%'),
    marginBottom: hp('1.8%'),
  },
  heroIcon: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.2%'),
  },
  heroTitle: {
    fontSize: fs(20),
    fontFamily: Fonts.bold,
    color: Colors.white,
    marginBottom: hp('0.5%'),
  },
  heroSubtitle: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: hp('2.3%'),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F3E6C8',
    paddingHorizontal: wp('3.5%'),
    height: hp('6.2%'),
    marginBottom: hp('1.4%'),
    gap: wp('2%'),
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.primary,
    paddingVertical: 0,
  },
  chipRow: {
    paddingBottom: hp('1.6%'),
    gap: wp('2%'),
  },
  chip: {
    paddingHorizontal: wp('3.6%'),
    paddingVertical: hp('0.7%'),
    borderRadius: wp('5%'),
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1,
    borderColor: Colors.tabActiveBg,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: Colors.white,
  },
  loaderWrap: {
    minHeight: hp('18%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.3%'),
    marginBottom: hp('1.1%'),
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.4%'),
  },
  articleIconWrap: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('2.4%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleQuestion: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
    lineHeight: hp('2.3%'),
  },
  articleAnswer: {
    marginTop: hp('1%'),
    marginLeft: wp('11.4%'),
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    lineHeight: hp('2.3%'),
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
    gap: hp('1%'),
  },
  emptyText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
});

export default HelpCenterScreen;
