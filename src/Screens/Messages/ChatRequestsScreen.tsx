import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../Components/ScreenHeader';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { CHAT_REQUESTS } from '../../Constant/Messages';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { MessagesStackParamList } from '../../Navigation/MessagesStackNavigator';
import { useHideTabBar } from '../../Functions/useHideTabBar';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  MessagesStackParamList,
  'ChatRequests'
>;

const ChatRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  useHideTabBar();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={Strings.chatRequests}
        subtitle={Strings.reviewBeforeAccepting}
        onBack={() => navigation.goBack()}
        align="flex-start"
        rightElement={
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
            <Icon name="bell-outline" size={fs(20)} color={Colors.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.noticeBox}>
          <Icon
            name="shield-check-outline"
            size={fs(18)}
            color={Colors.gold}
            style={styles.noticeIcon}
          />
          <Text style={styles.noticeText}>{Strings.chatRequestsNotice}</Text>
        </View>

        <Text style={styles.sectionTitle}>
          {Strings.pendingRequests} ({CHAT_REQUESTS.length})
        </Text>

        {CHAT_REQUESTS.map(request => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestTop}>
              <Image
                source={request.image}
                style={styles.requestImage}
                resizeMode="cover"
              />
              <View style={styles.requestInfo}>
                <View style={styles.requestNameRow}>
                  <Text style={styles.requestName}>
                    {request.name} {request.age}
                  </Text>
                  {request.isVerified ? (
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
                <View style={styles.locationRow}>
                  <Icon
                    name="map-marker-outline"
                    size={fs(12)}
                    color={Colors.textLight}
                  />
                  <Text style={styles.locationText}>{request.location}</Text>
                </View>
                <View style={styles.tagRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{request.education}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{request.profession}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.timeAgo}>{request.timeAgo}</Text>
            </View>

            <View style={styles.messagePreview}>
              <Text style={styles.messagePreviewText}>{request.message}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.declineBtn} activeOpacity={0.85}>
                <Icon name="close" size={fs(16)} color={Colors.primary} />
                <Text style={styles.declineText}>{Strings.decline}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('Chat', {
                    chatId: request.id,
                    name: request.name,
                  })
                }
              >
                <Icon name="check" size={fs(16)} color={Colors.white} />
                <Text style={styles.acceptText}>{Strings.accept}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: Colors.goldLight,
    borderRadius: AuthStyles.inputRadius,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.4%'),
    marginBottom: hp('2%'),
  },
  noticeIcon: {
    marginRight: wp('2.5%'),
    marginTop: hp('0.1%'),
  },
  noticeText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.primary,
    lineHeight: hp('2.2%'),
  },
  sectionTitle: {
    fontSize: fs(15),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('1.5%'),
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    padding: wp('3.5%'),
    marginBottom: hp('1.8%'),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  requestTop: {
    flexDirection: 'row',
    marginBottom: hp('1.2%'),
  },
  requestImage: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('3%'),
    marginRight: wp('3%'),
  },
  requestInfo: {
    flex: 1,
  },
  requestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: wp('1.5%'),
    marginBottom: hp('0.4%'),
  },
  requestName: {
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('0.8%'),
    marginBottom: hp('0.6%'),
  },
  locationText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.black,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('1.5%'),
  },
  tag: {
    backgroundColor: Colors.tabActiveBg,
    paddingHorizontal: wp('2.2%'),
    paddingVertical: hp('0.25%'),
    borderRadius: wp('2%'),
  },
  tagText: {
    fontSize: fs(10),
    fontFamily: Fonts.medium,
    color: Colors.black,
  },
  timeAgo: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  messagePreview: {
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    marginBottom: hp('1.2%'),
  },
  messagePreviewText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: hp('2%'),
  },
  actionRow: {
    flexDirection: 'row',
    gap: wp('3%'),
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.5%'),
    height: hp('5%'),
    borderRadius: AuthStyles.inputRadius,
    borderWidth: 1.2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  declineText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.5%'),
    height: hp('5%'),
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.primary,
  },
  acceptText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});

export default ChatRequestsScreen;
