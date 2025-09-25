import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  primary: '#4A7C4F',
  primaryLight: '#6B9B6F',
  background: '#FAFCFA',
  surface: '#FFFFFF',
  textPrimary: '#1A1F1A',
  textSecondary: '#5F6B5F',
  textTertiary: '#9CA59C',
  error: '#D84315',
  shadow: 'rgba(26, 31, 26, 0.08)',
};

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { seller, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              await logout();
              console.log('✅ Logged out from drawer');
            } catch (error) {
              console.error('❌ Logout error:', error);
            }
          }, 
          style: 'destructive' 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../../assets/images/logo.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{seller?.name || 'Seller'}</Text>
            <Text style={styles.shopName}>🏪 {seller?.shop_name || 'Your Shop'}</Text>
            <Text style={styles.userPhone}>📱 {seller?.phone || 'N/A'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Navigation Items */}
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>MAIN MENU</Text>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Footer Section */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Kerala Sellers</Text>
          <Text style={styles.appVersion}>v1.0.0</Text>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
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
  userPhone: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  drawerContent: {
    paddingTop: 0,
  },
  menuSection: {
    paddingHorizontal: 0,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    paddingHorizontal: 20,
    paddingBottom: 10,
    letterSpacing: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 124, 79, 0.1)',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 124, 79, 0.05)',
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(216, 67, 21, 0.1)',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(74, 124, 79, 0.1)',
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  appVersion: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});

