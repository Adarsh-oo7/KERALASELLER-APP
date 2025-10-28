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
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  primaryDark: '#1e3a8a',
  success: '#059669',
  successLight: '#10b981',
  warning: '#d97706',
  warningLight: '#f59e0b',
  danger: '#dc2626',
  dangerLight: '#ef4444',
  purple: '#7c3aed',
  purpleLight: '#8b5cf6',
  background: '#f8fafc',
  surface: '#ffffff',
  cardBg: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textMuted: '#cbd5e1',
  interactive: '#3b82f6',
  interactiveHover: '#2563eb',
  shadow: 'rgba(15, 23, 42, 0.1)',
  shadowDark: 'rgba(15, 23, 42, 0.2)',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/user/store/products/`;

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

// ===================================================================
// ✅ CUSTOM AMOUNT MODAL
// ===================================================================
const CustomAmountModal: React.FC<{
  visible: boolean;
  productName: string;
  currentStock: number;
  stockType: 'total' | 'online';
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}> = ({ visible, productName, currentStock, stockType, onConfirm, onCancel }) => {
  const [customAmount, setCustomAmount] = useState('');
  const [operation, setOperation] = useState<'add' | 'set'>('add');

  const handleConfirm = () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number');
      return;
    }
    
    const finalAmount = operation === 'add' ? currentStock + amount : amount;
    onConfirm(finalAmount);
    setCustomAmount('');
    setOperation('add');
  };

  const handleCancel = () => {
    setCustomAmount('');
    setOperation('add');
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
        <View style={styles.customAmountModal}>
          <LinearGradient
            colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]}
            style={styles.customAmountHeader}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="calculator" size={20} color="#fff" />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Custom Stock Amount</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{productName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.customAmountBody} showsVerticalScrollIndicator={false}>
            <View style={styles.currentStockDisplay}>
              <Text style={styles.currentStockLabel}>Current {stockType === 'total' ? 'Total' : 'Online'} Stock:</Text>
              <Text style={styles.currentStockValue}>{currentStock}</Text>
            </View>

            <View style={styles.operationSelector}>
              <TouchableOpacity
                style={[styles.operationButton, operation === 'add' && styles.operationButtonActive]}
                onPress={() => setOperation('add')}
              >
                <Ionicons name="add-circle" size={18} color={operation === 'add' ? '#fff' : STOCK_COLORS.primary} />
                <Text style={[styles.operationButtonText, operation === 'add' && styles.operationButtonTextActive]}>
                  Add to Stock
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.operationButton, operation === 'set' && styles.operationButtonActive]}
                onPress={() => setOperation('set')}
              >
                <Ionicons name="create" size={18} color={operation === 'set' ? '#fff' : STOCK_COLORS.primary} />
                <Text style={[styles.operationButtonText, operation === 'set' && styles.operationButtonTextActive]}>
                  Set Exact Amount
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.inputLabel}>
                {operation === 'add' ? 'Amount to Add:' : 'Set Stock To:'}
              </Text>
              <TextInput
                style={styles.amountInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={STOCK_COLORS.textTertiary}
                autoFocus
              />
              {customAmount && (
                <Text style={styles.previewText}>
                  {operation === 'add' 
                    ? `New stock will be: ${currentStock + parseInt(customAmount || '0', 10)}`
                    : `Stock will be set to: ${customAmount}`
                  }
                </Text>
              )}
            </View>

            {operation === 'add' && (
              <View style={styles.presetsContainer}>
                <Text style={styles.presetsLabel}>Quick Presets:</Text>
                <View style={styles.presetsRow}>
                  {[5, 10, 25, 50, 100].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.presetButton}
                      onPress={() => setCustomAmount(String(amount))}
                    >
                      <Text style={styles.presetButtonText}>+{amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActionButtons}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={handleCancel}>
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.buttonPrimary, !customAmount && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={!customAmount}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.buttonPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ===================================================================
// ✅ SIMPLIFIED STOCK CONTROL
// ===================================================================
const SimplifiedStockControl: React.FC<{
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (value: string) => void;
  onCustomAdd: () => void;
  disabled: boolean;
  maxValue?: number;
  type: 'total' | 'online';
}> = ({ value, onDecrease, onIncrease, onChange, onCustomAdd, disabled, maxValue, type }) => {
  const buttonColor = type === 'total' ? STOCK_COLORS.primary : STOCK_COLORS.success;
  const isAtMax = maxValue !== undefined && value >= maxValue;
  
  return (
    <View style={styles.stockControlContainer}>
      <View style={styles.stockControlRow}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            disabled && styles.controlButtonDisabled,
            { borderColor: buttonColor, backgroundColor: disabled ? STOCK_COLORS.borderLight : `${buttonColor}10` }
          ]}
          onPress={onDecrease}
          disabled={disabled || value <= 0}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={18} color={disabled || value <= 0 ? STOCK_COLORS.textMuted : buttonColor} />
        </TouchableOpacity>
        
        <View style={[styles.stockValueContainer, { borderColor: buttonColor }]}>
          <TextInput
            style={[styles.stockValueInput, disabled && styles.stockValueDisabled]}
            value={String(value || 0)}
            onChangeText={onChange}
            keyboardType="numeric"
            textAlign="center"
            editable={!disabled}
            selectTextOnFocus
            placeholder="0"
            placeholderTextColor={STOCK_COLORS.textTertiary}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.controlButton,
            (disabled || isAtMax) && styles.controlButtonDisabled,
            { borderColor: buttonColor, backgroundColor: disabled || isAtMax ? STOCK_COLORS.borderLight : `${buttonColor}10` }
          ]}
          onPress={onIncrease}
          disabled={disabled || isAtMax}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={disabled || isAtMax ? STOCK_COLORS.textMuted : buttonColor} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.customButton, { backgroundColor: buttonColor }, disabled && styles.customButtonDisabled]}
        onPress={onCustomAdd}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons name="calculator" size={14} color="#fff" />
        <Text style={styles.customButtonText}>Custom Amount</Text>
      </TouchableOpacity>
    </View>
  );
};

// ===================================================================
// ✅ CONFIRMATION MODAL
// ===================================================================
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
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
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton} disabled={isLoading}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity onPress={handleCancel} style={styles.buttonSecondary} disabled={isLoading}>
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ===================================================================
// ✅ MAIN SCREEN
// ===================================================================
const StockManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);
  
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
  const [customAmountModal, setCustomAmountModal] = useState<{
    visible: boolean;
    productId: number;
    productName: string;
    currentStock: number;
    stockType: 'total_stock' | 'online_stock';
  } | null>(null);

  useEffect(() => {
    setCurrentTitle('📦 Stock Management');
    setCurrentSubtitle('Quick inventory updates • Real-time tracking');
  }, [setCurrentTitle, setCurrentSubtitle]);

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
      
      const response = await axios.get(API_URL, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const productData = response.data.results || response.data || [];
      setProducts(productData);
      setFilteredProducts(productData);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError('Session expired. Please login again to continue.');
      } else {
        setError('Unable to load products. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
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

    switch (stockFilter) {
      case 'low_stock':
        filtered = filtered.filter(product => product.online_stock > 0 && product.online_stock <= 5);
        break;
      case 'out_of_stock':
        filtered = filtered.filter(product => product.online_stock <= 0);
        break;
      case 'overstocked':
        filtered = filtered.filter(product => product.online_stock > product.total_stock);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, stockFilter]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

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

          await axios.patch(`${API_URL}${productId}/update-stock/`, data, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          await fetchData();
          setError('');
          
          Alert.alert('✅ Success!', `${product.name}'s ${stockTypeLabel.toLowerCase()} has been updated to ${stockValue}`);
        } catch (error: any) {
          if (error.response?.status === 401) {
            setError('Session expired. Please login again.');
          } else {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Could not update stock. Please try again.';
            setError(errorMessage);
            Alert.alert('❌ Update Failed', errorMessage);
          }
          await fetchData();
        } finally {
          setConfirmation(null);
          setIsUpdatingStock(null);
        }
      },
    });
  };

  const getStockStatus = (product: Product) => {
    const { online_stock, total_stock } = product;
    
    if (online_stock <= 0) {
      return { label: 'Out of Stock', color: STOCK_COLORS.danger, bgColor: `${STOCK_COLORS.danger}15`, icon: 'alert-circle', borderColor: STOCK_COLORS.danger };
    } else if (online_stock <= 5) {
      return { label: 'Low Stock', color: STOCK_COLORS.warning, bgColor: `${STOCK_COLORS.warning}15`, icon: 'warning', borderColor: STOCK_COLORS.warning };
    } else if (online_stock > total_stock) {
      return { label: 'Overstocked', color: STOCK_COLORS.purple, bgColor: `${STOCK_COLORS.purple}15`, icon: 'trending-up', borderColor: STOCK_COLORS.purple };
    } else {
      return { label: 'In Stock', color: STOCK_COLORS.success, bgColor: `${STOCK_COLORS.success}15`, icon: 'checkmark-circle', borderColor: STOCK_COLORS.success };
    }
  };

  const getFilterCounts = () => {
    return {
      all: products.length,
      low_stock: products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length,
      out_of_stock: products.filter(p => p.online_stock <= 0).length,
      overstocked: products.filter(p => p.online_stock > p.total_stock).length
    };
  };

  const filterCounts = getFilterCounts();

  const filterTabs = [
    { key: 'all' as const, label: 'All', count: filterCounts.all, icon: 'grid', color: STOCK_COLORS.primary },
    { key: 'low_stock' as const, label: 'Low', count: filterCounts.low_stock, icon: 'warning', color: STOCK_COLORS.warning },
    { key: 'out_of_stock' as const, label: 'Out', count: filterCounts.out_of_stock, icon: 'alert-circle', color: STOCK_COLORS.danger },
    { key: 'overstocked' as const, label: 'Over', count: filterCounts.overstocked, icon: 'trending-up', color: STOCK_COLORS.purple },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={STOCK_COLORS.background} />
      
      {confirmation && (
        <ConfirmationModal
          visible={true}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={() => {
            setConfirmation(null);
            fetchData();
          }}
          isLoading={isUpdatingStock !== null}
        />
      )}

      {customAmountModal && (
        <CustomAmountModal
          visible={customAmountModal.visible}
          productName={customAmountModal.productName}
          currentStock={customAmountModal.currentStock}
          stockType={customAmountModal.stockType === 'total_stock' ? 'total' : 'online'}
          onConfirm={(newAmount) => {
            handleStockChange(customAmountModal.productId, customAmountModal.stockType, newAmount);
            setCustomAmountModal(null);
          }}
          onCancel={() => setCustomAmountModal(null)}
        />
      )}

      <View style={styles.compactStatsContainer}>
        <LinearGradient colors={[STOCK_COLORS.surface, STOCK_COLORS.borderLight]} style={styles.compactStatsGradient}>
          <View style={styles.compactStatsRow}>
            <View style={styles.compactStatItem}>
              <Text style={styles.compactStatNumber}>{products.length}</Text>
              <Text style={styles.compactStatLabel}>Total</Text>
            </View>
            <View style={styles.compactStatDivider} />
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatNumber, { color: STOCK_COLORS.success }]}>
                {products.filter(p => p.online_stock > 5).length}
              </Text>
              <Text style={styles.compactStatLabel}>In Stock</Text>
            </View>
            <View style={styles.compactStatDivider} />
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatNumber, { color: STOCK_COLORS.warning }]}>{filterCounts.low_stock}</Text>
              <Text style={styles.compactStatLabel}>Low</Text>
            </View>
            <View style={styles.compactStatDivider} />
            <View style={styles.compactStatItem}>
              <Text style={[styles.compactStatNumber, { color: STOCK_COLORS.danger }]}>{filterCounts.out_of_stock}</Text>
              <Text style={styles.compactStatLabel}>Out</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <LinearGradient colors={[`${STOCK_COLORS.danger}10`, `${STOCK_COLORS.danger}05`]} style={styles.errorGradient}>
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

      <View style={styles.searchFilterRow}>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compactFilterScroll} contentContainerStyle={styles.compactFilterContainer}>
          {filterTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.compactFilterTab,
                stockFilter === tab.key && [styles.compactActiveFilterTab, { backgroundColor: tab.color }]
              ]}
              onPress={() => setStockFilter(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={12} color={stockFilter === tab.key ? '#fff' : tab.color} />
              <Text style={[styles.compactFilterText, stockFilter === tab.key && styles.compactActiveFilterText]}>
                {tab.label}
              </Text>
              <View style={[
                styles.compactFilterBadge,
                stockFilter === tab.key ? 
                  { backgroundColor: 'rgba(255,255,255,0.25)' } : 
                  { backgroundColor: `${tab.color}15` }
              ]}>
                <Text style={[
                  styles.compactFilterCount,
                  stockFilter === tab.key ? { color: '#fff' } : { color: tab.color }
                ]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.productsList}
        contentContainerStyle={styles.productsContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={fetchData} colors={[STOCK_COLORS.primary]} tintColor={STOCK_COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <LinearGradient colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]} style={styles.loadingGradient}>
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
                <LinearGradient colors={[STOCK_COLORS.surface, STOCK_COLORS.borderLight]} style={styles.productCardGradient}>
                  <View style={styles.productHeader}>
                    <View style={styles.productImageContainer}>
                      <Image
                        source={{ uri: product.image_url || product.main_image_url || 'https://via.placeholder.com/60x60/e2e8f0/64748b?text=📦' }}
                        style={styles.productImage}
                      />
                      <View style={[styles.stockIndicator, { backgroundColor: stockStatus.color }]}>
                        <Ionicons name={stockStatus.icon as any} size={10} color="#fff" />
                      </View>
                    </View>
                    
                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      
                      {product.model_name && (
                        <View style={styles.productMetaRow}>
                          <Ionicons name="car-outline" size={12} color={STOCK_COLORS.textSecondary} />
                          <Text style={styles.productModel} numberOfLines={1}>{product.model_name}</Text>
                        </View>
                      )}
                      
                      <View style={styles.productMetaBottomRow}>
                        {product.sku && (
                          <View style={styles.productMetaItem}>
                            <Ionicons name="barcode-outline" size={11} color={STOCK_COLORS.textTertiary} />
                            <Text style={styles.productSku} numberOfLines={1}>{product.sku}</Text>
                          </View>
                        )}
                        
                        {product.price && (
                          <View style={styles.productMetaItem}>
                            <Ionicons name="pricetag" size={11} color={STOCK_COLORS.success} />
                            <Text style={styles.productPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: stockStatus.bgColor, borderColor: stockStatus.borderColor }]}>
                      <Ionicons name={stockStatus.icon as any} size={11} color={stockStatus.color} />
                      <Text style={[styles.statusText, { color: stockStatus.color }]}>{stockStatus.label}</Text>
                    </View>
                  </View>

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

                  <View style={styles.stockControlsWrapper}>
                    <View style={styles.stockSection}>
                      <View style={styles.stockSectionHeader}>
                        <Ionicons name="cube" size={14} color={STOCK_COLORS.primary} />
                        <Text style={styles.stockLabel}>Total Stock</Text>
                      </View>
                      <SimplifiedStockControl
                        value={product.total_stock}
                        onDecrease={() => handleStockChange(product.id, 'total_stock', Math.max(0, product.total_stock - 1))}
                        onIncrease={() => handleStockChange(product.id, 'total_stock', product.total_stock + 1)}
                        onChange={(value) => handleStockChange(product.id, 'total_stock', value)}
                        onCustomAdd={() => setCustomAmountModal({
                          visible: true,
                          productId: product.id,
                          productName: product.name,
                          currentStock: product.total_stock,
                          stockType: 'total_stock'
                        })}
                        disabled={isUpdating}
                        type="total"
                      />
                    </View>

                    <View style={styles.stockSection}>
                      <View style={styles.stockSectionHeader}>
                        <Ionicons name="globe" size={14} color={STOCK_COLORS.success} />
                        <Text style={styles.stockLabel}>Online Stock</Text>
                      </View>
                      <SimplifiedStockControl
                        value={product.online_stock}
                        onDecrease={() => handleStockChange(product.id, 'online_stock', Math.max(0, product.online_stock - 1))}
                        onIncrease={() => handleStockChange(product.id, 'online_stock', Math.min(product.online_stock + 1, product.total_stock))}
                        onChange={(value) => handleStockChange(product.id, 'online_stock', value)}
                        onCustomAdd={() => setCustomAmountModal({
                          visible: true,
                          productId: product.id,
                          productName: product.name,
                          currentStock: product.online_stock,
                          stockType: 'online_stock'
                        })}
                        disabled={isUpdating}
                        maxValue={product.total_stock}
                        type="online"
                      />
                    </View>
                  </View>

                  {isUpdating && (
                    <View style={styles.updatingIndicator}>
                      <LinearGradient colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]} style={styles.updatingGradient}>
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
            <LinearGradient colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]} style={styles.emptyIcon}>
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
                <LinearGradient colors={[STOCK_COLORS.primary, STOCK_COLORS.primaryLight]} style={styles.clearFiltersGradient}>
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

// ===================================================================
// ✅ STYLES
// ===================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STOCK_COLORS.background,
  },

  // Stock Control
  stockControlContainer: { gap: 10 },
  stockControlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  controlButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  controlButtonDisabled: { backgroundColor: STOCK_COLORS.borderLight, borderColor: STOCK_COLORS.border, elevation: 0, shadowOpacity: 0 },
  stockValueContainer: {
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: STOCK_COLORS.surface,
    minWidth: 70,
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  stockValueInput: { height: 40, textAlign: 'center', fontSize: 18, fontWeight: '700', color: STOCK_COLORS.textPrimary, paddingHorizontal: 8 },
  stockValueDisabled: { backgroundColor: STOCK_COLORS.borderLight, color: STOCK_COLORS.textMuted },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadowDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  customButtonDisabled: { backgroundColor: STOCK_COLORS.borderLight, elevation: 0, shadowOpacity: 0 },
  customButtonText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Custom Amount Modal
  customAmountModal: {
    backgroundColor: STOCK_COLORS.surface,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadowDark, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30 },
      android: { elevation: 15 },
    }),
  },
  customAmountHeader: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitleContainer: { flex: 1, marginRight: 8 },
  modalSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500', marginTop: 2 },
  customAmountBody: { maxHeight: 500 },
  currentStockDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: STOCK_COLORS.borderLight,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  currentStockLabel: { fontSize: 13, fontWeight: '600', color: STOCK_COLORS.textSecondary },
  currentStockValue: { fontSize: 18, fontWeight: '700', color: STOCK_COLORS.primary },
  operationSelector: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 16 },
  operationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: STOCK_COLORS.primary,
    backgroundColor: 'transparent',
  },
  operationButtonActive: { backgroundColor: STOCK_COLORS.primary, borderColor: STOCK_COLORS.primary },
  operationButtonText: { fontSize: 12, fontWeight: '600', color: STOCK_COLORS.primary },
  operationButtonTextActive: { color: '#fff' },
  amountInputContainer: { marginHorizontal: 20, marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: STOCK_COLORS.textSecondary, marginBottom: 8 },
  amountInput: {
    borderWidth: 2,
    borderColor: STOCK_COLORS.primary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: STOCK_COLORS.textPrimary,
    backgroundColor: STOCK_COLORS.borderLight,
  },
  previewText: { fontSize: 12, color: STOCK_COLORS.success, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  presetsContainer: { marginHorizontal: 20, marginBottom: 16 },
  presetsLabel: { fontSize: 11, fontWeight: '600', color: STOCK_COLORS.textSecondary, marginBottom: 8 },
  presetsRow: { flexDirection: 'row', gap: 6 },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: `${STOCK_COLORS.primary}10`,
    borderWidth: 1,
    borderColor: STOCK_COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetButtonText: { fontSize: 12, fontWeight: '700', color: STOCK_COLORS.primary },
  modalActionButtons: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginVertical: 20 },

  // Compact Stats
  compactStatsContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  compactStatsGradient: { paddingVertical: 12, paddingHorizontal: 8 },
  compactStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  compactStatItem: { alignItems: 'center', flex: 1 },
  compactStatDivider: { width: 1, height: 30, backgroundColor: STOCK_COLORS.border },
  compactStatNumber: { fontSize: 16, fontWeight: '700', color: STOCK_COLORS.textPrimary, marginBottom: 2 },
  compactStatLabel: { fontSize: 10, color: STOCK_COLORS.textSecondary, fontWeight: '500' },

  // Error
  errorContainer: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10, overflow: 'hidden' },
  errorGradient: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  errorIconContainer: { marginRight: 8 },
  errorText: { flex: 1, color: STOCK_COLORS.danger, fontSize: 12, fontWeight: '500', lineHeight: 16 },
  errorClose: { marginLeft: 8, padding: 4 },

  // Search & Filter
  searchFilterRow: { paddingHorizontal: 16, marginBottom: 12, gap: 10 },
  compactSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STOCK_COLORS.surface,
    borderWidth: 1,
    borderColor: STOCK_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
      android: { elevation: 1 },
    }),
  },
  compactSearchInput: { flex: 1, fontSize: 14, color: STOCK_COLORS.textPrimary, fontWeight: '500', padding: 0 },
  compactFilterScroll: { flexGrow: 0 },
  compactFilterContainer: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  compactFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    backgroundColor: STOCK_COLORS.surface,
    borderWidth: 1,
    borderColor: STOCK_COLORS.border,
  },
  compactActiveFilterTab: {
    borderColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadowDark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  compactFilterText: { fontSize: 11, fontWeight: '600', color: STOCK_COLORS.textSecondary },
  compactActiveFilterText: { color: '#fff' },
  compactFilterBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  compactFilterCount: { fontSize: 10, fontWeight: '700' },

  // Products List
  productsList: { flex: 1 },
  productsContent: { paddingHorizontal: 16, paddingBottom: 24 },
  productCard: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  productCardGradient: { padding: 16 },
  productHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  productImageContainer: { position: 'relative' },
  productImage: { width: 56, height: 56, borderRadius: 10, borderWidth: 1, borderColor: STOCK_COLORS.border },
  stockIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: STOCK_COLORS.surface,
  },
  productDetails: { flex: 1, gap: 4 },
  productName: { fontSize: 15, fontWeight: '700', color: STOCK_COLORS.textPrimary, lineHeight: 20, marginBottom: 2 },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  productModel: { fontSize: 12, color: STOCK_COLORS.textSecondary, fontWeight: '500', flex: 1 },
  productMetaBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  productMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  productSku: { fontSize: 11, color: STOCK_COLORS.textTertiary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  productPrice: { fontSize: 12, fontWeight: '700', color: STOCK_COLORS.success },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 4, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  stockProgressContainer: { marginBottom: 16 },
  stockProgressBar: { height: 5, backgroundColor: STOCK_COLORS.borderLight, borderRadius: 2.5, overflow: 'hidden', marginBottom: 6 },
  stockProgressFill: { height: '100%', borderRadius: 2.5 },
  stockProgressText: { fontSize: 11, color: STOCK_COLORS.textSecondary, fontWeight: '500', textAlign: 'center' },
  stockControlsWrapper: { gap: 16 },
  stockSection: { backgroundColor: STOCK_COLORS.borderLight, padding: 12, borderRadius: 12 },
  stockSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  stockLabel: { fontSize: 12, fontWeight: '600', color: STOCK_COLORS.textSecondary },
  updatingIndicator: { marginTop: 12, borderRadius: 10, overflow: 'hidden' },
  updatingGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8 },
  updatingText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Loading & Empty States
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  loadingGradient: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 40, borderRadius: 20, minWidth: 220 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#fff', fontWeight: '700', textAlign: 'center' },
  loadingSubtext: { marginTop: 4, fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', textAlign: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: STOCK_COLORS.textPrimary, marginBottom: 10, textAlign: 'center' },
  emptyDescription: { fontSize: 14, color: STOCK_COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  clearFiltersButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  clearFiltersGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  clearFiltersText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: {
    backgroundColor: STOCK_COLORS.surface,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: STOCK_COLORS.shadowDark, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30 },
      android: { elevation: 15 },
    }),
  },
  modalHeader: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalHeaderContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  closeButton: { padding: 8, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.15)', marginLeft: 8 },
  modalBody: { maxHeight: 400, paddingBottom: 20 },
  modalMessage: {
    fontSize: 15,
    color: STOCK_COLORS.textPrimary,
    marginBottom: 18,
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  formGroup: { marginBottom: 20, marginHorizontal: 20 },
  label: { fontSize: 13, fontWeight: '600', color: STOCK_COLORS.textSecondary, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  textarea: {
    borderWidth: 2,
    borderColor: STOCK_COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 90,
    backgroundColor: STOCK_COLORS.borderLight,
    color: STOCK_COLORS.textPrimary,
  },
  buttonContainer: { flexDirection: 'row', gap: 10, marginHorizontal: 20 },
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STOCK_COLORS.textSecondary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  buttonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STOCK_COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonSecondaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  buttonPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default StockManagementScreen;