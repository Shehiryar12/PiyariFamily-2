import React, { useEffect, useMemo, useRef } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  PanResponder,
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
  title: string;
  iconName?: string;
  iconSource?: ImageSourcePropType;
  min: number;
  max: number;
  lowValue: number;
  highValue: number;
  minLabel: string;
  centerLabel: string;
  maxLabel: string;
  step?: number;
  showControls?: boolean;
  thumbVariant?: 'filled' | 'outline';
  titleColor?: string;
  onLowValueChange?: (value: number) => void;
  onHighValueChange?: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

const snapToStep = (value: number, min: number, max: number, step: number) => {
  const snapped = Math.round((value - min) / step) * step + min;
  return Math.min(max, Math.max(min, snapped));
};

const FilterRangeSlider = ({
  title,
  iconName,
  iconSource,
  min,
  max,
  lowValue,
  highValue,
  minLabel,
  centerLabel,
  maxLabel,
  step = 1,
  showControls = true,
  thumbVariant = 'filled',
  titleColor = Colors.primary,
  onLowValueChange,
  onHighValueChange,
  onDragStart,
  onDragEnd,
}: Props) => {
  const trackRef = useRef<View>(null);
  const trackWidthRef = useRef(0);
  const trackOriginXRef = useRef(0);
  const activeThumbRef = useRef<'low' | 'high' | null>(null);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const lowRef = useRef(lowValue);
  const highRef = useRef(highValue);
  const onLowRef = useRef(onLowValueChange);
  const onHighRef = useRef(onHighValueChange);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);

  minRef.current = min;
  maxRef.current = max;
  stepRef.current = step;
  lowRef.current = lowValue;
  highRef.current = highValue;
  onLowRef.current = onLowValueChange;
  onHighRef.current = onHighValueChange;
  onDragStartRef.current = onDragStart;
  onDragEndRef.current = onDragEnd;

  const range = Math.max(max - min, 1);
  const lowPercent = ((lowValue - min) / range) * 100;
  const highPercent = ((highValue - min) / range) * 100;
  const canDrag = Boolean(onLowValueChange || onHighValueChange);

  const measureTrack = () => {
    trackRef.current?.measureInWindow(x => {
      trackOriginXRef.current = x;
    });
  };

  useEffect(() => {
    measureTrack();
  }, [min, max, lowValue, highValue]);

  const valueFromPageX = (pageX: number) => {
    const width = trackWidthRef.current;
    const currentMin = minRef.current;
    const currentMax = maxRef.current;
    const currentStep = stepRef.current;

    if (!width) {
      return currentMin;
    }

    const ratio = Math.min(
      1,
      Math.max(0, (pageX - trackOriginXRef.current) / width),
    );
    return snapToStep(
      currentMin + ratio * (currentMax - currentMin),
      currentMin,
      currentMax,
      currentStep,
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          canDrag &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 6,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          canDrag &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 6,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: evt => {
          measureTrack();
          const value = valueFromPageX(evt.nativeEvent.pageX);
          const distLow = Math.abs(value - lowRef.current);
          const distHigh = Math.abs(value - highRef.current);
          activeThumbRef.current = distLow <= distHigh ? 'low' : 'high';
          onDragStartRef.current?.();
        },
        onPanResponderMove: evt => {
          const value = valueFromPageX(evt.nativeEvent.pageX);
          const currentStep = stepRef.current;

          if (activeThumbRef.current === 'low') {
            onLowRef.current?.(
              Math.min(value, highRef.current - currentStep),
            );
            return;
          }

          if (activeThumbRef.current === 'high') {
            onHighRef.current?.(
              Math.max(value, lowRef.current + currentStep),
            );
          }
        },
        onPanResponderRelease: () => {
          activeThumbRef.current = null;
          onDragEndRef.current?.();
        },
        onPanResponderTerminate: () => {
          activeThumbRef.current = null;
          onDragEndRef.current?.();
        },
      }),
    [canDrag],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
    measureTrack();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        {iconSource ? (
          <Image
            source={iconSource}
            style={styles.sectionIconImage}
            resizeMode="contain"
          />
        ) : iconName ? (
          <Icon name={iconName} size={fs(18)} color={Colors.primary} />
        ) : null}
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      </View>

      <View
        ref={trackRef}
        style={styles.track}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBg} pointerEvents="none" />
        <View
          pointerEvents="none"
          style={[
            styles.trackFill,
            { left: `${lowPercent}%`, width: `${highPercent - lowPercent}%` },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            thumbVariant === 'outline' ? styles.thumbOutline : null,
            { left: `${lowPercent}%` },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            thumbVariant === 'outline' ? styles.thumbOutline : null,
            { left: `${highPercent}%` },
          ]}
        />
      </View>

      <View style={styles.labelsRow}>
        <Text style={styles.edgeLabel}>{minLabel}</Text>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
        <Text style={styles.edgeLabel}>{maxLabel}</Text>
      </View>

      {showControls && (onLowValueChange || onHighValueChange) ? (
        <View style={styles.controlsRow}>
          {onLowValueChange ? (
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Min</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onLowValueChange(Math.max(min, lowValue - step))}
              >
                <Icon
                  name="minus-circle-outline"
                  size={fs(22)}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.controlValue}>{lowValue}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  onLowValueChange(Math.min(highValue - step, lowValue + step))
                }
              >
                <Icon
                  name="plus-circle-outline"
                  size={fs(22)}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          ) : null}

          {onHighValueChange ? (
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Max</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  onHighValueChange(Math.max(lowValue + step, highValue - step))
                }
              >
                <Icon
                  name="minus-circle-outline"
                  size={fs(22)}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.controlValue}>{highValue}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onHighValueChange(Math.min(max, highValue + step))}
              >
                <Icon
                  name="plus-circle-outline"
                  size={fs(22)}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: hp('2.2%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
    marginBottom: hp('1.2%'),
  },
  sectionIconImage: {
    width: fs(18),
    height: fs(18),
  },
  title: {
    fontSize: fs(14),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  track: {
    height: hp('3.2%'),
    justifyContent: 'center',
  },
  trackBg: {
    height: hp('0.45%'),
    borderRadius: wp('1%'),
    backgroundColor: Colors.gradientStart,
  },
  trackFill: {
    position: 'absolute',
    height: hp('0.7%'),
    borderRadius: wp('1%'),
    backgroundColor: Colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: wp('5.5%'),
    height: wp('5.5%'),
    borderRadius: wp('2.75%'),
    backgroundColor: Colors.primary,
    marginLeft: -wp('2.75%'),
    top: '50%',
    marginTop: -wp('2.75%'),
    borderWidth: 2,
    borderColor: Colors.white,
  },
  thumbOutline: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('0.8%'),
    gap: wp('2%'),
  },
  edgeLabel: {
    fontSize: fs(11),
    fontFamily: Fonts.regular,
    color: Colors.textLight,
  },
  centerLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: fs(12),
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('4%'),
    marginTop: hp('1.2%'),
  },
  controlGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp('2%'),
    backgroundColor: Colors.tabActiveBg,
    borderRadius: wp('3%'),
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('2%'),
  },
  controlLabel: {
    fontSize: fs(11),
    fontFamily: Fonts.semiBold,
    color: Colors.textLight,
    marginRight: wp('1%'),
  },
  controlValue: {
    minWidth: wp('7%'),
    textAlign: 'center',
    fontSize: fs(13),
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
});

export default FilterRangeSlider;
