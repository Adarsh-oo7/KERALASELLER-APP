/**
 * BasicInfoComponent.tsx
 * Enhanced with smart price validation from web form
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BasicInfoComponentProps {
  formData: {
    name: string;
    model_name: string;
    description: string;
    price: string;
    mrp: string;
  };
  updateFormData: (updates: any) => void;
  errors: { [key: string]: string };
}

const BasicInfoComponent: React.FC<BasicInfoComponentProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  
  // ✅ ENHANCED: Smart price validation (from web form)
  const handlePriceChange = (value: string, field: 'price' | 'mrp') => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return; // Don't update if more than one decimal point
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return; // Don't update if more than 2 decimal places
    }
    
    updateFormData({ [field]: cleaned });
  };

  return (
    <View style={styles.container}>
      {/* Product Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Product Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(value) => updateFormData({ name: value })}
          placeholder="Enter product name"
          placeholderTextColor="#9ca3af"
          maxLength={100}
        />
        {errors.name && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.errorText}>{errors.name}</Text>
          </View>
        )}
        <Text style={styles.charCount}>{formData.name.length}/100</Text>
      </View>

      {/* Model Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Model/Brand Name</Text>
        <TextInput
          style={styles.input}
          value={formData.model_name}
          onChangeText={(value) => updateFormData({ model_name: value })}
          placeholder="e.g., iPhone 15, Samsung Galaxy"
          placeholderTextColor="#9ca3af"
          maxLength={50}
        />
        <Text style={styles.helpText}>
          💡 Adding model/brand helps customers find your product
        </Text>
        <Text style={styles.charCount}>{formData.model_name.length}/50</Text>
      </View>

      {/* Price */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>
            Selling Price <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputContainer, errors.price && styles.inputError]}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.priceInput}
              value={formData.price}
              onChangeText={(value) => handlePriceChange(value, 'price')}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          {errors.price && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errors.price}</Text>
            </View>
          )}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>MRP (Optional)</Text>
          <View style={[styles.inputContainer, errors.mrp && styles.inputError]}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.priceInput}
              value={formData.mrp}
              onChangeText={(value) => handlePriceChange(value, 'mrp')}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          {errors.mrp && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errors.mrp}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ✅ ENHANCED: Price Comparison with icon */}
      {formData.price && formData.mrp && parseFloat(formData.mrp) > parseFloat(formData.price) && (
        <View style={styles.priceComparison}>
          <View style={styles.priceComparisonHeader}>
            <Ionicons name="pricetag" size={20} color="#059669" />
            <Text style={styles.savingsText}>
              Customer saves ₹{(parseFloat(formData.mrp) - parseFloat(formData.price)).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.discountText}>
            🎉 {(((parseFloat(formData.mrp) - parseFloat(formData.price)) / parseFloat(formData.mrp)) * 100).toFixed(1)}% discount will attract more buyers!
          </Text>
        </View>
      )}

      {/* ✅ WARNING: If MRP < Price */}
      {formData.price && formData.mrp && parseFloat(formData.mrp) < parseFloat(formData.price) && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={18} color="#f59e0b" />
          <Text style={styles.warningText}>
            MRP should be greater than or equal to selling price
          </Text>
        </View>
      )}

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Product Description</Text>
        <TextInput
          style={styles.textArea}
          value={formData.description}
          onChangeText={(value) => updateFormData({ description: value })}
          placeholder="Describe your product features, specifications, warranty, condition, etc."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{formData.description.length}/500</Text>
      </View>

      {/* ✅ ENHANCED: Tips section with icons */}
      <View style={styles.tipsContainer}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb" size={18} color="#1e40af" />
          <Text style={styles.tipsTitle}>Tips for better sales</Text>
        </View>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.tip}>Use clear, descriptive product names</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.tip}>Add model/brand for electronics</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.tip}>Competitive pricing attracts customers</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.tip}>Detailed descriptions build trust</Text>
          </View>
        </View>
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
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#374151',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  
  // ✅ NEW: Price input with currency symbol
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    paddingLeft: 4,
    fontSize: 16,
    color: '#374151',
  },
  
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#374151',
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  
  // ✅ ENHANCED: Error container with icon
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  
  helpText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // ✅ ENHANCED: Price comparison
  priceComparison: {
    backgroundColor: '#d1fae5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 6,
  },
  priceComparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsText: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '700',
  },
  discountText: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
  
  // ✅ NEW: Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
  },
  
  // ✅ ENHANCED: Tips container
  tipsContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#93c5fd',
    gap: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tip: {
    flex: 1,
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
});

export default BasicInfoComponent;
