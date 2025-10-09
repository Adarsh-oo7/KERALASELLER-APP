import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface OrderCardProps {
  order: {
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
    items?: Array<{
      id: number;
      quantity: number;
      price: string;
      item_total?: number;
      product?: { 
        name: string; 
        model_name?: string;
      };
    }>;
  };
  onPress: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
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

  const getPaymentIcon = (paymentMethod?: string) => {
    if (paymentMethod === 'ONLINE') return '💳';
    if (paymentMethod === 'COD') return '💵';
    return '💰';
  };

  const statusStyle = getStatusStyle(order.status);
  const totalItems = order.items_count || order.items?.length || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.date}>{formatDate(order.created_at)}</Text>
          {order.order_type && (
            <View style={[
              styles.orderTypeBadge,
              {
                backgroundColor: order.order_type === 'LOCAL' ? '#fef3c7' : '#eff6ff',
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
          )}
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.amount}>
            {order.formatted_total || `₹${parseFloat(order.total_amount).toLocaleString('en-IN')}`}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerSection}>
        <Text style={styles.customerName}>
          👤 {order.customer_name || 'Guest Customer'}
        </Text>
        {order.customer_phone && (
          <Text style={styles.customerPhone}>📞 +91 {order.customer_phone}</Text>
        )}
        {order.store_name && (
          <Text style={styles.storeName}>🏪 {order.store_name}</Text>
        )}
      </View>

      {/* Items and Payment Info */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsCount}>
          📦 {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </Text>
        
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentMethod}>
            {getPaymentIcon(order.payment_method)} {
              order.payment_method === 'ONLINE' ? 'Online' : 
              order.payment_method === 'COD' ? 'COD' : 'Payment'
            }
          </Text>
          {order.payment_status && (
            <Text style={styles.paymentStatus}>
              {order.payment_status}
            </Text>
          )}
        </View>
      </View>

      {/* Shipping Info (if available) */}
      {(order.shipping_provider || order.tracking_id) && (
        <View style={styles.shippingSection}>
          {order.shipping_provider && (
            <Text style={styles.shippingProvider}>
              🚚 {order.shipping_provider}
            </Text>
          )}
          {order.tracking_id && (
            <Text style={styles.trackingId}>
              📋 {order.tracking_id}
            </Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {getStatusIcon(order.status)} {order.status}
          </Text>
        </View>
        <Text style={styles.viewDetails}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  orderTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  orderTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  customerSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500',
  },
  customerPhone: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  itemsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  paymentInfo: {
    alignItems: 'flex-end',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  paymentStatus: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '500',
  },
  shippingSection: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  shippingProvider: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  trackingId: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  viewDetails: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});

export default OrderCard;
