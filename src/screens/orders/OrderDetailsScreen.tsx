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
  Modal,
  TextInput,
  Clipboard,
  Share,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import OrderService from '../../services/OrderService';
import { ApiError } from '../../types/api';

// ✅ COMMENTED OUT - Missing Components
// import OrderTimeline from '../../components/orders/OrderTimeline';
// import UpdateStatusModal from '../../components/orders/UpdateStatusModal';

type OrderDetailsScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { orderId: number } }, 'params'>;
};

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  product?: { name: string; model_name?: string };
  product_name?: string;
}

interface Order {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  total_amount: string;
  status: string;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
  updated_at?: string;
  shipping_address?: string;
  shipping_provider?: string;
  tracking_id?: string;
  order_type?: string;
  items?: OrderItem[];
}

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      console.log('🔍 Fetching order details:', orderId);
      setError('');
      
      const response = await OrderService.getOrder(orderId);
      console.log('✅ Order details:', response.data);
      
      setOrder(response.data);
    } catch (error: any) {
      console.error('❌ Failed to fetch order details:', error);
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (apiError.response?.status === 404) {
        setError('Order not found or you do not have permission to view it.');
      } else {
        setError(apiError.message || 'Failed to load order details');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const handleStatusUpdate = () => {
    setShowUpdateModal(false);
    fetchOrderDetails(); // Refresh order data
  };

  const copyTrackingId = async (trackingId: string) => {
    try {
      await Clipboard.setString(trackingId);
      Alert.alert('Copied!', 'Tracking ID copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareOrderDetails = async () => {
    if (!order) return;
    
    const shareText = `Order #${order.id}\nCustomer: ${order.customer_name || 'Guest'}\nAmount: ₹${order.total_amount}\nStatus: ${order.status}${order.tracking_id ? `\nTracking: ${order.tracking_id}` : ''}`;
    
    try {
      await Share.share({
        message: shareText,
        title: `Order #${order.id} Details`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleGenerateBill = async () => {
    try {
      Alert.alert(
        'Bill Generation',
        'Bill generation feature will be implemented soon!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate bill');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyle = (status: string) => {
    const statusStyles = {
      'PENDING': { backgroundColor: '#fef3c7', color: '#92400e' },
      'PROCESSING': { backgroundColor: '#dbeafe', color: '#1e40af' },
      'SHIPPED': { backgroundColor: '#d1fae5', color: '#065f46' },
      'DELIVERED': { backgroundColor: '#d1fae5', color: '#065f46' },
      'CANCELLED': { backgroundColor: '#fee2e2', color: '#991b1b' },
    };
    return statusStyles[status as keyof typeof statusStyles] || { backgroundColor: '#f3f4f6', color: '#374151' };
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'PENDING': '⏱️',
      'PROCESSING': '📦',
      'SHIPPED': '🚚',
      'DELIVERED': '✅',
      'CANCELLED': '❌',
    };
    return icons[status as keyof typeof icons] || '📦';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Text style={styles.retryButtonText}>🔄 Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📦</Text>
        <Text style={styles.errorTitle}>Order not found</Text>
        <Text style={styles.errorMessage}>
          The order you're looking for doesn't exist or you don't have permission to view it.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusStyle(order.status);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.shareButton} onPress={shareOrderDetails}>
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Title */}
      <View style={styles.titleSection}>
        <Text style={styles.orderTitle}>Order #{order.id}</Text>
        <Text style={styles.orderDate}>
          📅 Placed on {formatDate(order.created_at)}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleGenerateBill}
        >
          <Text style={styles.actionButtonText}>📄 View Bill</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.primaryActionButton} 
          onPress={() => Alert.alert('Coming Soon!', 'Status update feature will be available soon.')}
        >
          <Text style={styles.primaryActionButtonText}>✏️ Update Status</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ REPLACED: Order Progress Timeline - Simple Version */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚚 Order Progress</Text>
        <View style={styles.simpleTimeline}>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {getStatusIcon(order.status)} {order.status}
            </Text>
          </View>
          <Text style={styles.statusDate}>
            Last updated: {formatDate(order.updated_at || order.created_at)}
          </Text>
        </View>
      </View>

      {/* Customer Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Customer Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name:</Text>
          <Text style={styles.detailValue}>
            {order.customer_name || 'Guest Customer'}
          </Text>
        </View>
        
        {order.customer_phone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>+91 {order.customer_phone}</Text>
          </View>
        )}
        
        {order.shipping_address && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Address:</Text>
            <Text style={[styles.detailValue, styles.addressText]}>
              {order.shipping_address}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Type:</Text>
          <View style={[
            styles.orderTypeBadge,
            {
              backgroundColor: order.order_type === 'LOCAL' ? '#fef3c7' : '#dbeafe',
            }
          ]}>
            <Text style={[
              styles.orderTypeText,
              {
                color: order.order_type === 'LOCAL' ? '#92400e' : '#1e40af',
              }
            ]}>
              {order.order_type === 'LOCAL' ? '🏪 Local Bill' : '🛒 Online Order'}
            </Text>
          </View>
        </View>
      </View>

      {/* Order Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Order Status</Text>
        
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {getStatusIcon(order.status)} {order.status}
            </Text>
          </View>
        </View>
        
        {order.shipping_provider && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider:</Text>
            <Text style={styles.detailValue}>{order.shipping_provider}</Text>
          </View>
        )}
        
        {order.tracking_id && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tracking ID:</Text>
            <View style={styles.trackingContainer}>
              <Text style={styles.trackingId}>{order.tracking_id}</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyTrackingId(order.tracking_id!)}
              >
                <Text style={styles.copyButtonText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Payment Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {order.payment_method === 'ONLINE' ? '💳' : '💵'} Payment Details
        </Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Method:</Text>
          <Text style={styles.detailValue}>
            {order.payment_method === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'}
          </Text>
        </View>
        
        {order.payment_status && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[
              styles.paymentStatusBadge,
              {
                backgroundColor: ['Paid', 'PAID'].includes(order.payment_status) 
                  ? '#d1fae5' : '#dbeafe',
              }
            ]}>
              <Text style={[
                styles.paymentStatusText,
                {
                  color: ['Paid', 'PAID'].includes(order.payment_status) 
                    ? '#065f46' : '#1e40af',
                }
              ]}>
                {order.payment_status}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.totalAmountRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          📦 Items in this Order ({order.items?.length || 0})
        </Text>
        
        {order.items && order.items.length > 0 ? (
          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>
                    {item.product?.name || item.product_name || 'Product'}
                  </Text>
                  <Text style={styles.itemSubtotal}>
                    ₹{(parseFloat(item.price || '0') * item.quantity).toLocaleString('en-IN')}
                  </Text>
                </View>
                
                {item.product?.model_name && (
                  <Text style={styles.itemModel}>
                    Model: {item.product.model_name}
                  </Text>
                )}
                
                <View style={styles.itemFooter}>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{item.quantity}x</Text>
                  </View>
                  <Text style={styles.unitPrice}>
                    ₹{parseFloat(item.price || '0').toLocaleString('en-IN')} each
                  </Text>
                </View>
              </View>
            ))}
            
            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalAmount}>
                ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No items found for this order</Text>
          </View>
        )}
      </View>

      {/* ✅ REMOVED: Update Status Modal - Commented out until components are created */}
    </ScrollView>
  );
};

// ✅ ADDED: Simple timeline styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  backButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#f3f4f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  // ✅ NEW: Simple timeline styles
  simpleTimeline: {
    alignItems: 'center',
    gap: 12,
  },
  statusDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  addressText: {
    lineHeight: 20,
  },
  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusSection: {
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  trackingId: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  itemModel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  unitPrice: {
    fontSize: 12,
    color: '#6b7280',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  grandTotalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  emptyItems: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default OrderDetailsScreen;
