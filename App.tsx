import 'react-native-gesture-handler'; // ⚠️ MUST be at the very top
import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import AuthService from './src/services/AuthService'; // ✅ ADD: Import AuthService

export default function App() {
  // ✅ ADD: Navigation reference for logout
  const navigationRef = useRef<any>();

  // ✅ ADD: Set navigation reference when app starts
  useEffect(() => {
    if (navigationRef.current) {
      AuthService.setNavigationRef(navigationRef);
      console.log('🧭 Navigation reference set in App.tsx');
    }
  }, []);

  return (
    <NavigationContainer 
      ref={navigationRef} // ✅ ADD: Navigation reference
      onReady={() => {
        // ✅ ADD: Set navigation reference when container is ready
        AuthService.setNavigationRef(navigationRef);
        console.log('🧭 NavigationContainer ready in App.tsx');
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}
