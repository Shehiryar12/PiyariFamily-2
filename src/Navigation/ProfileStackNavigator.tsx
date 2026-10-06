import React from 'react';
import { ImageSourcePropType } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  AccountOptionsScreen,
  ChangePasswordScreen,
  EditProfileScreen,
  MyRewardsScreen,
  NotificationsScreen,
  ViewProfileGalleryScreen,
  ViewProfileRequestsScreen,
  RequestHistoryScreen,
  ApprovedPhotoAccessScreen,
  ProfileVerifiedScreen,
  ReferralProgramScreen,
  SettingsScreen,
  VerifyProfileCodeScreen,
  VerifyProfileScreen,
} from '../Screens/Profile';
import {
  ChooseYourPlanScreen,
  ComparePlansScreen,
  CompletePaymentScreen,
  ManageSubscriptionScreen,
  PremiumPaywallScreen,
  PremiumSuccessScreen,
} from '../Screens/Subscription';
import MatchSuccessScreen from '../Screens/Home/MatchSuccessScreen';
import ProfileDetailScreen from '../Screens/Home/ProfileDetailScreen';
import { ProfileDetailParams } from './HomeStackNavigator';

export type ProfileStackParamList = {
  Settings: undefined;
  EditProfile: undefined;
  VerifyProfile: undefined;
  VerifyProfileCode: { phone: string };
  ProfileVerified: { phone: string };
  Notifications: undefined;
  ViewProfileRequests: undefined;
  RequestHistory: undefined;
  ApprovedPhotoAccess: undefined;
  ViewProfileGallery: {
    userId?: string;
    name: string;
    accessGranted?: boolean;
  };
  ProfileDetail: ProfileDetailParams;
  MatchSuccess: {
    name: string;
    fullName: string;
    matchImage: ImageSourcePropType;
    matchId?: string;
    mutualMatch?: boolean;
  };
  ChangePassword: undefined;
  AccountOptions: undefined;
  ReferralProgram: undefined;
  MyRewards: undefined;
  ChooseYourPlan: undefined;
  ComparePlans: undefined;
  PremiumPaywall: undefined;
  CompletePayment: {
    plan: 'VIP' | 'VVIP';
    price: number;
    priceLabel: string;
  };
  PremiumSuccess: {
    plan: 'VIP' | 'VVIP';
    priceLabel: string;
    nextBilling?: string;
  };
  ManageSubscription: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="VerifyProfile" component={VerifyProfileScreen} />
      <Stack.Screen
        name="VerifyProfileCode"
        component={VerifyProfileCodeScreen}
      />
      <Stack.Screen
        name="ProfileVerified"
        component={ProfileVerifiedScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="ViewProfileRequests"
        component={ViewProfileRequestsScreen}
      />
      <Stack.Screen name="RequestHistory" component={RequestHistoryScreen} />
      <Stack.Screen
        name="ApprovedPhotoAccess"
        component={ApprovedPhotoAccessScreen}
      />
      <Stack.Screen
        name="ViewProfileGallery"
        component={ViewProfileGalleryScreen}
      />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
      <Stack.Screen
        name="MatchSuccess"
        component={MatchSuccessScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="AccountOptions" component={AccountOptionsScreen} />
      <Stack.Screen name="ReferralProgram" component={ReferralProgramScreen} />
      <Stack.Screen name="MyRewards" component={MyRewardsScreen} />
      <Stack.Screen name="ChooseYourPlan" component={ChooseYourPlanScreen} />
      <Stack.Screen name="ComparePlans" component={ComparePlansScreen} />
      <Stack.Screen name="PremiumPaywall" component={PremiumPaywallScreen} />
      <Stack.Screen name="CompletePayment" component={CompletePaymentScreen} />
      <Stack.Screen name="PremiumSuccess" component={PremiumSuccessScreen} />
      <Stack.Screen
        name="ManageSubscription"
        component={ManageSubscriptionScreen}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
