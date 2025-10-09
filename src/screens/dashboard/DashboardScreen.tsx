import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Share,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../services/AuthService';
import StoreService from '../../services/StoreService';
import DashboardService from '../../services/DashboardService';
import SubscriptionService from '../../services/SubscriptionService';
import { ApiError } from '../../types/api';

type DashboardScreenProps = {
  navigation: StackNavigationProp<any>;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔍 Fetching dashboard data from Django...');
      
      // Try to fetch dashboard data
      let dashboardResponse = null;
      try {
        dashboardResponse = await DashboardService.getDashboard();
        console.log('✅ Dashboard API response:', JSON.stringify(dashboardResponse.data, null, 2));
      } catch (dashError) {
        console.log('⚠️ Dashboard API failed:', dashError.response?.data || dashError.message);
      }

      // Fetch store profile data
      let storeResponse = null;
      try {
        storeResponse = await StoreService.getProfile();
        console.log('✅ Store Profile API response:', JSON.stringify(storeResponse.data, null, 2));
      } catch (storeError) {
        console.log('⚠️ Store Profile API failed:', storeError.response?.data || storeError.message);
      }

      // Fetch subscription info
      let subscriptionResponse = null;
      try {
        subscriptionResponse = await SubscriptionService.getCurrentSubscription();
        console.log('✅ Subscription API response:', JSON.stringify(subscriptionResponse.data, null, 2));
      } catch (subError: any) {
        console.log('⚠️ Subscription API failed (normal if no subscription):', subError.response?.status);
      }

      // Set dashboard data from the actual response
      if (dashboardResponse?.data) {
        setDashboardData(dashboardResponse.data);
        console.log('✅ Dashboard data set:', dashboardResponse.data);
      }

      // Set store data from the actual response
      if (storeResponse?.data) {
        setStoreData(storeResponse.data.store_profile || storeResponse.data);
        console.log('✅ Store data set:', storeResponse.data.store_profile || storeResponse.data);
      }

      // Set subscription data
      if (subscriptionResponse?.data) {
        setSubscriptionInfo(subscriptionResponse.data);
        console.log('✅ Subscription data set:', subscriptionResponse.data);
      } else {
        setSubscriptionInfo(null);
      }

    } catch (error) {
      console.error('❌ Failed to fetch data:', error);
      const apiError = error as ApiError;
      
      if (apiError.message?.includes('401')) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => handleLogout() }
        ]);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = (): void => {
    setRefreshing(true);
    setError('');
    fetchDashboardData();
  };

  const handleLogout = async (): Promise<void> => {
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
              console.log('🚪 User confirmed logout');
              await AuthService.logout();
              console.log('✅ Logout completed successfully');
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert(
                'Logout Error', 
                'There was an issue logging out. Your session has been cleared locally.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const generateShopUrl = (): string => {
    const baseUrl = 'https://keralasellers.com';
    
    if (storeData && storeData.name) {
      const shopName = storeData.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      const sellerPhone = dashboardData?.seller?.phone || storeData?.seller?.phone || 'store';
      return `${baseUrl}/shop/${shopName}?id=${sellerPhone}`;
    }
    
    return `${baseUrl}/shop`;
  };

  const copyStoreLink = async (): Promise<void> => {
    const url = generateShopUrl();
    try {
      await Share.share({
        message: `Check out my Kerala store: ${url}`,
        url: url,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share store link');
    }
  };

  const visitStore = (): void => {
    const url = generateShopUrl();
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open store link');
    });
  };

  const navigateToCreateShop = (): void => {
    navigation.navigate('CreateShop');
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your Kerala Sellers dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>🔄 Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Extract real data from your Django responses
  const sellerName = dashboardData?.seller?.name || storeData?.name || 'Kerala Seller';
  const hasStoreProfile = dashboardData?.has_store_profile || (storeData && storeData.name);
  
  // Extract analytics data (use real data if available, otherwise show 0)
  const analytics = dashboardData?.analytics || {};
  const totalRevenue = analytics.total_revenue || 0;
  const totalOrders = analytics.total_orders || 0;
  const totalProducts = analytics.total_products || 0;
  const newOrders = analytics.new_orders_count || 0;
  const topProducts = analytics.top_selling_products || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {hasStoreProfile ? (
        <>
          {/* Real Statistics Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <View style={styles.statContent}>
                <Text style={styles.statTitle}>Total Revenue</Text>
                <Text style={styles.statValue}>
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🛒</Text>
              <View style={styles.statContent}>
                <Text style={styles.statTitle}>Total Orders</Text>
                <Text style={styles.statValue}>{totalOrders}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📦</Text>
              <View style={styles.statContent}>
                <Text style={styles.statTitle}>Total Products</Text>
                <Text style={styles.statValue}>{totalProducts}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔔</Text>
              <View style={styles.statContent}>
                <Text style={styles.statTitle}>New Orders</Text>
                <Text style={styles.statValue}>{newOrders}</Text>
              </View>
            </View>
          </View>

          {/* Subscription Status Card */}
          {subscriptionInfo && subscriptionInfo.is_active && (
            <View style={styles.subscriptionCard}>
              <Text style={styles.subscriptionIcon}>👑</Text>
              <View style={styles.subscriptionContent}>
                <Text style={styles.subscriptionTitle}>
                  {subscriptionInfo.plan.name} Plan Active
                </Text>
                <Text style={styles.subscriptionDetails}>
                  {subscriptionInfo.days_remaining} days remaining • {subscriptionInfo.plan.product_limit || 'Unlimited'} products
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.subscriptionButton}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.subscriptionButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          )}

          {(!subscriptionInfo || !subscriptionInfo.is_active) && (
            <View style={styles.subscriptionWarning}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Get Subscription to Sell Online</Text>
                <Text style={styles.warningText}>Unlock online selling features</Text>
              </View>
              <TouchableOpacity 
                style={styles.getSubscriptionButton}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.getSubscriptionButtonText}>Get Plan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Store Link Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌐 Your Public Storefront</Text>
            <Text style={styles.cardDescription}>
              Share this link with your customers to showcase your products across Kerala and beyond.
            </Text>
            
            <View style={styles.linkBox}>
              <Text style={styles.urlLabel}>Your Store URL:</Text>
              <Text style={styles.storeUrl}>{generateShopUrl()}</Text>
              
              <View style={styles.linkActions}>
                <TouchableOpacity style={styles.shareButton} onPress={copyStoreLink}>
                  <Text style={styles.buttonText}>📱 Share Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.visitButton} onPress={visitStore}>
                  <Text style={styles.buttonText}>🔗 Visit Store</Text>
                </TouchableOpacity>
              </View>
            </View>

            {storeData && storeData.name && (
              <View style={styles.seoInfo}>
                <Text style={styles.seoTag}>✅ SEO Optimized</Text>
                <Text style={styles.seoDescription}>
                  Your store: "{storeData.name}"
                </Text>
              </View>
            )}
          </View>

          {/* Top Products */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Top Selling Products</Text>
            
            {topProducts.length > 0 ? (
              <View style={styles.productsList}>
                {topProducts.slice(0, 5).map((item: any, index: number) => (
                  <View key={index} style={styles.productItem}>
                    <View style={styles.productRank}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.product__name}</Text>
                      <Text style={styles.productSales}>{item.total_sold} sold</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>No sales data yet</Text>
                <Text style={styles.emptyHint}>
                  Start adding products and sharing your store link to see analytics!
                </Text>
              </View>
            )}
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.quickActionIcon}>➕</Text>
                <Text style={styles.quickActionText}>Add Product</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.quickActionIcon}>📦</Text>
                <Text style={styles.quickActionText}>View Products</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Orders')}
              >
                <Text style={styles.quickActionIcon}>🛒</Text>
                <Text style={styles.quickActionText}>View Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Billing')}
              >
                <Text style={styles.quickActionIcon}>🧾</Text>
                <Text style={styles.quickActionText}>Local Billing</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('History')}
              >
                <Text style={styles.quickActionIcon}>📊</Text>
                <Text style={styles.quickActionText}>Stock History</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard} 
                onPress={navigateToCreateShop}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionIcon}>⚙️</Text>
                <Text style={styles.quickActionText}>Store Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.quickActionIcon}>👑</Text>
                <Text style={styles.quickActionText}>Subscription</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard} 
                activeOpacity={0.7}
                onPress={() => Alert.alert('Coming Soon!', 'Analytics feature will be available soon.')}
              >
                <Text style={styles.quickActionIcon}>📊</Text>
                <Text style={styles.quickActionText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        /* Setup Store Prompt */
        <View style={styles.setupCard}>
          <Text style={styles.setupIcon}>🏪</Text>
          <Text style={styles.setupTitle}>Your Kerala store is not yet active!</Text>
          <Text style={styles.setupDescription}>
            Complete your store setup to start selling and make your shop visible to customers across Kerala and India.
          </Text>
          
          <TouchableOpacity 
            style={styles.setupButton} 
            onPress={navigateToCreateShop}
            activeOpacity={0.8}
          >
            <Text style={styles.setupButtonText}>⚙️ Setup Your Store Now</Text>
          </TouchableOpacity>
          
          <View style={styles.setupBenefits}>
            <Text style={styles.benefit}>✅ Zero commission fees</Text>
            <Text style={styles.benefit}>✅ Reach customers across Kerala</Text>
            <Text style={styles.benefit}>✅ SEO-optimized shop pages</Text>
            <Text style={styles.benefit}>✅ Easy product management</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  // ... keep all your other existing styles
  // (subscriptionCard, card, quickActions, etc.)
  
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subscriptionContent: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subscriptionDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  subscriptionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subscriptionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subscriptionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fefce8',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#a16207',
  },
  getSubscriptionButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  getSubscriptionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  linkBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  urlLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  storeUrl: {
    fontSize: 14,
    color: '#374151',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  visitButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  seoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 12,
  },
  seoTag: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  seoDescription: {
    flex: 1,
    fontSize: 12,
    color: '#047857',
  },
  productsList: {
    gap: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  productRank: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  productSales: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  setupCard: {
    backgroundColor: '#fefce8',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#facc15',
    alignItems: 'center',
  },
  setupIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 16,
  },
  setupDescription: {
    fontSize: 16,
    color: '#a16207',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  setupButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setupBenefits: {
    gap: 12,
    alignItems: 'center',
  },
  benefit: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
});

export default DashboardScreen;
