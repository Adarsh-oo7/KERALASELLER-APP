import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

const COLORS = {
  primary: '#2B4B39',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1D1D1F',
  textSecondary: '#86868B',
  border: '#E5E5EA',
  error: '#C0392B',
};

export default function ProductFormScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    unit: 'kg',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price.trim() || isNaN(Number(form.price))) e.price = 'Valid price is required';
    if (!form.stock.trim() || isNaN(Number(form.stock))) e.stock = 'Valid stock quantity is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiClient.post('/api/products/', {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        unit: form.unit,
      });
      Alert.alert('Success', 'Product added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Failed to add product';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, placeholder, keyboardType = 'default', multiline = false }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, errors[field] && styles.inputError]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        value={form[field as keyof typeof form]}
        onChangeText={(v) => {
          setForm((prev) => ({ ...prev, [field]: v }));
          if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
        }}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Product</Text>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Field label="Product Name *" field="name" placeholder="e.g. Fresh Tomatoes" />
          <Field label="Description" field="description" placeholder="Brief description..." multiline />
          <Field label="Price (₹) *" field="price" placeholder="0.00" keyboardType="decimal-pad" />
          <Field label="Stock Quantity *" field="stock" placeholder="e.g. 100" keyboardType="numeric" />
          <Field label="Unit" field="unit" placeholder="e.g. kg, litre, piece" />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                <Text style={styles.submitText}>Add Product</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 55, paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  form: { padding: 20, paddingBottom: 40 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputMultiline: { height: 100, paddingTop: 12 },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 14,
    marginTop: 8,
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
