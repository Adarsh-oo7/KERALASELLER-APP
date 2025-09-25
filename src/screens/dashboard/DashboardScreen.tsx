import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ✅ Updated import for bottom tab navigation
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../../App'; // Updated type import

// ✅ Import your centralized API configuration
import { getApiConfig, getBaseURL } from '../../config/api';
// ✅ Import AuthContext for logout
import { useAuth } from '../../context/AuthContext';

// Modern Color Palette
const COLORS = {
  primary: '#4A7C4F',
  primaryLight: '#6B9B6F',
  background: '#FAFCFA',
  surface: '#FFFFFF',
  textPrimary: '#1A1F1A',
  textSecondary: '#5F6B5F',
  textTertiary: '#9CA59C',
  success: '#4A7C4F',
  warning: '#D4941E',
  error: '#D84315',
  shadow: 'rgba(26, 31, 26, 0.08)',
};

// ✅ Replace hardcoded URL with centralized config
const API_BASE_URL = getBaseURL(); // Gets current environment's baseURL

// ✅ Updated type for bottom tab navigation
type Props = BottomTabScreenProps<TabParamList, 'Dashboard'>;

interface SellerData {
  id: number;
  name: string;
  shop_name: string;
  phone: string;
  email: string;
}

interface AnalyticsData {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  new_orders_count: number;
  unread_notifications_count: number;
}

export default function DashboardScreen({ navigation }: Props) {
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Use AuthContext for logout
  const { logout: contextLogout } = useAuth();

  useEffect(() => {
    loadDashboardData();
    
    // ✅ Log current API configuration on screen load
    const config = getApiConfig();
    console.log('🔧 Dashboard Screen API Configuration:', {
      baseURL: config.baseURL,
      timeout: config.timeout,
      debug: config.debug,
    });
  }, []);

  const loadDashboardData = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (!accessToken) {
        Alert.alert('Authentication Error', 'Please login again');
        await handleLogout();
        return;
      }

      console.log('📊 Fetching dashboard data:', {
        endpoint: `${API_BASE_URL}/user/dashboard/`,
        environment: getApiConfig().debug ? 'Development' : 'Production'
      });

      // ✅ Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), getApiConfig().timeout);
      
      const response = await fetch(`${API_BASE_URL}/user/dashboard/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        signal: controller.signal, // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      console.log('📡 Dashboard Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dashboard Data loaded:', {
          seller: data.seller?.name,
          shopName: data.seller?.shop_name,
          revenue: data.analytics?.total_revenue,
          orders: data.analytics?.total_orders,
        });
        
        setSeller(data.seller);
        setAnalytics(data.analytics);
      } else if (response.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        await handleLogout();
      } else {
        const errorText = await response.text();
        console.error('Dashboard error response:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Dashboard Error:', error);
      
      let errorMessage = 'Failed to load dashboard data';
      
      if (error.name === 'AbortError') {
        errorMessage = `Connection timeout after ${getApiConfig().timeout}ms. Please try again.`;
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Cannot connect to server. Check your network connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Dashboard Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // ✅ Updated handleLogout to use AuthContext
  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out seller...');
      await contextLogout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Logout Error', 'Failed to logout properly. Please try again.');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: handleLogout, style: 'destructive' }
      ]
    );
  };

  // ✅ Test Connection Function (for debugging - development only)
  const testConnection = async () => {
    if (!getApiConfig().debug) return; // Only in development
    
    try {
      console.log('🔍 Testing dashboard connection...');
      
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('No Token', 'Please login first');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/test-auth/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        Alert.alert('Connection Test ✅', 'Dashboard API connection successful!');
      } else {
        Alert.alert('Connection Issue', `Status: ${response.status}`);
      }
    } catch (error: any) {
      Alert.alert('Connection Failed ❌', error.message || 'Cannot reach server');
    }
  };

  // ✅ Navigation handlers for bottom tabs
  const navigateToProducts = () => {
    navigation.navigate('Products');
  };

  const navigateToOrders = () => {
    navigation.navigate('Orders');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
        {/* ✅ Show current environment while loading (development only) */}
        {getApiConfig().debug && (
          <Text style={styles.debugText}>
            Environment: {getApiConfig().debug ? 'Development' : 'Production'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.background, COLORS.surface]}
          style={styles.backgroundGradient}
        />

        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Simplified for bottom tab navigation */}
          <View style={styles.header}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.sellerName}>{seller?.name || 'Seller'}</Text>
              <Text style={styles.shopName}>🏪 {seller?.shop_name || 'Your Shop'}</Text>
              {/* ✅ Show API info for debugging (development only) */}
              {getApiConfig().debug && (
                <Text style={styles.apiDebugText}>
                  API: {API_BASE_URL.replace('http://', '').replace('https://', '')}
                </Text>
              )}
            </View>
            
            {/* ✅ Simplified header actions (logout moved to More tab) */}
            <View style={styles.headerActions}>
              {/* ✅ Connection Test Button (development only) */}
              {getApiConfig().debug && (
                <TouchableOpacity 
                  style={styles.testButton}
                  onPress={testConnection}
                >
                  <Text style={styles.testButtonText}>🔍</Text>
                </TouchableOpacity>
              )}
              
              {/* ✅ Notification bell */}
              <TouchableOpacity style={styles.notificationButton}>
                <Text style={styles.notificationText}>🔔</Text>
                {analytics && analytics.unread_notifications_count > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {analytics.unread_notifications_count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Analytics Cards */}
          {analytics && (
            <View style={styles.analyticsSection}>
              <Text style={styles.sectionTitle}>Business Overview</Text>
              
              <View style={styles.cardRow}>
                <View style={[styles.analyticsCard, styles.revenueCard]}>
                  <Text style={styles.cardValue}>₹{analytics.total_revenue || 0}</Text>
                  <Text style={styles.cardLabel}>Total Revenue</Text>
                </View>
                
                <View style={[styles.analyticsCard, styles.ordersCard]}>
                  <Text style={styles.cardValue}>{analytics.total_orders || 0}</Text>
                  <Text style={styles.cardLabel}>Total Orders</Text>
                </View>
              </View>

              <View style={styles.cardRow}>
                <View style={[styles.analyticsCard, styles.productsCard]}>
                  <Text style={styles.cardValue}>{analytics.total_products || 0}</Text>
                  <Text style={styles.cardLabel}>Products</Text>
                </View>
                
                <View style={[styles.analyticsCard, styles.newOrdersCard]}>
                  <Text style={styles.cardValue}>{analytics.new_orders_count || 0}</Text>
                  <Text style={styles.cardLabel}>New Orders</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions - Updated with navigation */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToProducts}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>📦 Manage Products</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToOrders}
            >
              <LinearGradient
                colors={[COLORS.warning, '#E6A832']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>📋 View Orders</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'Analytics feature coming soon!')}
            >
              <LinearGradient
                colors={[COLORS.success, '#5A8B63']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>📈 View Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Seller Info */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{seller?.phone || 'N/A'}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{seller?.email || 'N/A'}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Seller ID:</Text>
                <Text style={styles.infoValue}>#{seller?.id || 'N/A'}</Text>
              </View>

              {/* ✅ Show environment info (development only) */}
              {getApiConfig().debug && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Environment:</Text>
                  <Text style={[styles.infoValue, styles.debugValue]}>
                    {getApiConfig().debug ? 'Development' : 'Production'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Layout Styles
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 20, // ✅ Reduced since tabs handle navigation now
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  debugText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sellerName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  shopName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  apiDebugText: {
    fontSize: 9,
    color: COLORS.textTertiary,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Header Actions
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: 'rgba(74, 124, 79, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationText: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '600',
  },

  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  // Analytics Styles
  analyticsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  ordersCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  productsCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  newOrdersCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Actions Styles
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },

  // Info Styles
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 124, 79, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  debugValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
});
