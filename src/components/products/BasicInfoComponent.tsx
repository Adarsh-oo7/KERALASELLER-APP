import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

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
  return (
    <View style={styles.container}>
      {/* Product Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(value) => updateFormData({ name: value })}
          placeholder="Enter product name"
          maxLength={100}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
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
          maxLength={50}
        />
        <Text style={styles.charCount}>{formData.model_name.length}/50</Text>
      </View>

      {/* Price */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Selling Price *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={(value) => updateFormData({ price: value })}
            placeholder="₹ 0"
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>MRP (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.mrp}
            onChangeText={(value) => updateFormData({ mrp: value })}
            placeholder="₹ 0"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </View>

      {/* Price Comparison */}
      {formData.price && formData.mrp && parseFloat(formData.mrp) > parseFloat(formData.price) && (
        <View style={styles.priceComparison}>
          <Text style={styles.savingsText}>
            💰 Customer saves ₹{(parseFloat(formData.mrp) - parseFloat(formData.price)).toFixed(2)}
          </Text>
          <Text style={styles.discountText}>
            ({(((parseFloat(formData.mrp) - parseFloat(formData.price)) / parseFloat(formData.mrp)) * 100).toFixed(1)}% off)
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
          placeholder="Describe your product features, specifications, etc."
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{formData.description.length}/500</Text>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips for better sales:</Text>
        <Text style={styles.tip}>• Use clear, descriptive product names</Text>
        <Text style={styles.tip}>• Add model/brand for electronics</Text>
        <Text style={styles.tip}>• Competitive pricing attracts customers</Text>
        <Text style={styles.tip}>• Detailed descriptions build trust</Text>
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
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  priceComparison: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  savingsText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  discountText: {
    fontSize: 12,
    color: '#047857',
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

export default BasicInfoComponent;
