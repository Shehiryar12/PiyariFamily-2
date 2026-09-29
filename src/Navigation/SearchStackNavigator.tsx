import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ImageSourcePropType } from 'react-native';
import FilterMatchesScreen from '../Screens/Like/FilterMatchesScreen';
import ProfileDetailScreen from '../Screens/Home/ProfileDetailScreen';
import { SearchScreen } from '../Screens/Search';
import type { SuggestedMatch } from '../API';

export type SearchStackParamList = {
  SearchMain:
    | {
        filterMatches?: SuggestedMatch[];
        filterTotal?: number;
        fromFilter?: boolean;
      }
    | undefined;
  FilterMatches: undefined;
  ProfileDetail: {
    profileId: string;
    name?: string;
    age?: number;
    location?: string;
    image?: ImageSourcePropType;
    isVerified?: boolean;
    pictureHidden?: boolean;
  };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

const SearchStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="FilterMatches" component={FilterMatchesScreen} />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
    </Stack.Navigator>
  );
};

export default SearchStackNavigator;
