import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import OrderService from '../../services/OrderService';
import { ApiError } from '../../types/api';

type Props = { navigation: StackNavigationProp<any> };

interface Order {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  total_amount: string;
  formatted_total?: string;
  status: string;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
  items_count?: number;
  items?: Array<any>;
}

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:    { label: 'Pending',    color: '#f59e0b', bg: '#fffbeb', icon: 'time-outline' },
  PROCESSING: { label: 'Processing', color: '#3b82f6', bg: '#eff6ff', icon: 'refresh-outline' },
  SHIPPED:    { label: 'Shipped',    color: '#8b5cf6', bg: '#f5f3ff', icon: 'car-outline' },
  DELIVERED:  { label: 'Delivered',  color: '#059669', bg: '#f0fdf4', icon: 'checkmark-circle-outline' },
  CANCELLED:  { label: 'Cancelled',  color: '#ef4444', bg: '#fef2f2', icon: 'close-circle-outline' },
};

const timeAgo = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1)  return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatBox = ({ value, label, color, urgent }: { value: number; label: string; color: string; urgent?: boolean }) => (
  <View style={[s.statBox, { borderTopColor: color, borderTopWidth: 3 }]}>
    {urgent && value > 0 && (
      <View style={s.urgentDot} />
    )}
    <Text style={[s.statVal, { color }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const OrderCard = ({ order, onPress }: { order: Order; onPress: () => void }) => {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const amount = order.formatted_total || `₹${parseFloat(order.total_amount).toLocaleString('en-IN')}`;

  return (
    <TouchableOpacity style={s.orderCard} onPress={onPress} activeOpacity={0.75}>
      <View style={s.orderCardTop}>
        <Text style={s.orderId}>KS{order.id}</Text>
        <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[s.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={s.orderCardMid}>
        <View style={s.orderRow}>
          <Ionicons name="person-outline" size={13} color="#9ca3af" />
          <Text style={s.orderCustomer}>{order.customer_name || 'Guest Customer'}</Text>
        </View>
        <Text style={s.orderAmount}>{amount}</Text>
      </View>

      <View style={s.orderCardBot}>
        <View style={s.orderRow}>
          <Ionicons name="location-outline" size={13} color="#9ca3af" />
          <Text style={s.orderMeta}>Kerala</Text>
        </View>
        <Text style={s.orderTime}>{timeAgo(order.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const MetricCard = ({ icon, label, value, color, change }: {
  icon: any; label: string; value: string; color: string; change: string;
}) => (
  <View style={s.metricCard}>
    <View style={[s.metricIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={s.metricValue}>{value}</Text>
    <Text style={s.metricLabel}>{label}</Text>
    <View style={s.metricChange}>
      <Ionicons name="trending-up-outline" size={11} color="#059669" />
      <Text style={s.metricChangeText}>{change}</Text>
    </View>
  </View>
);

const FeatureRow = ({ icon, title, desc, color, active }: {
  icon: any; title: string; desc: string; color: string; active: boolean;
}) => (
  <View style={s.featureRow}>
    <View style={[s.featureIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.featureTitle}>{title}</Text>
      <Text style={s.featureDesc}>{desc}</Text>
    </View>
    <View style={[s.featureBadge, active && s.featureBadgeActive]}>
      <Text style={[s.featureBadgeText, active && s.featureBadgeTextActive]}>
        {active ? 'Active' : 'Soon'}
      </Text>
    </View>
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────

const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const fetch = useCallback(async () => {
    try {
      setError('');
      const res = await OrderService.getOrders();
      const data: Order[] = Array.isArray(res.data)
        ? res.data
        : res.data?.results ?? [];
      setOrders(data);
    } catch (e: any) {
      const err = e as ApiError;
      setError(err.response?.status === 401
        ? 'Session expired. Please login again.'
        : err.message || 'Failed to load orders');
    } finally { setIsLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = () => { setRefreshing(true); fetch(); };

  // Stats
  const stats = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // This month metrics
  const now = new Date();
  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenue = thisMonth.reduce((s, o) => s + parseFloat(o.total_amount || '0'), 0);
  const avgOrder = thisMonth.length ? revenue / thisMonth.length : 0;

  if (isLoading) return (
    <View style={[s.screen, s.centered]}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={s.loadingText}>Loading orders...</Text>
    </View>
  );

  return (
    <View style={s.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >

        {/* ── Page header ── */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderIcon}>
            <Ionicons name="receipt-outline" size={22} color="#3b82f6" />
          </View>
          <View>
            <Text style={s.pageHeaderTitle}>Orders</Text>
            <Text style={s.pageHeaderSub}>{orders.length} total orders</Text>
          </View>
          <TouchableOpacity
            style={s.viewAllBtn}
            onPress={() => navigation.navigate('AllOrders')}
          >
            <Text style={s.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* ── Error banner ── */}
        {!!error && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetch}>
              <Text style={s.errorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Stat boxes ── */}
        <View style={s.statRow}>
          <StatBox value={stats.PENDING    || 0} label="Pending"    color="#f59e0b" urgent />
          <StatBox value={stats.PROCESSING || 0} label="Processing" color="#3b82f6" />
          <StatBox value={stats.DELIVERED  || 0} label="Delivered"  color="#059669" />
          <StatBox value={orders.length}          label="Total"      color="#8b5cf6" />
        </View>

        {/* ── Quick actions ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
              onPress={() => navigation.navigate('AllOrders')}
              activeOpacity={0.8}
            >
              <Ionicons name="list-outline" size={18} color="#3b82f6" />
              <Text style={[s.actionBtnText, { color: '#3b82f6' }]}>All Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
              onPress={() => navigation.navigate('AllOrders', { filter: 'PENDING' })}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={18} color="#059669" />
              <Text style={[s.actionBtnText, { color: '#059669' }]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#fdf4ff', borderColor: '#e9d5ff' }]}
              onPress={() => navigation.navigate('AllOrders', { filter: 'DELIVERED' })}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#8b5cf6" />
              <Text style={[s.actionBtnText, { color: '#8b5cf6' }]}>Delivered</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recent orders ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllOrders')}>
              <Text style={s.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {orders.length > 0 ? (
            orders.slice(0, 4).map(o => (
              <OrderCard
                key={o.id}
                order={o}
                onPress={() => navigation.navigate('OrderDetails', { orderId: o.id })}
              />
            ))
          ) : (
            <View style={s.emptyCard}>
              <View style={s.emptyIcon}>
                <Ionicons name="receipt-outline" size={36} color="#d1d5db" />
              </View>
              <Text style={s.emptyTitle}>No Orders Yet</Text>
              <Text style={s.emptySub}>
                Orders will appear here once customers start purchasing from your store.
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={s.emptyBtnText}>Go to Products</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── This month metrics ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>This Month</Text>
          <View style={s.metricGrid}>
            <MetricCard icon="receipt-outline"   label="Orders"     value={String(thisMonth.length)}                    color="#3b82f6" change="+12%" />
            <MetricCard icon="trending-up-outline" label="Revenue"  value={`₹${revenue.toLocaleString('en-IN')}`}       color="#059669" change="+18%" />
            <MetricCard icon="calculator-outline" label="Avg Order"  value={`₹${Math.round(avgOrder).toLocaleString('en-IN')}`} color="#8b5cf6" change="+5%"  />
            <MetricCard icon="star-outline"       label="Rating"     value="4.8"                                          color="#f59e0b" change="+0.2" />
          </View>
        </View>

        {/* ── Features ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Features</Text>
          <View style={s.featureCard}>
            <FeatureRow icon="notifications-outline" title="Real-time Orders"   desc="Instant alerts when new orders are placed"      color="#3b82f6" active={true}  />
            <View style={s.featureDivider} />
            <FeatureRow icon="analytics-outline"     title="Order Analytics"    desc="Track patterns, peak hours & preferences"       color="#8b5cf6" active={false} />
            <View style={s.featureDivider} />
            <FeatureRow icon="car-outline"           title="Delivery Tracking"  desc="Real-time tracking with customer notifications"  color="#f59e0b" active={false} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#f1f5f9' },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },

  // Page header
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  pageHeaderIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
  },
  pageHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  pageHeaderSub:   { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  viewAllBtn: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  viewAllText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', margin: 14, padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#fecaca',
  },
  errorText:  { flex: 1, fontSize: 13, color: '#dc2626' },
  errorRetry: { fontSize: 13, fontWeight: '700', color: '#dc2626' },

  // Stats
  statRow: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 14, marginTop: 14,
  },
  statBox: {
    flex: 1, backgroundColor: 'white', borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#f3f4f6',
    position: 'relative', overflow: 'hidden',
  },
  urgentDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444',
  },
  statVal:   { fontSize: 22, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', textAlign: 'center' },

  // Section
  section: { marginHorizontal: 14, marginTop: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  seeAll: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },

  // Quick actions
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // Order card
  orderCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6',
  },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontSize: 14, fontWeight: '800', color: '#111827' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  orderCardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderCustomer: { fontSize: 13, fontWeight: '600', color: '#374151' },
  orderAmount: { fontSize: 15, fontWeight: '900', color: '#059669' },
  orderCardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMeta: { fontSize: 12, color: '#9ca3af' },
  orderTime: { fontSize: 11, color: '#d1d5db', fontWeight: '500' },

  // Empty
  emptyCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 32,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#f3f4f6',
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  emptySub:   { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: 'white' },

  // Metrics
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: '48%', backgroundColor: 'white', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#f3f4f6',
  },
  metricIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  metricValue: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 2 },
  metricLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 8 },
  metricChange: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metricChangeText: { fontSize: 11, color: '#059669', fontWeight: '700' },

  // Features
  featureCard: {
    backgroundColor: 'white', borderRadius: 14,
    borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
  },
  featureDivider: { height: 1, backgroundColor: '#f9fafb', marginHorizontal: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  featureDesc:  { fontSize: 12, color: '#9ca3af', lineHeight: 17 },
  featureBadge: {
    backgroundColor: '#eff6ff', paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 6,
  },
  featureBadgeActive:     { backgroundColor: '#f0fdf4' },
  featureBadgeText:       { fontSize: 10, fontWeight: '700', color: '#3b82f6' },
  featureBadgeTextActive: { color: '#059669' },
});

export default OrdersScreen;
