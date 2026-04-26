import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';

const COLORS = {
  primary: '#2B4B39',
  primaryLight: '#3A5D47',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1D1D1F',
  textSecondary: '#86868B',
  error: '#C0392B',
  border: '#E5E5EA',
};

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  category_name?: string;
  is_active: boolean;
}

export default function ProductListScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/products/');
      setProducts(response.data?.results ?? response.data ?? []);
    } catch (error: any) {
      if (__DEV__) console.error('Products fetch error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/products/${id}/`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete product.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconBox}>
          <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productMeta}>₹{item.price}  •  Stock: {item.stock}</Text>
          {item.category_name ? (
            <Text style={styles.categoryTag}>{item.category_name}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditStock', { productId: item.id })}
        >
          <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Products</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Products Yet</Text>
          <Text style={styles.emptyText}>Tap the + button to add your first product.</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <Text style={styles.emptyAddBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 55, paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  addBtn: {
    backgroundColor: COLORS.primaryLight,
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 15 },
  listContent: { padding: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EBF2EE',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  productMeta: { fontSize: 13, color: COLORS.textSecondary },
  categoryTag: {
    marginTop: 4, fontSize: 11, color: COLORS.primary,
    backgroundColor: '#EBF2EE', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99,
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#EBF2EE',
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FDECEA',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 240, marginBottom: 24 },
  emptyAddBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13, paddingHorizontal: 32,
    borderRadius: 12,
  },
  emptyAddBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
});
