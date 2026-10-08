import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-simple-toast';
import ScreenHeader from '../../Components/ScreenHeader';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  mapLegalDoc,
} from '../../API';
import { AuthStyles } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { fs } from '../../Functions/responsive';

type RouteProps = RouteProp<ProfileStackParamList, 'LegalDocument'>;
type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'LegalDocument'
>;

const PAGE_HEAD = `
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 16px; font-size: 15px; line-height: 1.6; color: #71717B; }
    img, table { max-width: 100%; }
    h1, h2, h3 { color: #6B041D; }
  </style>
`;

const toPage = (html: string) =>
  `<html><head>${PAGE_HEAD}</head><body>${html}</body></html>`;

const LegalDocumentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { type } = useRoute<RouteProps>().params;
  const title =
    type === 'privacy' ? Strings.privacyPolicy : Strings.termsAndConditions;
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res =
          type === 'privacy'
            ? await Api.getPrivacyPolicy()
            : await Api.getTermsConditions();

        if (isApiSuccess(res?.status, res?.data?.success)) {
          const doc = mapLegalDoc(res.data, title);
          setHtml(doc.html || doc.content);
        } else {
          Toast.show(res?.data?.message ?? 'Failed to load document', Toast.LONG);
        }
      } catch (error) {
        Toast.show(
          getApiErrorMessage(error, 'Failed to load document'),
          Toast.LONG,
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [title, type]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader title={title} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : html ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: toPage(html) }}
          style={styles.webView}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.empty}>{Strings.helpCenterEmptyLegal}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  empty: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
  },
});

export default LegalDocumentScreen;
