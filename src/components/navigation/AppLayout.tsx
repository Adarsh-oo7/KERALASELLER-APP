import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import TopBar from './TopBar';
import DrawerLayout from './DrawerLayout';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  notificationCount?: number;
  backgroundColor?: string;
}

const { height } = Dimensions.get('window');

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = 'Kerala Sellers',
  subtitle,
  showNotifications = true,
  notificationCount = 3, // Example notification count
  backgroundColor = '#ffffff',
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const toggleDrawer = () => {
    console.log('🧭 Toggling drawer from TopBar');
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    console.log('🧭 Closing drawer from AppLayout');
    setIsDrawerOpen(false);
  };

  // Calculate top bar height (including status bar)
  const topBarHeight = 120; // Adjust based on your TopBar component

  return (
    <View style={styles.container}>
      {/* ✅ FIXED TOP BAR */}
      <TopBar
        title={title}
        subtitle={subtitle}
        onMenuPress={toggleDrawer}
        showNotifications={showNotifications}
        notificationCount={notificationCount}
        backgroundColor={backgroundColor}
      />

      {/* ✅ MAIN CONTENT WITH DRAWER */}
      <DrawerLayout isOpen={isDrawerOpen} onClose={closeDrawer}>
        <View style={[styles.content, { paddingTop: 0 }]}>
          {children}
        </View>
      </DrawerLayout>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

export default AppLayout;
