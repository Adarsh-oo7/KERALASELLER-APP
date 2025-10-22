// src/components/navigation/TopBar.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  useNavigation, 
  useNavigationState,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuthService from '../../services/AuthService';
import { AppStateContext } from '../../navigation/AppNavigator';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onMenuPress: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  backgroundColor?: string;
  textColor?: string;
}

interface UserData {
  name?: string;
  email?: string;
  id?: string;
  store_name?: string;
  shop_name?: string;
}

// ✅ Helper function OUTSIDE the component (defined first)
const getActiveRouteName = (state: any): string => {
  if (!state) return 'Dashboard';
  
  const route = state.routes[state.index];
  
  // If the route has nested state (like Tab Navigator inside Stack Navigator)
  if (route.state) {
    return getActiveRouteName(route.state);
  }
  
  return route.name || 'Dashboard';
};

const TopBar: React.FC<TopBarProps> = ({
  title: propTitle,
  subtitle: propSubtitle,
  onMenuPress,
  showNotifications = true,
  notificationCount: propNotificationCount,
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
}) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // ✅ Get notification count from context
  const { notificationCount: contextNotificationCount, loadNotificationCount } = useContext(AppStateContext);

  // ✅ Listen to navigation state changes in real-time
  const currentRouteName = useNavigationState(state => {
    if (!state) return 'Dashboard';
    return getActiveRouteName(state);
  });

  useEffect(() => {
    loadUserData();
  }, []);

  // ✅ Log when route changes (for debugging)
  useEffect(() => {
    console.log('📍 TopBar: Current route changed to:', currentRouteName);
  }, [currentRouteName]);

  const loadUserData = async (): Promise<void> => {
    try {
      const user = await AuthService.getCurrentUser();
      console.log('👤 TopBar: User data loaded:', user);
      setUserData(user);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // ✅ Get greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  // ✅ Get shop name from user data or fallback
  const getShopName = (): string => {
    return userData?.store_name || userData?.shop_name || 'Kerala Sellers';
  };

  // ✅ Get welcome message with user's name
  const getWelcomeMessage = (): string => {
    const greeting = getGreeting();
    const firstName = userData?.name?.split(' ')[0] || 'Seller';
    return `${greeting}, ${firstName}! 👋`;
  };

  // ✅ Get screen-specific title and subtitle based on CURRENT screen only
  const getScreenTitle = (): { title: string; subtitle: string } => {
    const shopName = getShopName();
    const welcomeMsg = getWelcomeMessage();

    // Screen-specific configurations
    const screenConfigs: Record<string, { title: string; subtitle: string }> = {
      'Dashboard': {
        title: shopName,
        subtitle: welcomeMsg
      },
      'Products': {
        title: 'My Products',
        subtitle: 'Manage your product catalog'
      },
      'Orders': {
        title: 'Orders',
        subtitle: 'Track and manage orders'
      },
      'Notifications': {
        title: 'Notifications',
        subtitle: 'Stay updated with alerts'
      },
      'Profile': {
        title: shopName,
        subtitle: 'Manage your account'
      },
      'AddProduct': {
        title: 'Add Product',
        subtitle: 'Add new items to your store'
      },
      'EditProduct': {
        title: 'Edit Product',
        subtitle: 'Update product details'
      },
      'OrderDetails': {
        title: 'Order Details',
        subtitle: 'View order information'
      },
      'Settings': {
        title: 'Settings',
        subtitle: 'Manage app preferences'
      },
      'StoreProfile': {
        title: shopName,
        subtitle: 'Your store information'
      },
      'Subscription': {
        title: 'Subscription',
        subtitle: 'Manage your plan'
      },
      'AllOrders': {
        title: 'All Orders',
        subtitle: 'Complete order history'
      },
    };

    // Return screen-specific config or default
    return screenConfigs[currentRouteName] || {
      title: shopName,
      subtitle: welcomeMsg
    };
  };

  // ✅ Use prop title/subtitle if provided, otherwise use dynamic based on screen
  const { title: dynamicTitle, subtitle: dynamicSubtitle } = getScreenTitle();
  const displayTitle = propTitle || dynamicTitle;
  const displaySubtitle = propSubtitle || dynamicSubtitle;

  // ✅ Better notification navigation
  const handleNotificationPress = (): void => {
    console.log('🔔 TopBar: Opening notifications screen...');
    
    try {
      navigation.navigate('MainTabs', { 
        screen: 'Notifications',
        initial: false
      });
      
      setTimeout(() => {
        loadNotificationCount();
      }, 200);
      
      console.log('✅ TopBar: Successfully navigated to notifications');
      
    } catch (error) {
      console.error('❌ TopBar: Navigation to notifications failed:', error);
      
      Alert.alert(
        'Notifications 🔔',
        'Notifications feature coming soon!',
        [{ text: 'OK' }]
      );
    }
  };

  // Use context notification count or prop
  const displayNotificationCount = propNotificationCount ?? contextNotificationCount;

  const getStatusBarHeight = (): number => {
    if (Platform.OS === 'ios') {
      return 50;
    } else {
      return StatusBar.currentHeight || 24;
    }
  };

  const statusBarHeight = getStatusBarHeight();

  return (
    <>
      <StatusBar 
        backgroundColor={backgroundColor}
        barStyle={backgroundColor === '#ffffff' ? 'dark-content' : 'light-content'}
        translucent={false}
      />
      
      <View style={[
        styles.container,
        { 
          backgroundColor,
          paddingTop: Platform.OS === 'ios' ? statusBarHeight : 16,
        }
      ]}>
        <View style={styles.content}>
          {/* LEFT: Hamburger Menu */}
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={26} color={textColor} />
          </TouchableOpacity>

          {/* CENTER: Dynamic Title & Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {displayTitle}
            </Text>
            {displaySubtitle && (
              <Text style={[styles.subtitle, { color: '#6b7280' }]} numberOfLines={1}>
                {displaySubtitle}
              </Text>
            )}
          </View>

          {/* RIGHT: Notifications */}
          {showNotifications && (
            <TouchableOpacity 
              style={[
                styles.notificationButton,
                displayNotificationCount > 0 && styles.notificationButtonActive
              ]}
              onPress={handleNotificationPress}
              activeOpacity={0.7}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons 
                  name={displayNotificationCount > 0 ? "notifications" : "notifications-outline"} 
                  size={26} 
                  color={displayNotificationCount > 0 ? '#3b82f6' : textColor} 
                />
                {displayNotificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>
                      {displayNotificationCount > 99 ? '99+' : displayNotificationCount.toString()}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification hint for unread notifications */}
        {userData && displayNotificationCount > 0 && currentRouteName === 'Dashboard' && (
          <TouchableOpacity 
            style={styles.notificationHint}
            onPress={handleNotificationPress}
            activeOpacity={0.8}
          >
            <View style={styles.notificationHintContent}>
              <Ionicons name="mail-unread" size={14} color="#3b82f6" />
              <Text style={styles.notificationHintText}>
                You have {displayNotificationCount} unread notification{displayNotificationCount !== 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={12} color="#3b82f6" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 64,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '500',
  },
  notificationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationCount: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notificationHint: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.1)',
  },
  notificationHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notificationHintText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
});

export default TopBar;
