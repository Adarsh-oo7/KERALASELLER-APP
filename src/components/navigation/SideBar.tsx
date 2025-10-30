// src/components/navigation/SideBar.tsx
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
import { LinearGradient } from 'expo-linear-gradient';
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

  const handleNavigation = (screenName: string, params?: any) => {
    console.log('🧭 Sidebar navigation to:', screenName);
    onClose();
    
    setTimeout(() => {
      try {
        if (screenName === 'Dashboard') {
          navigation.navigate('MainTabs' as never, { screen: 'Dashboard' } as never);
        } else if (screenName === 'Products') {
          navigation.navigate('MainTabs' as never, { screen: 'Products' } as never);
        } else if (screenName === 'AddProduct') {
          navigation.navigate('MainTabs' as never, { screen: 'AddProduct'} as never);
        } else if (screenName === 'Orders') {
          navigation.navigate('MainTabs' as never, { screen: 'Orders' } as never);
        } else if (screenName === 'History') {
          navigation.navigate('MainTabs' as never, { screen: 'History' } as never);
        } else if (screenName === 'Subscription') {
          navigation.navigate('MainTabs' as never, { screen: 'Subscription' } as never);
        } else if (screenName === 'StockManagement') {
          console.log('📦 Navigating to StockManagement screen...');
          navigation.navigate('StockManagement' as never, params as never);
        } else {
          navigation.navigate(screenName as never, params as never);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert(
          'Navigation Error',
          `Unable to navigate to ${screenName}. Please try again.`,
          [{ text: 'OK' }]
        );
      }
    }, 250);
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

  const mainMenuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'home-outline',
      route: 'Dashboard',
      description: 'Overview & Analytics'
    },
    {
      id: 'products',
      title: 'My Products',
      icon: 'cube-outline',
      route: 'Products',
      description: 'Manage Inventory'
    },
    {
      id: 'add-product',
      title: 'Add Product',
      icon: 'add-circle-outline',
      route: 'AddProduct',
      description: 'Create New Product'
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: 'bag-handle-outline',
      route: 'Orders',
      description: 'Customer Orders'
    },
    {
      id: 'history',
      title: 'Sales History',
      icon: 'time-outline',
      route: 'History',
      description: 'Transaction Records'
    },
  ];

  const businessTools = [
    {
      id: 'stock-management',
      title: 'Stock Management',
      icon: 'layers-outline',
      route: 'StockManagement',
      description: 'Quick Inventory Updates',
      badge: 'NEW',
      badgeColor: '#10b981'
    },
    {
      id: 'billing',
      title: 'Local Billing',
      icon: 'receipt-outline',
      route: 'Billing',
      description: 'Point of Sale'
    },
    {
      id: 'subscription',
      title: 'Subscription',
      icon: 'diamond-outline',
      route: 'Subscription',
      description: 'Upgrade Plan'
    },
    {
      id: 'store-settings',
      title: 'Store Settings',
      icon: 'settings-outline',
      route: 'CreateShop',
      description: 'Profile & Setup'
    },
  ];

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
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
        
        {/* ✅ DUAL BRANDING - Kerala Sellers + Shop Logo */}
       {/* ✅ KERALA SELLERS LOGO - Use asset module */}
<View style={styles.logoSection}>
  <Text style={styles.logoText}>KS</Text>
</View>


        {/* ✅ COMPACT Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#3b82f6', '#1e40af']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'K'}
              </Text>
            </LinearGradient>
            <View style={styles.statusIndicator} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userData?.name || 'Kerala Seller'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userData?.email || 'seller@keralasellers.com'}
            </Text>
          </View>
        </View>

        {/* ✅ Store Tag & Edit Button Row */}
        <View style={styles.actionsRow}>
          <View style={styles.storeTag}>
            <Text style={styles.storeTagText} numberOfLines={1}>
              🏪 {userData?.shop_name || 'Kerala Store'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => handleNavigation('CreateShop')}
          >
            <Ionicons name="pencil-outline" size={14} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Menu</Text>
          {mainMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.menuItemGradient}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon as any} size={22} color="#374151" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Business Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Tools</Text>
          {businessTools.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                item.id === 'stock-management' && styles.stockManagementItem
              ]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  item.id === 'stock-management' 
                    ? ['rgba(16, 185, 129, 0.05)', 'rgba(16, 185, 129, 0.02)']
                    : ['#ffffff', '#f8fafc']
                }
                style={styles.menuItemGradient}
              >
                <View style={[
                  styles.menuItemIcon, 
                  styles.businessIcon,
                  item.id === 'stock-management' && styles.stockManagementIcon
                ]}>
                  <Ionicons name={item.icon as any} size={22} color={
                    item.id === 'stock-management' ? '#10b981' : '#3b82f6'
                  } />
                </View>
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemTitleRow}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    {item.badge && (
                      <View style={[styles.newBadge, { backgroundColor: item.badgeColor }]}>
                        <Text style={styles.newBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pro Card */}
        <View style={styles.proCard}>
          <LinearGradient
            colors={['#eff6ff', '#dbeafe']}
            style={styles.proCardContent}
          >
            <Text style={styles.proCardTitle}>🌴 Kerala Sellers Pro</Text>
            <Text style={styles.proCardDescription}>
              Unlock premium features and boost sales
            </Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => handleNavigation('Subscription')}
            >
              <LinearGradient
                colors={['#3b82f6', '#1e40af']}
                style={styles.upgradeGradient}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleSupportAction(item.action)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.menuItemGradient}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon as any} size={22} color="#6b7280" />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#fef2f2', '#fee2e2']}
              style={styles.logoutGradient}
            >
              <View style={[styles.menuItemIcon, styles.logoutIcon]}>
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.logoutTitle}>Logout</Text>
                <Text style={styles.logoutDescription}>Sign out of Kerala Sellers</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Kerala Sellers v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 Kerala Sellers</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 6,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  
  // ✅ Logo Section with dual branding
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  keralaLogo: {
    width: 140,
    height: 45,
    marginBottom: 12,
  },
  shopLogoWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.1)',
    marginBottom: 8,
  },
  shopLogoImage: {
    width: 120,
    height: 40,
  },
  shopNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    marginTop: 4,
  },
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  storeTag: {
    flex: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  storeTagText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  editProfileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuItem: {
    borderRadius: 10,
    marginBottom: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  businessIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#6b7280',
  },

  stockManagementItem: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  stockManagementIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  proCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  proCardContent: {
    padding: 18,
    alignItems: 'center',
  },
  proCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  proCardDescription: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  upgradeButton: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  upgradeGradient: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  
  logoutItem: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  logoutIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 2,
  },
  logoutDescription: {
    fontSize: 12,
    color: '#dc2626',
  },
  
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 32,
  },
  appVersion: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 11,
    color: '#9ca3af',
  },
  logoText: {
  fontSize: 40,
  fontWeight: 'bold',
  color: '#FFFFFF',
},

});

export default SideBar;
