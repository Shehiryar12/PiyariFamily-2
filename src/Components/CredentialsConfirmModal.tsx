import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthInput from './AuthInput';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { Strings } from '../Constant/Strings';
import { fs, hp, wp } from '../Functions/responsive';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  initialEmail?: string;
  iconName?: string;
  onClose: () => void;
  onConfirm: (payload: { email: string; password: string }) => void;
};

const CredentialsConfirmModal = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = Strings.cancelAction,
  loading = false,
  initialEmail = '',
  iconName = 'account-lock-outline',
  onClose,
  onConfirm,
}: Props) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setPassword('');
    }
  }, [visible, initialEmail]);

  const handleConfirm = () => {
    if (loading) {
      return;
    }

    onConfirm({
      email: email.trim(),
      password,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.iconWrap}>
            <Icon name={iconName} size={fs(18)} color={Colors.white} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.fields}>
            <AuthInput
              compact
              label={Strings.emailLabel}
              iconName="email-outline"
              placeholder={Strings.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <AuthInput
              compact
              label={Strings.passwordLabel}
              iconName="lock-outline"
              placeholder={Strings.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              showToggle
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              activeOpacity={0.85}
              disabled={loading}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText} numberOfLines={2}>
                {loading ? '...' : confirmLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              activeOpacity={0.85}
              disabled={loading}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('7%'),
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
    marginBottom: hp('1.4%'),
  },
  fields: {
    width: '100%',
    marginBottom: hp('1.2%'),
  },
  actions: {
    width: '100%',
    gap: hp('1%'),
  },
  actionBtn: {
    width: '100%',
    minHeight: hp('5%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.1%'),
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
    textAlign: 'center',
  },
  confirmText: {
    fontSize: fs(13),
    fontFamily: Fonts.semiBold,
    color: Colors.white,
    textAlign: 'center',
  },
});

export default CredentialsConfirmModal;
