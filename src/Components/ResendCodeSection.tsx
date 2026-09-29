import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

export const RESEND_COOLDOWN_SECONDS = 120;

type Props = {
  cooldownSeconds?: number;
  loading?: boolean;
  onResend?: () => void;
  onCooldownEnd?: () => void;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const ResendCodeSection = ({
  cooldownSeconds = RESEND_COOLDOWN_SECONDS,
  loading = false,
  onResend,
  onCooldownEnd,
}: Props) => {
  const [seconds, setSeconds] = useState(cooldownSeconds);
  const canResend = seconds === 0;
  const onCooldownEndRef = useRef(onCooldownEnd);
  onCooldownEndRef.current = onCooldownEnd;

  useEffect(() => {
    setSeconds(cooldownSeconds);

    if (cooldownSeconds <= 0) {
      setTimeout(() => onCooldownEndRef.current?.(), 0);
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => onCooldownEndRef.current?.(), 0);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleResend = () => {
    if (!canResend || loading) {
      return;
    }
    onResend?.();
  };

  return (
    <View style={styles.container}>
      {!canResend && (
        <View style={styles.timerRow}>
          <Icon name="timer-outline" size={fs(16)} color={Colors.textLight} />
          <Text style={styles.timerText}>
            Resend code in {formatTime(seconds)}
          </Text>
        </View>
      )}
      <View style={styles.promptRow}>
        <Text style={styles.prompt}>Didn't receive it? </Text>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : (
          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canResend }}
          >
            <Text
              style={[styles.resendLink, !canResend && styles.resendDisabled]}
            >
              Resend
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  timerText: {
    fontSize: FontSizes.bodySmall,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    marginLeft: wp('1.6%'),
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  resendLink: {
    color: Colors.gold,
    fontFamily: Fonts.semiBold,
  },
  resendDisabled: {
    opacity: 0.55,
  },
});

export default ResendCodeSection;
