import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../Constant/Colors';
import { Fonts } from '../Constant/Fonts';
import { Strings } from '../Constant/Strings';
import { getTabBarBottomPadding, resolveInsets } from '../Functions/safeArea';
import { getTabBarStyle } from '../Functions/tabBarVisibility';
import { fs, hp, wp } from '../Functions/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeStackNavigator, {
  HomeStackParamList,
} from './HomeStackNavigator';
import LikeStackNavigator, {
  LikeStackParamList,
} from './LikeStackNavigator';
import SearchStackNavigator, {
  SearchStackParamList,
} from './SearchStackNavigator';
import MessagesStackNavigator, {
  MessagesStackParamList,
} from './MessagesStackNavigator';
import ProfileStackNavigator, {
  ProfileStackParamList,
} from './ProfileStackNavigator';

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Search: NavigatorScreenParams<SearchStackParamList> | undefined;
  Messages: NavigatorScreenParams<MessagesStackParamList> | undefined;
  Like: NavigatorScreenParams<LikeStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const TAB_BAR_CONTENT_HEIGHT = hp('7%');

type TabIconProps = {
  name: string;
  focused: boolean;
  color: string;
};

const TabIcon = ({ name, focused, color }: TabIconProps) => {
  if (
    focused &&
    (name === 'home' ||
      name === 'heart-outline' ||
      name === 'magnify' ||
      name === 'message-outline' ||
      name === 'account-outline')
  ) {
    return (
      <View style={styles.activeIconWrap}>
        <Icon name={name} size={fs(22)} color={Colors.primary} />
      </View>
    );
  }

  return <Icon name={name} size={fs(22)} color={color} />;
};

const MainTabNavigator = () => {
  const insets = resolveInsets(useSafeAreaInsets());
  const bottomPadding = getTabBarBottomPadding(insets.bottom);
  const visibleTabBarStyle = [
    styles.tabBar,
    {
      height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
      paddingBottom: bottomPadding,
    },
  ];

  return (
    <Tab.Navigator
      backBehavior="firstRoute"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: getTabBarStyle(route, visibleTabBarStyle),
        tabBarIcon: ({ focused, color }) => {
          const iconMap: Record<keyof MainTabParamList, string> = {
            Home: 'home',
            Search: 'magnify',
            Messages: 'message-outline',
            Like: 'heart-outline',
            Profile: 'account-outline',
          };

          return (
            <TabIcon
              name={iconMap[route.name]}
              focused={focused}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ tabBarLabel: Strings.tabHome }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{ tabBarLabel: Strings.tabSearch }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStackNavigator}
        options={{ tabBarLabel: Strings.tabMessages }}
      />
      <Tab.Screen
        name="Like"
        component={LikeStackNavigator}
        options={{ tabBarLabel: Strings.tabLike }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: Strings.tabProfile }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('Profile', { screen: 'Settings' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: hp('0.8%'),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.white,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: fs(11),
    fontFamily: Fonts.medium,
    marginTop: wp('1%'),
  },
  activeIconWrap: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MainTabNavigator;
