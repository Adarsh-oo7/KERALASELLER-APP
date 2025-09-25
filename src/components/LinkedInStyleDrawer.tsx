import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import {
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  primary: '#0077B5', // LinkedIn blue
  secondary: '#004182',
  background: '#F3F2F0',
  surface: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#5E5E5E',
  textTertiary: '#8D8D8D',
  border: '#E1E9EE',
  success: '#057642',
  warning: '#B24020',
  error: '#CC1016',
  accent: '#70B5F9',
};

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  screen?: string;
  badge?: number;
  onPress?: () => void;
}

// ✅ Fixed: Removed 'Profile' screen reference
const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'MAIN',
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: '📊', screen: 'Dashboard' },
      { id: 'network', title: 'My Network', icon: '👥' },
    ]
  },
  {
    title: 'BUSINESS',
    items: [
      { id: 'products', title: 'Products', icon: '📦', screen: 'Products', badge: 12 },
      { id: 'orders', title: 'Orders', icon: '📋', screen: 'Orders', badge: 3 },
      { id: 'analytics', title: 'Analytics', icon: '📈' },
      { id: 'marketing', title: 'Marketing', icon: '📢' },
    ]
  },
  {
    title: 'TOOLS',
    items: [
      { id: 'inventory', title: 'Inventory', icon: '📋' },
      { id: 'customers', title: 'Customers', icon: '👥' },
      { id: 'reports', title: 'Reports', icon: '📊' },
      { id: 'settings', title: 'Settings', icon: '⚙️' },
    ]
  }
];

export default function LinkedInStyleDrawer(props: DrawerContentComponentProps) {
  const { seller, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign out', 
          onPress: async () => {
            try {
              await logout();
              console.log('✅ Signed out from drawer');
            } catch (error) {
              console.error('❌ Logout error:', error);
            }
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  const handleMenuPress = (item: MenuItem) => {
    // ✅ Fixed: Only navigate to existing screens
    if (item.screen && (item.screen === 'Dashboard' || item.screen === 'Products' || item.screen === 'Orders')) {
      props.navigation.navigate(item.screen as any);
    } else if (item.onPress) {
      item.onPress();
    } else {
      Alert.alert('Coming Soon', `${item.title} feature is coming soon!`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Header Section */}
      <View style={styles.profileHeader}>
        <LinearGradient
          colors={['#0077B5', '#004182']}
          style={styles.profileBackground}
        />
        
        <TouchableOpacity style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../../assets/images/logo.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.statusIndicator} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{seller?.name || 'Seller Name'}</Text>
            <Text style={styles.userTitle}>Shop Owner</Text>
            <Text style={styles.shopName}>{seller?.shop_name || 'Your Shop'}</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Stats */}
        <View style={styles.profileStats}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>284</Text>
            <Text style={styles.statLabel}>Profile views</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>1,420</Text>
            <Text style={styles.statLabel}>Shop visits</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action */}
        <TouchableOpacity style={styles.premiumBanner}>
          <Text style={styles.premiumText}>📈 Boost your business visibility</Text>
          <Text style={styles.premiumSubtext}>Try Premium for free</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Menu */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                
                <View style={styles.menuItemRight}>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Saved Items Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.savedItemsHeader}>
            <Text style={styles.savedItemsTitle}>Saved items</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Section */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Text style={styles.footerIcon}>🚪</Text>
          <Text style={styles.footerText}>Sign out</Text>
        </TouchableOpacity>
        
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Kerala Sellers v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 Kerala Sellers</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  
  // Profile Header Styles
  profileHeader: {
    backgroundColor: COLORS.surface,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  userTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  shopName: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  // Profile Stats
  profileStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(112, 181, 249, 0.08)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  
  // Premium Banner
  premiumBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(112, 181, 249, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  premiumText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  premiumSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  
  // Menu Styles
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingBottom: 20,
  },
  menuSection: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(225, 233, 238, 0.5)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.surface,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textTertiary,
    marginLeft: 4,
  },
  
  // Saved Items
  savedItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(112, 181, 249, 0.03)',
  },
  savedItemsTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Footer Styles
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  footerIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  footerText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  appVersion: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  copyright: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
});
