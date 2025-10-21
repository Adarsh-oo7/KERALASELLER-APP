import 'react-native-gesture-handler'; // ⚠️ MUST be at the very top
import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Import Context Providers (REMOVED ApiProvider)
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

// ✅ Import Navigation
import AppNavigator from './src/navigation/AppNavigator';
import AuthService from './src/services/AuthService';

// ✅ Import Error Boundary
import ErrorBoundary from './src/components/common/ErrorBoundary';

// ✅ Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef<any>();

  // ✅ Handle app state changes (for session management)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Check for expired sessions when app becomes active
        checkAuthStatus();
      } else if (nextAppState === 'background') {
        // Save any pending data when app goes to background
        savePendingData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // ✅ Set navigation reference with better error handling
  useEffect(() => {
    if (navigationRef.current) {
      try {
        AuthService.setNavigationRef(navigationRef);
        console.log('🧭 Navigation reference set in App.tsx');
      } catch (error) {
        console.error('❌ Error setting navigation reference:', error);
      }
    }
  }, []);

  // ✅ Check authentication status
  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        // Validate token or refresh if needed
        console.log('🔒 Checking token validity...');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
    }
  };

  // ✅ Save pending data
  const savePendingData = async () => {
    try {
      // Save any unsaved form data, drafts, etc.
      console.log('💾 Saving pending data...');
    } catch (error) {
      console.error('❌ Error saving pending data:', error);
    }
  };

  // ✅ Handle navigation ready
  const handleNavigationReady = () => {
    try {
      AuthService.setNavigationRef(navigationRef);
      console.log('🧭 NavigationContainer ready in App.tsx');
      
      // Hide splash screen once navigation is ready
      SplashScreen.hideAsync();
    } catch (error) {
      console.error('❌ Error in navigation ready handler:', error);
      SplashScreen.hideAsync(); // Hide splash even if there's an error
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <StatusBar style="auto" />
            
            <NavigationContainer 
              ref={navigationRef}
              onReady={handleNavigationReady}
              onStateChange={(state) => {
                // Log navigation state changes for debugging
                if (__DEV__) {
                  console.log('🧭 Navigation state changed');
                }
              }}
              fallback={<View style={{ flex: 1, backgroundColor: '#fff' }} />}
              onUnhandledAction={(action) => {
                console.warn('🧭 Unhandled navigation action:', action);
              }}
            >
              <AppNavigator />
            </NavigationContainer>
          </View>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
