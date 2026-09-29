import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
import ScreenHeader from '../../Components/ScreenHeader';
import {
  Api,
  getApiErrorMessage,
  isApiSuccess,
  mapPhotoAccessPayload,
  resolvePhotoAccessRespond,
  type PhotoAccessAction,
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
  'ViewProfileRequests'
>;

type ConfirmModalState = {
  type: 'accept' | 'reject';
  request: ViewProfileRequest;
};

const isPendingRequest = (item: ViewProfileRequest) =>
  item.status === 'pending';

const ViewProfileRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [requests, setRequests] = useState<ViewProfileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondingAction, setRespondingAction] =
    useState<PhotoAccessAction | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(
    null,
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await Api.getPhotoAccessRequests();
      const body = res?.data;
      const items = mapPhotoAccessPayload(body);

      console.log(
        'ViewProfileRequests backend data:',
        JSON.stringify(body ?? null, null, 2),
      );
      console.log(
        'ViewProfileRequests mapped:',
        items.map(item => ({
          id: item?.id,
          name: item?.name,
          status: item?.status,
        })),
      );

      const hasRequestList =
        Array.isArray(body?.requests) || items.length > 0;

      if (isApiSuccess(res?.status, body?.success) || hasRequestList) {
        setRequests(items.filter(item => item && isPendingRequest(item)));
      } else {
        const message =
          res?.data?.message ?? Strings.viewProfileRequestsError;
        setRequests([]);
        setError(message);
        Toast.show(message, Toast.LONG);
      }
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        Strings.viewProfileRequestsError,
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

  const respondToRequest = async (
    request: ViewProfileRequest,
    action: PhotoAccessAction,
  ) => {
    if (respondingId) {
      return;
    }

    setRespondingId(request.id);
    setRespondingAction(action);
    setConfirmModal(null);

    let snapshot: ViewProfileRequest[] = [];
    setRequests(current => {
      snapshot = current;
      return current.filter(item => item.id !== request.id);
    });

    try {
      const res = await Api.respondToPhotoAccessRequest(request.id, action);

      if (isApiSuccess(res?.status, res?.data?.success)) {
        const resolved = resolvePhotoAccessRespond(res?.data);
        const targetId = resolved.requestId || request.id;
        setRequests(current =>
          current.filter(item => item.id !== targetId && item.id !== request.id),
        );
      } else {
        setRequests(snapshot);
        Toast.show(
          res?.data?.message ?? Strings.viewProfileRequestsError,
          Toast.LONG,
        );
      }
    } catch (requestError) {
      setRequests(snapshot);
      Toast.show(
        getApiErrorMessage(requestError, Strings.viewProfileRequestsError),
        Toast.LONG,
      );
    } finally {
      setRespondingId(null);
      setRespondingAction(null);
    }
  };

  const handleAccept = (request: ViewProfileRequest) => {
    if (respondingId) {
      return;
    }
    setConfirmModal({ type: 'accept', request });
  };

  const handleReject = (request: ViewProfileRequest) => {
    if (respondingId) {
      return;
    }
    setConfirmModal({ type: 'reject', request });
  };

  const handleConfirmRespond = () => {
    if (!confirmModal || respondingId) {
      return;
    }

    respondToRequest(
      confirmModal.request,
      confirmModal.type === 'accept' ? 'approve' : 'reject',
    );
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
    const busy = respondingId === request.id;

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

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{Strings.pendingStatus}</Text>
            </View>
          </View>

          <Text style={styles.timeText}>{request.requestedAt}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            activeOpacity={0.88}
            onPress={() => handleReject(request)}
            disabled={Boolean(respondingId)}
          >
            {busy && respondingAction === 'reject' ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Icon name="close" size={fs(16)} color={Colors.primary} />
                <Text style={styles.rejectText}>{Strings.reject}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            activeOpacity={0.88}
            onPress={() => handleAccept(request)}
            disabled={Boolean(respondingId)}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.acceptBtnFill}
            >
              {busy && respondingAction === 'approve' ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Icon name="check" size={fs(16)} color={Colors.white} />
                  <Text style={styles.acceptText}>{Strings.accept}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
        title={Strings.viewProfileRequests}
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
          showsVerticalScrollIndicator={true}
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
                    name="account-eye-outline"
                    size={fs(30)}
                    color={Colors.primary}
                  />
                </View>
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {Strings.viewProfileRequestsEmpty}
              </Text>
              <View style={styles.emptyDivider} />
              <Text style={styles.emptyHint}>
                {Strings.viewProfileRequestsEmptyHint}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {confirmModal ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!respondingId) {
              setConfirmModal(null);
            }
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <LinearGradient
                colors={
                  confirmModal.type === 'accept'
                    ? [Colors.goldLight, Colors.gold]
                    : [Colors.gradientStart, Colors.focusBorder]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalIconRing}
              >
                <View style={styles.modalIconInner}>
                  <Icon
                    name={
                      confirmModal.type === 'accept'
                        ? 'check-circle-outline'
                        : 'close-circle-outline'
                    }
                    size={fs(34)}
                    color={
                      confirmModal.type === 'accept'
                        ? Colors.gold
                        : Colors.primary
                    }
                  />
                </View>
              </LinearGradient>

              <Text style={styles.modalTitle}>
                {confirmModal.type === 'accept'
                  ? Strings.requestAcceptConfirmTitle
                  : Strings.requestRejectConfirmTitle}
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalNoBtn}
                  activeOpacity={0.88}
                  onPress={handleConfirmRespond}
                  disabled={Boolean(respondingId)}
                >
                  <Text style={styles.modalNoText}>{Strings.requestModalNo}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalYesBtn}
                  activeOpacity={0.9}
                  onPress={handleConfirmRespond}
                  disabled={Boolean(respondingId)}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalYesFill}
                  >
                    <Text style={styles.modalYesText}>
                      {Strings.requestModalYes}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
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
    marginBottom: hp('1.4%'),
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
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('2%'),
    paddingHorizontal: wp('2.4%'),
    paddingVertical: hp('0.28%'),
  },
  statusText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: wp('2.5%'),
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.2%'),
    height: hp('5%'),
    borderRadius: AuthStyles.inputRadius,
    borderWidth: 1.2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  rejectText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  acceptBtn: {
    flex: 1,
    height: hp('5%'),
    borderRadius: AuthStyles.inputRadius,
    overflow: 'hidden',
  },
  acceptBtnFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('1.2%'),
  },
  acceptText: {
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
    width: wp('17.5%'),
    height: wp('17.5%'),
    borderRadius: wp('8.75%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fs(18),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('1.2%'),
  },
  emptyDivider: {
    width: wp('12%'),
    height: 2,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginBottom: hp('1.4%'),
  },
  emptyHint: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: fs(20),
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: wp('3%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('0.7%'),
    marginTop: hp('1.2%'),
  },
  retryBtnText: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(107, 4, 29, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('7%'),
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: wp('6%'),
    paddingHorizontal: wp('6%'),
    paddingTop: hp('3.2%'),
    paddingBottom: hp('2.4%'),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E6C8',
  },
  modalIconRing: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('9%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.8%'),
  },
  modalIconInner: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: hp('2.4%'),
    lineHeight: fs(24),
    paddingHorizontal: wp('2%'),
  },
  modalMessage: {
    fontSize: fs(13),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: fs(20),
    marginBottom: hp('2.4%'),
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: wp('3%'),
  },
  modalNoBtn: {
    flex: 1,
    height: hp('5.2%'),
    borderRadius: wp('4%'),
    borderWidth: 1.2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNoText: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  modalYesBtn: {
    flex: 1,
    height: hp('5.2%'),
    borderRadius: wp('4%'),
    overflow: 'hidden',
  },
  modalYesFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalYesText: {
    fontSize: fs(14),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});

export default ViewProfileRequestsScreen;
