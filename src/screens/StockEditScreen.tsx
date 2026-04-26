import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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

export default function StockEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { productId } = route.params ?? {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (!productId) { navigation.goBack(); return; }
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await apiClient.get(`/api/products/${productId}/`);
      const p = response.data;
      setProduct(p);
      setStock(String(p.stock ?? ''));
      setPrice(String(p.price ?? ''));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load product.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!stock || isNaN(Number(stock))) { Alert.alert('Error', 'Enter a valid stock number.'); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('Error', 'Enter a valid price.'); return; }
    setSaving(true);
    try {
      await apiClient.patch(`/api/products/${productId}/`, {
        stock: parseInt(stock, 10),
        price: parseFloat(price),
      });
      Alert.alert('Updated!', 'Stock and price updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Stock</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.productName}>{product?.name}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholder="Enter stock"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="Enter price"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  content: { padding: 24 },
  productName: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 16,
    color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
