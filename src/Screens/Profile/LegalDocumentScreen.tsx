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
import { fs, hp, wp } from '../../Functions/responsive';

type RouteProps = RouteProp<ProfileStackParamList, 'LegalDocument'>;
type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'LegalDocument'
>;

const toPage = (body: string) => {
  const style = `
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body {
        margin: 0;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        overflow-x: hidden !important;
      }
      body {
        padding: ${Math.round(hp('1.6%'))}px ${Math.round(wp('5%'))}px ${Math.round(hp('6%'))}px;
        box-sizing: border-box;
        font-size: ${fs(14)}px;
        line-height: 1.6;
        color: ${Colors.textLight};
        background: ${Colors.background};
        word-wrap: break-word;
        overflow-wrap: anywhere;
      }
      h1, h2, h3, h4 { color: ${Colors.primary}; line-height: 1.35; }
      img, video, iframe, table, pre { max-width: 100% !important; height: auto !important; }
      p, li { margin: 0 0 12px; }
    </style>
  `;

  if (/<head[^>]*>/i.test(body)) {
    return body.replace(/<head[^>]*>/i, match => `${match}${style}`);
  }

  return `<!DOCTYPE html><html><head>${style}</head><body>${body}</body></html>`;
};

const LegalDocumentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const type = route.params?.type === 'terms' ? 'terms' : 'privacy';
  const title =
    type === 'terms' ? Strings.termsAndConditions : Strings.privacyPolicy;
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res =
          type === 'privacy'
            ? await Api.getPrivacyPolicy()
            : await Api.getTermsConditions();

        if (!active) {
          return;
        }

        if (isApiSuccess(res?.status, res?.data?.success)) {
          const doc = mapLegalDoc(res.data, title);
          setHtml(doc.html || doc.content);
        } else {
          Toast.show(res?.data?.message ?? 'Failed to load document', Toast.LONG);
        }
      } catch (error) {
        if (active) {
          Toast.show(
            getApiErrorMessage(error, 'Failed to load document'),
            Toast.LONG,
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [title, type]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
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
          showsHorizontalScrollIndicator={false}
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
