import React from 'react';
import { Platform, StatusBar, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { getSafeAreaInitialMetrics } from './src/Functions/safeArea';
import { AppNavigator } from './src/Navigation';
import { Colors } from './src/Constant/Colors';
import { persistor, store } from './src/Redux';
import { DropdownOverlayHost, DropdownPortalProvider } from './src/Components/DropdownPortal';
import { usePendingReferralCapture } from './src/Functions';

const PersistLoading = () => (
  <View style={{ flex: 1, backgroundColor: Colors.white }} />
);

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  usePendingReferralCapture();

  return (
    <SafeAreaProvider
      initialMetrics={getSafeAreaInitialMetrics(initialWindowMetrics)}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={Platform.OS === 'android'}
        backgroundColor="transparent"
      />
      <DropdownPortalProvider>
        <View style={{ flex: 1 }}>
          <AppNavigator />
          <DropdownOverlayHost />
        </View>
      </DropdownPortalProvider>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<PersistLoading />} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
