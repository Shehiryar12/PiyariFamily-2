import { Platform, StatusBar } from 'react-native';
import { EdgeInsets, Metrics } from 'react-native-safe-area-context';
import { hp } from './responsive';

export const getAndroidStatusBarHeight = (): number =>
  StatusBar.currentHeight ?? 0;

export const getTopInset = (insetTop: number): number => {
  if (insetTop > 0) {
    return insetTop;
  }

  return Platform.OS === 'android' ? getAndroidStatusBarHeight() : 0;
};

export const getTabBarBottomPadding = (insetBottom: number): number => {
  if (Platform.OS === 'ios') {
    return Math.max(insetBottom, hp('0.5%'));
  }

  if (insetBottom > 0) {
    return insetBottom;
  }

  return hp('1%');
};

export const getFooterBottomPadding = (insetBottom: number): number =>
  Math.max(insetBottom + hp('1%'), hp('3%'));

export const getSafeAreaInitialMetrics = (
  metrics: Metrics | null,
): Metrics | undefined => {
  if (!metrics || Platform.OS !== 'android') {
    return metrics ?? undefined;
  }

  return {
    ...metrics,
    insets: {
      ...metrics.insets,
      top: getTopInset(metrics.insets.top),
    },
  };
};

export const resolveInsets = (insets: EdgeInsets): EdgeInsets => ({
  ...insets,
  top: getTopInset(insets.top),
});
