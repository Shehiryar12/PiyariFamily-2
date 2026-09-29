import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import BackButton from '../../Components/BackButton';
import BlockReportModal from '../../Components/BlockReportModal';
import ProfilePreviewSheet from '../../Components/ProfilePreviewSheet';
import { Images } from '../../Assets';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { PROFILE_DETAILS } from '../../Constant/MatchProfiles';
import { AYESHA_CHAT_MESSAGES } from '../../Constant/Messages';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { FREE_DAILY_MESSAGE_LIMIT } from '../../Constant/Subscription';
import { Strings } from '../../Constant/Strings';
import { MessagesStackParamList } from '../../Navigation/MessagesStackNavigator';
import { getFooterBottomPadding } from '../../Functions/safeArea';
import { navigateToSubscription } from '../../Functions/subscriptionNavigation';
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { fs, hp, wp } from '../../Functions/responsive';

type ChatRouteProp = RouteProp<MessagesStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<MessagesStackParamList, 'Chat'>;

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const insets = useSafeAreaInsets();
  useHideTabBar();
  const [message, setMessage] = useState('');
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [showBlockReport, setShowBlockReport] = useState(false);
  const [sentCount, setSentCount] = useState(
    AYESHA_CHAT_MESSAGES.filter(item => item.isMine).length,
  );

  const contactName = route.params.name || 'Ayesha Khan';
  const messages = AYESHA_CHAT_MESSAGES;
  const profile = PROFILE_DETAILS['1'];

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    if (sentCount >= FREE_DAILY_MESSAGE_LIMIT) {
      navigateToSubscription(navigation, 'PremiumPaywall');
      return;
    }

    setSentCount(prev => prev + 1);
    setMessage('');
    Toast.show('Message sent');
  };

  const handleViewFullProfile = () => {
    setShowProfilePreview(false);
    navigation.getParent()?.navigate('Home', {
      screen: 'ProfileDetail',
      params: { profileId: '1' },
    });
  };

  const handleBlockReport = (_reasonId: string, _details: string) => {
    setShowBlockReport(false);
    Toast.show(Strings.reportSubmitted);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton
          variant="pink"
          compact
          onPress={() => navigation.goBack()}
        />
        <TouchableOpacity
          style={styles.headerProfileTap}
          activeOpacity={0.85}
          onPress={() => setShowProfilePreview(true)}
        >
          <Image
            source={Images.femaleProfile}
            style={styles.headerAvatar}
            resizeMode="cover"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{contactName}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{Strings.onlineNow}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.85}>
            <Icon name="phone-outline" size={fs(20)} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.85}
            onPress={() => setShowBlockReport(true)}
          >
            <Icon
              name="block-helper"
              size={fs(20)}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={hp('1%')}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.chatContent}
        >
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{Strings.today}</Text>
          </View>

          {messages.map(item => (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                item.isMine ? styles.messageRowMine : styles.messageRowOther,
              ]}
            >
              {!item.isMine && item.showAvatar ? (
                <Image
                  source={Images.femaleProfile}
                  style={styles.messageAvatar}
                  resizeMode="cover"
                />
              ) : !item.isMine ? (
                <View style={styles.messageAvatarSpacer} />
              ) : null}

              <View style={styles.messageCol}>
                <View
                  style={[
                    styles.bubble,
                    item.isMine ? styles.bubbleMine : styles.bubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      item.isMine
                        ? styles.bubbleTextMine
                        : styles.bubbleTextOther,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
                <View
                  style={[
                    styles.metaRow,
                    item.isMine && styles.metaRowMine,
                  ]}
                >
                  <Text style={styles.messageTime}>{item.time}</Text>
                  {item.isMine ? (
                    <Icon
                      name="check-all"
                      size={fs(14)}
                      color={Colors.gold}
                      style={styles.readIcon}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View
          style={[
            styles.inputBar,
            { paddingBottom: getFooterBottomPadding(insets.bottom) },
          ]}
        >
          <TextInput
            style={styles.messageInput}
            placeholder={Strings.typeMessage}
            placeholderTextColor={Colors.placeholder}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={styles.sendBtn}
            activeOpacity={0.85}
            onPress={handleSend}
          >
            <Icon name="send" size={fs(18)} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {profile ? (
        <ProfilePreviewSheet
          visible={showProfilePreview}
          profile={profile}
          onClose={() => setShowProfilePreview(false)}
          onViewFullProfile={handleViewFullProfile}
        />
      ) : null}

      <BlockReportModal
        visible={showBlockReport}
        contactName={contactName.split(' ')[0]}
        onClose={() => setShowBlockReport(false)}
        onSubmit={handleBlockReport}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('1.2%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerProfileTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  headerAvatar: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    marginRight: wp('2.5%'),
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.2%'),
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1.5%'),
  },
  onlineDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    backgroundColor: '#22C55E',
  },
  onlineText: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  headerActions: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  headerActionBtn: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.5%'),
    paddingBottom: hp('2%'),
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: Colors.tabActiveBg,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.4%'),
    borderRadius: wp('3%'),
    marginBottom: hp('2%'),
  },
  dateText: {
    fontSize: fs(11),
    fontFamily: Fonts.medium,
    color: Colors.textLight,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: hp('1.2%'),
    maxWidth: '88%',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
  },
  messageAvatar: {
    width: wp('7%'),
    height: wp('7%'),
    borderRadius: wp('3.5%'),
    marginRight: wp('2%'),
    marginTop: hp('0.2%'),
  },
  messageAvatarSpacer: {
    width: wp('7%'),
    marginRight: wp('2%'),
  },
  messageCol: {
    flexShrink: 1,
  },
  bubble: {
    borderRadius: wp('4%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1%'),
  },
  bubbleOther: {
    backgroundColor: Colors.tabActiveBg,
    borderTopLeftRadius: wp('1%'),
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: wp('1%'),
  },
  bubbleText: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    lineHeight: hp('2.1%'),
  },
  bubbleTextOther: {
    color: Colors.primary,
  },
  bubbleTextMine: {
    color: Colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.3%'),
    paddingLeft: wp('1%'),
  },
  metaRowMine: {
    justifyContent: 'flex-end',
    paddingRight: wp('1%'),
  },
  messageTime: {
    fontSize: fs(10),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  readIcon: {
    marginLeft: wp('1%'),
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingTop: hp('1.2%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
    gap: wp('2.5%'),
  },
  messageInput: {
    flex: 1,
    minHeight: hp('5%'),
    maxHeight: hp('12%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  sendBtn: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('0.2%'),
  },
});

export default ChatScreen;
