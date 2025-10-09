import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import OrderService from '../../services/OrderService';

interface Order {
  id: number;
  status: string;
  customer_name?: string;
  total_amount: string;
}

interface UpdateStatusModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ 
  order, 
  onClose, 
  onUpdate 
}) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [trackingId, setTrackingId] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'PENDING', label: '⏱️ Pending', color: '#f59e0b' },
    { value: 'PROCESSING', label: '⚙️ Processing', color: '#3b82f6' },
    { value: 'SHIPPED', label: '🚚 Shipped', color: '#8b5cf6' },
    { value: 'DELIVERED', label: '✅ Delivered', color: '#059669' },
    { value: 'CANCELLED', label: '❌ Cancelled', color: '#ef4444' },
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

  const handleUpdateStatus = async () => {
    if (newStatus === order.status && !trackingId && !shippingProvider) {
      Alert.alert('No Changes', 'Please select a different status or add tracking information.');
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
    setIsUpdating(true);
    
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (trackingId.trim()) {
        updateData.tracking_id = trackingId.trim();
      }

      if (shippingProvider.trim()) {
        updateData.shipping_provider = shippingProvider.trim();
      }

      console.log('🔄 Updating order status:', updateData);
      
      await OrderService.updateOrderStatus(order.id, updateData);
      
      Alert.alert(
        'Success! 🎉',
        `Order #${order.id} has been updated to "${newStatus}"`,
        [{ text: 'OK', onPress: () => { onUpdate(); onClose(); } }]
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

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || '#6b7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Update Order Status</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>Order #{order.id}</Text>
          <Text style={styles.customerName}>
            {order.customer_name || 'Guest Customer'}
          </Text>
          <Text style={styles.orderAmount}>
            ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current Status</Text>
          <View style={[
            styles.currentStatusBadge,
            { backgroundColor: `${getStatusColor(order.status)}15` }
          ]}>
            <Text style={[
              styles.currentStatusText,
              { color: getStatusColor(order.status) }
            ]}>
              {statusOptions.find(opt => opt.value === order.status)?.label || order.status}
            </Text>
          </View>
        </View>

        {/* New Status Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>New Status *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newStatus}
              onValueChange={(value) => setNewStatus(value)}
              style={styles.picker}
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

        {/* Shipping Details (if status is SHIPPED) */}
        {newStatus === 'SHIPPED' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Shipping Provider</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={shippingProvider}
                  onValueChange={(value) => setShippingProvider(value)}
                  style={styles.picker}
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

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tracking ID</Text>
              <TextInput
                style={styles.textInput}
                value={trackingId}
                onChangeText={setTrackingId}
                placeholder="Enter tracking number"
                autoCapitalize="characters"
              />
            </View>
          </>
        )}

        {/* Status Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Status Guide</Text>
          <View style={styles.statusGuide}>
            {statusOptions.map((option) => (
              <View key={option.value} style={styles.guideItem}>
                <Text style={styles.guideIcon}>{option.label.split(' ')[0]}</Text>
                <Text style={styles.guideText}>
                  {option.label.substring(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.updateButton, isUpdating && styles.disabledButton]}
          onPress={handleUpdateStatus}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.updateButtonText}>Update Status</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orderInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  currentStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: '600',
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
  statusGuide: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guideIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  guideText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  updateButton: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  updateButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});

export default UpdateStatusModal;
