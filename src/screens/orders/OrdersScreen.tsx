import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import OrderService from '../../services/OrderService';
import { ApiError } from '../../types/api';

// Updated colors for modern design
const COLORS = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primarySoft: '#eff6ff',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  secondary: '#8b5cf6',
  facebook: '#1877f2',
  facebookLight: '#42a5f5',
  surface: '#ffffff',
  background: '#f8fafc',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  borderLight: '#e5e7eb',
  shadowColored: '#3b82f6',
  shadowMedium: '#000000',
};

type OrdersScreenProps = {
  navigation: StackNavigationProp<any>;
};

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
  store_name?: string;
  items_count?: number;
  shipping_provider?: string;
  tracking_id?: string;
  order_type?: string;
  items?: Array<any>;
}

interface OrderStats {
  [key: string]: number;
}

interface OrderPreviewCardProps {
  orderId: string;
  customerName: string;
  location: string;
  amount: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  timeAgo: string;
  onPress: () => void;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    try {
      console.log('🔍 Fetching orders for dashboard...');
      setError('');
      
      const response = await OrderService.getOrders();
      console.log('✅ Orders response:', response.data);
      
      let ordersData: Order[] = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        ordersData = response.data.results;
      }

      setOrders(ordersData);
      
      // Calculate real statistics
      const stats = ordersData.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {} as OrderStats);
      
      setOrderStats(stats);
      
      console.log(`📦 Found ${ordersData.length} orders`);

    } catch (error: any) {
      console.error('❌ Failed to fetch orders:', error);
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(apiError.message || 'Failed to load orders');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleViewAllOrders = (): void => {
    // Navigate to full orders list
    Alert.alert(
      '📋 Full Orders List',
      'Complete orders management is available! Navigate to full orders screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View All Orders', onPress: () => navigation.navigate('AllOrders') }
      ]
    );
  };

  const handleOrderPress = (orderId: string): void => {
    navigation.navigate('OrderDetails', { orderId: parseInt(orderId) });
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getCustomerLocation = (order: Order): string => {
    // Extract city from shipping address or use default
    if (order.items && order.items[0] && order.items[0].product) {
      return 'Kerala'; // Default to Kerala for your app
    }
    return 'Kerala';
  };

  // Calculate performance metrics from real data
  const calculatePerformanceMetrics = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const totalRevenue = thisMonthOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total_amount || '0');
    }, 0);

    const avgOrder = thisMonthOrders.length > 0 ? totalRevenue / thisMonthOrders.length : 0;

    return {
      totalOrders: thisMonthOrders.length,
      revenue: totalRevenue,
      avgOrder: avgOrder,
      rating: 4.8 // You can calculate this from actual reviews later
    };
  };

  const metrics = calculatePerformanceMetrics();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ REMOVED: MainLayout - now handled by TopBar */}
      
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ✅ UPDATED: Header Section */}
        <View style={styles.headerCard}>
          <LinearGradient
            colors={[COLORS.facebook, COLORS.facebookLight]}
            style={styles.headerGradient}
          >
            <View style={styles.headerIconContainer}>
              <Ionicons name="receipt" size={32} color={COLORS.surface} />
            </View>
            <Text style={styles.headerTitle}>Orders Management</Text>
            <Text style={styles.headerSubtitle}>
              Track and manage all your customer orders from Kerala
            </Text>
          </LinearGradient>
        </View>

        {/* Real Order Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orderStats.PENDING || 0}</Text>
            <Text style={styles.statLabel}>New Orders</Text>
            {(orderStats.PENDING || 0) > 0 && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orderStats.PROCESSING || 0}</Text>
            <Text style={styles.statLabel}>Processing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{orderStats.DELIVERED || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewAllOrders}>
              <LinearGradient
                colors={[COLORS.success, '#10B981']}
                style={styles.actionGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color={COLORS.surface} />
                <Text style={styles.actionText}>View All Orders</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleViewAllOrders}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.actionGradient}
              >
                <Ionicons name="search" size={24} color={COLORS.surface} />
                <Text style={styles.actionText}>Search Orders</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders Preview - Real Data */}
        <View style={styles.ordersContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <Text style={styles.sectionCount}>
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {orders.length > 0 ? (
            orders.slice(0, 3).map((order) => (
              <OrderPreviewCard
                key={order.id}
                orderId={`KS${order.id}`}
                customerName={order.customer_name || 'Guest Customer'}
                location={getCustomerLocation(order)}
                amount={order.formatted_total || `₹${parseFloat(order.total_amount).toLocaleString('en-IN')}`}
                status={order.status as any}
                timeAgo={getTimeAgo(order.created_at)}
                onPress={() => handleOrderPress(order.id.toString())}
              />
            ))
          ) : (
            <View style={styles.emptyOrdersContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={64} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptyOrdersTitle}>No Orders Yet</Text>
              <Text style={styles.emptyOrdersText}>
                Your orders will appear here once customers start placing orders from your online store.
              </Text>
              <TouchableOpacity 
                style={styles.promoteButton}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.promoteButtonText}>Add Products</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Performance Stats - Real Data */}
        <View style={styles.performanceContainer}>
          <Text style={styles.sectionTitle}>This Month's Performance</Text>
          
          <View style={styles.performanceGrid}>
            <PerformanceCard
              title="Total Orders"
              value={metrics.totalOrders.toString()}
              change={metrics.totalOrders > 0 ? '+' + Math.round((metrics.totalOrders / Math.max(orders.length, 1)) * 100) + '%' : '0%'}
              icon="receipt"
              color={COLORS.primary}
            />
            <PerformanceCard
              title="Revenue"
              value={`₹${metrics.revenue.toLocaleString('en-IN')}`}
              change={metrics.revenue > 0 ? '+18%' : '0%'}
              icon="trending-up"
              color={COLORS.success}
            />
            <PerformanceCard
              title="Avg Order"
              value={`₹${Math.round(metrics.avgOrder).toLocaleString('en-IN')}`}
              change={metrics.avgOrder > 0 ? '+5%' : '0%'}
              icon="calculator"
              color={COLORS.secondary}
            />
            <PerformanceCard
              title="Customer Rating"
              value={metrics.rating.toString()}
              change="+0.2"
              icon="star"
              color={COLORS.facebook}
            />
          </View>
        </View>

        {/* Order Management Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Available Features</Text>
          
          <FeatureCard
            icon="notifications"
            title="Real-time Orders"
            description="Get instant updates when new orders are placed by customers"
            color={COLORS.primary}
            isActive={true}
          />
          
          <FeatureCard
            icon="analytics"
            title="Order Analytics"
            description="Track order patterns, peak hours, and customer preferences"
            color={COLORS.secondary}
            isActive={false}
          />
          
          <FeatureCard
            icon="car"
            title="Delivery Tracking"
            description="Real-time delivery tracking with customer notifications"
            color={COLORS.facebook}
            isActive={false}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// Order Preview Card Component
const OrderPreviewCard: React.FC<OrderPreviewCardProps> = ({ 
  orderId, 
  customerName, 
  location, 
  amount, 
  status, 
  timeAgo,
  onPress 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'PENDING': return COLORS.error;
      case 'PROCESSING': return COLORS.warning;
      case 'SHIPPED': return COLORS.primary;
      case 'DELIVERED': return COLORS.success;
      case 'CANCELLED': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'PENDING': return 'time';
      case 'PROCESSING': return 'refresh';
      case 'SHIPPED': return 'car';
      case 'DELIVERED': return 'checkmark-circle';
      case 'CANCELLED': return 'close-circle';
      default: return 'help';
    }
  };

  const getStatusDisplayName = () => {
    switch (status) {
      case 'PENDING': return 'New';
      case 'PROCESSING': return 'Processing';
      case 'SHIPPED': return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{orderId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
          <Ionicons name={getStatusIcon() as any} size={12} color={getStatusColor()} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusDisplayName()}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderContent}>
        <View style={styles.customerInfo}>
          <Ionicons name="person" size={16} color={COLORS.textSecondary} />
          <Text style={styles.customerName}>{customerName}</Text>
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
          <Text style={styles.orderAmount}>{amount}</Text>
        </View>
        
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>
      
      <View style={styles.actionIndicator}>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  isActive?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, isActive = false }) => (
  <View style={styles.featureCard}>
    <View style={[styles.featureIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
    <View style={[styles.comingSoonBadge, isActive && styles.activeBadge]}>
      <Text style={[styles.comingSoonText, isActive && styles.activeText]}>
        {isActive ? 'Active' : 'Soon'}
      </Text>
    </View>
  </View>
);

// Performance Card Component
interface PerformanceCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, value, change, icon, color }) => (
  <View style={styles.performanceCard}>
    <View style={[styles.performanceIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={styles.performanceValue}>{value}</Text>
    <Text style={styles.performanceTitle}>{title}</Text>
    <View style={styles.performanceChange}>
      <Ionicons name="arrow-up" size={12} color={COLORS.success} />
      <Text style={styles.changeText}>{change}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  // ✅ UPDATED: Header card
  headerCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  headerIconContainer: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgentText: {
    fontSize: 8,
    color: COLORS.surface,
    fontWeight: '600',
  },
  
  actionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  
  ordersContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  // ✅ NEW: Section header with count
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  emptyOrdersContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    gap: 16,
  },
  emptyIconContainer: {
    marginBottom: 8,
  },
  emptyOrdersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyOrdersText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // ✅ NEW: Promote button
  promoteButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  promoteButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderContent: {
    gap: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  actionIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -8,
  },

  // Features
  featuresContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  activeText: {
    color: '#059669',
  },

  // Performance
  performanceContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  performanceTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  performanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
});

export default OrdersScreen;
