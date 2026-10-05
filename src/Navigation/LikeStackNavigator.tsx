import React from 'react';
import { ImageSourcePropType } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FilterMatchesScreen from '../Screens/Like/FilterMatchesScreen';
import MatchSuccessScreen from '../Screens/Home/MatchSuccessScreen';
import ProfileDetailScreen from '../Screens/Home/ProfileDetailScreen';
import ViewProfileGalleryScreen from '../Screens/Profile/ViewProfileGalleryScreen';
import ShortlistedScreen from '../Screens/Like/ShortlistedScreen';

export type LikeStackParamList = {
  Shortlisted: undefined;
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
  MatchSuccess: {
    name: string;
    fullName: string;
    matchImage: ImageSourcePropType;
    matchId?: string;
    mutualMatch?: boolean;
  };
  ViewProfileGallery: {
    userId?: string;
    name: string;
    accessGranted?: boolean;
  };
};

const Stack = createNativeStackNavigator<LikeStackParamList>();

const LikeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Shortlisted" component={ShortlistedScreen} />
      <Stack.Screen name="FilterMatches" component={FilterMatchesScreen} />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
      <Stack.Screen
        name="MatchSuccess"
        component={MatchSuccessScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="ViewProfileGallery" component={ViewProfileGalleryScreen} />
    </Stack.Navigator>
  );
};

export default LikeStackNavigator;
