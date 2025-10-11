// src/screens/stock/StockManagementScreen.tsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { AppStateContext } from '../../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ✅ Professional Color Palette
const STOCK_COLORS = {
  // Primary Brand Colors
  primary: '#1e40af',        // Deep blue
  primaryLight: '#3b82f6',   // Light blue
  primaryDark: '#1e3a8a',    // Darker blue
  
  // Status Colors
  success: '#059669',        // Green
  successLight: '#10b981',   // Light green
  warning: '#d97706',        // Orange
  warningLight: '#f59e0b',   // Light orange
  danger: '#dc2626',         // Red
  dangerLight: '#ef4444',    // Light red
  purple: '#7c3aed',         // Purple
  purpleLight: '#8b5cf6',    // Light purple
  
  // Neutral Colors
  background: '#f8fafc',     // Light gray background
  surface: '#ffffff',        // White surface
  cardBg: '#ffffff',         // Card background
  border: '#e2e8f0',         // Light border
  borderLight: '#f1f5f9',    // Very light border
  
  // Text Colors
  textPrimary: '#0f172a',    // Dark text
  textSecondary: '#475569',  // Medium text
  textTertiary: '#94a3b8',   // Light text
  textMuted: '#cbd5e1',      // Very light text
  
  // Interactive Colors
  interactive: '#3b82f6',    // Interactive blue
  interactiveHover: '#2563eb', // Hover blue
  
  // Shadow
  shadow: 'rgba(15, 23, 42, 0.1)',
  shadowDark: 'rgba(15, 23, 42, 0.2)',
};

// ✅ API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/user/store/products/`;

// ✅ Product Interface
interface Product {
  id: number;
  name: string;
  model_name?: string;
  sku?: string;
  online_stock: number;
  total_stock: number;
  price?: number;
  image_url?: string;
  main_image_url?: string;
}

// ✅ Enhanced Confirmation Modal
const ConfirmationModal: React.FC<{
  visible: boolean;
  message: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ visible, message, onConfirm, onCancel, isLoading }) => {
  const [note, setNote] = useState('');

  const handleConfirmClick = () => {
    onConfirm(note);
    setNote('');
  };

  const handleCancel = () => {
    setNote('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="cube" size={20} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Confirm Stock Update</Text>
            </View>
            <TouchableOpacity 
              onPress={handleCancel} 
              style={styles.closeButton}
              disabled={isLoading}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.modalMessage}>{message}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                <Ionicons name="document-text-outline" size={14} color={STOCK_COLORS.textSecondary} />
                {' '}Reason for change (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g., weekly restock, sale, correction, damage"
                style={styles.textarea}
                multiline
                numberOfLines={3}
                editable={!isLoading}
                placeholderTextColor={STOCK_COLORS.textTertiary}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={handleCancel} 
                style={styles.buttonSecondary}
                disabled={isLoading}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleConfirmClick} 
                style={[styles.buttonPrimary, isLoading && styles.buttonDisabled]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonPrimaryText}>Updating...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.buttonPrimaryText}>Confirm Update</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ✅ Professional Stock Control Component
const StockControl: React.FC<{
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (value: string) => void;
  disabled: boolean;
  maxValue?: number;
  type: 'total' | 'online';
}> = ({ value, onDecrease, onIncrease, onChange, disabled, maxValue, type }) => {
  const buttonColor = type === 'total' ? STOCK_COLORS.primary : STOCK_COLORS.success;
  const isAtMax = maxValue && value >= maxValue;
  
  return (
    <View style={styles.stockControl}>
      <TouchableOpacity
        style={[
          styles.stockButton,
          disabled && styles.stockButtonDisabled,
          { borderColor: buttonColor, backgroundColor: disabled ? STOCK_COLORS.borderLight : `${buttonColor}10` }
        ]}
        onPress={onDecrease}
        disabled={disabled || value <= 0}
      >
        <Ionicons 
          name="remove" 
          size={14} 
          color={disabled || value <= 0 ? STOCK_COLORS.textMuted : buttonColor} 
        />
      </TouchableOpacity>
      
      <View style={[styles.stockInputContainer, { borderColor: buttonColor }]}>
        <TextInput
          style={[styles.stockInput, disabled && styles.stockInputDisabled]}
          value={String(value || 0)}
          onChangeText={onChange}
          keyboardType="numeric"
          textAlign="center"
          editable={!disabled}
          selectTextOnFocus
        />
      </View>
      
      <TouchableOpacity
        style={[
          styles.stockButton,
          (disabled || isAtMax) && styles.stockButtonDisabled,
          { borderColor: buttonColor, backgroundColor: disabled || isAtMax ? STOCK_COLORS.borderLight : `${buttonColor}10` }
        ]}
        onPress={onIncrease}
        disabled={disabled || isAtMax}
      >
        <Ionicons 
          name="add" 
          size={14} 
          color={disabled || isAtMax ? STOCK_COLORS.textMuted : buttonColor} 
        />
      </TouchableOpacity>
    </View>
  );
};

// ✅ Main Stock Management Screen
const StockManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);
  
  // ✅ State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmation, setConfirmation] = useState<{
    message: string;
    onConfirm: (note: string) => void;
  } | null>(null);
  const [isUpdatingStock, setIsUpdatingStock] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'overstocked'>('all');

  // ✅ Set TopBar title
  useEffect(() => {
    setCurrentTitle('📦 Stock Management');
    setCurrentSubtitle('Quick inventory updates • Real-time tracking');
  }, [setCurrentTitle, setCurrentSubtitle]);

  // ✅ Fetch Data Function
  const fetchData = useCallback(async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      setError('Authentication required. Please login to continue.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('📦 Fetching products from:', API_URL);
      const response = await axios.get(API_URL, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const productData = response.data.results || response.data || [];
      console.log('✅ Products fetched for stock management:', productData.length);
      
      setProducts(productData);
      setFilteredProducts(productData);
    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please login again to continue.');
      } else {
        setError('Unable to load products. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Search and Filter Logic
  useEffect(() => {
    let filtered = [...products];

    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (stockFilter) {
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
      case 'overstocked':
        filtered = filtered.filter(product => 
          product.online_stock > product.total_stock
        );
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, stockFilter]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // ✅ Stock Change Handler
  const handleStockChange = (productId: number, stockType: 'total_stock' | 'online_stock', newStock: string | number) => {
    const stockValue = Math.max(0, parseInt(String(newStock), 10));
    if (isNaN(stockValue)) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentStock = product[stockType];
    const difference = stockValue - currentStock;
    const stockTypeLabel = stockType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    setConfirmation({
      message: `Update ${product.name}'s ${stockTypeLabel} from ${currentStock} to ${stockValue}${
        difference > 0 ? ` (+${difference})` : difference < 0 ? ` (${difference})` : ' (no change)'
      }?`,
      onConfirm: async (note: string) => {
        setIsUpdatingStock(productId);
        
        try {
          const token = await AsyncStorage.getItem('accessToken');
          const data = { 
            [stockType]: stockValue, 
            note: note || `${stockTypeLabel} updated via mobile stock management`
          };

          console.log('📦 Updating stock:', { productId, data });
          await axios.patch(`${API_URL}${productId}/update-stock/`, data, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          await fetchData();
          setError('');
          
          Alert.alert(
            '✅ Success!',
            `${product.name}'s ${stockTypeLabel.toLowerCase()} has been updated to ${stockValue}`,
            [{ text: 'Great!', style: 'default' }]
          );
        } catch (error: any) {
          console.error('❌ Stock update failed:', error);
          if (error.response?.status === 401) {
            setError('Session expired. Please login again.');
          } else {
            const errorMessage = error.response?.data?.error || 
                                error.response?.data?.message ||
                                'Could not update stock. Please try again.';
            setError(errorMessage);
            Alert.alert('❌ Update Failed', errorMessage);
          }
          await fetchData();
        } finally {
          setConfirmation(null);
          setIsUpdatingStock(null);
        }
      },
      onCancel: () => {
        setConfirmation(null);
        fetchData();
      }
    });
  };

  // ✅ Stock Status Function
  const getStockStatus = (product: Product) => {
    const { online_stock, total_stock } = product;
    
    if (online_stock <= 0) {
      return { 
        label: 'Out of Stock', 
        color: STOCK_COLORS.danger, 
        bgColor: `${STOCK_COLORS.danger}15`, 
        icon: 'alert-circle',
        borderColor: STOCK_COLORS.danger
      };
    } else if (online_stock <= 5) {
      return { 
        label: 'Low Stock', 
        color: STOCK_COLORS.warning, 
        bgColor: `${STOCK_COLORS.warning}15`, 
        icon: 'warning',
        borderColor: STOCK_COLORS.warning
      };
    } else if (online_stock > total_stock) {
      return { 
        label: 'Overstocked', 
        color: STOCK_COLORS.purple, 
        bgColor: `${STOCK_COLORS.purple}15`, 
        icon: 'trending-up',
        borderColor: STOCK_COLORS.purple
      };
    } else {
      return { 
        label: 'In Stock', 
        color: STOCK_COLORS.success, 
        bgColor: `${STOCK_COLORS.success}15`, 
        icon: 'checkmark-circle',
        borderColor: STOCK_COLORS.success
      };
    }
  };

  // ✅ Filter Counts
  const getFilterCounts = () => {
    return {
      all: products.length,
      low_stock: products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length,
      out_of_stock: products.filter(p => p.online_stock <= 0).length,
      overstocked: products.filter(p => p.online_stock > p.total_stock).length
    };
  };

  const filterCounts = getFilterCounts();

  // ✅ Compact Filter Tabs
  const filterTabs = [
    { 
      key: 'all' as const, 
      label: 'All', 
      count: filterCounts.all,
      icon: 'grid', 
      color: STOCK_COLORS.primary 
    },
    { 
      key: 'low_stock' as const, 
      label: 'Low', 
      count: filterCounts.low_stock,
      icon: 'warning', 
      color: STOCK_COLORS.warning 
    },
    { 
      key: 'out_of_stock' as const, 
      label: 'Out', 
      count: filterCounts.out_of_stock,
      icon: 'alert-circle', 
      color: STOCK_COLORS.danger 
    },
    { 
      key: 'overstocked' as const, 
      label: 'Over', 
      count: filterCounts.overstocked,
      icon: 'trending-up', 
      color: STOCK_COLORS.purple 
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={STOCK_COLORS.background} />
      
      {/* Confirmation Modal */}
      {confirmation && (
        <ConfirmationModal
          visible={true}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
          isLoading={isUpdatingStock !== null}
        />
      )}

      {/* Compact Statistics Header */}
      <View style={styles.compactStatsContainer}>
        <LinearGradient
          colors={[STOCK_COLORS.surface, STOCK_COLORS.borderLight]}
          style={styles.compactStatsGradient}
        >
          <View style={styles.compactStatsRow}>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatNumber}>{products.length}</Text>
              <Text style={styles.compactStatLabel}>Total</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatNumber, { color: STOCK_COLORS.success }]}>
                {products.filter(p => p.online_stock > 5).length}
              </Text>
              <Text style={styles.compactStatLabel}>In Stock</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatNumber, { color: STOCK_COLORS.warning }]}>
                {filterCounts.low_stock}
              </Text>
              <Text style={styles.compactStatLabel}>Low</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatNumber, { color: STOCK_COLORS.danger }]}>
                {filterCounts.out_of_stock}
              </Text>
              <Text style={styles.compactStatLabel}>Out</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={[`${STOCK_COLORS.danger}10`, `${STOCK_COLORS.danger}05`]}
            style={styles.errorGradient}
          >
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={16} color={STOCK_COLORS.danger} />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')} style={styles.errorClose}>
              <Ionicons name="close-circle" size={14} color={STOCK_COLORS.danger} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Compact Search & Filter Row */}
      <View style={styles.searchFilterRow}>
        {/* Compact Search */}
        <View style={styles.compactSearchContainer}>
          <Ionicons name="search" size={16} color={STOCK_COLORS.textSecondary} />
          <TextInput
            placeholder="Search products..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.compactSearchInput}
            placeholderTextColor={STOCK_COLORS.textTertiary}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={14} color={STOCK_COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Compact Filter Tabs */}
        <View style={styles.compactFilterContainer}>
          <View style={styles.compactFilterRow}>
            {filterTabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.compactFilterTab,
                  stockFilter === tab.key && [styles.compactActiveFilterTab, { backgroundColor: tab.color }]
                ]}
                onPress={() => setStockFilter(tab.key)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={12} 
                  color={stockFilter === tab.key ? '#fff' : tab.color} 
                />
                <Text style={[
                  styles.compactFilterText,
                  stockFilter === tab.key && styles.compactActiveFilterText
                ]}>
                  {tab.label}
                </Text>
                <View style={[
                  styles.compactFilterBadge,
                  stockFilter === tab.key ? 
                    { backgroundColor: 'rgba(255,255,255,0.2)' } : 
                    { backgroundColor: `${tab.color}15` }
                ]}>
                  <Text style={[
                    styles.compactFilterCount,
                    stockFilter === tab.key ? 
                      { color: '#fff' } : 
                      { color: tab.color }
                  ]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Products List */}
      <ScrollView
        style={styles.productsList}
        contentContainerStyle={styles.productsContent}
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={fetchData}
            colors={[STOCK_COLORS.primary]}
            tintColor={STOCK_COLORS.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <LinearGradient
              colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]}
              style={styles.loadingGradient}
            >
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading your inventory...</Text>
              <Text style={styles.loadingSubtext}>Fetching real-time stock data</Text>
            </LinearGradient>
          </View>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const stockStatus = getStockStatus(product);
            const isUpdating = isUpdatingStock === product.id;
            
            return (
              <View key={product.id} style={styles.productCard}>
                <LinearGradient
                  colors={[STOCK_COLORS.surface, STOCK_COLORS.borderLight]}
                  style={styles.productCardGradient}
                >
                  {/* Product Info Section */}
                  <View style={styles.productInfo}>
                    <View style={styles.productImageContainer}>
                      <Image
                        source={{
                          uri: product.image_url || product.main_image_url || 
                               'https://via.placeholder.com/60x60/e2e8f0/64748b?text=📦'
                        }}
                        style={styles.productImage}
                        defaultSource={{
                          uri: 'https://via.placeholder.com/60x60/e2e8f0/64748b?text=📦'
                        }}
                      />
                      {/* Stock Status Indicator */}
                      <View style={[styles.stockIndicator, { backgroundColor: stockStatus.color }]}>
                        <Ionicons name={stockStatus.icon as any} size={10} color="#fff" />
                      </View>
                    </View>
                    
                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      
                      {product.model_name && (
                        <View style={styles.productMetaRow}>
                          <Ionicons name="car-outline" size={12} color={STOCK_COLORS.textSecondary} />
                          <Text style={styles.productModel}>{product.model_name}</Text>
                        </View>
                      )}
                      
                      {product.sku && (
                        <View style={styles.productMetaRow}>
                          <Ionicons name="barcode-outline" size={12} color={STOCK_COLORS.textSecondary} />
                          <Text style={styles.productSku}>{product.sku}</Text>
                        </View>
                      )}
                      
                      {product.price && (
                        <View style={styles.productMetaRow}>
                          <Ionicons name="pricetag" size={12} color={STOCK_COLORS.success} />
                          <Text style={styles.productPrice}>
                            ₹{product.price.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Professional Status Badge */}
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: stockStatus.bgColor,
                        borderColor: stockStatus.borderColor,
                        borderWidth: 1
                      }
                    ]}>
                      <Ionicons name={stockStatus.icon as any} size={12} color={stockStatus.color} />
                      <Text style={[styles.statusText, { color: stockStatus.color }]}>
                        {stockStatus.label}
                      </Text>
                    </View>
                  </View>

                  {/* Stock Progress Bar */}
                  <View style={styles.stockProgressContainer}>
                    <View style={styles.stockProgressBar}>
                      <View 
                        style={[
                          styles.stockProgressFill, 
                          { 
                            width: `${Math.min((product.online_stock / Math.max(product.total_stock, 1)) * 100, 100)}%`,
                            backgroundColor: stockStatus.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.stockProgressText}>
                      {product.online_stock} of {product.total_stock} available online
                    </Text>
                  </View>

                  {/* Professional Stock Controls */}
                  <View style={styles.stockControlsContainer}>
                    {/* Total Stock Section */}
                    <View style={styles.stockSection}>
                      <View style={styles.stockSectionHeader}>
                        <Ionicons name="cube" size={16} color={STOCK_COLORS.primary} />
                        <Text style={styles.stockLabel}>Total Stock</Text>
                      </View>
                      <StockControl
                        value={product.total_stock}
                        onDecrease={() => handleStockChange(product.id, 'total_stock', Math.max(0, product.total_stock - 1))}
                        onIncrease={() => handleStockChange(product.id, 'total_stock', product.total_stock + 1)}
                        onChange={(value) => handleStockChange(product.id, 'total_stock', value)}
                        disabled={isUpdating}
                        type="total"
                      />
                    </View>

                    {/* Online Stock Section */}
                    <View style={styles.stockSection}>
                      <View style={styles.stockSectionHeader}>
                        <Ionicons name="globe" size={16} color={STOCK_COLORS.success} />
                        <Text style={styles.stockLabel}>Online Stock</Text>
                      </View>
                      <StockControl
                        value={product.online_stock}
                        onDecrease={() => handleStockChange(product.id, 'online_stock', Math.max(0, product.online_stock - 1))}
                        onIncrease={() => handleStockChange(product.id, 'online_stock', Math.min(product.online_stock + 1, product.total_stock))}
                        onChange={(value) => handleStockChange(product.id, 'online_stock', value)}
                        disabled={isUpdating}
                        maxValue={product.total_stock}
                        type="online"
                      />
                    </View>
                  </View>

                  {/* Updating Indicator */}
                  {isUpdating && (
                    <View style={styles.updatingIndicator}>
                      <LinearGradient
                        colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]}
                        style={styles.updatingGradient}
                      >
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.updatingText}>Updating stock levels...</Text>
                      </LinearGradient>
                    </View>
                  )}
                </LinearGradient>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]}
              style={styles.emptyIcon}
            >
              <Ionicons name="cube-outline" size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyDescription}>
              {searchTerm || stockFilter !== 'all'
                ? 'No products match your current search or filter criteria. Try adjusting your filters or search terms.'
                : "You haven't added any products to your store yet. Start by adding your first product to manage inventory."}
            </Text>
            {(searchTerm || stockFilter !== 'all') && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchTerm('');
                  setStockFilter('all');
                }}
              >
                <LinearGradient
                  colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]}
                  style={styles.clearFiltersGradient}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ✅ Complete Professional Styles with Compact Filter Section
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STOCK_COLORS.background,
  },

  // Compact Statistics
  compactStatsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  compactStatsGradient: {
    padding: 12,
  },
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  compactStatItem: {
    alignItems: 'center',
  },
  compactStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: STOCK_COLORS.textPrimary,
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 10,
    color: STOCK_COLORS.textSecondary,
    fontWeight: '500',
  },

  // Error Message
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.danger,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  errorIconContainer: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    color: STOCK_COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorClose: {
    marginLeft: 8,
    padding: 4,
  },

  // Search & Filter Row
  searchFilterRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  compactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STOCK_COLORS.surface,
    borderWidth: 1,
    borderColor: STOCK_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  compactSearchInput: {
    flex: 1,
    fontSize: 14,
    color: STOCK_COLORS.textPrimary,
    fontWeight: '500',
  },

  // Compact Filter Tabs
  compactFilterContainer: {
    marginTop: 8,
  },
  compactFilterRow: {
    flexDirection: 'row',
    backgroundColor: STOCK_COLORS.surface,
    borderRadius: 10,
    padding: 3,
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  compactFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 7,
    gap: 3,
    backgroundColor: 'transparent',
  },
  compactActiveFilterTab: {
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadowDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  compactFilterText: {
    fontSize: 10,
    fontWeight: '600',
    color: STOCK_COLORS.textSecondary,
  },
  compactActiveFilterText: {
    color: '#fff',
  },
  compactFilterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactFilterCount: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Products List
  productsList: {
    flex: 1,
  },
  productsContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Product Card
  productCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  productCardGradient: {
    padding: 20,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STOCK_COLORS.border,
  },
  stockIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: STOCK_COLORS.surface,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: STOCK_COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  productModel: {
    fontSize: 13,
    color: STOCK_COLORS.textSecondary,
    fontWeight: '500',
  },
  productSku: {
    fontSize: 12,
    color: STOCK_COLORS.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: STOCK_COLORS.success,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Stock Progress
  stockProgressContainer: {
    marginBottom: 20,
  },
  stockProgressBar: {
    height: 6,
    backgroundColor: STOCK_COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  stockProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockProgressText: {
    fontSize: 12,
    color: STOCK_COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Stock Controls
  stockControlsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  stockSection: {
    flex: 1,
  },
  stockSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  stockLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: STOCK_COLORS.textSecondary,
  },
  stockControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stockButton: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stockButtonDisabled: {
    backgroundColor: STOCK_COLORS.borderLight,
    borderColor: STOCK_COLORS.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  stockInputContainer: {
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: STOCK_COLORS.surface,
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  stockInput: {
    width: 60,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: STOCK_COLORS.textPrimary,
    paddingHorizontal: 8,
  },
  stockInputDisabled: {
    backgroundColor: STOCK_COLORS.borderLight,
    color: STOCK_COLORS.textMuted,
  },
  updatingIndicator: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  updatingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  updatingText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },

  // Loading State
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: STOCK_COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: STOCK_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  clearFiltersButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  clearFiltersGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: STOCK_COLORS.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: STOCK_COLORS.shadowDark,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBody: {
    padding: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: STOCK_COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: STOCK_COLORS.textSecondary,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textarea: {
    borderWidth: 2,
    borderColor: STOCK_COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: STOCK_COLORS.borderLight,
    color: STOCK_COLORS.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STOCK_COLORS.textSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STOCK_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonSecondaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StockManagementScreen;
