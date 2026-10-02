import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import {
  LoginScreen,
  OnboardingScreen,
  SignUpScreen,
  SplashScreen,
  VerifyEmailScreen,
  ForgotPasswordScreen,
  CheckEmailScreen,
  CodeVerifiedScreen,
  SetNewPasswordScreen,
  PasswordResetSuccessScreen,
  WelcomeBackScreen,
} from '../Screens/Auth';
import {
  AddPhotosScreen,
  BasicInfoScreen,
  CareerScreen,
  EducationScreen,
  FaithCommunityScreen,
  PhysicalDetailsScreen,
  ProfileReadyScreen,
  SelectCountryScreen,
} from '../Screens/ProfileSetup';
import { getActiveRouteName } from '../Functions/navigationPersistence';
import { AccountDeactivatedScreen } from '../Screens/Profile';
import { setNavigationState, store } from '../Redux';
import { navigationRef } from './navigationRef';
import MainTabNavigator from './MainTabNavigator';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: { email?: string };
  SignUp: undefined;
  VerifyEmail: {
    email: string;
    autoSend?: boolean;
    password?: string;
    name?: string;
    resendAfterSeconds?: number;
  };
  ForgotPassword: undefined;
  CheckEmail: { email: string; resendAfterSeconds?: number };
  CodeVerified: { email: string };
  SetNewPassword: { email: string };
  PasswordResetSuccess: undefined;
  WelcomeBack: undefined;
  SelectCountry: undefined;
  BasicInfo: undefined;
  Education: undefined;
  Career: undefined;
  PhysicalDetails: undefined;
  FaithCommunity: undefined;
  AddPhotos: undefined;
  ProfileReady: undefined;
  AccountDeactivated: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={state => {
        if (getActiveRouteName(state) === 'Splash') {
          return;
        }

        store.dispatch(setNavigationState(state ?? null));
      }}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
        <Stack.Screen name="CodeVerified" component={CodeVerifiedScreen} />
        <Stack.Screen name="SetNewPassword" component={SetNewPasswordScreen} />
        <Stack.Screen
          name="PasswordResetSuccess"
          component={PasswordResetSuccessScreen}
        />
        <Stack.Screen name="WelcomeBack" component={WelcomeBackScreen} />
        <Stack.Screen
          name="SelectCountry"
          component={SelectCountryScreen}
          options={{
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen name="BasicInfo" component={BasicInfoScreen} />
        <Stack.Screen name="Education" component={EducationScreen} />
        <Stack.Screen name="Career" component={CareerScreen} />
        <Stack.Screen
          name="PhysicalDetails"
          component={PhysicalDetailsScreen}
        />
        <Stack.Screen name="FaithCommunity" component={FaithCommunityScreen} />
        <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
        <Stack.Screen name="ProfileReady" component={ProfileReadyScreen} />
        <Stack.Screen
          name="AccountDeactivated"
          component={AccountDeactivatedScreen}
          options={{
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
            animation: 'none',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ animation: 'fade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;
