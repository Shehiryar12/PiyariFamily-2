import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ImageSourcePropType } from 'react-native';
import HomeScreen from '../Screens/Home/HomeScreen';
import MatchSuccessScreen from '../Screens/Home/MatchSuccessScreen';
import ProfileDetailScreen from '../Screens/Home/ProfileDetailScreen';
import ViewProfileGalleryScreen from '../Screens/Profile/ViewProfileGalleryScreen';

export type ProfileDetailParams = {
  profileId: string;
  name?: string;
  age?: number;
  location?: string;
  image?: ImageSourcePropType;
  isVerified?: boolean;
  pictureHidden?: boolean;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  ProfileDetail: ProfileDetailParams;
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

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
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

export default HomeStackNavigator;
