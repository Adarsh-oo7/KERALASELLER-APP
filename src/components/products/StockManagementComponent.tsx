import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface StockManagementComponentProps {
  formData: {
    total_stock: number;
    online_stock: number;
    sale_type: 'BOTH' | 'ONLINE' | 'OFFLINE';
  };
  updateFormData: (updates: any) => void;
  errors: { [key: string]: string };
}

const StockManagementComponent: React.FC<StockManagementComponentProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const saleTypeOptions = [
    { value: 'BOTH', label: '🌐 Online + Offline', description: 'Sell everywhere' },
    { value: 'ONLINE', label: '💻 Online Only', description: 'Website sales only' },
    { value: 'OFFLINE', label: '🏪 Offline Only', description: 'Store sales only' }
  ];

  return (
    <View style={styles.container}>
      {/* Total Stock */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Total Stock Quantity</Text>
        <TextInput
          style={[styles.input, errors.total_stock && styles.inputError]}
          value={formData.total_stock.toString()}
          onChangeText={(value) => updateFormData({ total_stock: parseInt(value) || 0 })}
          placeholder="0"
          keyboardType="numeric"
        />
        {errors.total_stock && <Text style={styles.errorText}>{errors.total_stock}</Text>}
        <Text style={styles.helpText}>Total inventory you have</Text>
      </View>

      {/* Online Stock */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Online Stock Allocation</Text>
        <TextInput
          style={[styles.input, errors.online_stock && styles.inputError]}
          value={formData.online_stock.toString()}
          onChangeText={(value) => updateFormData({ online_stock: parseInt(value) || 0 })}
          placeholder="0"
          keyboardType="numeric"
        />
        {errors.online_stock && <Text style={styles.errorText}>{errors.online_stock}</Text>}
        <Text style={styles.helpText}>How much to allocate for online sales</Text>
      </View>

      {/* Stock Summary */}
      <View style={styles.stockSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>📦 Total Stock:</Text>
          <Text style={styles.summaryValue}>{formData.total_stock} units</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>🌐 Online Stock:</Text>
          <Text style={styles.summaryValue}>{formData.online_stock} units</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>🏪 Offline Stock:</Text>
          <Text style={styles.summaryValue}>{formData.total_stock - formData.online_stock} units</Text>
        </View>
      </View>

      {/* Sale Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Where do you want to sell?</Text>
        {saleTypeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.saleTypeOption,
              formData.sale_type === option.value && styles.saleTypeOptionActive
            ]}
            onPress={() => updateFormData({ sale_type: option.value })}
          >
            <View style={styles.saleTypeContent}>
              <Text style={[
                styles.saleTypeLabel,
                formData.sale_type === option.value && styles.saleTypeLabelActive
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.saleTypeDescription,
                formData.sale_type === option.value && styles.saleTypeDescriptionActive
              ]}>
                {option.description}
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              formData.sale_type === option.value && styles.radioButtonActive
            ]}>
              {formData.sale_type === option.value && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stock Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>📋 Stock Management Tips:</Text>
        <Text style={styles.tip}>• Keep online stock lower than total stock</Text>
        <Text style={styles.tip}>• Reserve some stock for offline customers</Text>
        <Text style={styles.tip}>• Update stock regularly to avoid overselling</Text>
        <Text style={styles.tip}>• Monitor stock levels and reorder in time</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  stockSummary: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  saleTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  saleTypeOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  saleTypeContent: {
    flex: 1,
  },
  saleTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  saleTypeLabelActive: {
    color: '#1d4ed8',
  },
  saleTypeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleTypeDescriptionActive: {
    color: '#3730a3',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: '#3b82f6',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  tipsContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
});

export default StockManagementComponent;
