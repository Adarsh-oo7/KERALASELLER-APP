

// import 'react-native-gesture-handler'; // ⚠️ MUST be at the very top
// import React, { useRef, useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { StatusBar } from 'expo-status-bar';
// import * as SplashScreen from 'expo-splash-screen';
// import { View, AppState } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import { AuthProvider } from './src/context/AuthContext';
// import { ThemeProvider } from './src/context/ThemeContext';
// import { PaymentProvider } from './src/context/PaymentContext'; // ✅ ADD THIS

// import AppNavigator from './src/navigation/AppNavigator';
// import AuthService from './src/services/AuthService';
// import ErrorBoundary from './src/components/common/ErrorBoundary';

// SplashScreen.preventAutoHideAsync();

// export default function App() {
//   const navigationRef = useRef<any>();

//   useEffect(() => {
//     const handleAppStateChange = (nextAppState: string) => {
//       if (nextAppState === 'active') {
//         checkAuthStatus();
//       } else if (nextAppState === 'background') {
//         savePendingData();
//       }
//     };
//     const subscription = AppState.addEventListener('change', handleAppStateChange);
//     return () => subscription?.remove();
//   }, []);

//   useEffect(() => {
//     if (navigationRef.current) {
//       try {
//         AuthService.setNavigationRef(navigationRef);
//         console.log('🧭 Navigation reference set in App.tsx');
//       } catch (error) {
//         console.error('❌ Error setting navigation reference:', error);
//       }
//     }
//   }, []);

//   const checkAuthStatus = async () => {
//     try {
//       const token = await AsyncStorage.getItem('accessToken');
//       if (token) {
//         console.log('🔒 Checking token validity...');
//       }
//     } catch (error) {
//       console.error('❌ Error checking auth status:', error);
//     }
//   };

//   const savePendingData = async () => {
//     try {
//       console.log('💾 Saving pending data...');
//     } catch (error) {
//       console.error('❌ Error saving pending data:', error);
//     }
//   };

//   const handleNavigationReady = () => {
//     try {
//       AuthService.setNavigationRef(navigationRef);
//       console.log('🧭 NavigationContainer ready in App.tsx');
//       SplashScreen.hideAsync();
//     } catch (error) {
//       console.error('❌ Error in navigation ready handler:', error);
//       SplashScreen.hideAsync();
//     }
//   };

//   return (
//     <ErrorBoundary>
//       <ThemeProvider>
//         <AuthProvider>
//           <PaymentProvider>  {/* ✅ WRAP HERE — inside AuthProvider so it can use auth token */}
//             <View style={{ flex: 1 }}>
//               <StatusBar style="auto" />
//               <NavigationContainer
//                 ref={navigationRef}
//                 onReady={handleNavigationReady}
//                 onStateChange={(state) => {
//                   if (__DEV__) console.log('🧭 Navigation state changed');
//                 }}
//                 fallback={<View style={{ flex: 1, backgroundColor: '#fff' }} />}
//                 onUnhandledAction={(action) => {
//                   console.warn('🧭 Unhandled navigation action:', action);
//                 }}
//               >
//                 <AppNavigator />
//               </NavigationContainer>
//             </View>
//           </PaymentProvider>  {/* ✅ CLOSE HERE */}
//         </AuthProvider>
//       </ThemeProvider>
//     </ErrorBoundary>
//   );
// }

import 'react-native-gesture-handler'; // ⚠️ MUST be at the very top
import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, AppState, AppStateStatus } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { PaymentProvider } from './src/context/PaymentContext';

import AppNavigator from './src/navigation/AppNavigator';
import AuthService from './src/services/AuthService';
import ErrorBoundary from './src/components/common/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigationRef = useRef<any>(null);

  // ── AppState listener ────────────────────────────────────────────────────
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAuthStatus();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // ── Set nav ref once on mount ─────────────────────────────────────────────
  // ✅ FIX: removed the second useEffect that also called setNavigationRef
  // with the wrong timing — onReady handler below is the correct place

  const checkAuthStatus = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      if (__DEV__) console.log('🔒 Auth check on resume:', isAuth ? 'authenticated' : 'not authenticated');
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
    }
  };

  const handleNavigationReady = () => {
    try {
      // ✅ FIX: pass .current directly — the actual NavigationContainerRef value
      AuthService.setNavigationRef(navigationRef.current);
      if (__DEV__) console.log('🧭 NavigationContainer ready — nav ref set');
    } catch (error) {
      console.error('❌ Error in navigation ready handler:', error);
    } finally {
      // ✅ Always hide splash screen even if something errors
      SplashScreen.hideAsync();
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PaymentProvider>
            <View style={{ flex: 1 }}>
              <StatusBar style="auto" />
              <NavigationContainer
                ref={navigationRef}
                onReady={handleNavigationReady}
                onStateChange={() => {
                  if (__DEV__) console.log('🧭 Navigation state changed');
                }}
                fallback={<View style={{ flex: 1, backgroundColor: '#fff' }} />}
              >
                <AppNavigator />
              </NavigationContainer>
            </View>
          </PaymentProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

