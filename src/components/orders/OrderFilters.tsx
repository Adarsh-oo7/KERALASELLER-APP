import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface OrderFiltersProps {
  statusFilter: string;
  paymentFilter: string;
  dateFilter: string;
  orderStats: { [key: string]: number };
  onStatusChange: (status: string) => void;
  onPaymentChange: (payment: string) => void;
  onDateChange: (date: string) => void;
  onClose: () => void;
  onClearAll: () => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  statusFilter,
  paymentFilter,
  dateFilter,
  orderStats,
  onStatusChange,
  onPaymentChange,
  onDateChange,
  onClose,
  onClearAll,
}) => {
  const statusOptions = [
    { value: '', label: `All Orders (${orderStats.total || 0})` },
    { value: 'PENDING', label: `Pending (${orderStats.PENDING || 0})` },
    { value: 'PROCESSING', label: `Processing (${orderStats.PROCESSING || 0})` },
    { value: 'SHIPPED', label: `Shipped (${orderStats.SHIPPED || 0})` },
    { value: 'DELIVERED', label: `Delivered (${orderStats.DELIVERED || 0})` },
    { value: 'CANCELLED', label: `Cancelled (${orderStats.CANCELLED || 0})` },
  ];

  const paymentOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'ONLINE', label: 'Online Payment' },
    { value: 'COD', label: 'Cash on Delivery' },
  ];

  const dateOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'Last 3 Months' },
  ];

  const hasActiveFilters = statusFilter || paymentFilter || dateFilter;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter Orders</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Order Status</Text>
          <View style={styles.optionsList}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  statusFilter === option.value && styles.optionButtonActive
                ]}
                onPress={() => onStatusChange(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  statusFilter === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
                {statusFilter === option.value && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          <View style={styles.optionsList}>
            {paymentOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  paymentFilter === option.value && styles.optionButtonActive
                ]}
                onPress={() => onPaymentChange(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  paymentFilter === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
                {paymentFilter === option.value && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Date Range</Text>
          <View style={styles.optionsList}>
            {dateOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  dateFilter === option.value && styles.optionButtonActive
                ]}
                onPress={() => onDateChange(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  dateFilter === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
                {dateFilter === option.value && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={onClearAll}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.applyButton} onPress={onClose}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  optionsList: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#1d4ed8',
  },
  checkMark: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderFilters;
