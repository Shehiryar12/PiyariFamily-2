import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import ConfirmModal from '../../Components/ConfirmModal';
import ScreenHeader from '../../Components/ScreenHeader';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  mapPhotoAccessPayload,
  mergePhotoAccessResponses,
  resolvePhotoAccessRespond,
  type ViewProfileRequest,
} from '../../API';
import { AuthStyles, FontSizes } from '../../Constant/AuthStyles';
import { Colors } from '../../Constant/Colors';
import { Fonts } from '../../Constant/Fonts';
import { Strings } from '../../Constant/Strings';
import { ProfileStackParamList } from '../../Navigation/ProfileStackNavigator';
import { fs, hp, wp } from '../../Functions/responsive';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ApprovedPhotoAccess'
>;

const isApprovedRequest = (item: ViewProfileRequest) =>
  item.status === 'accepted';

const ApprovedPhotoAccessScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [requests, setRequests] = useState<ViewProfileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ViewProfileRequest | null>(
    null,
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incoming, all] = await Promise.all([
        Api.getPhotoAccessRequests('incoming'),
        Api.getPhotoAccessRequests(),
      ]);
      const body = {
        requests: mergePhotoAccessResponses([incoming?.data, all?.data]),
      };
      const items = mapPhotoAccessPayload(body).filter(isApprovedRequest);
      const success =
        isApiSuccess(incoming?.status, incoming?.data?.success) ||
        isApiSuccess(all?.status, all?.data?.success) ||
        items.length > 0;

      if (success) {
        setRequests(items);
      } else {
        const message =
          incoming?.data?.message ??
          all?.data?.message ??
          Strings.approvedPhotoAccessError;
        setRequests([]);
        setError(message);
        Toast.show(message, Toast.LONG);
      }
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        Strings.approvedPhotoAccessError,
      );
      setRequests([]);
      setError(message);
      Toast.show(message, Toast.LONG);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests]),
  );

  const revokeAccess = async (request: ViewProfileRequest) => {
    if (blockingId) {
      return;
    }

    setBlockingId(request.id);
    setConfirmRequest(null);

    let snapshot: ViewProfileRequest[] = [];
    setRequests(current => {
      snapshot = current;
      return current.filter(item => item.id !== request.id);
    });

    try {
      const res = await Api.revokePhotoAccessRequest(request.id);

      if (isApiSuccess(res?.status, res?.data?.success)) {
        const resolved = resolvePhotoAccessRespond(res?.data);
        Toast.show(
          resolved.message || Strings.photoAccessRevoked,
          Toast.LONG,
        );
      } else {
        setRequests(snapshot);
        Toast.show(
          res?.data?.message ?? Strings.approvedPhotoAccessError,
          Toast.LONG,
        );
      }
    } catch (requestError) {
      setRequests(snapshot);
      Toast.show(
        getApiErrorMessage(requestError, Strings.approvedPhotoAccessError),
        Toast.LONG,
      );
    } finally {
      setBlockingId(null);
    }
  };

  const renderRequest = (request: ViewProfileRequest) => {
    const name = request.name?.trim();
    const nameLabel = name
      ? request.age != null
        ? `${name}, ${request.age}`
        : name
      : request.age != null
        ? String(request.age)
        : '';
    const busy = blockingId === request.id;

    return (
      <View key={request.id} style={styles.requestCard}>
        <LinearGradient
          colors={[Colors.goldLight, Colors.gold, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardAccent}
        />

        <View style={styles.requestTop}>
          <View style={styles.avatarRing}>
            <Image
              source={request.image}
              style={styles.requestImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.requestInfo}>
            <View style={styles.requestNameRow}>
              {nameLabel ? (
                <Text style={styles.requestName} numberOfLines={1}>
                  {nameLabel}
                </Text>
              ) : null}
              {request.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Icon name="shield-check" size={fs(10)} color={Colors.gold} />
                  <Text style={styles.verifiedText}>{Strings.verifiedLabel}</Text>
                </View>
              ) : null}
            </View>

            {request.location ? (
              <View style={styles.locationRow}>
                <Icon
                  name="map-marker-outline"
                  size={fs(13)}
                  color={Colors.gold}
                />
                <Text style={styles.locationText}>{request.location}</Text>
              </View>
            ) : null}

            <View style={[styles.statusBadge, styles.statusBadgeAccepted]}>
              <Text style={[styles.statusText, styles.statusTextAccepted]}>
                {Strings.acceptedStatus}
              </Text>
            </View>
          </View>

          <Text style={styles.timeText}>{request.requestedAt}</Text>
        </View>

        <TouchableOpacity
          style={styles.blockBtn}
          activeOpacity={0.88}
          onPress={() => setConfirmRequest(request)}
          disabled={Boolean(blockingId)}
        >
          {busy ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Icon name="block-helper" size={fs(16)} color={Colors.white} />
              <Text style={styles.blockBtnText}>{Strings.blockPhotoAccess}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#FFE5EC', '#FFF8FA', Colors.background]}
        style={styles.topGlow}
      />

      <ScreenHeader
        title={Strings.approvedPhotoAccess}
        onBack={() => navigation.goBack()}
        style={styles.screenHeader}
      />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            activeOpacity={0.88}
            onPress={fetchRequests}
          >
            <Text style={styles.retryBtnText}>{Strings.tryAgain}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            requests.length === 0 && styles.emptyScrollContent,
          ]}
        >
          {requests.length > 0 ? (
            requests.map(renderRequest)
          ) : (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[Colors.goldLight, Colors.gold, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconRing}
              >
                <View style={styles.emptyIconWrap}>
                  <Icon
                    name="account-cancel-outline"
                    size={fs(30)}
                    color={Colors.primary}
                  />
                </View>
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {Strings.approvedPhotoAccessEmpty}
              </Text>
              <View style={styles.emptyDivider} />
              <Text style={styles.emptyHint}>
                {Strings.approvedPhotoAccessEmptyHint}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <ConfirmModal
        visible={Boolean(confirmRequest)}
        title={Strings.blockPhotoAccessConfirmTitle}
        message={Strings.blockPhotoAccessConfirmMessage}
        cancelLabel={Strings.no}
        confirmLabel={Strings.yes}
        loading={Boolean(blockingId)}
        iconName="block-helper"
        onClose={() => {
          if (!blockingId) {
            setConfirmRequest(null);
          }
        }}
        onConfirm={() => {
          if (confirmRequest) {
            revokeAccess(confirmRequest);
          }
        }}
      />
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
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AuthStyles.horizontalPadding,
  },
  scrollContent: {
    paddingHorizontal: AuthStyles.horizontalPadding,
    paddingBottom: hp('3%'),
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: wp('4.5%'),
    borderWidth: 1,
    borderColor: '#F3E6C8',
    padding: wp('3.8%'),
    marginBottom: hp('1.8%'),
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp('0.45%'),
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarRing: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    borderWidth: 1.5,
    borderColor: Colors.gold,
    padding: wp('0.6%'),
    marginRight: wp('3%'),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp('8%'),
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
    fontSize: fs(15),
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
  timeText: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    marginLeft: wp('1%'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
    marginBottom: hp('0.7%'),
  },
  locationText: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('2.4%'),
    paddingVertical: hp('0.28%'),
  },
  statusBadgeAccepted: {
    backgroundColor: '#FFF8E7',
  },
  statusText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
  },
  statusTextAccepted: {
    color: Colors.gold,
  },
  blockBtn: {
    marginTop: hp('1.4%'),
    height: hp('5%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.5%'),
  },
  blockBtnText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  emptyText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('6%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: Colors.focusBorder,
  },
  emptyIconRing: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('2.2%'),
  },
  emptyIconWrap: {
    width: wp('17%'),
    height: wp('17%'),
    borderRadius: wp('8.5%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('1%'),
  },
  emptyDivider: {
    width: wp('12%'),
    height: 2,
    backgroundColor: Colors.gold,
    borderRadius: 2,
    marginBottom: hp('1.2%'),
  },
  emptyHint: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2.2%'),
  },
  retryBtn: {
    marginTop: hp('1.6%'),
    backgroundColor: Colors.primary,
    borderRadius: AuthStyles.inputRadius,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.1%'),
  },
  retryBtnText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});

export default ApprovedPhotoAccessScreen;
