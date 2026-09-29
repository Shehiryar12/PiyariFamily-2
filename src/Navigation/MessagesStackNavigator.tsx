import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ChatRequestsScreen,
  ChatScreen,
  MessagesScreen,
} from '../Screens/Messages';

export type MessagesStackParamList = {
  MessagesMain: undefined;
  ChatRequests: undefined;
  Chat: { chatId: string; name: string };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

const MessagesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MessagesMain" component={MessagesScreen} />
      <Stack.Screen name="ChatRequests" component={ChatRequestsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
};

export default MessagesStackNavigator;
