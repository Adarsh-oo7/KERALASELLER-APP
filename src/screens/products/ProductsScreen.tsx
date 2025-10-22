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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProductService from '../../services/ProductService';
import { ApiError } from '../../types/api';

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
        filtered = filtered.filter(product => product.online_stock > 0 && product.online_stock <= 5);
        break;
      case 'out_of_stock':
        filtered = filtered.filter(product => product.online_stock <= 0);
        break;
      case 'in_stock':
        filtered = filtered.filter(product => product.online_stock > 5);
        break;
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'price':
          aValue = parseFloat(a.price || '0');
          bValue = parseFloat(b.price || '0');
          break;
        case 'stock':
          aValue = parseInt(a.online_stock?.toString() || '0');
          bValue = parseInt(b.online_stock?.toString() || '0');
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterType, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDelete = async (productId: number): Promise<void> => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(productId);
            try {
              await ProductService.deleteProduct(productId);
              fetchProducts();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const getStockStatus = (onlineStock: number) => {
    if (onlineStock <= 0) return { label: 'Out', color: '#ef4444', bgColor: '#fee2e2' };
    if (onlineStock <= 5) return { label: 'Low', color: '#f59e0b', bgColor: '#fef3c7' };
    return { label: 'Stock', color: '#10b981', bgColor: '#d1fae5' };
  };

  const getFilterCounts = () => {
    return {
      all: products.length,
      low_stock: products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length,
      out_of_stock: products.filter(p => p.online_stock <= 0).length,
      in_stock: products.filter(p => p.online_stock > 5).length
    };
  };

  const getAnalytics = () => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => 
      sum + (parseFloat(p.price || '0') * parseInt(p.online_stock?.toString() || '0')), 0
    );
    const averagePrice = totalProducts > 0 
      ? products.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0) / totalProducts 
      : 0;
    const lowStockCount = products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length;

    return { totalProducts, totalValue, averagePrice, lowStockCount };
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderAnalytics = () => {
    const analytics = getAnalytics();
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.analyticsContainer}
        contentContainerStyle={styles.analyticsContent}
      >
        <View style={styles.analyticsCard}>
          <Ionicons name="cube" size={18} color="#3b82f6" />
          <Text style={styles.analyticsLabel}>Products</Text>
          <Text style={styles.analyticsValue}>{analytics.totalProducts}</Text>
        </View>

        <View style={styles.analyticsCard}>
          <Ionicons name="cash" size={18} color="#10b981" />
          <Text style={styles.analyticsLabel}>Value</Text>
          <Text style={styles.analyticsValue}>
            ₹{analytics.totalValue >= 1000 
              ? (analytics.totalValue / 1000).toFixed(1) + 'k' 
              : Math.round(analytics.totalValue)}
          </Text>
        </View>

        <View style={styles.analyticsCard}>
          <Ionicons name="trending-up" size={18} color="#f59e0b" />
          <Text style={styles.analyticsLabel}>Avg</Text>
          <Text style={styles.analyticsValue}>
            ₹{Math.round(analytics.averagePrice)}
          </Text>
        </View>

        <View style={styles.analyticsCard}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.analyticsLabel}>Low</Text>
          <Text style={styles.analyticsValue}>{analytics.lowStockCount}</Text>
        </View>
      </ScrollView>
    );
  };

  const renderSortButton = () => (
    <View style={styles.sortButtonContainer}>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortMenu(!showSortMenu)}
      >
        <Ionicons name="swap-vertical" size={16} color="#6b7280" />
        <Text style={styles.sortButtonText}>
          {sortBy === 'name' ? 'Name' : sortBy === 'price' ? 'Price' : 'Stock'}
        </Text>
        <Ionicons 
          name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
          size={16} 
          color="#6b7280" 
        />
      </TouchableOpacity>

      {showSortMenu && (
        <View style={styles.sortMenu}>
          <TouchableOpacity
            style={[styles.sortMenuItem, sortBy === 'name' && styles.sortMenuItemActive]}
            onPress={() => { setSortBy('name'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortMenuItemText}>Name</Text>
            {sortBy === 'name' && <Ionicons name="checkmark" size={16} color="#3b82f6" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortMenuItem, sortBy === 'price' && styles.sortMenuItemActive]}
            onPress={() => { setSortBy('price'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortMenuItemText}>Price</Text>
            {sortBy === 'price' && <Ionicons name="checkmark" size={16} color="#3b82f6" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortMenuItem, sortBy === 'stock' && styles.sortMenuItemActive]}
            onPress={() => { setSortBy('stock'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortMenuItemText}>Stock</Text>
            {sortBy === 'stock' && <Ionicons name="checkmark" size={16} color="#3b82f6" />}
          </TouchableOpacity>

          <View style={styles.sortMenuDivider} />

          <TouchableOpacity
            style={styles.sortMenuItem}
            onPress={() => { toggleSortOrder(); setShowSortMenu(false); }}
          >
            <Text style={styles.sortMenuItemText}>
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Text>
            <Ionicons 
              name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color="#3b82f6" 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const stockStatus = getStockStatus(item.online_stock);
    const isDeleting = deletingId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => navigation.navigate('ProductDetails', { 
          productId: item.id.toString(), 
          product: item 
        })}
      >
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={styles.imageContainer}>
              <Image 
                source={{ 
                  uri: item.main_image_url || item.image_url || 'https://via.placeholder.com/70x70/e9ecef/6c757d?text=No+Image'
                }} 
                style={styles.productImage}
              />
              <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
                <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                  {stockStatus.label}
                </Text>
              </View>
            </View>
            
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name || 'Unnamed Product'}
              </Text>
              {item.model_name && (
                <Text style={styles.modelName} numberOfLines={1}>
                  {item.model_name}
                </Text>
              )}
              
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  ₹{parseFloat(item.price || '0').toLocaleString('en-IN')}
                </Text>
                {item.mrp && parseFloat(item.mrp) > parseFloat(item.price) && (
                  <Text style={styles.mrp}>
                    ₹{parseFloat(item.mrp).toLocaleString('en-IN')}
                  </Text>
                )}
              </View>

              <Text style={styles.stockText}>
                Stock: {item.online_stock || 0} / {item.total_stock || 0}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('AddProduct', { product: item });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color="white" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              {isDeleting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterTabs = () => {
    const filterCounts = getFilterCounts();
    const filters = [
      { key: 'all', label: `All (${filterCounts.all})` },
      { key: 'in_stock', label: `In Stock (${filterCounts.in_stock})` },
      { key: 'low_stock', label: `Low (${filterCounts.low_stock})` },
      { key: 'out_of_stock', label: `Out (${filterCounts.out_of_stock})` },
    ] as const;

    return (
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                filterType === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setFilterType(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                filterType === filter.key && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#9ca3af" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>
        {searchTerm || filterType !== 'all' ? 'No products found' : 'No Products Yet'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchTerm || filterType !== 'all'
          ? 'Try adjusting your filters'
          : 'Add your first product to get started'}
      </Text>
      
      {searchTerm || filterType !== 'all' ? (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => {
            setSearchTerm('');
            setFilterType('all');
          }}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Error Loading Products</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Products ({filteredProducts.length})</Text>
          <Text style={styles.subtitle}>Manage inventory</Text>
        </View>
        <TouchableOpacity 
          style={styles.addProductButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addProductButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {products.length > 0 && renderAnalytics()}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {products.length > 0 && renderSortButton()}

      {renderFilterTabs()}

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={filteredProducts.length === 0 ? styles.emptyListContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    gap: 16 
  },
  loadingText: { 
    fontSize: 15, 
    color: '#6b7280',
    fontWeight: '500'
  },
  
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: '#f8fafc', 
    gap: 16 
  },
  errorTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#ef4444',
    marginTop: 8
  },
  errorMessage: { 
    fontSize: 15, 
    color: '#6b7280', 
    textAlign: 'center',
    lineHeight: 22
  },
  retryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10, 
    gap: 8,
    marginTop: 8
  },
  retryButtonText: { 
    color: 'white', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  
  headerInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  headerContent: { 
    flex: 1 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1f2937', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 13, 
    color: '#6b7280',
    fontWeight: '500'
  },
  addProductButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 10, 
    gap: 6 
  },
  addProductButtonText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  
  analyticsContainer: { 
    marginHorizontal: 16, 
    marginTop: 8,
    marginBottom: 16,
  },
  analyticsContent: { 
    gap: 12, 
    paddingRight: 16,
  },
  analyticsCard: { 
    backgroundColor: 'white', 
    paddingVertical: 8,   
    paddingHorizontal: 16,
    borderRadius: 10, 
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  analyticsLabel: { 
    fontSize: 10, 
    color: '#6b7280', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    textAlign: 'center',
    fontWeight: '600',
  },
  analyticsValue: { 
    fontSize: 15,
    fontWeight: '700', 
    color: '#1f2937',
    textAlign: 'center',
  },

  sortButtonContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', 
    position: 'relative' 
  },
  sortButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    backgroundColor: '#f9fafb', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 10, 
    alignSelf: 'flex-start' 
  },
  sortButtonText: { 
    fontSize: 14, 
    color: '#374151', 
    fontWeight: '600' 
  },
  sortMenu: { 
    position: 'absolute', 
    top: 56, 
    left: 16, 
    backgroundColor: 'white', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 5, 
    zIndex: 1000, 
    minWidth: 160 
  },
  sortMenuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    paddingHorizontal: 16 
  },
  sortMenuItemActive: { 
    backgroundColor: '#eff6ff' 
  },
  sortMenuItemText: { 
    fontSize: 14, 
    color: '#374151',
    fontWeight: '500'
  },
  sortMenuDivider: { 
    height: 1, 
    backgroundColor: '#e5e7eb', 
    marginVertical: 4 
  },
  
  searchContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  searchInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 10, 
    backgroundColor: '#f9fafb', 
    paddingHorizontal: 12,
    height: 44
  },
  searchIcon: { 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    color: '#374151',
    paddingVertical: 0
  },
  clearSearchButton: { 
    padding: 4 
  },
  
  filterContainer: { 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', 
    paddingVertical: 12 
  },
  filterScrollContainer: { 
    paddingHorizontal: 16, 
    gap: 8 
  },
  filterTab: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#f3f4f6', 
    minWidth: 80 
  },
  activeFilterTab: { 
    backgroundColor: '#3b82f6' 
  },
  filterTabText: { 
    fontSize: 12, 
    color: '#6b7280', 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  activeFilterTabText: { 
    color: 'white' 
  },
  
  listContainer: { 
    padding: 16, 
    paddingBottom: 32 
  },
  emptyListContainer: { 
    flex: 1 
  },
  
  productCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  productHeader: { 
    flexDirection: 'row', 
    marginBottom: 12 
  },
  
  imageContainer: { 
    position: 'relative', 
    marginRight: 14 
  },
  productImage: { 
    width: 72, 
    height: 72, 
    borderRadius: 36,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  stockBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  stockBadgeText: { 
    fontSize: 9, 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  
  productInfo: { 
    flex: 1, 
    justifyContent: 'space-between' 
  },
  productName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1f2937', 
    marginBottom: 4, 
    lineHeight: 22 
  },
  modelName: { 
    fontSize: 12, 
    color: '#6b7280', 
    marginBottom: 6,
    fontWeight: '500'
  },
  priceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 4 
  },
  price: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#059669' 
  },
  mrp: { 
    fontSize: 12, 
    color: '#9ca3af', 
    textDecorationLine: 'line-through',
    fontWeight: '500'
  },
  stockText: { 
    fontSize: 12, 
    color: '#6b7280',
    fontWeight: '500'
  },
  
  actionButtons: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 6 
  },
  editButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#6b7280', 
    paddingVertical: 10, 
    borderRadius: 10, 
    gap: 6 
  },
  editButtonText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  deleteButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ef4444', 
    paddingVertical: 10, 
    borderRadius: 10, 
    gap: 6 
  },
  deleteButtonDisabled: { 
    opacity: 0.6 
  },
  deleteButtonText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40 
  },
  emptyIcon: { 
    marginBottom: 16 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  emptyDescription: { 
    fontSize: 14, 
    color: '#6b7280', 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 24,
    paddingHorizontal: 20
  },
  clearButton: { 
    backgroundColor: '#6b7280', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  clearButtonText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10, 
    gap: 8 
  },
  addButtonText: { 
    color: 'white', 
    fontSize: 15, 
    fontWeight: '600' 
  },
});

export default ProductsScreen;