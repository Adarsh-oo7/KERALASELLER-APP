import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import ProductService from '../../services/ProductService';

const { width } = Dimensions.get('window');

interface ProductDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      productId: string;
      product?: any; // Optional: pass full product object for faster loading
    };
  };
}

interface Product {
  id: number;
  name: string;
  model_name?: string;
  description?: string;
  price: string;
  mrp?: string;
  total_stock: number;
  online_stock: number;
  sale_type: 'BOTH' | 'ONLINE' | 'OFFLINE';
  category?: any;
  attributes?: { [key: string]: string };
  main_image_url?: string;
  sub_images?: Array<{ image_url: string }>;
  created_at: string;
  updated_at: string;
  sku?: string;
}

export default function ProductDetailsScreen({ navigation, route }: ProductDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const { productId, product: passedProduct } = route.params;

  const [product, setProduct] = useState<Product | null>(passedProduct || null);
  const [isLoading, setIsLoading] = useState(!passedProduct);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load product details
  useEffect(() => {
    if (!passedProduct) {
      loadProductDetails();
    }
  }, [productId]);

  const loadProductDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📦 Loading product details for ID:', productId);
      const response = await ProductService.getProduct(productId);
      setProduct(response.data);
      console.log('✅ Product loaded:', response.data);
    } catch (err: any) {
      console.error('❌ Failed to load product:', err);
      setError(err.message || 'Failed to load product details');
      Alert.alert('Error', 'Failed to load product details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate discount
  const calculateDiscount = () => {
    if (!product?.mrp || !product?.price) return null;
    const mrp = parseFloat(product.mrp);
    const price = parseFloat(product.price);
    if (mrp > price) {
      const discount = mrp - price;
      const percentage = Math.round((discount / mrp) * 100);
      return { discount, percentage };
    }
    return null;
  };

  // Get stock status
  const getStockStatus = () => {
    if (!product) return { label: 'Unknown', color: COLORS.textSecondary, bgColor: '#f3f4f6' };
    const stock = product.online_stock;
    if (stock <= 0) return { label: 'Out of Stock', color: '#dc2626', bgColor: '#fee2e2' };
    if (stock <= 5) return { label: 'Low Stock', color: '#f59e0b', bgColor: '#fef3c7' };
    return { label: 'In Stock', color: '#10b981', bgColor: '#d1fae5' };
  };

  // Format sale type
  const formatSaleType = (type: string) => {
    const types: { [key: string]: string } = {
      'BOTH': 'Online & In-Store',
      'ONLINE': 'Online Only',
      'OFFLINE': 'In-Store Only',
    };
    return types[type] || type;
  };

  // Handle edit
  const handleEdit = () => {
    if (!product) return;
    navigation.navigate('AddProduct', { product });
  };

  // Handle delete
  const handleDelete = () => {
    if (!product) return;

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting product:', product.id);
      await ProductService.deleteProduct(product.id);
      console.log('✅ Product deleted');
      Alert.alert(
        'Success',
        'Product deleted successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('❌ Failed to delete product:', err);
      Alert.alert('Error', 'Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!product) return;

    try {
      const message = `Check out ${product.name}!\nPrice: ₹${parseFloat(product.price).toLocaleString('en-IN')}\n\nShop at Kerala Sellers`;
      await Share.share({
        message,
        title: product.name,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // Get all images
  const getAllImages = () => {
    if (!product) return [];
    const images: string[] = [];
    if (product.main_image_url) images.push(product.main_image_url);
    if (product.sub_images) {
      images.push(...product.sub_images.map(img => img.image_url));
    }
    return images;
  };

  const images = getAllImages();
  const discount = calculateDiscount();
  const stockStatus = getStockStatus();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <Text style={styles.errorText}>{error || 'Unable to load product details'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProductDetails}>
            <Ionicons name="refresh" size={20} color={COLORS.surface} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={24} color={COLORS.surface} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {images.length > 0 && (
          <View style={styles.imageGalleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setSelectedImageIndex(index);
              }}
            >
              {images.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.imageIndicator}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicatorDot,
                      selectedImageIndex === index && styles.indicatorDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            
            {/* Stock Status Badge */}
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
              <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                {stockStatus.label}
              </Text>
            </View>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.model_name && (
            <Text style={styles.productModel}>Model: {product.model_name}</Text>
          )}
          {product.sku && (
            <Text style={styles.productSku}>SKU: {product.sku}</Text>
          )}

          {/* Price Section */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{parseFloat(product.price).toLocaleString('en-IN')}</Text>
              {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                <Text style={styles.mrp}>₹{parseFloat(product.mrp).toLocaleString('en-IN')}</Text>
              )}
            </View>
            {discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount.percentage}% OFF</Text>
                <Text style={styles.savingsText}>Save ₹{discount.discount.toLocaleString('en-IN')}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Stock Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Total Stock</Text>
                <Text style={styles.infoValue}>{product.total_stock}</Text>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="globe-outline" size={24} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Online Stock</Text>
                <Text style={styles.infoValue}>{product.online_stock}</Text>
              </View>
            </View>
          </View>

          {/* Sale Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.saleTypeContainer}>
              <Ionicons 
                name={
                  product.sale_type === 'BOTH' ? 'storefront' :
                  product.sale_type === 'ONLINE' ? 'globe' : 'location'
                } 
                size={20} 
                color={COLORS.primary} 
              />
              <Text style={styles.saleTypeText}>{formatSaleType(product.sale_type)}</Text>
            </View>
          </View>

          {/* Category & Attributes */}
          {(product.category || (product.attributes && Object.keys(product.attributes).length > 0)) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {product.category && (
                <View style={styles.attributeRow}>
                  <Text style={styles.attributeLabel}>Category</Text>
                  <Text style={styles.attributeValue}>
                    {typeof product.category === 'string' ? product.category : product.category.name || 'N/A'}
                  </Text>
                </View>
              )}
              {product.attributes && Object.entries(product.attributes).map(([key, value]) => (
                <View key={key} style={styles.attributeRow}>
                  <Text style={styles.attributeLabel}>{key}</Text>
                  <Text style={styles.attributeValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Metadata */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            <View style={styles.metadataContainer}>
              <View style={styles.metadataRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metadataText}>
                  Created: {new Date(product.created_at).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.metadataText}>
                  Updated: {new Date(product.updated_at).toLocaleDateString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.surface} />
          <Text style={styles.actionButtonText}>Edit Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={COLORS.surface} />
              <Text style={styles.actionButtonText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
  shareButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.surface },
  placeholder: { width: 44 },
  
  // Loading/Error
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: COLORS.textSecondary },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: 12 },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.surface },
  
  content: { flex: 1 },
  
  // Image Gallery
  imageGalleryContainer: { backgroundColor: COLORS.surface, position: 'relative' },
  productImage: { width, height: width, backgroundColor: '#f9fafb' },
  imageIndicator: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  indicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  indicatorDotActive: { backgroundColor: 'rgba(255,255,255,1)', width: 24 },
  stockBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  stockBadgeText: { fontSize: 12, fontWeight: '600' },
  
  // Product Info
  productInfoContainer: { padding: 20, gap: 20 },
  productName: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  productModel: { fontSize: 14, color: COLORS.textSecondary, marginTop: -12 },
  productSku: { fontSize: 12, color: COLORS.textSecondary, marginTop: -12 },
  
  // Price
  priceContainer: { gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  price: { fontSize: 28, fontWeight: '700', color: '#10b981' },
  mrp: { fontSize: 18, color: COLORS.textSecondary, textDecorationLine: 'line-through' },
  discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  discountText: { fontSize: 14, fontWeight: '600', color: '#10b981', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  savingsText: { fontSize: 12, color: COLORS.textSecondary },
  
  // Sections
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  descriptionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  
  // Info Grid
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCard: { flex: 1, backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  
  // Sale Type
  saleTypeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 },
  saleTypeText: { fontSize: 14, fontWeight: '500', color: COLORS.primary },
  
  // Attributes
  attributeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  attributeLabel: { fontSize: 14, color: COLORS.textSecondary },
  attributeValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  
  // Metadata
  metadataContainer: { gap: 8 },
  metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metadataText: { fontSize: 12, color: COLORS.textSecondary },
  
  // Action Buttons
  actionButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  editButton: { backgroundColor: COLORS.primary },
  deleteButton: { backgroundColor: '#ef4444' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.surface },
});
