import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

// Import your main navigator
import BottomTabNavigator from './BottomTabNavigator';
import FixedTopNav from '../components/navigation/FixedTopNav';
import FixedBottomNavGlobal from '../components/navigation/FixedBottomNavGlobal';

// Import additional screens
import BillingScreen from '../screens/billing/BillingScreen';
import StockManagementScreen from '../screens/stock/StockManagementScreen'; // ✅ FIXED: Correct import
import HistoryScreen from '../screens/history/HistoryScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SubscriptionsScreen from '../screens/subscription/SubscriptionScreen';

const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { seller, logout } = useAuth();

  const menuItems = [
    {
      id: 'billing',
      title: 'Local Billing',
      icon: 'card',
      onPress: () => {
        console.log('💳 Navigating to Billing');
        navigation.navigate('Billing');
        navigation.closeDrawer();
      },
    },
    {
      id: 'stock',
      title: 'Stock Management', // ✅ This matches the screen
      icon: 'cube-outline', // ✅ Use Ionicons icon
      onPress: () => {
        console.log('📦 Navigating to Stock Management');
        navigation.navigate('StockManagement'); // ✅ FIXED: Correct screen name
        navigation.closeDrawer();
      },
    },
    {
      id: 'history',
      title: 'Transaction History',
      icon: 'time',
      onPress: () => {
        console.log('📜 Navigating to History');
        navigation.navigate('History');
        navigation.closeDrawer();
      },
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      badge: '5',
      badgeColor: COLORS.primary,
      onPress: () => {
        console.log('🔔 Navigating to Notifications');
        navigation.navigate('NotificationsStack');
        navigation.closeDrawer();
      },
    },
    {
      id: 'subscriptions',
      title: 'Subscriptions',
      icon: 'crown',
      onPress: () => {
        console.log('👑 Navigating to Subscriptions');
        navigation.navigate('Subscriptions');
        navigation.closeDrawer();
      },
    },
  ];

  const handleLogout = async () => {
    Alert.alert(
      '👋 Logout',
      'Are you sure you want to logout from Kerala Sellers?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Logging out...');
              await logout();
              navigation.closeDrawer();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      {/* Profile Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.drawerHeader}
      >
        <View style={styles.profileSection}>
          <LinearGradient
            colors={COLORS.gradients.kerala}
            style={styles.profileBorder}
          >
            <View style={styles.profileContainer}>
              <Text style={styles.profileInitial}>
                {seller?.name?.charAt(0)?.toUpperCase() || 'T'}
              </Text>
            </View>
          </LinearGradient>
          
          <View style={styles.profileInfo}>
            <Text style={styles.sellerName}>
              {seller?.name || 'Thor A D'}
            </Text>
            <Text style={styles.shopName}>
              🏪 {seller?.shop_name || 'Gost namez'}
            </Text>
            <Text style={styles.sellerPhone}>
              📱 {seller?.phone || '+91 9898989898'}
            </Text>
            <View style={styles.memberBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
              <Text style={styles.memberText}>Kerala Seller</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>BUSINESS TOOLS</Text>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemIcon}>
                <Ionicons name={item.icon as any} size={22} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
              {item.badge && (
                <View style={[styles.menuBadge, { backgroundColor: item.badgeColor || COLORS.primary }]}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ✅ MAIN: Drawer Navigator with Global Navigation Wrapper
function DrawerNavigatorWithGlobalNav() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.globalContainer}>
      {/* ✅ GLOBAL: Fixed Top Navigation - Always visible */}
      <FixedTopNav title="Kerala Sellers" />
      
      {/* ✅ GLOBAL: Main Content Area with proper margins */}
      <View style={[
        styles.contentArea,
        {
          marginTop: 64 + insets.top, // Top nav height + safe area
          marginBottom: Platform.OS === 'ios' ? 85 : 65, // Bottom nav height
        }
      ]}>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              backgroundColor: COLORS.surface,
              width: 300,
            },
            drawerType: Platform.OS === 'ios' ? 'slide' : 'front',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            drawerHideStatusBarOnOpen: false,
            drawerStatusBarAnimation: 'none',
            gestureHandlerProps: {
              enableTrackpadTwoFingerGesture: false,
            },
          }}
        >
          {/* Main tab navigator */}
          <Drawer.Screen 
            name="MainTabs" 
            component={BottomTabNavigator}
            options={{ drawerLabel: 'Kerala Sellers Main' }}
          />
          
          {/* Additional screens */}
          <Drawer.Screen 
            name="Billing" 
            component={BillingScreen}
            options={{
              title: 'Local Billing',
              drawerItemStyle: { display: 'none' }, // Hide from auto drawer
            }}
          />
          
          {/* ✅ FIXED: Stock Management Screen */}
          <Drawer.Screen 
            name="StockManagement" 
            component={StockManagementScreen}
            options={{
              title: 'Stock Management',
              drawerItemStyle: { display: 'none' }, // Hide from auto drawer, use custom
            }}
          />
          
          <Drawer.Screen 
            name="History" 
            component={HistoryScreen}
            options={{
              title: 'Transaction History',
              drawerItemStyle: { display: 'none' },
            }}
          />
          
          <Drawer.Screen 
            name="NotificationsStack" 
            component={NotificationsScreen}
            options={{
              title: 'Notifications',
              drawerItemStyle: { display: 'none' },
            }}
          />
          
          <Drawer.Screen 
            name="Subscriptions" 
            component={SubscriptionsScreen}
            options={{
              title: 'Subscriptions',
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer.Navigator>
      </View>

      {/* ✅ GLOBAL: Fixed Bottom Navigation - Always visible */}
      <FixedBottomNavGlobal />
    </View>
  );
}

export default DrawerNavigatorWithGlobalNav;

const styles = StyleSheet.create({
  // ✅ Global container styles
  globalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentArea: {
    flex: 1,
  },

  // Existing drawer styles
  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'flex-start',
  },
  profileBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileInfo: {
    marginBottom: 16,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  shopName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  sellerPhone: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  memberText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    marginLeft: 24,
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.03)',
  },
  menuItemIcon: {
    width: 32,
    alignItems: 'flex-start',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginLeft: 16,
  },
  menuBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuBadgeText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.errorLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(216, 67, 21, 0.2)',
  },
  logoutIconContainer: {
    width: 32,
    alignItems: 'flex-start',
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 16,
  },
});
