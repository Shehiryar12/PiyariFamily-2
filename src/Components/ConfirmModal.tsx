import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  loading?: boolean;
  iconName?: string;
  onClose: () => void;
  onConfirm: () => void;
};

const ConfirmModal = ({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  loading = false,
  iconName = 'logout',
  onClose,
  onConfirm,
}: Props) => {
  const [allowBackdropClose, setAllowBackdropClose] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAllowBackdropClose(false);
      return;
    }

    const timer = setTimeout(() => setAllowBackdropClose(true), 400);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop} pointerEvents="box-none">
        <Pressable
          style={styles.backdropPress}
          onPress={allowBackdropClose && !loading ? onClose : undefined}
        />
        <View style={styles.dialog} pointerEvents="auto">
          <View style={styles.iconWrap}>
            <Icon name={iconName} size={fs(18)} color={Colors.white} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              activeOpacity={0.85}
              disabled={loading}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              activeOpacity={0.85}
              disabled={loading}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>
                {loading ? '...' : confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('10%'),
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: wp('4%'),
    paddingHorizontal: wp('4.5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('1.8%'),
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
    elevation: 8,
  },
  iconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('1.1%'),
  },
  title: {
    fontSize: fs(16),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginBottom: hp('0.5%'),
    textAlign: 'center',
  },
  message: {
    fontSize: fs(12),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: hp('2%'),
    marginBottom: hp('1.8%'),
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: wp('2.5%'),
  },
  actionBtn: {
    flex: 1,
    height: hp('4.6%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
  },
  cancelText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  confirmText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});

export default ConfirmModal;
