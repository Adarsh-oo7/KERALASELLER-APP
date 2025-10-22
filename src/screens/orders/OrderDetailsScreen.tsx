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

// ✅ Order Timeline Component for React Native
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
        <View style={styles.cancelledHeader}>
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.cancelledText}>
            Order was cancelled on {new Date(order.updated_at || order.created_at).toLocaleDateString()}
          </Text>
        </View>
        {order.cancel_reason && (
          <View style={styles.cancelReason}>
            <Text style={styles.cancelReasonLabel}>Reason:</Text>
            <Text style={styles.cancelReasonText}>{order.cancel_reason}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.timelineContainer}>
      {timelineSteps.map((step, index) => (
        <View key={step.key} style={styles.timelineStepContainer}>
          <View style={styles.timelineRow}>
            <View style={[
              styles.timelineIcon,
              { backgroundColor: step.completed ? '#10b981' : '#e5e7eb' }
            ]}>
              <Ionicons 
                name={step.icon as any} 
                size={20} 
                color={step.completed ? 'white' : '#6b7280'} 
              />
            </View>
            
            <View style={styles.timelineContent}>
              <Text style={[
                styles.timelineLabel,
                { 
                  color: step.completed ? '#1f2937' : '#6b7280',
                  fontWeight: step.completed ? '600' : '400'
                }
              ]}>
                {step.label}
              </Text>
              {step.key === order.status && (
                <Text style={styles.currentStep}>Current Status</Text>
              )}
            </View>
          </View>
          
          {index < timelineSteps.length - 1 && (
            <View style={[
              styles.timelineConnector,
              { backgroundColor: step.completed ? '#10b981' : '#e5e7eb' }
            ]} />
          )}
        </View>
      ))}
    </View>
  );
};

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

  // Check if order can be modified
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
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cube-outline" size={48} color="#6b7280" />
        <Text style={styles.errorTitle}>Order not found</Text>
        <Text style={styles.errorMessage}>
          The order you're looking for doesn't exist or you don't have permission to view it.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#3b82f6" />
          <Text style={styles.backButtonText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusStyle(order.status);

  return (
    <>
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
            <Ionicons name="arrow-back" size={20} color="#3b82f6" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={shareOrderDetails}>
              <Ionicons name="share-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Title */}
        <View style={styles.titleSection}>
          <Text style={styles.orderTitle}>Order #{order.id}</Text>
          <View style={styles.orderMeta}>
            <Ionicons name="calendar" size={14} color="#6b7280" />
            <Text style={styles.orderDate}>Placed on {formatDate(order.created_at)}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleGenerateBill}
          >
            <Ionicons name="document-text" size={16} color="white" />
            <Text style={styles.actionButtonText}>View Bill</Text>
          </TouchableOpacity>
          
          {canModifyOrder && (
            <TouchableOpacity 
              style={styles.primaryActionButton} 
              onPress={() => setShowUpdateModal(true)}
            >
              <Ionicons name="create" size={16} color="white" />
              <Text style={styles.primaryActionButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}

          {(isOrderCancelled || isOrderDelivered) && (
            <TouchableOpacity 
              style={styles.infoActionButton} 
              onPress={() => setShowUpdateModal(true)}
            >
              <Ionicons name="eye" size={16} color="white" />
              <Text style={styles.primaryActionButtonText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ Order Timeline Component */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={20} color="#1f2937" />
            <Text style={styles.cardTitle}>Order Progress</Text>
          </View>
          <OrderTimeline order={order} />
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color="#1f2937" />
            <Text style={styles.cardTitle}>Customer Details</Text>
          </View>
          
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
              <Text style={styles.detailLabel}>Address:</Text>
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
          <View style={styles.cardHeader}>
            <Ionicons name="cube" size={20} color="#1f2937" />
            <Text style={styles.cardTitle}>Order Status</Text>
          </View>
          
          <View style={styles.statusSection}>
            <View style={[styles.statusBadge, statusStyle]}>
              <Ionicons name={getStatusIcon(order.status) as any} size={14} color={statusStyle.color} />
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {order.status}
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
                  <Ionicons name="copy" size={12} color="white" />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={order.payment_method === 'ONLINE' ? 'card' : 'wallet'} size={20} color="#1f2937" />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>
          
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
          <View style={styles.cardHeader}>
            <Ionicons name="cube" size={20} color="#1f2937" />
            <Text style={styles.cardTitle}>
              Items in this Order ({order.items?.length || 0})
            </Text>
          </View>
          
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
              
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalAmount}>
                  ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyItems}>
              <Ionicons name="cube-outline" size={32} color="#6b7280" />
              <Text style={styles.emptyText}>No items found for this order</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ✅ Enhanced Update Status Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isOrderCancelled ? 'Order Details' : isOrderDelivered ? 'Order Details' : 'Update Order'} #{order.id}
            </Text>
            <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Cancelled Order Warning */}
            {isOrderCancelled && (
              <View style={styles.cancelledWarning}>
                <Ionicons name="alert-circle" size={16} color="#991b1b" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningText}>
                    This order has been cancelled and cannot be modified.
                  </Text>
                  {order.cancel_reason && (
                    <View style={styles.cancelReasonBox}>
                      <Text style={styles.cancelReasonLabel}>Cancellation Reason:</Text>
                      <Text style={styles.cancelReasonText}>{order.cancel_reason}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Delivered Order Warning */}
            {isOrderDelivered && (
              <View style={styles.deliveredWarning}>
                <Ionicons name="checkmark-circle" size={16} color="#065f46" />
                <Text style={styles.warningText}>
                  This order has been delivered and cannot be modified further.
                </Text>
              </View>
            )}

            {/* Order Info */}
            <View style={styles.modalOrderInfo}>
              <Text style={styles.modalOrderId}>Order #{order.id}</Text>
              <Text style={styles.modalCustomer}>
                {order.customer_name || 'Guest Customer'}
              </Text>
              <Text style={styles.modalAmount}>
                ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Current Status */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Current Status</Text>
              <View style={[styles.statusBadge, statusStyle]}>
                <Ionicons name={getStatusIcon(order.status) as any} size={14} color={statusStyle.color} />
                <Text style={[styles.statusText, { color: statusStyle.color }]}>
                  {order.status}
                </Text>
              </View>
            </View>

            {/* New Status */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>New Status *</Text>
              <View style={[
                styles.pickerContainer,
                { backgroundColor: !canModifyOrder ? '#f3f4f6' : 'white' }
              ]}>
                <Picker
                  selectedValue={newStatus}
                  onValueChange={(value) => setNewStatus(value)}
                  style={styles.picker}
                  enabled={canModifyOrder && !isUpdating}
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
              {!canModifyOrder && (
                <Text style={styles.disabledNote}>
                  Status cannot be changed for {isOrderCancelled ? 'cancelled' : 'delivered'} orders
                </Text>
              )}
            </View>

            {/* Shipping Details (if SHIPPED and can modify) */}
            {newStatus === 'SHIPPED' && canModifyOrder && (
              <>
                <View style={styles.modalSection}>
                  <View style={styles.modalLabelRow}>
                    <Ionicons name="car" size={16} color="#374151" />
                    <Text style={styles.modalLabel}>Shipping Provider</Text>
                  </View>
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
                  <View style={styles.modalLabelRow}>
                    <Ionicons name="cube" size={16} color="#374151" />
                    <Text style={styles.modalLabel}>Tracking ID</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    value={trackingId}
                    onChangeText={setTrackingId}
                    placeholder="Enter tracking number"
                    autoCapitalize="characters"
                    editable={!isUpdating}
                  />
                </View>
              </>
            )}

            {/* Show existing shipping info for cancelled/delivered orders */}
            {!canModifyOrder && order.shipping_provider && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Shipping Information</Text>
                <View style={styles.readOnlyInfo}>
                  <Text style={styles.readOnlyText}>
                    <Text style={styles.readOnlyLabel}>Provider:</Text> {order.shipping_provider}
                  </Text>
                  {order.tracking_id && (
                    <Text style={styles.readOnlyText}>
                      <Text style={styles.readOnlyLabel}>Tracking ID:</Text> {order.tracking_id}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Notes field */}
            <View style={styles.modalSection}>
              <View style={styles.modalLabelRow}>
                <Ionicons name="chatbox" size={16} color="#374151" />
                <Text style={styles.modalLabel}>
                  {canModifyOrder ? 'Additional Notes (Optional)' : 'Order Notes'}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: !canModifyOrder ? '#f3f4f6' : 'white' }
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder={canModifyOrder ? "Add any additional information..." : "No additional notes available"}
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={canModifyOrder && !isUpdating}
              />
              {canModifyOrder && (
                <Text style={styles.charCount}>{notes.length}/500 characters</Text>
              )}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowUpdateModal(false)}
              disabled={isUpdating}
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
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text style={styles.modalUpdateText}>Save Status</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  iconButton: {
    backgroundColor: '#f3f4f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 14,
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
    borderRadius: 8,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  
  // ✅ Timeline Styles
  timelineContainer: {
    gap: 16,
  },
  timelineStepContainer: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  currentStep: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 2,
  },
  timelineConnector: {
    width: 2,
    height: 20,
    marginLeft: 19,
  },
  cancelledTimeline: {
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    gap: 12,
  },
  cancelledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelledText: {
    fontSize: 14,
    color: '#991b1b',
    flex: 1,
  },
  cancelReason: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
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
  },
  
  // Detail Rows
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  
  // Items List
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
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
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
    backgroundColor: '#fef2f2',
    border: '1px solid #ef4444',
    borderRadius: 8,
    marginBottom: 20,
  },
  deliveredWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#991b1b',
    flex: 1,
  },
  cancelReasonBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
  },
  modalOrderInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOrderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalCustomer: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  modalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  picker: {
    height: 50,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disabledNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  readOnlyInfo: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    gap: 8,
  },
  readOnlyText: {
    fontSize: 14,
    color: '#374151',
  },
  readOnlyLabel: {
    fontWeight: '600',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#6b7280',
    borderRadius: 8,
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
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  modalUpdateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});

export default OrderDetailsScreen;
