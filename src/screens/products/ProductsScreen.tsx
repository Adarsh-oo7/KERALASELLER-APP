import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProductService from '../../services/ProductService';
import { ApiError } from '../../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProductsScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface Product {
  id: number;
  name: string;
  model_name?: string;
  price: string;
  mrp?: string;
  online_stock: number;
  total_stock: number;
  sale_type: string;
  main_image_url?: string;
  image_url?: string;
  sku?: string;
}

const ProductsScreen: React.FC<ProductsScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setError('');
      const response = await ProductService.getProducts();
      let productsData: Product[] = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        productsData = response.data.results;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error: any) {
      const apiError = error as ApiError;
      if (apiError.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(apiError.message || 'Failed to load products');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let filtered = [...products];
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    switch (filterType) {
      case 'low_stock':
        filtered = filtered.filter(p => p.online_stock > 0 && p.online_stock <= 5);
        break;
      case 'out_of_stock':
        filtered = filtered.filter(p => p.online_stock <= 0);
        break;
      case 'in_stock':
        filtered = filtered.filter(p => p.online_stock > 5);
        break;
    }
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'price':
          aValue = parseFloat(a.price || '0');
          bValue = parseFloat(b.price || '0');
          break;
        case 'stock':
          aValue = a.online_stock ?? 0;
          bValue = b.online_stock ?? 0;
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredProducts(filtered);
  }, [products, searchTerm, filterType, sortBy, sortOrder]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const handleDelete = (productId: number) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingId(productId);
          try {
            await ProductService.deleteProduct(productId);
            fetchProducts();
          } catch {
            Alert.alert('Error', 'Failed to delete product');
          } finally {
            setDeletingId(null);
          }
        }
      }
    ]);
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Out of Stock', color: '#dc2626', bgColor: '#fef2f2', dot: '#dc2626' };
    if (stock <= 5) return { label: 'Low Stock', color: '#d97706', bgColor: '#fffbeb', dot: '#f59e0b' };
    return { label: 'In Stock', color: '#059669', bgColor: '#f0fdf4', dot: '#10b981' };
  };

  const getFilterCounts = () => ({
    all: products.length,
    low_stock: products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length,
    out_of_stock: products.filter(p => p.online_stock <= 0).length,
    in_stock: products.filter(p => p.online_stock > 5).length,
  });

  const getAnalytics = () => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) =>
      sum + (parseFloat(p.price || '0') * (p.online_stock ?? 0)), 0);
    const averagePrice = totalProducts > 0
      ? products.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0) / totalProducts : 0;
    const lowStockCount = products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length;
    return { totalProducts, totalValue, averagePrice, lowStockCount };
  };

  // ── Analytics Row ──────────────────────────────────────────────
  const renderAnalytics = () => {
    const { totalProducts, totalValue, averagePrice, lowStockCount } = getAnalytics();
    const cards = [
      { icon: 'cube-outline' as const, color: '#3b82f6', bg: '#eff6ff', label: 'Products', value: totalProducts.toString() },
      { icon: 'cash-outline' as const, color: '#059669', bg: '#f0fdf4', label: 'Inv. Value', value: totalValue >= 1000 ? `₹${(totalValue / 1000).toFixed(1)}k` : `₹${Math.round(totalValue)}` },
      { icon: 'trending-up-outline' as const, color: '#d97706', bg: '#fffbeb', label: 'Avg Price', value: `₹${Math.round(averagePrice)}` },
      { icon: 'alert-circle-outline' as const, color: '#dc2626', bg: '#fef2f2', label: 'Low Stock', value: lowStockCount.toString() },
    ];
    return (
      <View style={styles.analyticsRow}>
        {cards.map((card, i) => (
          <View key={i} style={[styles.analyticsCard, { backgroundColor: card.bg }]}>
            <View style={[styles.analyticsIconWrap, { backgroundColor: card.color + '20' }]}>
              <Ionicons name={card.icon} size={16} color={card.color} />
            </View>
            <Text style={styles.analyticsValue}>{card.value}</Text>
            <Text style={styles.analyticsLabel}>{card.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ── Filter + Sort Bar ──────────────────────────────────────────
  const renderFilterSortBar = () => {
    const counts = getFilterCounts();
    const filters = [
      { key: 'all' as const, label: `All`, count: counts.all },
      { key: 'in_stock' as const, label: `In Stock`, count: counts.in_stock },
      { key: 'low_stock' as const, label: `Low`, count: counts.low_stock },
      { key: 'out_of_stock' as const, label: `Out`, count: counts.out_of_stock },
    ];
    return (
      <View style={styles.filterSortBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filterType === f.key && styles.filterChipActive]}
              onPress={() => setFilterType(f.key)}
            >
              <Text style={[styles.filterChipText, filterType === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.filterBadge, filterType === f.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, filterType === f.key && styles.filterBadgeTextActive]}>
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort button on same row */}
        <View style={styles.sortWrap}>
          <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSortMenu(v => !v)}>
            <Ionicons name="funnel-outline" size={14} color="#6b7280" />
            <Text style={styles.sortBtnText}>
              {sortBy === 'name' ? 'Name' : sortBy === 'price' ? 'Price' : 'Stock'}
            </Text>
            <Ionicons name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={12} color="#6b7280" />
          </TouchableOpacity>
          {showSortMenu && (
            <View style={styles.sortMenu}>
              {(['name', 'price', 'stock'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sortItem, sortBy === s && styles.sortItemActive]}
                  onPress={() => { setSortBy(s); setShowSortMenu(false); }}
                >
                  <Text style={[styles.sortItemText, sortBy === s && styles.sortItemTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                  {sortBy === s && <Ionicons name="checkmark" size={14} color="#3b82f6" />}
                </TouchableOpacity>
              ))}
              <View style={styles.sortDivider} />
              <TouchableOpacity
                style={styles.sortItem}
                onPress={() => { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); setShowSortMenu(false); }}
              >
                <Text style={styles.sortItemText}>{sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── Product Card ───────────────────────────────────────────────
  const renderProduct = ({ item }: { item: Product }) => {
    const stock = getStockStatus(item.online_stock);
    const isDeleting = deletingId === item.id;
    const discount = item.mrp && parseFloat(item.mrp) > parseFloat(item.price)
      ? Math.round(((parseFloat(item.mrp) - parseFloat(item.price)) / parseFloat(item.mrp)) * 100)
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.id.toString(), product: item })}
      >
        {/* Left: Image */}
        <Image
          source={{ uri: item.main_image_url || item.image_url || 'https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=No+Img' }}
          style={styles.cardImage}
        />

        {/* Center: Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name || 'Unnamed Product'}</Text>
          {item.model_name ? (
            <Text style={styles.cardModel} numberOfLines={1}>{item.model_name}</Text>
          ) : null}

          {/* Price row */}
          <View style={styles.cardPriceRow}>
            <Text style={styles.cardPrice}>₹{parseFloat(item.price || '0').toLocaleString('en-IN')}</Text>
            {item.mrp && parseFloat(item.mrp) > parseFloat(item.price) && (
              <Text style={styles.cardMrp}>₹{parseFloat(item.mrp).toLocaleString('en-IN')}</Text>
            )}
            {discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% off</Text>
              </View>
            )}
          </View>

          {/* Stock row */}
          <View style={styles.cardStockRow}>
            <View style={[styles.stockDot, { backgroundColor: stock.dot }]} />
            <Text style={[styles.cardStockLabel, { color: stock.color }]}>{stock.label}</Text>
            <Text style={styles.cardStockCount}> · {item.online_stock}/{item.total_stock}</Text>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionEdit}
            onPress={e => { e.stopPropagation(); navigation.navigate('AddProduct', { product: item }); }}
          >
            <Ionicons name="pencil" size={14} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionDelete, isDeleting && { opacity: 0.5 }]}
            onPress={e => { e.stopPropagation(); handleDelete(item.id); }}
            disabled={isDeleting}
          >
            {isDeleting
              ? <ActivityIndicator size="small" color="#dc2626" />
              : <Ionicons name="trash" size={14} color="#dc2626" />
            }
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Empty State ────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="cube-outline" size={40} color="#9ca3af" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchTerm || filterType !== 'all' ? 'No products found' : 'No Products Yet'}
      </Text>
      <Text style={styles.emptyDesc}>
        {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filters' : 'Add your first product to get started'}
      </Text>
      {searchTerm || filterType !== 'all' ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={() => { setSearchTerm(''); setFilterType('all'); }}>
          <Text style={styles.emptyBtnText}>Clear Filters</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: '#3b82f6' }]} onPress={() => navigation.navigate('AddProduct')}>
          <Ionicons name="add" size={16} color="white" />
          <Text style={[styles.emptyBtnText, { color: 'white' }]}>Add Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Loading products...</Text>
    </View>
  );

  // ── Error ──────────────────────────────────────────────────────
  if (error) return (
    <View style={styles.centered}>
      <View style={styles.errorIconWrap}>
        <Ionicons name="cloud-offline-outline" size={40} color="#dc2626" />
      </View>
      <Text style={styles.errorTitle}>Couldn't Load Products</Text>
      <Text style={styles.errorMsg}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
        <Ionicons name="refresh" size={16} color="white" />
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Main ───────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Products</Text>
          <Text style={styles.headerSub}>{filteredProducts.length} of {products.length} items</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Analytics */}
      {products.length > 0 && renderAnalytics()}

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, model or SKU..."
          placeholderTextColor="#9ca3af"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter + Sort */}
      {renderFilterSortBar()}

      {/* List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        contentContainerStyle={filteredProducts.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },

  // Loading / Error
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24, backgroundColor: '#f1f5f9' },
  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  errorIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  errorMsg: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
  retryBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#9ca3af', marginTop: 2, fontWeight: '500' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },

  // Analytics — 4-column fixed grid
  analyticsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  analyticsCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  analyticsIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  analyticsValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
  analyticsLabel: { fontSize: 9, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb',
    paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#374151', paddingVertical: 0 },

  // Filter + Sort bar
  filterSortBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  filterScrollContent: { paddingLeft: 12, paddingRight: 8, gap: 6 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  filterChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  filterChipText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  filterChipTextActive: { color: 'white' },
  filterBadge: { backgroundColor: '#e5e7eb', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterBadgeText: { fontSize: 10, color: '#6b7280', fontWeight: '700' },
  filterBadgeTextActive: { color: 'white' },

  // Sort
  sortWrap: { paddingRight: 12, paddingLeft: 4, position: 'relative' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  sortBtnText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  sortMenu: { position: 'absolute', top: 36, right: 0, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6, zIndex: 999, minWidth: 140 },
  sortItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14 },
  sortItemActive: { backgroundColor: '#eff6ff' },
  sortItemText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  sortItemTextActive: { color: '#3b82f6', fontWeight: '700' },
  sortDivider: { height: 1, backgroundColor: '#f3f4f6' },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#f3f4f6' },
  cardBody: { flex: 1, gap: 3, minWidth: 0 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 18 },
  cardModel: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: '800', color: '#059669' },
  cardMrp: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through', fontWeight: '500' },
  discountBadge: { backgroundColor: '#fef3c7', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  discountText: { fontSize: 10, color: '#d97706', fontWeight: '700' },
  cardStockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  stockDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  cardStockLabel: { fontSize: 11, fontWeight: '600' },
  cardStockCount: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },

  // Card actions (right column)
  cardActions: { gap: 8, alignItems: 'center' },
  actionEdit: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  actionDelete: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },

  // List
  listContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 28 },
  emptyContainer: { flex: 1 },

  // Empty
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 10 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 6 },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});

export default ProductsScreen;
