import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import ScreenHeader from '../../Components/ScreenHeader';
import PrimaryButton from '../../Components/PrimaryButton';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { SUPPORT_EMAIL, SUPPORT_TOPICS } from '../../Constant/HelpCenter';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { fs, hp, wp } from '../../Functions/responsive';
import { selectUser, useAppSelector } from '../../Redux';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ContactSupport'
>;

const ContactSupportScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const user = useAppSelector(selectUser);
  const [topic, setTopic] = useState(SUPPORT_TOPICS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const senderName = user?.name?.trim() || 'PiyariFamily member';
  const senderEmail = user?.email?.trim() || '';

  const mailBody = useMemo(() => {
    const lines = [
      `Name: ${senderName}`,
      senderEmail ? `Email: ${senderEmail}` : null,
      `Topic: ${topic}`,
      '',
      message.trim(),
    ].filter(Boolean);

    return lines.join('\n');
  }, [message, senderEmail, senderName, topic]);

  const openMail = async (subject: string, body: string) => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error(Strings.contactSupportMailError);
    }

    await Linking.openURL(url);
  };

  const handleCopyEmail = () => {
    Toast.show(SUPPORT_EMAIL, Toast.LONG);
  };

  const handleEmailPress = async () => {
    try {
      await openMail('PiyariFamily support', '');
    } catch {
      handleCopyEmail();
      Toast.show(Strings.contactSupportMailError, Toast.LONG);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Toast.show(Strings.contactSupportFillMessage, Toast.LONG);
      return;
    }

    setSending(true);
    try {
      await openMail(`PiyariFamily support — ${topic}`, mailBody);
      Toast.show(Strings.contactSupportSent, Toast.LONG);
      setMessage('');
    } catch {
      handleCopyEmail();
      Toast.show(Strings.contactSupportMailError, Toast.LONG);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#FFE5EC', '#FFF8FA', Colors.background]}
        style={styles.topGlow}
      />

      <ScreenHeader
        title={Strings.contactSupport}
        onBack={() => navigation.goBack()}
        style={styles.screenHeader}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: getFooterBottomPadding(insets.bottom) + hp('2%') },
          ]}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIcon}>
              <Icon name="headset" size={fs(22)} color={Colors.gold} />
            </View>
            <Text style={styles.heroTitle}>{Strings.contactSupportHeroTitle}</Text>
            <Text style={styles.heroSubtitle}>
              {Strings.contactSupportHeroSubtitle}
            </Text>
          </LinearGradient>

          <TouchableOpacity
            style={styles.emailCard}
            activeOpacity={0.88}
            onPress={handleEmailPress}
            onLongPress={handleCopyEmail}
          >
            <View style={styles.emailIconWrap}>
              <Icon name="email-outline" size={fs(20)} color={Colors.primary} />
            </View>
            <View style={styles.emailCopy}>
              <Text style={styles.emailLabel}>{Strings.contactSupportEmailLabel}</Text>
              <Text style={styles.emailValue}>{Strings.contactSupportEmail}</Text>
              <Text style={styles.emailHint}>{Strings.contactSupportHours}</Text>
            </View>
            <Icon name="open-in-new" size={fs(18)} color={Colors.gold} />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>{Strings.contactSupportTopicLabel}</Text>
          <View style={styles.topicWrap}>
            {SUPPORT_TOPICS.map(item => {
              const active = topic === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.topicChip, active && styles.topicChipActive]}
                  activeOpacity={0.85}
                  onPress={() => setTopic(item)}
                >
                  <Text
                    style={[styles.topicText, active && styles.topicTextActive]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>{Strings.contactSupportMessageLabel}</Text>
          <View style={styles.messageBox}>
            <TextInput
              style={styles.messageInput}
              placeholder={Strings.contactSupportMessagePlaceholder}
              placeholderTextColor={Colors.placeholder}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />
          </View>

          <PrimaryButton
            title={Strings.contactSupportSend}
            onPress={handleSend}
            loading={sending}
            leftIcon="send-outline"
          />
        </ScrollView>
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
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    borderWidth: 1,
    borderColor: '#F3E6C8',
    padding: wp('3.6%'),
    marginBottom: hp('2.2%'),
    gap: wp('3%'),
  },
  emailIconWrap: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailCopy: {
    flex: 1,
  },
  emailLabel: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.textLight,
    marginBottom: hp('0.2%'),
  },
  emailValue: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  emailHint: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginTop: hp('0.25%'),
  },
  sectionLabel: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.textLight,
    letterSpacing: 0.5,
    marginBottom: hp('1%'),
  },
  topicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  topicChip: {
    paddingHorizontal: wp('3.4%'),
    paddingVertical: hp('0.75%'),
    borderRadius: wp('5%'),
    backgroundColor: Colors.tabActiveBg,
    borderWidth: 1,
    borderColor: Colors.tabActiveBg,
  },
  topicChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  topicText: {
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  topicTextActive: {
    color: Colors.white,
  },
  messageBox: {
    minHeight: hp('18%'),
    borderRadius: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: Colors.white,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('2%'),
  },
  messageInput: {
    minHeight: hp('15%'),
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.primary,
  },
});

export default ContactSupportScreen;
