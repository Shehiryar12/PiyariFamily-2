import React, { useRef } from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';
import DropdownOptionsOverlay from './DropdownOptionsOverlay';

type Props = {
  label?: string;
  iconName?: string;
  iconSource?: ImageSourcePropType;
  iconImageSize?: number;
  iconText?: string;
  placeholder: string;
  value: string;
  options: readonly string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  style?: ViewStyle;
};

const SetupDropdown = ({
  label,
  iconName,
  iconSource,
  iconImageSize = fs(15),
  iconText,
  placeholder,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  style,
}: Props) => {
  const anchorRef = useRef<View>(null);

  return (
    <View style={[style, styles.wrap, isOpen && styles.openWrap]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View ref={anchorRef} collapsable={false} style={styles.anchor}>
        <TouchableOpacity
          style={styles.dropdownRow}
          activeOpacity={0.85}
          onPress={() => {
            Keyboard.dismiss();
            onToggle();
          }}
        >
          {iconSource ? (
            <Image
              source={iconSource}
              style={[
                styles.dropdownIcon,
                styles.iconImage,
                { width: iconImageSize, height: iconImageSize } as ImageStyle,
              ]}
              resizeMode="contain"
            />
          ) : iconText ? (
            <Text style={[styles.dropdownIcon, styles.iconText]}>
              {iconText}
            </Text>
          ) : (
            <Icon
              name={iconName!}
              size={fs(20)}
              color={Colors.primary}
              style={styles.dropdownIcon}
            />
          )}
          <Text
            style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}
          >
            {value || placeholder}
          </Text>
          <Icon
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={fs(22)}
            color={Colors.iconMuted}
          />
        </TouchableOpacity>

        <DropdownOptionsOverlay
          visible={isOpen}
          anchorRef={anchorRef}
          options={options}
          selectedValues={value ? [value] : []}
          onSelect={onSelect}
          onClose={() => {
            if (isOpen) {
              onToggle();
            }
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: hp('0.5%'),
    overflow: 'visible',
    zIndex: 1,
  },
  openWrap: {
    zIndex: 200,
    elevation: 200,
  },
  anchor: {
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
  },
  fieldLabel: {
    fontSize: FontSizes.body,
    color: Colors.label,
    marginBottom: AuthStyles.fieldLabelGap,
    fontFamily: Fonts.medium,
    includeFontPadding: false,
    lineHeight: FontSizes.body + 2,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: wp('3.7%'),
    height: AuthStyles.inputHeight,
  },
  dropdownIcon: {
    marginRight: wp('2.5%'),
  },
  iconImage: {
    width: fs(15),
    height: fs(15),
  },
  iconText: {
    fontSize: fs(22),
    fontFamily: Fonts.bold,
    color: Colors.primary,
    lineHeight: fs(22),
    transform: [{ rotate: '12deg' }],
  },
  dropdownText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  dropdownPlaceholder: {
    color: Colors.placeholder,
  },
});

export default SetupDropdown;
