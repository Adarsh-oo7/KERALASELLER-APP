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
import { useNavigation } from '@react-navigation/native';
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
}

const TopBar: React.FC<TopBarProps> = ({
  title = 'Kerala Sellers',
  subtitle,
  onMenuPress,
  showNotifications = true,
  notificationCount: propNotificationCount,
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
}) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // ✅ USE CONTEXT: Get notification count from app state
  const { notificationCount: contextNotificationCount, loadNotificationCount } = useContext(AppStateContext);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      const user = await AuthService.getCurrentUser();
      setUserData(user);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // ✅ FIXED: Navigate to NotificationsScreen correctly
  const handleNotificationPress = (): void => {
    console.log('🔔 TopBar: Opening notifications screen...');
    
    try {
      // ✅ CORRECT NAVIGATION: Navigate to the Notifications tab within MainTabs
      navigation.navigate('MainTabs', { 
        screen: 'Notifications',
        initial: false // Ensure it actually navigates even if already in MainTabs
      });
      
      // ✅ Alternative approach if the above doesn't work:
      // Check if we're already in MainTabs
      // if (navigation.getState().routeNames.includes('Notifications')) {
      //   navigation.navigate('Notifications');
      // } else {
      //   navigation.navigate('MainTabs', { screen: 'Notifications' });
      // }
      
      // Refresh notification count after navigation
      setTimeout(() => {
        loadNotificationCount();
      }, 200);
      
      console.log('✅ TopBar: Successfully navigated to notifications');
      
    } catch (error) {
      console.error('❌ TopBar: Navigation to notifications failed:', error);
      
      // ✅ ENHANCED FALLBACK: Try direct navigation
      try {
        navigation.navigate('Notifications');
        console.log('✅ TopBar: Fallback navigation successful');
      } catch (fallbackError) {
        console.error('❌ TopBar: Fallback navigation also failed:', fallbackError);
        
        // Final fallback alert
        Alert.alert(
          'Notifications 🔔',
          'Unable to open notifications. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // ✅ UPDATED: Use context notification count or prop
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

          {/* CENTER: Title & Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: textColor }]} numberOfLines={1}>
                {subtitle}
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

        {/* ✅ ENHANCED: Welcome message with notification indicator */}
        {userData && displayNotificationCount > 0 && title === 'Dashboard' && (
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

  // ✅ ENHANCED: Clickable notification hint
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
