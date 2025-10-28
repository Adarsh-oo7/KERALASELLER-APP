// screens/Orders/OrderDetailsScreen.tsx
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
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import OrderService from '../../services/OrderService';
import { ApiError } from '../../types/api';

// ===================================================================
// ✅ ENHANCED COLORS - Better contrast and readability
// ===================================================================
const COLORS = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  success: '#10b981',
  successLight: '#d1fae5',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  surface: '#ffffff',
  background: '#f8fafc',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  borderLight: '#e5e7eb',
  borderMedium: '#d1d5db',
};

type OrderDetailsScreenProps = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { orderId: number; onRefresh?: () => void } }, 'params'>;
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
  cancel_reason?: string;
}

// ===================================================================
// ✅ ENHANCED ORDER TIMELINE - Better visual design
// ===================================================================
const OrderTimeline: React.FC<{ order: Order }> = ({ order }) => {
  const timelineSteps = [
    {
      key: 'PENDING',
      label: 'Order Placed',
      icon: 'checkmark-circle',
      completed: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
    },
    {
      key: 'PROCESSING',
      label: 'Processing',
      icon: 'cube',
      completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
    },
    {
      key: 'SHIPPED',
      label: 'Shipped',
      icon: 'car',
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status)
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      icon: 'star',
      completed: order.status === 'DELIVERED'
    }
  ];

  if (order.status === 'CANCELLED') {
    return (
      <View style={styles.cancelledTimeline}>
        <View style={styles.cancelledIconContainer}>
          <Ionicons name="alert-circle" size={24} color={COLORS.error} />
        </View>
        <View style={styles.cancelledContent}>
          <Text style={styles.cancelledTitle}>Order Cancelled</Text>
          <Text style={styles.cancelledDate}>
            on {new Date(order.updated_at || order.created_at).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          {order.cancel_reason && (
            <View style={styles.cancelReasonBox}>
              <Text style={styles.cancelReasonLabel}>Reason:</Text>
              <Text style={styles.cancelReasonText}>{order.cancel_reason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.timelineContainer}>
      {timelineSteps.map((step, index) => (
        <View key={step.key} style={styles.timelineStepContainer}>
          <View style={styles.timelineRow}>
            {/* ✅ Improved icon design */}
            <View style={[
              styles.timelineIcon,
              {
                backgroundColor: step.completed ? COLORS.success : COLORS.background,
                borderWidth: step.completed ? 0 : 2,
                borderColor: COLORS.borderMedium,
              }
            ]}>
              <Ionicons 
                name={step.icon as any} 
                size={22} 
                color={step.completed ? 'white' : COLORS.textTertiary} 
              />
              {step.key === order.status && (
                <View style={styles.currentIndicator} />
              )}
            </View>
            
            {/* ✅ Better content layout */}
            <View style={styles.timelineContent}>
              <Text style={[
                styles.timelineLabel,
                { 
                  color: step.completed ? COLORS.textPrimary : COLORS.textSecondary,
                  fontWeight: step.key === order.status ? '700' : step.completed ? '600' : '400'
                }
              ]}>
                {step.label}
              </Text>
              {step.key === order.status && (
                <View style={styles.currentBadge}>
                  <View style={styles.currentDot} />
                  <Text style={styles.currentText}>Current Status</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* ✅ Improved connector */}
          {index < timelineSteps.length - 1 && (
            <View style={[
              styles.timelineConnector,
              { 
                backgroundColor: step.completed ? COLORS.success : COLORS.borderLight,
                opacity: step.completed ? 1 : 0.5,
              }
            ]} />
          )}
        </View>
      ))}
    </View>
  );
};

// ===================================================================
// ✅ MAIN COMPONENT
// ===================================================================
const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
  const { orderId, onRefresh: parentRefresh } = route.params;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Modal state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      console.log('🔍 Fetching order details:', orderId);
      setError('');
      
      const response = await OrderService.getOrder(orderId);
      console.log('✅ Order details fetched:', response.data);
      
      setOrder(response.data);
      setNewStatus(response.data.status);
      setTrackingId(response.data.tracking_id || '');
      setShippingProvider(response.data.shipping_provider || '');
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

  const canModifyOrder = order?.status !== 'CANCELLED' && order?.status !== 'DELIVERED';
  const isOrderCancelled = order?.status === 'CANCELLED';
  const isOrderDelivered = order?.status === 'DELIVERED';

  const handleStatusUpdate = async () => {
    if (!order) return;
    
    if (isOrderCancelled) {
      Alert.alert('Cannot Update', 'Cannot update status of a cancelled order.');
      return;
    }

    if (isOrderDelivered) {
      Alert.alert('Cannot Update', 'Cannot update status of a delivered order.');
      return;
    }

    if (newStatus === 'SHIPPED' && (!trackingId.trim() || !shippingProvider.trim())) {
      Alert.alert('Missing Information', 'Please provide both shipping provider and tracking ID for shipped orders.');
      return;
    }

    Alert.alert(
      'Confirm Update',
      `Update order #${order.id} status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: performUpdate }
      ]
    );
  };

  const performUpdate = async () => {
    if (!order) return;
    
    setIsUpdating(true);
    
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'SHIPPED') {
        updateData.tracking_id = trackingId.trim();
        updateData.shipping_provider = shippingProvider.trim();
      }

      if (notes.trim()) {
        updateData.notes = notes.trim();
      }

      console.log('🔄 Updating order status:', updateData);
      
      await OrderService.updateOrderStatus(order.id, updateData);
      
      console.log('✅ Order status updated successfully');
      
      setShowUpdateModal(false);
      setTrackingId('');
      setShippingProvider('');
      setNotes('');
      
      await fetchOrderDetails();
      
      if (parentRefresh) {
        parentRefresh();
      }
      
      Alert.alert(
        'Success! 🎉',
        `Order #${order.id} has been updated to "${newStatus}"`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ Failed to update order status:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'Failed to update order status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
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
      'PENDING': { backgroundColor: COLORS.warningLight, color: '#92400e' },
      'PROCESSING': { backgroundColor: '#dbeafe', color: '#1e40af' },
      'SHIPPED': { backgroundColor: COLORS.successLight, color: '#065f46' },
      'DELIVERED': { backgroundColor: COLORS.successLight, color: '#065f46' },
      'CANCELLED': { backgroundColor: COLORS.errorLight, color: '#991b1b' },
    };
    return statusStyles[status as keyof typeof statusStyles] || { backgroundColor: '#f3f4f6', color: '#374151' };
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'PENDING': 'time',
      'PROCESSING': 'cube',
      'SHIPPED': 'car',
      'DELIVERED': 'checkmark-circle',
      'CANCELLED': 'close-circle',
    };
    return icons[status as keyof typeof icons] || 'cube';
  };

  const statusOptions = [
    { value: 'PENDING', label: '⏱️ Pending' },
    { value: 'PROCESSING', label: '⚙️ Processing' },
    { value: 'SHIPPED', label: '🚚 Shipped' },
    { value: 'DELIVERED', label: '✅ Delivered' },
    { value: 'CANCELLED', label: '❌ Cancelled' },
  ];

  const shippingProviders = [
    'DTDC',
    'Blue Dart',
    'FedEx',
    'Delhivery',
    'Ecom Express',
    'India Post',
    'Other'
  ];

  // ===================================================================
  // ✅ LOADING STATE
  // ===================================================================
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  // ===================================================================
  // ✅ ERROR STATE
  // ===================================================================
  if (error && !order) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backToOrdersButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backToOrdersText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cube-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.errorTitle}>Order not found</Text>
        <Text style={styles.errorMessage}>
          The order you're looking for doesn't exist or you don't have permission to view it.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusStyle(order.status);

  // ===================================================================
  // ✅ MAIN RENDER
  // ===================================================================
  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl=

{
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* ✅ ENHANCED HEADER */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
            <Text style={styles.headerBackText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerShareButton} 
            onPress={shareOrderDetails}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* ✅ ORDER TITLE SECTION */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.orderTitle}>Order #{order.id}</Text>
            <View style={[styles.statusBadge, statusStyle]}>
              <Ionicons name={getStatusIcon(order.status) as any} size={16} color={statusStyle.color} />
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {order.status}
              </Text>
            </View>
          </View>
          <View style={styles.orderMeta}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
          </View>
        </View>

        {/* ✅ QUICK ACTIONS - Better visual design */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleGenerateBill}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>View Bill</Text>
          </TouchableOpacity>
          
          {canModifyOrder && (
            <TouchableOpacity 
              style={styles.primaryActionButton} 
              onPress={() => setShowUpdateModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="white" />
              <Text style={styles.primaryActionButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}

          {(isOrderCancelled || isOrderDelivered) && (
            <TouchableOpacity 
              style={styles.infoActionButton} 
              onPress={() => setShowUpdateModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={20} color="white" />
              <Text style={styles.primaryActionButtonText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ ORDER TIMELINE */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="navigate-circle" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Order Progress</Text>
          </View>
          <OrderTimeline order={order} />
        </View>

        {/* ✅ CUSTOMER DETAILS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="person" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Customer Details</Text>
          </View>
          
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>
                {order.customer_name || 'Guest Customer'}
              </Text>
            </View>
            
            {order.customer_phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>+91 {order.customer_phone}</Text>
              </View>
            )}
            
            {order.shipping_address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={[styles.detailValue, styles.addressText]}>
                  {order.shipping_address}
                </Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Type</Text>
              <View style={[
                styles.orderTypeBadge,
                {
                  backgroundColor: order.order_type === 'LOCAL' ? COLORS.warningLight : '#dbeafe',
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
        </View>

        {/* ✅ SHIPPING DETAILS */}
        {order.shipping_provider && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="car" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Shipping Details</Text>
            </View>
            
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailValue}>{order.shipping_provider}</Text>
              </View>
              
              {order.tracking_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tracking ID</Text>
                  <View style={styles.trackingContainer}>
                    <Text style={styles.trackingId}>{order.tracking_id}</Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => copyTrackingId(order.tracking_id!)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="copy-outline" size={14} color="white" />
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ✅ PAYMENT DETAILS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons 
                name={order.payment_method === 'ONLINE' ? 'card' : 'wallet'} 
                size={22} 
                color={COLORS.primary} 
              />
            </View>
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>
          
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method</Text>
              <Text style={styles.detailValue}>
                {order.payment_method === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'}
              </Text>
            </View>
            
            {order.payment_status && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[
                  styles.paymentStatusBadge,
                  {
                    backgroundColor: ['Paid', 'PAID'].includes(order.payment_status) 
                      ? COLORS.successLight : '#dbeafe',
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
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* ✅ ORDER ITEMS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Ionicons name="cube" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>Items in this Order</Text>
              <View style={styles.itemsCountBadge}>
                <Text style={styles.itemsCountText}>{order.items?.length || 0}</Text>
              </View>
            </View>
          </View>
          
          {order.items && order.items.length > 0 ? (
            <View style={styles.itemsList}>
              {order.items.map((item, index) => (
                <View key={item.id || index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemNameContainer}>
                      <Text style={styles.itemName}>
                        {item.product?.name || item.product_name || 'Product'}
                      </Text>
                      {item.product?.model_name && (
                        <Text style={styles.itemModel}>
                          {item.product.model_name}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemSubtotal}>
                      ₹{(parseFloat(item.price || '0') * item.quantity).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  
                  <View style={styles.itemFooter}>
                    <View style={styles.quantityContainer}>
                      <View style={styles.quantityBadge}>
                        <Text style={styles.quantityText}>{item.quantity}×</Text>
                      </View>
                      <Text style={styles.unitPrice}>
                        ₹{parseFloat(item.price || '0').toLocaleString('en-IN')} each
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalAmount}>
                  ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No items found for this order</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===================================================================
          ✅ ENHANCED UPDATE STATUS MODAL
          =================================================================== */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>
                {isOrderCancelled ? 'Order Details' : isOrderDelivered ? 'Order Details' : 'Update Order'} #{order.id}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowUpdateModal(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Cancelled Order Warning */}
            {isOrderCancelled && (
              <View style={styles.cancelledWarning}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>Order Cancelled</Text>
                  <Text style={styles.warningText}>
                    This order has been cancelled and cannot be modified.
                  </Text>
                  {order.cancel_reason && (
                    <View style={styles.cancelReasonModalBox}>
                      <Text style={styles.cancelReasonModalLabel}>Reason:</Text>
                      <Text style={styles.cancelReasonModalText}>{order.cancel_reason}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Delivered Order Info */}
            {isOrderDelivered && (
              <View style={styles.deliveredWarning}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Order Delivered</Text>
                  <Text style={styles.successText}>
                    This order has been delivered successfully.
                  </Text>
                </View>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.modalOrderSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue}>{order.customer_name || 'Guest'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryAmount}>
                  ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Current Status */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Current Status</Text>
              <View style={[styles.statusBadge, statusStyle, styles.modalStatusBadge]}>
                <Ionicons name={getStatusIcon(order.status) as any} size={18} color={statusStyle.color} />
                <Text style={[styles.statusText, { color: statusStyle.color, fontSize: 15 }]}>
                  {order.status}
                </Text>
              </View>
            </View>

            {/* New Status Picker */}
            {canModifyOrder && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>
                  New Status <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newStatus}
                    onValueChange={(value) => setNewStatus(value)}
                    style={styles.picker}
                    enabled={!isUpdating}
                  >
                    {statusOptions.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Shipping Details (only when status is SHIPPED) */}
            {newStatus === 'SHIPPED' && canModifyOrder && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>
                    Shipping Provider <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={shippingProvider}
                      onValueChange={(value) => setShippingProvider(value)}
                      style={styles.picker}
                      enabled={!isUpdating}
                    >
                      <Picker.Item label="Select Provider" value="" />
                      {shippingProviders.map((provider) => (
                        <Picker.Item
                          key={provider}
                          label={provider}
                          value={provider}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>
                    Tracking ID <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={trackingId}
                    onChangeText={setTrackingId}
                    placeholder="Enter tracking number"
                    placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="characters"
                    editable={!isUpdating}
                  />
                </View>
              </>
            )}

            {/* Show existing shipping info for non-editable orders */}
            {!canModifyOrder && order.shipping_provider && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Shipping Information</Text>
                <View style={styles.readOnlyBox}>
                  <View style={styles.readOnlyRow}>
                    <Text style={styles.readOnlyLabel}>Provider:</Text>
                    <Text style={styles.readOnlyValue}>{order.shipping_provider}</Text>
                  </View>
                  {order.tracking_id && (
                    <View style={styles.readOnlyRow}>
                      <Text style={styles.readOnlyLabel}>Tracking ID:</Text>
                      <Text style={styles.readOnlyValue}>{order.tracking_id}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Notes */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                {canModifyOrder ? 'Additional Notes' : 'Order Notes'}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: !canModifyOrder ? COLORS.background : 'white' }
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder={canModifyOrder ? "Add any additional information..." : "No additional notes available"}
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={canModifyOrder && !isUpdating}
              />
              {canModifyOrder && (
                <Text style={styles.charCount}>{notes.length}/500</Text>
              )}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowUpdateModal(false)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>
                {canModifyOrder ? 'Cancel' : 'Close'}
              </Text>
            </TouchableOpacity>
            
            {canModifyOrder && (
              <TouchableOpacity
                style={[styles.modalUpdateButton, isUpdating && styles.disabledButton]}
                onPress={handleStatusUpdate}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.modalUpdateText}>Update Status</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

// ===================================================================
// ✅ ENHANCED STYLES - Better UI/UX
// ===================================================================
// ===================================================================
// ✅ OPTIMIZED STYLES - Proper Spacing & Clean Design
// ===================================================================
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
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
    gap: 20,
  },
  errorIconContainer: {
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backToOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backToOrdersText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // ✅ OPTIMIZED: Compact Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,           // ✅ Reduced from 60
    paddingBottom: 12,        // ✅ Reduced from 20
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  headerBackText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  headerShareButton: {
    backgroundColor: COLORS.primaryLight + '15',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // ✅ OPTIMIZED: Compact Title Section
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 16,           // ✅ Reduced from 20
    paddingBottom: 16,        // ✅ Reduced from 20
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderTitle: {
    fontSize: 24,             // ✅ Reduced from 26
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  
  // ✅ OPTIMIZED: Compact Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,      // ✅ Reduced from 20
    backgroundColor: COLORS.surface,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.textSecondary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  infoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 10,
  },
  
  // ✅ OPTIMIZED: Cards with less top margin
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 16,            // ✅ Reduced from 20
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 16,
    marginBottom: 20,
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemsCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCountText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  
  // Timeline Styles
  timelineContainer: {
    gap: 0,
  },
  timelineStepContainer: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  timelineIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  currentIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.warning,
    borderWidth: 2,
    borderColor: 'white',
  },
  timelineContent: {
    flex: 1,
    gap: 4,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  currentText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timelineConnector: {
    width: 3,
    height: 32,
    marginLeft: 21.5,
    marginTop: -4,
    marginBottom: -4,
  },
  cancelledTimeline: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.errorLight,
    borderRadius: 12,
    gap: 16,
  },
  cancelledIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledContent: {
    flex: 1,
    gap: 6,
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
  cancelledDate: {
    fontSize: 14,
    color: '#991b1b',
  },
  cancelReasonBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  cancelReasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancelReasonText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  
  // Details List
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    minWidth: 90,
    paddingTop: 2,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  addressText: {
    lineHeight: 22,
  },
  orderTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,    // ✅ Reduced from 12
    paddingVertical: 6,       // ✅ Reduced from 8
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,             // ✅ Reduced from 13
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  trackingId: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    flex: 1,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.borderLight,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
  },
  
  // Items List
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  itemNameContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemModel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  itemSubtotal: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.success,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quantityText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  unitPrice: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.borderMedium,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  grandTotalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.success,
  },
  emptyItems: {
    alignItems: 'center',
    padding: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // ✅ OPTIMIZED: Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,           // ✅ Reduced from 60
    paddingBottom: 16,        // ✅ Reduced from 20
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  cancelledWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  cancelReasonModalBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  cancelReasonModalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  cancelReasonModalText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  deliveredWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 12,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  modalOrderSummary: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 18,
    color: COLORS.success,
    fontWeight: '700',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  required: {
    color: COLORS.error,
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
  },
  picker: {
    height: 54,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  readOnlyBox: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    gap: 12,
  },
  readOnlyRow: {
    gap: 4,
  },
  readOnlyLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  readOnlyValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalUpdateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  modalUpdateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: COLORS.textTertiary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight + '15',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;
