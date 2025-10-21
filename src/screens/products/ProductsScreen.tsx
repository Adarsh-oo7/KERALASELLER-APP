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
  Switch,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProductService from '../../services/ProductService';
import SubscriptionService from '../../services/SubscriptionService';
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
  is_subscription_controlled?: boolean;
  online_activated_at?: string;
}

const ProductsScreen: React.FC<ProductsScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);
  
  // ✅ NEW: Sort states
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      console.log('🔍 Fetching products and subscription info...');
      setError('');
      
      const response = await ProductService.getProducts();
      console.log('✅ Products response:', response.data);
      
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
      console.log(`📦 Found ${productsData.length} products`);

      try {
        const subscriptionResponse = await SubscriptionService.getCurrentSubscription();
        console.log('✅ Subscription info loaded:', subscriptionResponse.data);
        setSubscriptionInfo(subscriptionResponse.data);
      } catch (subError: any) {
        console.log('⚠️ No subscription found (this is normal for new users):', subError.response?.status);
        setSubscriptionInfo(null);
      }

    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error);
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

  const handleToggleSubscriptionControl = async (product: Product): Promise<void> => {
    const newStatus = !product.is_subscription_controlled;
    
    if (newStatus && subscriptionInfo && subscriptionInfo.is_active) {
      const activeCount = products.filter(p => p.is_subscription_controlled && p.online_stock > 0).length;
      const limit = subscriptionInfo.plan.product_limit;
      
      if (limit && activeCount >= limit && !product.is_subscription_controlled) {
        Alert.alert(
          'Subscription Limit Reached',
          `Your ${subscriptionInfo.plan.name} plan allows maximum ${limit} products online. Upgrade your plan to activate more products.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade Plan', 
              onPress: () => navigation.navigate('Subscription')
            }
          ]
        );
        return;
      }
    }

    if (newStatus && !subscriptionInfo?.is_active) {
      Alert.alert(
        'Subscription Required',
        'You need an active subscription to enable online selling for products.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get Plan', 
            onPress: () => navigation.navigate('Subscription')
          }
        ]
      );
      return;
    }

    Alert.alert(
      newStatus ? 'Enable Online Selling' : 'Disable Online Selling',
      newStatus 
        ? `Enable "${product.name}" for online selling?`
        : `Remove "${product.name}" from online store?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus ? 'Enable' : 'Disable',
          onPress: () => toggleProductSubscriptionControl(product, newStatus)
        }
      ]
    );
  };

  const toggleProductSubscriptionControl = async (product: Product, isActive: boolean): Promise<void> => {
    setToggleLoading(product.id);
    
    try {
      const response = await ProductService.toggleSubscriptionControl(product.id, isActive);

      if (response.data.success) {
        setProducts(prev => 
          prev.map(p => 
            p.id === product.id 
              ? { 
                  ...p, 
                  is_subscription_controlled: response.data.is_subscription_controlled,
                  online_activated_at: response.data.online_activated_at
                }
              : p
          )
        );
        
        Alert.alert('Success', response.data.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update product status';
      Alert.alert('Error', errorMessage);
    } finally {
      setToggleLoading(null);
    }
  };

  // ✅ ENHANCED: Apply filters, search, AND sorting
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply stock filter
    switch (filterType) {
      case 'low_stock':
        filtered = filtered.filter(product => 
          product.online_stock > 0 && product.online_stock <= 5
        );
        break;
      case 'out_of_stock':
        filtered = filtered.filter(product => 
          product.online_stock <= 0
        );
        break;
      case 'in_stock':
        filtered = filtered.filter(product => 
          product.online_stock > 5
        );
        break;
      default:
        break;
    }

    // ✅ NEW: Apply sorting
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
        default: // name
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

  // ✅ NEW: Refresh on screen focus
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
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(productId);
            try {
              await ProductService.deleteProduct(productId);
              console.log(`✅ Product ${productId} deleted successfully`);
              fetchProducts();
            } catch (error: any) {
              console.error('❌ Failed to delete product:', error);
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const formatSaleType = (type: string): string => {
    const types: { [key: string]: string } = {
      'BOTH': 'Online & Store',
      'ONLINE': 'Online Only',
      'OFFLINE': 'Store Only',
      'ONLINE_AND_OFFLINE': 'Online & Store',
      'OFFLINE_ONLY': 'Store Only',
      'ONLINE_ONLY': 'Online Only'
    };
    return types[type] || type;
  };

  const getStockStatus = (onlineStock: number) => {
    if (onlineStock <= 0) return { label: 'Out of Stock', color: '#ef4444', bgColor: '#fee2e2' };
    if (onlineStock <= 5) return { label: 'Low Stock', color: '#f59e0b', bgColor: '#fef3c7' };
    return { label: 'In Stock', color: '#10b981', bgColor: '#d1fae5' };
  };

  const getFilterCounts = () => {
    return {
      all: products.length,
      low_stock: products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length,
      out_of_stock: products.filter(p => p.online_stock <= 0).length,
      in_stock: products.filter(p => p.online_stock > 5).length
    };
  };

  // ✅ NEW: Analytics calculation
  const getAnalytics = () => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => 
      sum + (parseFloat(p.price || '0') * parseInt(p.online_stock?.toString() || '0')), 0
    );
    const averagePrice = totalProducts > 0 
      ? products.reduce((sum, p) => sum + parseFloat(p.price || '0'), 0) / totalProducts 
      : 0;
    const lowStockCount = products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length;
    const onlineProducts = products.filter(p => p.is_subscription_controlled && p.online_stock > 0).length;

    return {
      totalProducts,
      totalValue,
      averagePrice,
      lowStockCount,
      onlineProducts,
    };
  };

  // ✅ NEW: Sort menu toggle
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderSubscriptionBanner = () => {
    if (!subscriptionInfo) {
      return (
        <View style={styles.subscriptionWarning}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Get Subscription to Sell Online</Text>
            <Text style={styles.warningText}>Enable products for online selling</Text>
          </View>
          <TouchableOpacity 
            style={styles.getSubscriptionButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.getSubscriptionButtonText}>Get Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (subscriptionInfo.is_active) {
      const activeOnlineProducts = products.filter(p => p.is_subscription_controlled && p.online_stock > 0).length;
      const limit = subscriptionInfo.plan.product_limit || 'Unlimited';
      
      return (
        <View style={styles.subscriptionActive}>
          <Text style={styles.activeIcon}>👑</Text>
          <View style={styles.activeContent}>
            <Text style={styles.activeTitle}>{subscriptionInfo.plan.name} Plan Active</Text>
            <Text style={styles.activeText}>
              {activeOnlineProducts}/{limit} products online
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ✅ NEW: Analytics Cards Component
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
          <View style={styles.analyticsIcon}>
            <Ionicons name="cube" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.analyticsLabel}>Total Products</Text>
          <Text style={styles.analyticsValue}>{analytics.totalProducts}</Text>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsIcon}>
            <Ionicons name="cash" size={20} color="#10b981" />
          </View>
          <Text style={styles.analyticsLabel}>Inventory Value</Text>
          <Text style={styles.analyticsValue}>₹{Math.round(analytics.totalValue).toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsIcon}>
            <Ionicons name="trending-up" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.analyticsLabel}>Avg Price</Text>
          <Text style={styles.analyticsValue}>₹{Math.round(analytics.averagePrice).toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsIcon}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
          </View>
          <Text style={styles.analyticsLabel}>Low Stock</Text>
          <Text style={styles.analyticsValue}>{analytics.lowStockCount}</Text>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsIcon}>
            <Ionicons name="globe" size={20} color="#8b5cf6" />
          </View>
          <Text style={styles.analyticsLabel}>Online</Text>
          <Text style={styles.analyticsValue}>{analytics.onlineProducts}</Text>
        </View>
      </ScrollView>
    );
  };

  // ✅ NEW: Sort Button Component
  const renderSortButton = () => (
    <View style={styles.sortButtonContainer}>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortMenu(!showSortMenu)}
      >
        <Ionicons name="swap-vertical" size={16} color="#6b7280" />
        <Text style={styles.sortButtonText}>
          Sort: {sortBy === 'name' ? 'Name' : sortBy === 'price' ? 'Price' : 'Stock'}
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
            <Text style={styles.sortMenuItemText}>Sort by Name</Text>
            {sortBy === 'name' && <Ionicons name="checkmark" size={16} color="#3b82f6" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortMenuItem, sortBy === 'price' && styles.sortMenuItemActive]}
            onPress={() => { setSortBy('price'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortMenuItemText}>Sort by Price</Text>
            {sortBy === 'price' && <Ionicons name="checkmark" size={16} color="#3b82f6" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortMenuItem, sortBy === 'stock' && styles.sortMenuItemActive]}
            onPress={() => { setSortBy('stock'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortMenuItemText}>Sort by Stock</Text>
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

  // ✅ UPDATED: Product card with tap-to-view
  const renderProduct = ({ item }: { item: Product }) => {
    const stockStatus = getStockStatus(item.online_stock);
    const isDeleting = deletingId === item.id;
    const isToggling = toggleLoading === item.id;

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
            <Image 
              source={{ 
                uri: item.main_image_url || item.image_url || 'https://via.placeholder.com/80x80/e9ecef/6c757d?text=No+Image'
              }} 
              style={styles.productImage}
              onError={() => console.log('Image load error for product:', item.id)}
            />
            
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name || 'Unnamed Product'}
              </Text>
              {item.model_name && (
                <Text style={styles.modelName} numberOfLines={1}>
                  Model: {item.model_name}
                </Text>
              )}
              {item.sku && (
                <Text style={styles.sku}>SKU: {item.sku}</Text>
              )}
              
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  ₹{parseFloat(item.price || '0').toLocaleString('en-IN')}
                </Text>
                {item.mrp && parseFloat(item.mrp) > parseFloat(item.price) && (
                  <Text style={styles.mrp}>
                    ₹{parseFloat(item.mrp).toLocaleString('en-IN')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.productDetails}>
            <View style={styles.stockContainer}>
              <Text style={styles.stockLabel}>Stock (Online/Total)</Text>
              <Text style={styles.stockValue}>
                {item.online_stock || 0} / {item.total_stock || 0}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: stockStatus.bgColor }
              ]}>
                <Text style={[styles.statusText, { color: stockStatus.color }]}>
                  {stockStatus.label}
                </Text>
              </View>
              
              <View style={styles.saleTypeBadge}>
                <Text style={styles.saleTypeText}>
                  {formatSaleType(item.sale_type)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.subscriptionControl}>
            <View style={styles.subscriptionControlLeft}>
              <Text style={styles.controlLabel}>Sell Online</Text>
              {item.is_subscription_controlled && item.online_stock > 0 && (
                <Text style={styles.onlineActiveText}>✅ Available Online</Text>
              )}
            </View>
            
            <View style={styles.subscriptionControlRight}>
              {isToggling ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Switch
                  value={item.is_subscription_controlled && item.online_stock > 0}
                  onValueChange={() => handleToggleSubscriptionControl(item)}
                  trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
                  thumbColor={'#ffffff'}
                  disabled={!subscriptionInfo?.is_active}
                />
              )}
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
      { key: 'low_stock', label: `Low Stock (${filterCounts.low_stock})` },
      { key: 'out_of_stock', label: `Out of Stock (${filterCounts.out_of_stock})` },
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
      <Ionicons 
        name="cube-outline" 
        size={64} 
        color="#9ca3af" 
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {searchTerm || filterType !== 'all' 
          ? 'No products match your filters' 
          : 'No Products Found'}
      </Text>
      <Text style={styles.emptyDescription}>
        {searchTerm || filterType !== 'all'
          ? 'Try adjusting your search terms or filters to find products.'
          : 'You haven\'t added any products to your store yet. Start by adding your first product!'}
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
          <Text style={styles.addButtonText}>Add Your First Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your products...</Text>
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
          <Ionicons name="refresh" size={16} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Products ({filteredProducts.length})</Text>
          <Text style={styles.subtitle}>Manage your product inventory</Text>
        </View>
        <TouchableOpacity 
          style={styles.addProductButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addProductButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {renderSubscriptionBanner()}

      {/* ✅ NEW: Analytics Cards */}
      {products.length > 0 && renderAnalytics()}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name, model, or SKU..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchTerm('')}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ✅ NEW: Sort Button */}
      {products.length > 0 && renderSortButton()}

      {renderFilterTabs()}

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          filteredProducts.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 16 },
  loadingText: { fontSize: 16, color: '#6b7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc', gap: 16 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#ef4444' },
  errorMessage: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, gap: 8 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerContent: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  addProductButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addProductButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  subscriptionWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b' },
  warningIcon: { fontSize: 20, marginRight: 12 },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 2 },
  warningText: { fontSize: 12, color: '#a16207' },
  getSubscriptionButton: { backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  getSubscriptionButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  subscriptionActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f6' },
  activeIcon: { fontSize: 20, marginRight: 12 },
  activeContent: { flex: 1 },
  activeTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  activeText: { fontSize: 12, color: '#6b7280' },
  manageButton: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  manageButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  
  // ✅ NEW: Analytics styles
  analyticsContainer: { marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  analyticsContent: { gap: 12 },
  analyticsCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, minWidth: 130, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  analyticsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  analyticsLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  analyticsValue: { fontSize: 18, fontWeight: '700', color: '#1f2937' },

  // ✅ NEW: Sort styles
  sortButtonContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', position: 'relative' },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, alignSelf: 'flex-start' },
  sortButtonText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  sortMenu: { position: 'absolute', top: 52, left: 20, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 1000, minWidth: 180 },
  sortMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  sortMenuItemActive: { backgroundColor: '#eff6ff' },
  sortMenuItemText: { fontSize: 14, color: '#374151' },
  sortMenuDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  
  searchContainer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#374151' },
  clearSearchButton: { padding: 4 },
  
  filterContainer: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 12 },
  filterScrollContainer: { paddingHorizontal: 20, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', minWidth: 80 },
  activeFilterTab: { backgroundColor: '#3b82f6' },
  filterTabText: { fontSize: 12, color: '#6b7280', fontWeight: '600', textAlign: 'center' },
  activeFilterTabText: { color: 'white' },
  
  listContainer: { padding: 20, paddingBottom: 40 },
  emptyListContainer: { flex: 1 },
  productCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  productHeader: { flexDirection: 'row', marginBottom: 12 },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 12 },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  productName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  modelName: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  sku: { fontSize: 11, color: '#9ca3af', marginBottom: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  mrp: { fontSize: 12, color: '#6b7280', textDecorationLine: 'line-through' },
  productDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stockContainer: { alignItems: 'flex-start' },
  stockLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  stockValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  statusContainer: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  saleTypeBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  saleTypeText: { fontSize: 11, color: '#1e40af', fontWeight: '500' },
  
  subscriptionControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  subscriptionControlLeft: { flex: 1 },
  controlLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 2 },
  onlineActiveText: { fontSize: 12, color: '#10b981', fontWeight: '500' },
  subscriptionControlRight: { alignItems: 'center' },
  
  actionButtons: { flexDirection: 'row', gap: 12 },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6b7280', paddingVertical: 10, borderRadius: 8, gap: 6 },
  editButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', paddingVertical: 10, borderRadius: 8, gap: 6 },
  deleteButtonDisabled: { opacity: 0.7 },
  deleteButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 8, textAlign: 'center' },
  emptyDescription: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  clearButton: { backgroundColor: '#6b7280', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  clearButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, gap: 8 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default ProductsScreen;
