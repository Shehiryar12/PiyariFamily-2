import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStyles, FontSizes } from '../Constant/AuthStyles';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { fs, hp, wp } from '../Functions/responsive';

export const DROPDOWN_MAX_HEIGHT = hp('28%');
const ROW = hp('1.4%') * 2 + FontSizes.body + 8;

type Menu = {
  x: number;
  y: number;
  width: number;
  options: readonly string[];
  selected: readonly string[];
  closeOnSelect: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
};

const Ctx = createContext<{
  openMenu: (menu: Menu) => void;
  patchMenu: (patch: Partial<Menu>) => void;
  closeMenu: () => void;
  menu: Menu | null;
  hostRef: React.RefObject<View | null>;
} | null>(null);

export const useDropdownPortal = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useDropdownPortal needs DropdownPortalProvider');
  }
  return ctx;
};

export const useGuardedDropdownPress = (onPress: () => void) => onPress;

export const DropdownPortalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [menu, setMenu] = useState<Menu | null>(null);
  const hostRef = useRef<View>(null);

  const openMenu = useCallback((next: Menu) => setMenu(next), []);
  const patchMenu = useCallback((patch: Partial<Menu>) => {
    setMenu(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);
  const closeMenu = useCallback(() => setMenu(null), []);

  return (
    <Ctx.Provider value={{ openMenu, patchMenu, closeMenu, menu, hostRef }}>
      {children}
    </Ctx.Provider>
  );
};

export const DropdownSafeScrollView = React.forwardRef<
  ScrollView,
  ScrollViewProps
>(function DropdownSafeScrollView({ scrollEnabled = true, ...props }, ref) {
  const { menu } = useDropdownPortal();

  return (
    <ScrollView
      ref={ref}
      {...props}
      scrollEnabled={scrollEnabled && menu == null}
    />
  );
});

export const DropdownOverlayHost = () => {
  const { menu, closeMenu, hostRef } = useDropdownPortal();
  const allowSelectRef = useRef(false);
  const menuSession = menu
    ? `${menu.x}:${menu.y}:${menu.width}:${menu.options.join('|')}`
    : '';

  useEffect(() => {
    allowSelectRef.current = false;
    if (!menuSession) {
      return;
    }

    const timer = setTimeout(() => {
      allowSelectRef.current = true;
    }, 300);

    return () => clearTimeout(timer);
  }, [menuSession]);

  if (!menu) {
    return <View ref={hostRef} collapsable={false} style={styles.host} pointerEvents="none" />;
  }

  const height = Math.min(
    Math.max(menu.options.length, 1) * ROW,
    DROPDOWN_MAX_HEIGHT,
    Math.max(Dimensions.get('window').height - menu.y - hp('14%'), ROW * 3),
  );

  return (
    <View ref={hostRef} collapsable={false} pointerEvents="auto" style={styles.host}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          menu.onClose();
          closeMenu();
        }}
      />
      <View
        style={[
          styles.menu,
          { top: menu.y, left: menu.x, width: menu.width, height },
        ]}
      >
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator
          style={{ height }}
        >
          {menu.options.map((item, index) => {
            const selected = menu.selected.includes(item);
            const last = index === menu.options.length - 1;
            return (
              <Pressable
                key={item}
                style={[styles.option, last && styles.optionLast]}
                onPress={() => {
                  if (!allowSelectRef.current) {
                    return;
                  }
                  menu.onSelect(item);
                  if (menu.closeOnSelect !== false) {
                    closeMenu();
                  }
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
                {selected ? (
                  <Icon name="check" size={fs(18)} color={Colors.gold} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

type OverlayProps = {
  visible: boolean;
  anchorRef?: React.RefObject<View | null>;
  options: readonly string[];
  selectedValues: readonly string[];
  closeOnSelect?: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export const DropdownOptionsOverlay = ({
  visible,
  anchorRef,
  options,
  selectedValues,
  closeOnSelect = true,
  onSelect,
  onClose,
}: OverlayProps) => {
  const { openMenu, patchMenu, closeMenu, hostRef } = useDropdownPortal();
  const onSelectRef = useRef(onSelect);
  const onCloseRef = useRef(onClose);
  const selectedRef = useRef(selectedValues);
  onSelectRef.current = onSelect;
  onCloseRef.current = onClose;
  selectedRef.current = selectedValues;

  useEffect(() => {
    if (!visible) {
      return;
    }

    patchMenu({ selected: selectedValues, options });
  }, [visible, selectedValues, options, patchMenu]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    Keyboard.dismiss();

    const timer = setTimeout(() => {
      const field = anchorRef?.current;
      const overlay = hostRef.current;
      if (!field) {
        return;
      }

      const show = (overlayX: number, overlayY: number) => {
        field.measureInWindow((x, y, width, height) => {
          if (width <= 0 || height <= 0) {
            return;
          }
          openMenu({
            x: x - overlayX,
            y: y + height - overlayY,
            width,
            options,
            selected: selectedRef.current,
            closeOnSelect,
            onSelect: value => onSelectRef.current(value),
            onClose: () => onCloseRef.current(),
          });
        });
      };

      if (overlay) {
        overlay.measureInWindow((ox, oy) => show(ox, oy));
      } else {
        show(0, 0);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      closeMenu();
    };
  }, [visible]);

  return null;
};

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  menu: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: Colors.dividerPink,
    borderRadius: AuthStyles.inputRadius,
    backgroundColor: Colors.white,
    elevation: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ROW,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.4%'),
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerPink,
    backgroundColor: Colors.white,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
});

export default DropdownOptionsOverlay;
