import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../Components/ScreenHeader';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { ACTIVE_USERS, CONVERSATIONS } from '../../Constant/Messages';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { MessagesStackParamList } from '../../Navigation/MessagesStackNavigator';
import { navigateToProfileScreen } from '../../Functions/profileNavigation';
import { navigateToHomeTab, useTabRootBackToHome } from '../../Functions/tabNavigation';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  MessagesStackParamList,
  'MessagesMain'
>;

const MessagesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  useTabRootBackToHome(navigation);

  const messagesCount = CONVERSATIONS.length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={Strings.messagesTitle}
        onBack={() => navigateToHomeTab(navigation)}
        rightElement={
          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.8}
            onPress={() => navigateToProfileScreen(navigation, 'Notifications')}
          >
            <Icon name="bell-outline" size={fs(20)} color={Colors.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchRow}>
          <Icon name="magnify" size={fs(20)} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.searchConversations}
            placeholderTextColor={Colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeUsersRow}
        >
          {ACTIVE_USERS.map(user => (
            <TouchableOpacity
              key={user.id}
              style={styles.activeUserItem}
              activeOpacity={0.85}
            >
              <View style={styles.activeAvatarWrap}>
                <Image
                  source={user.image}
                  style={styles.activeAvatar}
                  resizeMode="cover"
                />
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.activeUserName}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.requestsBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ChatRequests')}
        >
          <View style={styles.requestsLeft}>
            <Icon
              name="account-clock-outline"
              size={fs(20)}
              color={Colors.primary}
            />
            <Text style={styles.requestsText}>{Strings.chatRequests}</Text>
          </View>
          <View style={styles.requestsBadge}>
            <Text style={styles.requestsBadgeText}>3</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{Strings.messagesTitle}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{messagesCount}</Text>
          </View>
        </View>

        {CONVERSATIONS.map(conversation => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationRow}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('Chat', {
                chatId: conversation.id,
                name: conversation.name,
              })
            }
          >
            <View style={styles.avatarWrap}>
              <Image
                source={conversation.image}
                style={styles.avatar}
                resizeMode="cover"
              />
              {conversation.isOnline ? <View style={styles.onlineDot} /> : null}
            </View>

            <View style={styles.conversationBody}>
              <View style={styles.nameRow}>
                <Text style={styles.conversationName}>{conversation.name}</Text>
                {conversation.isVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Icon
                      name="shield-check"
                      size={fs(10)}
                      color={Colors.gold}
                    />
                    <Text style={styles.verifiedText}>
                      {Strings.verifiedLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
            </View>

            <View style={styles.metaCol}>
              <Text style={styles.timeText}>{conversation.time}</Text>
              {conversation.unreadCount ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {conversation.unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notificationBtn: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: Colors.notificationBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: hp('1.2%'),
    right: wp('2.8%'),
    width: wp('2.2%'),
    height: wp('2.2%'),
    borderRadius: wp('1.1%'),
    backgroundColor: Colors.redish,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('2%'),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: AuthStyles.inputRadius,
    paddingHorizontal: wp('3.8%'),
    height: AuthStyles.inputHeight,
    gap: wp('2.5%'),
    marginBottom: hp('2%'),
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  activeUsersRow: {
    gap: wp('4%'),
    paddingBottom: hp('2%'),
  },
  activeUserItem: {
    alignItems: 'center',
    width: wp('16%'),
  },
  activeAvatarWrap: {
    position: 'relative',
    marginBottom: hp('0.6%'),
  },
  activeAvatar: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    borderWidth: 2,
    borderColor: Colors.focusBorder,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp('3.2%'),
    height: wp('3.2%'),
    borderRadius: wp('1.6%'),
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  activeUserName: {
    fontSize: fs(11),
    fontFamily: Fonts.medium,
    color: Colors.primary,
    textAlign: 'center',
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.tabActiveBg,
    borderRadius: AuthStyles.inputRadius,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
  },
  requestsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2.5%'),
  },
  requestsText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  requestsBadge: {
    minWidth: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('1.5%'),
  },
  requestsBadgeText: {
    fontSize: fs(11),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  sectionTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  countBadge: {
    minWidth: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: Colors.redish,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('1.5%'),
  },
  countBadgeText: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1.3%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: wp('3%'),
  },
  avatar: {
    width: wp('13%'),
    height: wp('13%'),
    borderRadius: wp('6.5%'),
  },
  conversationBody: {
    flex: 1,
    marginRight: wp('2%'),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp('1.5%'),
    marginBottom: hp('0.3%'),
  },
  conversationName: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    backgroundColor: '#FFF8E7',
    paddingHorizontal: wp('1.8%'),
    paddingVertical: hp('0.2%'),
    borderRadius: wp('2%'),
  },
  verifiedText: {
    fontSize: fs(9),
    fontFamily: Fonts.semiBold,
    color: Colors.gold,
  },
  lastMessage: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  metaCol: {
    alignItems: 'flex-end',
    gap: hp('0.6%'),
  },
  timeText: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  unreadBadge: {
    minWidth: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    backgroundColor: Colors.redish,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('1.2%'),
  },
  unreadText: {
    fontSize: fs(10),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
});

export default MessagesScreen;
