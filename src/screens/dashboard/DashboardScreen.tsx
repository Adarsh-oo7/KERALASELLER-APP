import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2B4B39',
  primaryLight: '#3A5D47',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1D1D1F',
  textSecondary: '#86868B',
  success: '#4A6B52',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const API_BASE_URL = 'http://192.168.1.7:8000';

interface SellerData {
  id: number;
  name: string;
  phone: string;
  shop_name: string;
  email: string;
}

export default function DashboardScreen() {
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerData();
  }, []);

  const loadSellerData = async () => {
    try {
      // Get stored seller data
      const sellerData = await AsyncStorage.getItem('sellerData');
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (sellerData) {
        setSeller(JSON.parse(sellerData));
      }
      
      console.log('📊 Dashboard loaded for seller:', sellerData);
      console.log('🔑 Access token available:', !!accessToken);
    } catch (error) {
      console.error('Failed to load seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all stored data
              await AsyncStorage.multiRemove([
                'accessToken',
                'refreshToken',
                'apiToken',
                'userPhone',
                'userType',
                'sellerId',
                'sellerData'
              ]);
              
              console.log('🚪 User logged out');
              // You'll need to navigate back to login here
              // For now, we'll just show an alert
              Alert.alert('Logged Out', 'You have been logged out successfully.');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const testProtectedAPI = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (!accessToken) {
        Alert.alert('Error', 'No access token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/test-auth-protected/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      console.log('🔒 Protected API test:', data);
      
      Alert.alert('API Test Result', `Status: ${response.status}\nUser: ${data.user}\nAuthenticated: ${data.is_authenticated}`);
    } catch (error: any) {
      console.error('API test error:', error);
      Alert.alert('API Test Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.sellerName}>{seller?.name || 'Seller'}</Text>
            <Text style={styles.shopName}>{seller?.shop_name || 'Shop'}</Text>
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Seller Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seller Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{seller?.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{seller?.shop_name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>+91{seller?.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{seller?.email}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={testProtectedAPI}>
            <LinearGradient
              colors={[COLORS.success, '#5A8B63']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.surface} />
              <Text style={styles.actionButtonText}>Test Protected API</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} disabled>
            <LinearGradient
              colors={[COLORS.textSecondary, COLORS.textSecondary]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="cube-outline" size={20} color={COLORS.surface} />
              <Text style={styles.actionButtonText}>Manage Products (Coming Soon)</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} disabled>
            <LinearGradient
              colors={[COLORS.textSecondary, COLORS.textSecondary]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="receipt-outline" size={20} color={COLORS.surface} />
              <Text style={styles.actionButtonText}>View Orders (Coming Soon)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>✅ Successfully authenticated</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>🏪 Shop profile active</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>📱 Mobile app connected</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  shopName: {
    fontSize: 18,
    color: COLORS.surface,
    opacity: 0.8,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
});
