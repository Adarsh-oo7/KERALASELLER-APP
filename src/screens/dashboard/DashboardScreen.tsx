import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Linking, Share, Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/ApiClient';
import AuthService from '../../services/AuthService';

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
      console.log('🔍 Fetching dashboard data...');
      
      // ✅ Parallel API calls for better performance
      const [dashboardResponse, storeResponse, subscriptionResponse] = await Promise.allSettled([
        apiClient.get('/api/seller/dashboard/'),
        apiClient.get('/user/store/profile/'),
        apiClient.get('/api/subscription/current/'),
      ]);

      // Dashboard data
      if (dashboardResponse.status === 'fulfilled') {
        setDashboardData(dashboardResponse.value.data);
        console.log('✅ Dashboard data loaded');
      }

      // Store data
      if (storeResponse.status === 'fulfilled') {
        setStoreData(storeResponse.value.data.store_profile || storeResponse.value.data);
        console.log('✅ Store data loaded');
      }

      // Subscription data
      if (subscriptionResponse.status === 'fulfilled') {
        setSubscriptionInfo(subscriptionResponse.value.data);
        console.log('✅ Subscription data loaded');
      } else {
        setSubscriptionInfo(null);
      }

    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      
      if (error.response?.status === 401) {
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
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              console.log('✅ Logout successful');
            } catch (error) {
              console.error('❌ Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const generateShopUrl = (): string => {
    const baseUrl = 'https://keralasellers.com';
    
    if (storeData?.name) {
      const shopSlug = storeData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      const sellerId = storeData.seller?.id || dashboardData?.seller?.id || 'store';
      return `${baseUrl}/shop/${shopSlug}?id=${sellerId}`;
    }
    
    return `${baseUrl}/shop`;
  };

  const copyStoreLink = async (): Promise<void> => {
    const url = generateShopUrl();
    try {
      await Share.share({
        message: `Check out my Kerala Sellers store: ${url}`,
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

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Kerala Sellers dashboard...</Text>
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

  // ✅ Extract data with fallbacks
  const hasStoreProfile = Boolean(storeData?.name);
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {hasStoreProfile ? (
        <>
          {/* ✅ Welcome Header with Store Info */}
          {storeData?.logo_url && (
            <View style={styles.storeHeader}>
              <Image 
                source={{ uri: storeData.logo_url }} 
                style={styles.storeLogo}
                resizeMode="cover"
              />
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{storeData.name}</Text>
                {storeData.tagline && (
                  <Text style={styles.storeTagline}>{storeData.tagline}</Text>
                )}
              </View>
            </View>
          )}

          {/* ✅ Statistics Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <View style={styles.statContent}>
                <Text style={styles.statTitle}>Total Revenue</Text>
                <Text style={styles.statValue}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
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

          {/* ✅ Subscription Status */}
          {subscriptionInfo?.is_active ? (
            <View style={styles.subscriptionCard}>
              <Text style={styles.subscriptionIcon}>👑</Text>
              <View style={styles.subscriptionContent}>
                <Text style={styles.subscriptionTitle}>
                  {subscriptionInfo.plan.name} Plan Active
                </Text>
                <Text style={styles.subscriptionDetails}>
                  {subscriptionInfo.days_remaining} days left • {subscriptionInfo.plan.product_limit || 'Unlimited'} products
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.subscriptionButton}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.subscriptionButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          ) : (
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

          {/* ✅ Store Link Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌐 Your Public Storefront</Text>
            <Text style={styles.cardDescription}>
              Share this link with customers across Kerala and beyond.
            </Text>
            
            <View style={styles.linkBox}>
              <Text style={styles.urlLabel}>Your Store URL:</Text>
              <Text style={styles.storeUrl} numberOfLines={1} ellipsizeMode="middle">
                {generateShopUrl()}
              </Text>
              
              <View style={styles.linkActions}>
                <TouchableOpacity style={styles.shareButton} onPress={copyStoreLink}>
                  <Ionicons name="share-social" size={18} color="white" />
                  <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.visitButton} onPress={visitStore}>
                  <Ionicons name="open-outline" size={18} color="white" />
                  <Text style={styles.buttonText}>Visit</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.seoInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.seoTag}>SEO Optimized</Text>
              <Text style={styles.seoDescription}>"{storeData.name}"</Text>
            </View>
          </View>

          {/* ✅ Top Products */}
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
                  Start adding products and share your store link!
                </Text>
              </View>
            )}
          </View>
          
          {/* ✅ Quick Actions Grid */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsGrid}>
              {[
                { icon: '➕', text: 'Add Product', screen: 'AddProduct' },
                { icon: '📦', text: 'Products', screen: 'Products' },
                { icon: '🛒', text: 'Orders', screen: 'Orders' },
                { icon: '🧾', text: 'Billing', screen: 'Billing' },
                { icon: '📊', text: 'History', screen: 'History' },
                { icon: '⚙️', text: 'Settings', screen: 'CreateShop' },
                { icon: '👑', text: 'Subscription', screen: 'Subscription' },
                { icon: '📈', text: 'Analytics', screen: null },
              ].map((action, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.quickActionCard} 
                  activeOpacity={0.7}
                  onPress={() => {
                    if (action.screen) {
                      navigation.navigate(action.screen);
                    } else {
                      Alert.alert('Coming Soon!', `${action.text} feature will be available soon.`);
                    }
                  }}
                >
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionText}>{action.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      ) : (
        /* ✅ Setup Store Prompt */
        <View style={styles.setupCard}>
          <Text style={styles.setupIcon}>🏪</Text>
          <Text style={styles.setupTitle}>Your Kerala store is not yet active!</Text>
          <Text style={styles.setupDescription}>
            Complete your store setup to start selling and make your shop visible to customers.
          </Text>
          
          <TouchableOpacity 
            style={styles.setupButton} 
            onPress={() => navigation.navigate('CreateShop')}
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 16 },
  loadingText: { fontSize: 16, color: '#6b7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20, gap: 16 },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },
  errorMessage: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  retryButton: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  // ✅ NEW: Store Header
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  storeTagline: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, gap: 12 },
  statIcon: { fontSize: 24 },
  statContent: { flex: 1 },
  statTitle: { fontSize: 12, color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  
  subscriptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  subscriptionIcon: { fontSize: 24, marginRight: 12 },
  subscriptionContent: { flex: 1 },
  subscriptionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  subscriptionDetails: { fontSize: 14, color: '#6b7280' },
  subscriptionButton: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  subscriptionButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  subscriptionWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#f59e0b' },
  warningIcon: { fontSize: 24, marginRight: 12 },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 16, fontWeight: 'bold', color: '#92400e', marginBottom: 4 },
  warningText: { fontSize: 14, color: '#a16207' },
  getSubscriptionButton: { backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  getSubscriptionButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  card: { backgroundColor: 'white', marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  cardDescription: { fontSize: 14, color: '#6b7280', marginBottom: 16, lineHeight: 20 },
  
  linkBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  urlLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  storeUrl: { fontSize: 14, color: '#374151', backgroundColor: 'white', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', fontFamily: 'monospace', marginBottom: 16 },
  linkActions: { flexDirection: 'row', gap: 12 },
  shareButton: { flex: 1, backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  visitButton: { flex: 1, backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  buttonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  seoInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: '#ecfdf5', borderRadius: 8, borderWidth: 1, borderColor: '#10b981', gap: 8 },
  seoTag: { fontSize: 12, color: '#059669', fontWeight: '600' },
  seoDescription: { flex: 1, fontSize: 12, color: '#047857' },
  
  productsList: { gap: 12 },
  productItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', gap: 16 },
  productRank: { width: 32, height: 32, backgroundColor: '#3b82f6', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  rankText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  productSales: { fontSize: 12, color: '#6b7280' },
  
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  
  quickActionsContainer: { paddingHorizontal: 20, marginBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  quickActionCard: { flex: 1, minWidth: 140, backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, gap: 12 },
  quickActionIcon: { fontSize: 24 },
  quickActionText: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'center' },
  
  setupCard: { backgroundColor: '#fefce8', marginHorizontal: 20, marginTop: 20, padding: 32, borderRadius: 16, borderWidth: 2, borderColor: '#facc15', alignItems: 'center' },
  setupIcon: { fontSize: 64, marginBottom: 20 },
  setupTitle: { fontSize: 20, fontWeight: 'bold', color: '#92400e', textAlign: 'center', marginBottom: 16 },
  setupDescription: { fontSize: 16, color: '#a16207', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  setupButton: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  setupButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  setupBenefits: { gap: 12, alignItems: 'center' },
  benefit: { fontSize: 14, color: '#059669', fontWeight: '500' },
});

export default DashboardScreen;
