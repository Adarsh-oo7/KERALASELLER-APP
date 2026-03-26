import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Linking, Share, Image, Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/ApiClient';
import AuthService from '../../services/AuthService';

const { width: SW } = Dimensions.get('window');
const CARD_GAP = 10;
const H_PAD = 16;
const STAT_W = (SW - H_PAD * 2 - CARD_GAP) / 2;
const ACTION_W = (SW - H_PAD * 2 - CARD_GAP * 3) / 4;

type DashboardScreenProps = { navigation: StackNavigationProp<any> };

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [timeoutError, setTimeoutError] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError('');
      setTimeoutError(false);
      const [storeRes, ordersRes, productsRes, subRes] = await Promise.allSettled([
        apiClient.get('/user/store/profile/'),
        apiClient.get('/user/orders/'),
        apiClient.get('/api/products/'),
        apiClient.get('/api/subscriptions/status/'),
      ]);

      if (storeRes.status === 'fulfilled') {
        const d = storeRes.value?.data?.store_profile || storeRes.value?.data || {};
        if (Object.keys(d).length > 0) setStoreData(d);
      } else if (storeRes.reason?.message?.includes('timeout')) {
        setTimeoutError(true);
      }

      if (ordersRes.status === 'fulfilled' && productsRes.status === 'fulfilled') {
        const ordersRaw = ordersRes.value?.data;
        const productsRaw = productsRes.value?.data;
        const orders = Array.isArray(ordersRaw?.results) ? ordersRaw.results : Array.isArray(ordersRaw) ? ordersRaw : [];
        const products = Array.isArray(productsRaw?.results) ? productsRaw.results : Array.isArray(productsRaw) ? productsRaw : [];
        const totalRevenue = orders.reduce((s: number, o: any) => o.status === 'DELIVERED' ? s + (parseFloat(o.total_amount) || 0) : s, 0);
        const topProducts = [...products]
          .sort((a: any, b: any) => (b.sold_count || 0) - (a.sold_count || 0))
          .slice(0, 3)
          .map((p: any, i: number) => ({ id: p.id, name: p.name || 'Unnamed', sold: p.sold_count || 0, rank: i + 1 }));
        setDashboardData({
          analytics: {
            total_revenue: totalRevenue,
            total_orders: orders.length,
            total_products: products.length,
            new_orders_count: orders.filter((o: any) => o.status === 'PENDING').length,
            top_selling_products: topProducts,
          }
        });
      }

      if (subRes.status === 'fulfilled') {
        setSubscriptionInfo(subRes.value?.data || {});
      } else {
        setSubscriptionInfo(null);
      }
    } catch (e: any) {
      if (e.message?.includes('timeout')) { setTimeoutError(true); setError('Request timed out'); }
      else if (e.message?.includes('401')) { setError('Session expired'); }
      else setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError('');
    setTimeoutError(false);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { try { await AuthService.logout(); } catch {} } }
    ]);
  };

  const generateShopUrl = () => {
    if (!storeData?.name) return 'https://keralasellers.com/shop';
    const slug = storeData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    const id = storeData.seller?.id || storeData.id || 'store';
    return `https://keralasellers.com/shop/${slug}?id=${id}`;
  };

  const shareStore = async () => {
    const url = generateShopUrl();
    try { await Share.share({ message: `Check out my Kerala Sellers store: ${url}`, url }); }
    catch { Alert.alert('Error', 'Failed to share'); }
  };

  const visitStore = () => Linking.openURL(generateShopUrl()).catch(() => Alert.alert('Error', 'Could not open link'));

  const hasStore = useMemo(() => Boolean(storeData?.name), [storeData]);
  const analytics = useMemo(() => dashboardData?.analytics || {}, [dashboardData]);
  const totalRevenue = analytics.total_revenue || 0;
  const totalOrders = analytics.total_orders || 0;
  const totalProducts = analytics.total_products || 0;
  const newOrders = analytics.new_orders_count || 0;
  const topProducts = analytics.top_selling_products || [];
  const hasActiveSub = subscriptionInfo?.is_active === true || subscriptionInfo?.has_subscription === true;
  const expiringSoon = hasActiveSub && (subscriptionInfo?.days_remaining || 0) <= 7;

  const QUICK_ACTIONS = [
    { icon: 'add-circle-outline' as const, label: 'Add\nProduct', screen: 'AddProduct', color: '#3b82f6' },
    { icon: 'cube-outline' as const, label: 'Products', screen: 'Products', color: '#8b5cf6' },
    { icon: 'bag-handle-outline' as const, label: 'Orders', screen: 'Orders', color: '#f59e0b' },
    { icon: 'receipt-outline' as const, label: 'Billing', screen: 'Billing', color: '#10b981' },
    { icon: 'time-outline' as const, label: 'History', screen: 'History', color: '#6b7280' },
    { icon: 'settings-outline' as const, label: 'Settings', screen: 'CreateShop', color: '#64748b' },
    { icon: 'star-outline' as const, label: 'Subscription', screen: 'Subscription', color: '#f59e0b' },
    { icon: 'bar-chart-outline' as const, label: 'Analytics', screen: null, color: '#3b82f6' },
  ];

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading && !refreshing) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={s.loadingText}>Loading dashboard...</Text>
    </View>
  );

  // ── Error / Timeout ───────────────────────────────────────────
  if ((timeoutError || error) && !hasStore) return (
    <View style={s.centered}>
      <View style={s.errorIconWrap}>
        <Ionicons name={timeoutError ? 'time-outline' : 'cloud-offline-outline'} size={36} color="#dc2626" />
      </View>
      <Text style={s.errorTitle}>{timeoutError ? 'Request Timeout' : 'Connection Error'}</Text>
      <Text style={s.errorMsg}>{timeoutError ? 'Server is slow. Check your connection.' : error}</Text>
      <View style={s.errorBtns}>
        <TouchableOpacity style={s.retryBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={16} color="white" />
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        {timeoutError && (
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: '#6b7280' }]} onPress={() => setTimeoutError(false)}>
            <Text style={s.retryBtnText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── Setup needed ──────────────────────────────────────────────
  if (!hasStore) return (
    <ScrollView style={s.screen} contentContainerStyle={s.setupScroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={s.setupCard}>
        <View style={s.setupIconWrap}>
          <Text style={{ fontSize: 40 }}>🏪</Text>
        </View>
        <Text style={s.setupTitle}>Set up your store</Text>
        <Text style={s.setupDesc}>Complete your store profile to start selling to customers across Kerala.</Text>
        <TouchableOpacity style={s.setupBtn} onPress={() => navigation.navigate('CreateShop')}>
          <Ionicons name="storefront-outline" size={18} color="white" />
          <Text style={s.setupBtnText}>Setup Store Now</Text>
        </TouchableOpacity>
        <View style={s.benefitsList}>
          {['Zero commission fees', 'Reach customers across Kerala', 'SEO-optimized shop page', 'Easy product management'].map(b => (
            <View key={b} style={s.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={s.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // ── Main Dashboard ────────────────────────────────────────────
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      showsVerticalScrollIndicator={false}
    >

      {/* Timeout Banner */}
      {timeoutError && (
        <View style={s.banner}>
          <Ionicons name="time-outline" size={14} color="#92400e" />
          <Text style={s.bannerText}>Some data may be outdated</Text>
          <TouchableOpacity onPress={() => setTimeoutError(false)}>
            <Ionicons name="close" size={16} color="#92400e" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Store Header ── */}
      <View style={s.storeHeader}>
        <View style={s.storeHeaderLeft}>
          {storeData?.logo_url ? (
            <Image source={{ uri: storeData.logo_url }} style={s.storeLogo} />
          ) : (
            <View style={s.storeLogoPlaceholder}>
              <Ionicons name="storefront" size={24} color="#3b82f6" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.storeName} numberOfLines={1}>{storeData?.name}</Text>
            {storeData?.tagline
              ? <Text style={s.storeTagline} numberOfLines={1}>{storeData.tagline}</Text>
              : <Text style={s.storeTagline}>Kerala Sellers</Text>
            }
          </View>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* ── Stat Cards 2×2 Grid ── */}
      <View style={s.statsGrid}>
        {[
          { label: 'Revenue', value: `₹${totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + 'k' : totalRevenue.toLocaleString('en-IN')}`, icon: 'cash-outline' as const, color: '#059669', bg: '#f0fdf4' },
          { label: 'Orders', value: totalOrders.toString(), icon: 'bag-handle-outline' as const, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Products', value: totalProducts.toString(), icon: 'cube-outline' as const, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Pending', value: newOrders.toString(), icon: 'notifications-outline' as const, color: '#f59e0b', bg: '#fffbeb' },
        ].map((stat, i) => (
          <View key={i} style={[s.statCard, { width: STAT_W, backgroundColor: stat.bg }]}>
            <View style={[s.statIconWrap, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Subscription Card ── */}
      {hasActiveSub ? (
        <View style={[s.subCard, expiringSoon && s.subCardWarn]}>
          <View style={[s.subIconWrap, { backgroundColor: expiringSoon ? '#fef3c7' : '#eff6ff' }]}>
            <Ionicons name={expiringSoon ? 'warning-outline' : 'star'} size={20} color={expiringSoon ? '#d97706' : '#3b82f6'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subTitle}>{subscriptionInfo?.plan_name || 'Premium'} Plan</Text>
            <Text style={s.subDetails}>
              {subscriptionInfo?.days_remaining || 0} days left · {subscriptionInfo?.product_limit || '∞'} products
            </Text>
            {expiringSoon && <Text style={s.subWarnText}>Renew soon to avoid interruption</Text>}
          </View>
          <TouchableOpacity style={[s.subBtn, expiringSoon && s.subBtnWarn]} onPress={() => navigation.navigate('Subscription')}>
            <Text style={s.subBtnText}>{expiringSoon ? 'Renew' : 'Manage'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={s.subCardNoSub} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
          <View style={s.subIconWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.subTitle}>No Active Subscription</Text>
            <Text style={s.subDetails}>Subscribe to start selling online</Text>
          </View>
          <View style={[s.subBtn, { backgroundColor: '#f59e0b' }]}>
            <Text style={s.subBtnText}>Get Plan</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Quick Actions ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={s.actionCard}
              activeOpacity={0.75}
              onPress={() => a.screen ? navigation.navigate(a.screen) : Alert.alert('Coming Soon!', `${a.label.replace('\n', ' ')} will be available soon.`)}
            >
              <View style={[s.actionIconWrap, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Store Link ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Your Storefront</Text>
        <View style={s.storeCard}>
          <View style={s.urlRow}>
            <Ionicons name="link-outline" size={14} color="#6b7280" />
            <Text style={s.urlText} numberOfLines={1} ellipsizeMode="middle">{generateShopUrl()}</Text>
          </View>
          <View style={s.storeLinkBtns}>
            <TouchableOpacity style={s.shareLinkBtn} onPress={shareStore}>
              <Ionicons name="share-social-outline" size={16} color="white" />
              <Text style={s.linkBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.visitLinkBtn} onPress={visitStore}>
              <Ionicons name="open-outline" size={16} color="white" />
              <Text style={s.linkBtnText}>Visit</Text>
            </TouchableOpacity>
          </View>
          <View style={s.seoBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#059669" />
            <Text style={s.seoBadgeText}>SEO Optimized · {storeData?.name}</Text>
          </View>
        </View>
      </View>

      {/* ── Top Products ── */}
      <View style={[s.section, { marginBottom: 32 }]}>
        <Text style={s.sectionTitle}>Top Products</Text>
        {topProducts.length > 0 ? (
          <View style={s.topProductsCard}>
            {topProducts.map((item: any, idx: number) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <View key={item.id} style={[s.topRow, idx < topProducts.length - 1 && s.topRowBorder]}>
                  <Text style={s.topMedal}>{medals[idx]}</Text>
                  <Text style={s.topName} numberOfLines={1}>{item.name}</Text>
                  <View style={s.topSoldWrap}>
                    <Text style={s.topSold}>{item.sold}</Text>
                    <Text style={s.topSoldLabel}> sold</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Ionicons name="bar-chart-outline" size={32} color="#d1d5db" />
            <Text style={s.emptyTitle}>No sales data yet</Text>
            <Text style={s.emptyDesc}>Add products and share your store link to start selling</Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollContent: { paddingBottom: 24 },
  setupScroll: { flexGrow: 1, justifyContent: 'center', padding: H_PAD },

  // Loading / Error
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 24, backgroundColor: '#f1f5f9' },
  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  errorIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  errorMsg: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  errorBtns: { flexDirection: 'row', gap: 10 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },

  // Banner
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', paddingHorizontal: H_PAD, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  bannerText: { flex: 1, fontSize: 12, color: '#92400e', fontWeight: '500' },

  // Store Header
  storeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: H_PAD, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  storeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  storeLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f3f4f6' },
  storeLogoPlaceholder: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  storeName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  storeTagline: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  logoutBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, paddingHorizontal: H_PAD, paddingTop: 14, paddingBottom: 4 },
  statCard: { borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Subscription
  subCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#eff6ff', marginHorizontal: H_PAD, marginTop: 14, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#bfdbfe' },
  subCardWarn: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  subCardNoSub: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fffbeb', marginHorizontal: H_PAD, marginTop: 14, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#fde68a' },
  subIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff' },
  subTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  subDetails: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  subWarnText: { fontSize: 11, color: '#dc2626', fontWeight: '600', marginTop: 3 },
  subBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  subBtnWarn: { backgroundColor: '#f59e0b' },
  subBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },

  // Section
  section: { paddingHorizontal: H_PAD, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 10 },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  actionCard: { width: ACTION_W, backgroundColor: 'white', borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center', lineHeight: 14 },

  // Store Link
  storeCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  urlText: { flex: 1, fontSize: 12, color: '#374151', fontFamily: 'monospace' },
  storeLinkBtns: { flexDirection: 'row', gap: 10 },
  shareLinkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#3b82f6', padding: 11, borderRadius: 8 },
  visitLinkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#059669', padding: 11, borderRadius: 8 },
  linkBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  seoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  seoBadgeText: { fontSize: 11, color: '#059669', fontWeight: '600' },

  // Top Products
  topProductsCard: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  topRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  topMedal: { fontSize: 20 },
  topName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  topSoldWrap: { flexDirection: 'row', alignItems: 'baseline' },
  topSold: { fontSize: 15, fontWeight: '800', color: '#3b82f6' },
  topSoldLabel: { fontSize: 11, color: '#9ca3af' },
  emptyCard: { backgroundColor: 'white', borderRadius: 12, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },

  // Setup
  setupCard: { backgroundColor: 'white', borderRadius: 16, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  setupIconWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fde68a' },
  setupTitle: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  setupDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  setupBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 10, marginTop: 4 },
  setupBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  benefitsList: { gap: 8, width: '100%', marginTop: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 13, color: '#374151', fontWeight: '500' },
});

export default DashboardScreen;
