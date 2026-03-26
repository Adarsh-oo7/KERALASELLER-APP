// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   Alert,
//   ActivityIndicator,
//   Dimensions,
//   Share,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { COLORS } from '../../constants/colors';
// import ProductService from '../../services/ProductService';

// const { width } = Dimensions.get('window');

// interface ProductDetailsScreenProps {
//   navigation: any;
//   route: {
//     params: {
//       productId: string;
//       product?: any; // Optional: pass full product object for faster loading
//     };
//   };
// }

// interface Product {
//   id: number;
//   name: string;
//   model_name?: string;
//   description?: string;
//   price: string;
//   mrp?: string;
//   total_stock: number;
//   online_stock: number;
//   sale_type: 'BOTH' | 'ONLINE' | 'OFFLINE';
//   category?: any;
//   attributes?: { [key: string]: string };
//   main_image_url?: string;
//   sub_images?: Array<{ image_url: string }>;
//   created_at: string;
//   updated_at: string;
//   sku?: string;
// }

// export default function ProductDetailsScreen({ navigation, route }: ProductDetailsScreenProps) {
//   const insets = useSafeAreaInsets();
//   const { productId, product: passedProduct } = route.params;

//   const [product, setProduct] = useState<Product | null>(passedProduct || null);
//   const [isLoading, setIsLoading] = useState(!passedProduct);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Load product details
//   useEffect(() => {
//     if (!passedProduct) {
//       loadProductDetails();
//     }
//   }, [productId]);

//   const loadProductDetails = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       console.log('📦 Loading product details for ID:', productId);
//       const response = await ProductService.getProduct(productId);
//       setProduct(response.data);
//       console.log('✅ Product loaded:', response.data);
//     } catch (err: any) {
//       console.error('❌ Failed to load product:', err);
//       setError(err.message || 'Failed to load product details');
//       Alert.alert('Error', 'Failed to load product details. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Calculate discount
//   const calculateDiscount = () => {
//     if (!product?.mrp || !product?.price) return null;
//     const mrp = parseFloat(product.mrp);
//     const price = parseFloat(product.price);
//     if (mrp > price) {
//       const discount = mrp - price;
//       const percentage = Math.round((discount / mrp) * 100);
//       return { discount, percentage };
//     }
//     return null;
//   };

//   // Get stock status
//   const getStockStatus = () => {
//     if (!product) return { label: 'Unknown', color: COLORS.textSecondary, bgColor: '#f3f4f6' };
//     const stock = product.online_stock;
//     if (stock <= 0) return { label: 'Out of Stock', color: '#dc2626', bgColor: '#fee2e2' };
//     if (stock <= 5) return { label: 'Low Stock', color: '#f59e0b', bgColor: '#fef3c7' };
//     return { label: 'In Stock', color: '#10b981', bgColor: '#d1fae5' };
//   };

//   // Format sale type
//   const formatSaleType = (type: string) => {
//     const types: { [key: string]: string } = {
//       'BOTH': 'Online & In-Store',
//       'ONLINE': 'Online Only',
//       'OFFLINE': 'In-Store Only',
//     };
//     return types[type] || type;
//   };

//   // Handle edit
//   const handleEdit = () => {
//     if (!product) return;
//     navigation.navigate('AddProduct', { product });
//   };

//   // Handle delete
//   const handleDelete = () => {
//     if (!product) return;

//     Alert.alert(
//       'Delete Product',
//       `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: confirmDelete,
//         },
//       ]
//     );
//   };

//   const confirmDelete = async () => {
//     if (!product) return;

//     setIsDeleting(true);
//     try {
//       console.log('🗑️ Deleting product:', product.id);
//       await ProductService.deleteProduct(product.id);
//       console.log('✅ Product deleted');
//       Alert.alert(
//         'Success',
//         'Product deleted successfully',
//         [
//           {
//             text: 'OK',
//             onPress: () => navigation.goBack(),
//           },
//         ]
//       );
//     } catch (err: any) {
//       console.error('❌ Failed to delete product:', err);
//       Alert.alert('Error', 'Failed to delete product. Please try again.');
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   // Handle share
//   const handleShare = async () => {
//     if (!product) return;

//     try {
//       const message = `Check out ${product.name}!\nPrice: ₹${parseFloat(product.price).toLocaleString('en-IN')}\n\nShop at Kerala Sellers`;
//       await Share.share({
//         message,
//         title: product.name,
//       });
//     } catch (err) {
//       console.error('Share error:', err);
//     }
//   };

//   // Get all images
//   const getAllImages = () => {
//     if (!product) return [];
//     const images: string[] = [];
//     if (product.main_image_url) images.push(product.main_image_url);
//     if (product.sub_images) {
//       images.push(...product.sub_images.map(img => img.image_url));
//     }
//     return images;
//   };

//   const images = getAllImages();
//   const discount = calculateDiscount();
//   const stockStatus = getStockStatus();

//   // Loading state
//   if (isLoading) {
//     return (
//       <View style={styles.container}>
//         <LinearGradient
//           colors={[COLORS.primary, COLORS.primaryLight]}
//           style={[styles.header, { paddingTop: insets.top + 10 }]}
//         >
//           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//             <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Product Details</Text>
//           <View style={styles.placeholder} />
//         </LinearGradient>

//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.loadingText}>Loading product details...</Text>
//         </View>
//       </View>
//     );
//   }

//   // Error state
//   if (error || !product) {
//     return (
//       <View style={styles.container}>
//         <LinearGradient
//           colors={[COLORS.primary, COLORS.primaryLight]}
//           style={[styles.header, { paddingTop: insets.top + 10 }]}
//         >
//           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//             <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Product Details</Text>
//           <View style={styles.placeholder} />
//         </LinearGradient>

//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle" size={64} color="#ef4444" />
//           <Text style={styles.errorTitle}>Product Not Found</Text>
//           <Text style={styles.errorText}>{error || 'Unable to load product details'}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={loadProductDetails}>
//             <Ionicons name="refresh" size={20} color={COLORS.surface} />
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <LinearGradient
//         colors={[COLORS.primary, COLORS.primaryLight]}
//         style={[styles.header, { paddingTop: insets.top + 10 }]}
//       >
//         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Product Details</Text>
//         <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
//           <Ionicons name="share-social" size={24} color={COLORS.surface} />
//         </TouchableOpacity>
//       </LinearGradient>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {/* Image Gallery */}
//         {images.length > 0 && (
//           <View style={styles.imageGalleryContainer}>
//             <ScrollView
//               horizontal
//               pagingEnabled
//               showsHorizontalScrollIndicator={false}
//               onMomentumScrollEnd={(e) => {
//                 const index = Math.round(e.nativeEvent.contentOffset.x / width);
//                 setSelectedImageIndex(index);
//               }}
//             >
//               {images.map((imageUrl, index) => (
//                 <Image
//                   key={index}
//                   source={{ uri: imageUrl }}
//                   style={styles.productImage}
//                   resizeMode="contain"
//                 />
//               ))}
//             </ScrollView>
//             {images.length > 1 && (
//               <View style={styles.imageIndicator}>
//                 {images.map((_, index) => (
//                   <View
//                     key={index}
//                     style={[
//                       styles.indicatorDot,
//                       selectedImageIndex === index && styles.indicatorDotActive,
//                     ]}
//                   />
//                 ))}
//               </View>
//             )}
            
//             {/* Stock Status Badge */}
//             <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
//               <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
//                 {stockStatus.label}
//               </Text>
//             </View>
//           </View>
//         )}

//         {/* Product Info */}
//         <View style={styles.productInfoContainer}>
//           <Text style={styles.productName}>{product.name}</Text>
//           {product.model_name && (
//             <Text style={styles.productModel}>Model: {product.model_name}</Text>
//           )}
//           {product.sku && (
//             <Text style={styles.productSku}>SKU: {product.sku}</Text>
//           )}

//           {/* Price Section */}
//           <View style={styles.priceContainer}>
//             <View style={styles.priceRow}>
//               <Text style={styles.price}>₹{parseFloat(product.price).toLocaleString('en-IN')}</Text>
//               {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
//                 <Text style={styles.mrp}>₹{parseFloat(product.mrp).toLocaleString('en-IN')}</Text>
//               )}
//             </View>
//             {discount && (
//               <View style={styles.discountBadge}>
//                 <Text style={styles.discountText}>{discount.percentage}% OFF</Text>
//                 <Text style={styles.savingsText}>Save ₹{discount.discount.toLocaleString('en-IN')}</Text>
//               </View>
//             )}
//           </View>

//           {/* Description */}
//           {product.description && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Description</Text>
//               <Text style={styles.descriptionText}>{product.description}</Text>
//             </View>
//           )}

//           {/* Stock Info */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Inventory</Text>
//             <View style={styles.infoGrid}>
//               <View style={styles.infoCard}>
//                 <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
//                 <Text style={styles.infoLabel}>Total Stock</Text>
//                 <Text style={styles.infoValue}>{product.total_stock}</Text>
//               </View>
//               <View style={styles.infoCard}>
//                 <Ionicons name="globe-outline" size={24} color={COLORS.primary} />
//                 <Text style={styles.infoLabel}>Online Stock</Text>
//                 <Text style={styles.infoValue}>{product.online_stock}</Text>
//               </View>
//             </View>
//           </View>

//           {/* Sale Type */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Availability</Text>
//             <View style={styles.saleTypeContainer}>
//               <Ionicons 
//                 name={
//                   product.sale_type === 'BOTH' ? 'storefront' :
//                   product.sale_type === 'ONLINE' ? 'globe' : 'location'
//                 } 
//                 size={20} 
//                 color={COLORS.primary} 
//               />
//               <Text style={styles.saleTypeText}>{formatSaleType(product.sale_type)}</Text>
//             </View>
//           </View>

//           {/* Category & Attributes */}
//           {(product.category || (product.attributes && Object.keys(product.attributes).length > 0)) && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Specifications</Text>
//               {product.category && (
//                 <View style={styles.attributeRow}>
//                   <Text style={styles.attributeLabel}>Category</Text>
//                   <Text style={styles.attributeValue}>
//                     {typeof product.category === 'string' ? product.category : product.category.name || 'N/A'}
//                   </Text>
//                 </View>
//               )}
//               {product.attributes && Object.entries(product.attributes).map(([key, value]) => (
//                 <View key={key} style={styles.attributeRow}>
//                   <Text style={styles.attributeLabel}>{key}</Text>
//                   <Text style={styles.attributeValue}>{value}</Text>
//                 </View>
//               ))}
//             </View>
//           )}

//           {/* Metadata */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Product Information</Text>
//             <View style={styles.metadataContainer}>
//               <View style={styles.metadataRow}>
//                 <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
//                 <Text style={styles.metadataText}>
//                   Created: {new Date(product.created_at).toLocaleDateString('en-IN')}
//                 </Text>
//               </View>
//               <View style={styles.metadataRow}>
//                 <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} />
//                 <Text style={styles.metadataText}>
//                   Updated: {new Date(product.updated_at).toLocaleDateString('en-IN')}
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </View>
//       </ScrollView>

//       {/* Action Buttons */}
//       <View style={[styles.actionButtons, { paddingBottom: insets.bottom + 16 }]}>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.editButton]}
//           onPress={handleEdit}
//         >
//           <Ionicons name="create-outline" size={20} color={COLORS.surface} />
//           <Text style={styles.actionButtonText}>Edit Product</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.deleteButton]}
//           onPress={handleDelete}
//           disabled={isDeleting}
//         >
//           {isDeleting ? (
//             <ActivityIndicator size="small" color={COLORS.surface} />
//           ) : (
//             <>
//               <Ionicons name="trash-outline" size={20} color={COLORS.surface} />
//               <Text style={styles.actionButtonText}>Delete</Text>
//             </>
//           )}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background },
  
//   // Header
//   header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
//   backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
//   shareButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
//   headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.surface },
//   placeholder: { width: 44 },
  
//   // Loading/Error
//   loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
//   loadingText: { fontSize: 16, color: COLORS.textSecondary },
//   errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 16 },
//   errorTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
//   errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
//   retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: 12 },
//   retryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.surface },
  
//   content: { flex: 1 },
  
//   // Image Gallery
//   imageGalleryContainer: { backgroundColor: COLORS.surface, position: 'relative' },
//   productImage: { width, height: width, backgroundColor: '#f9fafb' },
//   imageIndicator: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6 },
//   indicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
//   indicatorDotActive: { backgroundColor: 'rgba(255,255,255,1)', width: 24 },
//   stockBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
//   stockBadgeText: { fontSize: 12, fontWeight: '600' },
  
//   // Product Info
//   productInfoContainer: { padding: 20, gap: 20 },
//   productName: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
//   productModel: { fontSize: 14, color: COLORS.textSecondary, marginTop: -12 },
//   productSku: { fontSize: 12, color: COLORS.textSecondary, marginTop: -12 },
  
//   // Price
//   priceContainer: { gap: 8 },
//   priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   price: { fontSize: 28, fontWeight: '700', color: '#10b981' },
//   mrp: { fontSize: 18, color: COLORS.textSecondary, textDecorationLine: 'line-through' },
//   discountBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   discountText: { fontSize: 14, fontWeight: '600', color: '#10b981', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
//   savingsText: { fontSize: 12, color: COLORS.textSecondary },
  
//   // Sections
//   section: { gap: 12 },
//   sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
//   descriptionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  
//   // Info Grid
//   infoGrid: { flexDirection: 'row', gap: 12 },
//   infoCard: { flex: 1, backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
//   infoLabel: { fontSize: 12, color: COLORS.textSecondary },
//   infoValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  
//   // Sale Type
//   saleTypeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 },
//   saleTypeText: { fontSize: 14, fontWeight: '500', color: COLORS.primary },
  
//   // Attributes
//   attributeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
//   attributeLabel: { fontSize: 14, color: COLORS.textSecondary },
//   attributeValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  
//   // Metadata
//   metadataContainer: { gap: 8 },
//   metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   metadataText: { fontSize: 12, color: COLORS.textSecondary },
  
//   // Action Buttons
//   actionButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
//   actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
//   editButton: { backgroundColor: COLORS.primary },
//   deleteButton: { backgroundColor: '#ef4444' },
//   actionButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.surface },
// });
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Alert, ActivityIndicator, Dimensions, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductService from '../../services/ProductService';

const { width } = Dimensions.get('window');
const IMG_H = width * 0.85;

interface Props {
  navigation: any;
  route: { params: { productId: string; product?: any } };
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

const SALE_TYPE_LABEL: Record<string, string> = {
  BOTH: 'Online & In-Store',
  ONLINE: 'Online Only',
  OFFLINE: 'In-Store Only',
};

const getStockStatus = (stock: number) => {
  if (stock <= 0) return { label: 'Out of Stock', color: '#dc2626', bg: '#fef2f2' };
  if (stock <= 5)  return { label: 'Low Stock',    color: '#f59e0b', bg: '#fffbeb' };
  return              { label: 'In Stock',       color: '#059669', bg: '#f0fdf4' };
};

export default function ProductDetailsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { productId, product: passed } = route.params;

  const [product, setProduct]           = useState<Product | null>(passed || null);
  const [isLoading, setIsLoading]       = useState(!passed);
  const [error, setError]               = useState<string | null>(null);
  const [imgIdx, setImgIdx]             = useState(0);
  const [isDeleting, setIsDeleting]     = useState(false);

  useEffect(() => { if (!passed) load(); }, [productId]);

  const load = async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await ProductService.getProduct(productId);
      setProduct(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load product');
    } finally { setIsLoading(false); }
  };

  const discount = (() => {
    if (!product?.mrp || !product?.price) return null;
    const mrp = parseFloat(product.mrp), price = parseFloat(product.price);
    if (mrp > price) return { pct: Math.round(((mrp - price) / mrp) * 100), amt: mrp - price };
    return null;
  })();

  const images = [
    ...(product?.main_image_url ? [product.main_image_url] : []),
    ...(product?.sub_images?.map(i => i.image_url) || []),
  ];

  const stock = product ? getStockStatus(product.online_stock) : null;

  const handleDelete = () => Alert.alert(
    'Delete Product',
    `Delete "${product?.name}"? This cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (!product) return;
        setIsDeleting(true);
        try {
          await ProductService.deleteProduct(product.id);
          Alert.alert('Deleted', 'Product removed successfully.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } catch { Alert.alert('Error', 'Failed to delete. Try again.'); }
        finally { setIsDeleting(false); }
      }}
    ]
  );

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name}\nPrice: ₹${parseFloat(product.price).toLocaleString('en-IN')}\n\nShop at Kerala Sellers`,
        title: product.name,
      });
    } catch {}
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Product Details</Text>
        <View style={s.headerBtn} />
      </View>
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={s.loadingText}>Loading product...</Text>
      </View>
    </View>
  );

  // ── Error ────────────────────────────────────────────────────────────────────

  if (error || !product) return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Product Details</Text>
        <View style={s.headerBtn} />
      </View>
      <View style={s.centered}>
        <View style={s.errorIcon}>
          <Ionicons name="alert-circle-outline" size={36} color="#dc2626" />
        </View>
        <Text style={s.errorTitle}>Product Not Found</Text>
        <Text style={s.errorSub}>{error || 'Unable to load product details'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={load}>
          <Ionicons name="refresh" size={16} color="white" />
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Main ─────────────────────────────────────────────────────────────────────

  const catName = typeof product.category === 'string'
    ? product.category
    : product.category?.name || null;

  return (
    <View style={s.screen}>

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity style={s.headerBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Image Gallery ── */}
        {images.length > 0 ? (
          <View style={s.gallery}>
            <ScrollView
              horizontal pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e =>
                setImgIdx(Math.round(e.nativeEvent.contentOffset.x / width))
              }
            >
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={s.image} resizeMode="cover" />
              ))}
            </ScrollView>

            {/* Stock badge */}
            {stock && (
              <View style={[s.stockBadge, { backgroundColor: stock.bg }]}>
                <View style={[s.stockDot, { backgroundColor: stock.color }]} />
                <Text style={[s.stockText, { color: stock.color }]}>{stock.label}</Text>
              </View>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <View style={s.imgCounter}>
                <Text style={s.imgCounterText}>{imgIdx + 1}/{images.length}</Text>
              </View>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
              <View style={s.dots}>
                {images.map((_, i) => (
                  <View key={i} style={[s.dot, i === imgIdx && s.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={s.noImage}>
            <Ionicons name="image-outline" size={48} color="#d1d5db" />
            <Text style={s.noImageText}>No image</Text>
          </View>
        )}

        {/* ── Product Info Card ── */}
        <View style={s.card}>
          {/* Name + badges */}
          <View style={s.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{product.name}</Text>
              {product.model_name && <Text style={s.model}>{product.model_name}</Text>}
            </View>
            {discount && (
              <View style={s.discountPill}>
                <Text style={s.discountPillText}>{discount.pct}% OFF</Text>
              </View>
            )}
          </View>

          {/* SKU */}
          {product.sku && (
            <View style={s.skuRow}>
              <Ionicons name="barcode-outline" size={13} color="#9ca3af" />
              <Text style={s.skuText}>SKU: {product.sku}</Text>
            </View>
          )}

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>₹{parseFloat(product.price).toLocaleString('en-IN')}</Text>
            {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
              <Text style={s.mrp}>₹{parseFloat(product.mrp).toLocaleString('en-IN')}</Text>
            )}
            {discount && (
              <Text style={s.savings}>Save ₹{discount.amt.toLocaleString('en-IN')}</Text>
            )}
          </View>
        </View>

        {/* ── Inventory ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Inventory</Text>
          <View style={s.statRow}>
            <View style={s.statBox}>
              <View style={[s.statIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="cube-outline" size={20} color="#3b82f6" />
              </View>
              <Text style={s.statVal}>{product.total_stock}</Text>
              <Text style={s.statLabel}>Total Stock</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <View style={[s.statIcon, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="globe-outline" size={20} color="#059669" />
              </View>
              <Text style={s.statVal}>{product.online_stock}</Text>
              <Text style={s.statLabel}>Online Stock</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <View style={[s.statIcon, { backgroundColor: stock?.bg || '#f3f4f6' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={stock?.color || '#6b7280'} />
              </View>
              <Text style={[s.statVal, { color: stock?.color, fontSize: 13 }]}>{stock?.label}</Text>
              <Text style={s.statLabel}>Status</Text>
            </View>
          </View>
        </View>

        {/* ── Availability ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Availability</Text>
          <View style={s.availRow}>
            <View style={[s.statIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons
                name={product.sale_type === 'ONLINE' ? 'globe-outline' : product.sale_type === 'OFFLINE' ? 'storefront-outline' : 'swap-horizontal-outline'}
                size={18} color="#3b82f6"
              />
            </View>
            <Text style={s.availText}>{SALE_TYPE_LABEL[product.sale_type]}</Text>
          </View>
        </View>

        {/* ── Description ── */}
        {product.description && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Description</Text>
            <Text style={s.desc}>{product.description}</Text>
          </View>
        )}

        {/* ── Specifications ── */}
        {(catName || (product.attributes && Object.keys(product.attributes).length > 0)) && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Specifications</Text>
            {catName && (
              <View style={s.specRow}>
                <Text style={s.specKey}>Category</Text>
                <Text style={s.specVal}>{catName}</Text>
              </View>
            )}
            {product.attributes && Object.entries(product.attributes).map(([k, v]) => (
              <View key={k} style={s.specRow}>
                <Text style={s.specKey}>{k}</Text>
                <Text style={s.specVal}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Meta ── */}
        <View style={[s.card, { marginBottom: 100 }]}>
          <Text style={s.cardTitle}>Product Info</Text>
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={s.metaText}>Added {new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
          <View style={s.metaRow}>
            <Ionicons name="create-outline" size={14} color="#9ca3af" />
            <Text style={s.metaText}>Updated {new Date(product.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Bottom Actions ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => navigation.navigate('AddProduct', { product })}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="white" />
          <Text style={s.footerBtnText}>Edit Product</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.deleteBtn, isDeleting && s.btnDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}
          activeOpacity={0.85}
        >
          {isDeleting
            ? <ActivityIndicator size="small" color="white" />
            : <Ionicons name="trash-outline" size={18} color="white" />
          }
          <Text style={s.footerBtnText}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white', paddingHorizontal: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center', marginHorizontal: 8 },

  // States
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 24 },
  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  errorSub: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },

  scroll: { flex: 1 },

  // Gallery
  gallery: { backgroundColor: 'white', position: 'relative' },
  image: { width, height: IMG_H },
  stockBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  stockDot: { width: 7, height: 7, borderRadius: 4 },
  stockText: { fontSize: 12, fontWeight: '700' },
  imgCounter: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  imgCounterText: { color: 'white', fontSize: 12, fontWeight: '600' },
  dots: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 20, backgroundColor: 'white' },

  noImage: { height: 200, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', gap: 8 },
  noImageText: { fontSize: 13, color: '#9ca3af' },

  // Cards
  card: {
    backgroundColor: 'white', marginHorizontal: 14, marginTop: 12,
    borderRadius: 14, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Name row
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827', lineHeight: 26 },
  model: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  discountPill: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 2 },
  discountPillText: { fontSize: 11, fontWeight: '800', color: '#15803d' },

  skuRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  skuText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },

  // Price
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  price: { fontSize: 26, fontWeight: '900', color: '#059669' },
  mrp: { fontSize: 16, color: '#9ca3af', textDecorationLine: 'line-through' },
  savings: { fontSize: 12, color: '#059669', fontWeight: '600', backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },

  // Stats
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, height: 50, backgroundColor: '#f3f4f6' },

  // Availability
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availText: { fontSize: 14, fontWeight: '600', color: '#374151' },

  // Description
  desc: { fontSize: 14, color: '#6b7280', lineHeight: 22 },

  // Specs
  specRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  specKey: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  specVal: { fontSize: 13, fontWeight: '700', color: '#111827', maxWidth: '60%', textAlign: 'right' },

  // Meta
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#9ca3af' },

  // Footer
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 14, paddingTop: 12,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#3b82f6', paddingVertical: 13, borderRadius: 12 },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ef4444', paddingVertical: 13, borderRadius: 12 },
  btnDisabled: { opacity: 0.6 },
  footerBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
});
