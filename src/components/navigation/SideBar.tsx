import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../../services/AuthService';

const { width, height } = Dimensions.get('window');

interface SideBarProps {
  onClose: () => void;
  isVisible: boolean;
}

const SideBar: React.FC<SideBarProps> = ({ onClose, isVisible }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      loadUserData();
    }
  }, [isVisible]);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setUserData(user);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // ✅ FIXED: Proper navigation handling for nested screens
  const handleNavigation = (screenName: string, params?: any) => {
    console.log('🧭 Sidebar navigation to:', screenName);
    onClose(); // Close drawer first
    
    setTimeout(() => {
      try {
        if (screenName === 'Dashboard') {
          // Navigate to MainTabs and select Dashboard
          navigation.navigate('MainTabs' as never, { screen: 'Dashboard' } as never);
        } else if (screenName === 'Products') {
          // Navigate to MainTabs and select Products
          navigation.navigate('MainTabs' as never, { screen: 'Products' } as never);
        } else if (screenName === 'AddProduct') {
          // Navigate to MainTabs and select AddProduct
          navigation.navigate('MainTabs' as never, { screen: 'AddProduct' } as never);
        } else if (screenName === 'Orders') {
          // Navigate to MainTabs and select Orders
          navigation.navigate('MainTabs' as never, { screen: 'Orders' } as never);
        } else if (screenName === 'History') {
          // Navigate to MainTabs and select History
          navigation.navigate('MainTabs' as never, { screen: 'History' } as never);
        } else if (screenName === 'Subscription') {
          // ✅ FIXED: Subscription is now in MainTabs (hidden tab)
          navigation.navigate('MainTabs' as never, { screen: 'Subscription' } as never);
        } else {
          // For other stack screens (CreateShop, Billing), navigate directly
          navigation.navigate(screenName as never, params as never);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback: try to navigate to MainTabs
        try {
          navigation.navigate('MainTabs' as never);
        } catch (fallbackError) {
          console.error('Fallback navigation error:', fallbackError);
        }
      }
    }, 300); // Small delay for smooth animation
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout from Kerala Sellers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose();
              await AuthService.logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  // ✅ UPDATED: Fixed routes for proper navigation
  const mainMenuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'home-outline',
      route: 'Dashboard', // This will navigate to MainTabs -> Dashboard
      description: 'Overview & Analytics'
    },
    {
      id: 'products',
      title: 'My Products',
      icon: 'cube-outline',
      route: 'Products', // This will navigate to MainTabs -> Products
      description: 'Manage Inventory'
    },
    {
      id: 'add-product',
      title: 'Add Product',
      icon: 'add-circle-outline',
      route: 'AddProduct', // This will navigate to MainTabs -> AddProduct
      description: 'Create New Product'
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: 'bag-handle-outline',
      route: 'Orders', // This will navigate to MainTabs -> Orders
      description: 'Customer Orders'
    },
    {
      id: 'history',
      title: 'Sales History',
      icon: 'time-outline',
      route: 'History', // This will navigate to MainTabs -> History
      description: 'Transaction Records'
    },
  ];

  // ✅ BUSINESS TOOLS: Updated with correct navigation
  const businessTools = [
    {
      id: 'billing',
      title: 'Local Billing',
      icon: 'receipt-outline',
      route: 'Billing', // Stack screen - direct navigation
      description: 'Point of Sale'
    },
    {
      id: 'subscription',
      title: 'Subscription',
      icon: 'diamond-outline',
      route: 'Subscription', // ✅ FIXED: Now handled as MainTabs screen
      description: 'Upgrade Plan'
    },
    {
      id: 'store-settings',
      title: 'Store Settings',
      icon: 'settings-outline',
      route: 'CreateShop', // Stack screen - direct navigation
      description: 'Profile & Setup'
    },
  ];

  // ✅ SUPPORT & INFO
  const supportItems = [
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      action: 'help'
    },
    {
      id: 'about',
      title: 'About Kerala Sellers',
      icon: 'information-circle-outline',
      action: 'about'
    },
  ];

  const handleSupportAction = (action: string) => {
    onClose();
    
    if (action === 'help') {
      Alert.alert(
        'Help & Support',
        'Contact Kerala Sellers support:\n\n📧 Email: support@keralasellers.com\n📱 WhatsApp: +91 9876543210',
        [{ text: 'OK' }]
      );
    } else if (action === 'about') {
      Alert.alert(
        'About Kerala Sellers',
        'Kerala Sellers - Empowering local businesses across Kerala with zero-commission online stores.\n\nVersion: 1.0.0\n\n🌴 Made with love in Kerala',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ HEADER SECTION */}
      <View style={styles.header}>
        {/* ✅ CLOSE BUTTON: LinkedIn-style X */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={26} color="#6b7280" />
        </TouchableOpacity>
        
        {/* ✅ PROFILE SECTION: LinkedIn-style */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'K'}
              </Text>
            </View>
            <View style={styles.statusIndicator} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userData?.name || 'Kerala Seller'}
            </Text>
            <Text style={styles.userEmail}>
              {userData?.email || 'seller@keralasellers.com'}
            </Text>
            <View style={styles.storeTag}>
              <Text style={styles.storeTagText}>
                🏪 {userData?.shop_name || 'Kerala Store'}
              </Text>
            </View>
          </View>
        </View>

        {/* ✅ EDIT PROFILE BUTTON */}
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => handleNavigation('CreateShop')}
        >
          <Ionicons name="pencil-outline" size={16} color="#3b82f6" />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ SCROLLABLE CONTENT */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ✅ MAIN NAVIGATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Menu</Text>
          {mainMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name={item.icon as any} size={24} color="#374151" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ BUSINESS TOOLS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Tools</Text>
          {businessTools.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIcon, styles.businessIcon]}>
                <Ionicons name={item.icon as any} size={24} color="#3b82f6" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ KERALA SELLERS PRO CARD */}
        <View style={styles.proCard}>
          <View style={styles.proCardContent}>
            <Text style={styles.proCardTitle}>🌴 Kerala Sellers Pro</Text>
            <Text style={styles.proCardDescription}>
              Unlock premium features and boost your sales with our Pro plan
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => handleNavigation('Subscription')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ SUPPORT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleSupportAction(item.action)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name={item.icon as any} size={24} color="#6b7280" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ LOGOUT SECTION */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.menuItemIcon, styles.logoutIcon]}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.logoutDescription}>Sign out of Kerala Sellers</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ✅ APP INFO */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Kerala Sellers v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 Kerala Sellers</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ✅ STYLES: Keep all your existing styles - they're perfect!
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // ✅ HEADER SECTION
  header: {
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userInfo: {
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  storeTag: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  storeTagText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  editProfileText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  
  // ✅ CONTENT SECTION
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#f9fafb',
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  businessIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // ✅ PRO CARD
  proCard: {
    marginHorizontal: 24,
    marginVertical: 12,
  },
  proCardContent: {
    backgroundColor: '#eff6ff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    alignItems: 'center',
  },
  proCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  proCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // ✅ LOGOUT SECTION
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  logoutDescription: {
    fontSize: 13,
    color: '#dc2626',
  },
  
  // ✅ APP INFO
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  appVersion: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default SideBar;
