// /**
//  * AddProductScreen.tsx
//  * ✅ FIXED: URI cleaning + Network error handling + Cloudinary upload
//  * Works perfectly with your Django backend - NO BACKEND CHANGES NEEDED!
//  */

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { Ionicons } from '@expo/vector-icons';

// // Import components
// import BasicInfoComponent from '../../components/products/BasicInfoComponent';
// import StockManagementComponent from '../../components/products/StockManagementComponent';
// import CategorySelectorComponent from '../../components/products/CategorySelectorComponent';
// import ImageUploadComponent from '../../components/products/ImageUploadComponent';

// // Services
// import ProductService from '../../services/ProductService';
// import { ApiError } from '../../types/api';

// type AddProductScreenProps = {
//   navigation: StackNavigationProp<any>;
//   route?: {
//     params?: {
//       product?: any;
//     };
//   };
// };

// interface ProductFormData {
//   name: string;
//   model_name: string;
//   description: string;
//   price: string;
//   mrp: string;
//   total_stock: number;
//   online_stock: number;
//   sale_type: 'BOTH' | 'ONLINE' | 'OFFLINE';
//   category: number | null;
//   attributes: { [key: string]: string };
//   sku?: string;
// }

// // ✅ CLOUDINARY CONFIGURATION
// const CLOUDINARY_CONFIG = {
//   cloud_name: 'dnmbfeckd',
//   upload_preset: 'kerala_sellers_preset',
//   fallback_presets: ['ml_default', 'kerala_sellers_unsigned', 'unsigned_preset'],
// };

// // ============================================================================
// // ✅ HELPER FUNCTIONS
// // ============================================================================

// const extractCategoryId = (product: any): number | null => {
//   if (!product) return null;
  
//   if (typeof product.category === 'number') return product.category;
//   if (product.category?.id) return product.category.id;
//   if (product.category_id) return product.category_id;
//   if (typeof product.category === 'string' && !isNaN(parseInt(product.category))) {
//     return parseInt(product.category);
//   }
  
//   return null;
// };

// const extractAttributes = (product: any): { [key: string]: string } => {
//   if (!product) return {};
  
//   if (product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)) {
//     return product.attributes;
//   }
  
//   if (typeof product.attributes === 'string') {
//     try {
//       return JSON.parse(product.attributes) || {};
//     } catch {
//       return {};
//     }
//   }
  
//   return {};
// };

// const validatePositiveNumber = (value: string, fieldName: string): { isValid: boolean; error?: string; cleanedValue?: string } => {
//   const cleaned = value.replace(/[^0-9.]/g, '');
  
//   if ((cleaned.match(/\./g) || []).length > 1) {
//     return { isValid: false, error: `${fieldName} can only have one decimal point` };
//   }
  
//   const numValue = parseFloat(cleaned);
  
//   if (isNaN(numValue) || numValue < 0) {
//     return { isValid: false, error: `${fieldName} must be a positive number` };
//   }
  
//   return { isValid: true, cleanedValue: cleaned };
// };

// // ============================================================================
// // ✅ CLOUDINARY UPLOAD FUNCTION - FIXED!
// // ============================================================================

// const uploadImageToCloudinary = async (
//   imageUri: string,
//   onProgress?: (progress: number) => void,
//   imageType: 'main' | 'sub' = 'main'
// ): Promise<{ url: string; public_id: string }> => {
//   // ✅ CRITICAL FIX: Clean the URI to prevent "fiile://" typo
//   const cleanUri = imageUri.trim().replace(/^fiile:\/\//, 'file://');
//   console.log(`☁️ Starting Cloudinary upload for ${imageType} image:`, cleanUri);
  
//   const presetsToTry = [
//     CLOUDINARY_CONFIG.upload_preset,
//     ...CLOUDINARY_CONFIG.fallback_presets,
//   ];

//   let lastError: Error | null = null;

//   for (let i = 0; i < presetsToTry.length; i++) {
//     const preset = presetsToTry[i];
//     console.log(`🔄 Trying preset ${i + 1}/${presetsToTry.length}:`, preset);

//     try {
//       const formData = new FormData();
      
//       // ✅ Use cleaned URI
//       formData.append('file', {
//         uri: cleanUri,
//         type: 'image/jpeg',
//         name: `product_${imageType}_${Date.now()}.jpg`,
//       } as any);
      
//       formData.append('upload_preset', preset);
//       formData.append('cloud_name', CLOUDINARY_CONFIG.cloud_name);
//       formData.append('folder', `kerala-sellers/products/${imageType}`);
//       formData.append('tags', 'kerala-sellers,product,mobile-app');

//       const xhr = new XMLHttpRequest();
      
//       xhr.upload.addEventListener('progress', (event) => {
//         if (event.lengthComputable && onProgress) {
//           const percentComplete = Math.round((event.loaded / event.total) * 100);
//           onProgress(Math.min(percentComplete, 99));
//         }
//       });

//       const response: any = await new Promise((resolve, reject) => {
//         xhr.onload = () => {
//           if (xhr.status >= 200 && xhr.status < 300) {
//             try {
//               const parsed = JSON.parse(xhr.responseText);
//               onProgress?.(100);
//               resolve(parsed);
//             } catch (err) {
//               reject(new Error('Failed to parse Cloudinary response'));
//             }
//           } else {
//             // ✅ Better error message
//             const errorText = xhr.responseText || xhr.statusText;
//             reject(new Error(`Cloudinary error: ${xhr.status} - ${errorText}`));
//           }
//         };
//         xhr.onerror = () => reject(new Error(`Network error. Check file: ${cleanUri.substring(0, 50)}...`));
//         xhr.ontimeout = () => reject(new Error('Upload timeout after 60s'));
//         xhr.timeout = 60000; // 60 second timeout
//         xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`);
//         xhr.send(formData);
//       });

//       console.log('✅ Cloudinary upload successful with preset:', preset);
//       return {
//         url: response.secure_url,
//         public_id: response.public_id,
//       };

//     } catch (error: any) {
//       lastError = error;
//       console.log(`❌ Upload failed with preset ${preset}:`, error.message);
      
//       if (i < presetsToTry.length - 1) {
//         console.log('🔄 Retrying with next preset...');
//         await new Promise(resolve => setTimeout(resolve, 1000)); // ✅ 1 second delay
//       }
//     }
//   }

//   throw new Error(
//     `Image upload failed after trying ${presetsToTry.length} presets. ` +
//     `Last error: ${lastError?.message || 'Unknown error'}`
//   );
// };

// // ============================================================================
// // ✅ MAIN COMPONENT
// // ============================================================================

// const AddProductScreen: React.FC<AddProductScreenProps> = ({ navigation, route }) => {
//   const existingProduct = route?.params?.product;
//   const isEditing = !!existingProduct;

//   const [formData, setFormData] = useState<ProductFormData>({
//     name: existingProduct?.name || '',
//     model_name: existingProduct?.model_name || '',
//     description: existingProduct?.description || '',
//     price: existingProduct?.price?.toString() || '',
//     mrp: existingProduct?.mrp?.toString() || '',
//     total_stock: existingProduct?.total_stock || 0,
//     online_stock: existingProduct?.online_stock || 0,
//     sale_type: existingProduct?.sale_type || 'BOTH',
//     category: extractCategoryId(existingProduct),
//     attributes: extractAttributes(existingProduct),
//     sku: existingProduct?.sku || '',
//   });

//   const [mainImage, setMainImage] = useState<string>('');
//   const [subImages, setSubImages] = useState<string[]>([]);
//   const [existingMainImage, setExistingMainImage] = useState<string>(existingProduct?.main_image_url || '');
//   const [existingSubImages, setExistingSubImages] = useState<string[]>(
//     existingProduct?.sub_images?.map((img: any) => img.image_url || img.url) || []
//   );

//   const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
//   const [isUploading, setIsUploading] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   // ============================================================================
//   // ✅ VALIDATION FUNCTIONS
//   // ============================================================================

//   const calculateDiscount = () => {
//     if (!formData.mrp || !formData.price) return null;
    
//     const mrp = parseFloat(formData.mrp);
//     const price = parseFloat(formData.price);
    
//     if (mrp > price && !isNaN(mrp) && !isNaN(price)) {
//       const discount = mrp - price;
//       const percentage = Math.round((discount / mrp) * 100);
//       return { discount, percentage };
//     }
    
//     return null;
//   };

//   const validateStock = (): boolean => {
//     const { total_stock, online_stock } = formData;
    
//     if (online_stock > total_stock) {
//       return false;
//     }
    
//     if (online_stock < 0 || total_stock < 0) {
//       return false;
//     }
    
//     return true;
//   };

//   const validateForm = (): boolean => {
//     const newErrors: { [key: string]: string } = {};

//     // Name validation
//     if (!formData.name.trim()) {
//       newErrors.name = 'Product name is required';
//     } else if (formData.name.length < 3) {
//       newErrors.name = 'Product name must be at least 3 characters';
//     }

//     // Price validation
//     const priceValidation = validatePositiveNumber(formData.price, 'Price');
//     if (!priceValidation.isValid) {
//       newErrors.price = priceValidation.error || 'Valid price is required';
//     } else if (parseFloat(formData.price) <= 0) {
//       newErrors.price = 'Price must be greater than 0';
//     }

//     // MRP validation
//     if (formData.mrp) {
//       const mrpValidation = validatePositiveNumber(formData.mrp, 'MRP');
//       if (!mrpValidation.isValid) {
//         newErrors.mrp = mrpValidation.error || 'Valid MRP is required';
//       } else if (parseFloat(formData.mrp) < parseFloat(formData.price)) {
//         newErrors.mrp = 'MRP must be greater than or equal to selling price';
//       }
//     }

//     // Stock validation
//     const { total_stock, online_stock } = formData;
    
//     if (online_stock > total_stock) {
//       newErrors.online_stock = 'Online stock cannot exceed total stock';
//     }
    
//     if (online_stock < 0 || total_stock < 0) {
//       newErrors.stock = 'Stock cannot be negative';
//     }

//     // Category validation
//     if (!formData.category) {
//       newErrors.category = 'Please select a category';
//     }

//     // Image validation (only for new products)
//     if (!isEditing && !mainImage && !existingMainImage) {
//       newErrors.mainImage = 'Main product image is required';
//     }

//     setErrors(newErrors);
    
//     if (Object.keys(newErrors).length > 0) {
//       const firstError = Object.values(newErrors)[0];
//       console.log('❌ Validation failed:', firstError);
//     }
    
//     return Object.keys(newErrors).length === 0;
//   };

//   // ============================================================================
//   // ✅ IMAGE UPLOAD HANDLER
//   // ============================================================================

//   const uploadImagesToCloudinary = async (): Promise<{
//     main_image_url?: string;
//     sub_image_urls?: { url: string; public_id: string }[];
//   }> => {
//     const result: {
//       main_image_url?: string;
//       sub_image_urls?: { url: string; public_id: string }[];
//     } = {};

//     setIsUploading(true);
//     console.log('☁️ Starting image uploads to Cloudinary...');

//     try {
//       if (mainImage) {
//         console.log('📸 Uploading main image...');
//         const mainImageResult = await uploadImageToCloudinary(mainImage, (progress) => {
//           setUploadProgress(prev => ({ ...prev, main: progress }));
//         }, 'main');
//         result.main_image_url = mainImageResult.url;
//         console.log('✅ Main image uploaded:', mainImageResult.url);
//       }

//       if (subImages.length > 0) {
//         console.log(`📸 Uploading ${subImages.length} sub images...`);
//         result.sub_image_urls = [];
        
//         for (let i = 0; i < subImages.length; i++) {
//           const subImageResult = await uploadImageToCloudinary(subImages[i], (progress) => {
//             setUploadProgress(prev => ({ ...prev, [`sub_${i}`]: progress }));
//           }, 'sub');
//           result.sub_image_urls.push(subImageResult);
//           console.log(`✅ Sub image ${i + 1}/${subImages.length} uploaded:`, subImageResult.url);
//         }
//       }

//       console.log('✅ All images uploaded successfully!');

//     } catch (error: any) {
//       console.error('❌ Cloudinary upload failed:', error);
//       throw new Error(`Image upload failed: ${error.message}`);
//     } finally {
//       setIsUploading(false);
//       setUploadProgress({});
//     }

//     return result;
//   };

//   // ============================================================================
//   // ✅ SUBMIT HANDLER
//   // ============================================================================

//   const handleSubmit = async (): Promise<void> => {
//     console.log('🚀 Submit button pressed');
    
//     if (!validateForm()) {
//       const errorMessages = Object.values(errors).join('\n');
//       Alert.alert('Validation Error', errorMessages || 'Please fix the errors and try again');
//       return;
//     }

//     setIsSubmitting(true);
    
//     try {
//       console.log(`🔄 ${isEditing ? 'Updating' : 'Creating'} product...`);

//       const hasNewImages = mainImage || subImages.length > 0;
//       const totalNewImages = (mainImage ? 1 : 0) + subImages.length;

//       let imageUrls: {
//         main_image_url?: string;
//         sub_image_urls?: { url: string; public_id: string }[];
//       } = {};

//       if (hasNewImages) {
//         console.log(`☁️ Uploading ${totalNewImages} image(s) to Cloudinary...`);
//         imageUrls = await uploadImagesToCloudinary();
//         console.log('✅ All images uploaded to Cloudinary');
//       }

//       const productData: any = {
//         name: formData.name.trim(),
//         model_name: formData.model_name.trim(),
//         description: formData.description.trim(),
//         price: parseFloat(formData.price),
//         mrp: parseFloat(formData.mrp || formData.price),
//         total_stock: parseInt(formData.total_stock.toString()),
//         online_stock: parseInt(formData.online_stock.toString()),
//         sale_type: formData.sale_type,
//         category: formData.category,
//         attributes: formData.attributes || {},
//       };

//       if (formData.sku && formData.sku.trim()) {
//         productData.sku = formData.sku.trim();
//       }

//       if (imageUrls.main_image_url) {
//         productData.main_image_url = imageUrls.main_image_url;
//         console.log('✅ Added main_image_url to product data');
//       }

//       if (imageUrls.sub_image_urls && imageUrls.sub_image_urls.length > 0) {
//         productData.sub_image_urls = imageUrls.sub_image_urls;
//         console.log(`✅ Added ${imageUrls.sub_image_urls.length} sub_image_urls`);
//       }

//       console.log('📋 Submitting product data:', JSON.stringify(productData, null, 2));

//       let result;
//       if (isEditing) {
//         result = await ProductService.updateProductWithoutImages(existingProduct.id, productData);
//         console.log('✅ Product updated:', result);
//       } else {
//         result = await ProductService.createProductWithoutImages(productData);
//         console.log('✅ Product created:', result);
//       }

//       const discount = calculateDiscount();
//       let successMessage = `Product ${isEditing ? 'updated' : 'created'} successfully!`;
      
//       if (discount) {
//         successMessage += `\n\n🎉 You're offering ${discount.percentage}% off!`;
//         successMessage += `\n💰 Customers save ₹${discount.discount.toLocaleString('en-IN')}`;
//       }
      
//       if (hasNewImages) {
//         successMessage += `\n☁️ ${totalNewImages} image(s) uploaded to cloud`;
//       }

//       Alert.alert(
//         '🎉 Success!',
//         successMessage,
//         [
//           {
//             text: 'View Products',
//             onPress: () => {
//               navigation.reset({
//                 index: 0,
//                 routes: [{ name: 'MainTabs', params: { screen: 'Products' } }],
//               });
//             }
//           }
//         ]
//       );

//     } catch (error: any) {
//       console.error('❌ Product submission failed:', error);
      
//       let errorMessage = `Failed to ${isEditing ? 'update' : 'save'} product`;
      
//       if (error.message.includes('Image upload failed')) {
//         errorMessage = '☁️ Image upload failed. Please check your internet connection and try again.';
//       } else if (error.message.includes('Network')) {
//         errorMessage = '🌐 Network error. Please check your connection and try again.';
//       } else if (error.message.includes('timeout')) {
//         errorMessage = '⏱️ Request timeout. Please try again.';
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       Alert.alert('❌ Error', errorMessage);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // ============================================================================
//   // ✅ FORM DATA UPDATER
//   // ============================================================================

//   const updateFormData = (updates: Partial<ProductFormData>) => {
//     console.log('📋 Updating form data:', updates);
    
//     setFormData(prev => {
//       const newData = { ...prev, ...updates };
      
//       if (updates.total_stock !== undefined && updates.total_stock < prev.online_stock) {
//         newData.online_stock = updates.total_stock;
//         console.log('⚠️ Auto-adjusted online stock to match total stock');
//       }
      
//       return newData;
//     });
    
//     const updatedErrors = { ...errors };
//     Object.keys(updates).forEach(key => {
//       delete updatedErrors[key];
//       if (key === 'total_stock' || key === 'online_stock') {
//         delete updatedErrors.stock;
//       }
//     });
//     setErrors(updatedErrors);
//   };

//   // ============================================================================
//   // ✅ STEP NAVIGATION
//   // ============================================================================

//   const canGoNext = (): boolean => {
//     switch (currentStep) {
//       case 1:
//         return !!(
//           formData.name.trim() && 
//           formData.price && 
//           parseFloat(formData.price) > 0
//         );
//       case 2:
//         return formData.online_stock >= 0 && 
//                formData.total_stock >= 0 && 
//                formData.online_stock <= formData.total_stock;
//       case 3:
//         return formData.category !== null;
//       case 4:
//         return !!(mainImage || existingMainImage);
//       default:
//         return false;
//     }
//   };

//   const handleNext = () => {
//     if (canGoNext()) {
//       setCurrentStep(prev => prev + 1);
//     }
//   };

//   const handlePrevious = () => {
//     if (currentStep > 1) {
//       setCurrentStep(prev => prev - 1);
//     }
//   };

//   // ============================================================================
//   // ✅ RENDER FUNCTIONS
//   // ============================================================================

//   const renderStepIndicator = () => (
//     <View style={styles.stepIndicator}>
//       {[1, 2, 3, 4].map(step => (
//         <View key={step} style={styles.stepItemContainer}>
//           <View
//             style={[
//               styles.stepDot,
//               currentStep >= step ? styles.stepDotActive : styles.stepDotInactive
//             ]}
//           >
//             <Text style={[
//               styles.stepNumber,
//               currentStep >= step ? styles.stepNumberActive : styles.stepNumberInactive
//             ]}>
//               {step}
//             </Text>
//           </View>
//           {step < 4 && (
//             <View style={[
//               styles.stepLine,
//               currentStep > step ? styles.stepLineActive : styles.stepLineInactive
//             ]} />
//           )}
//         </View>
//       ))}
//     </View>
//   );

//   const stepTitles = [
//     { icon: 'document-text-outline', title: 'Basic Information', subtitle: 'Name, price, description' },
//     { icon: 'cube-outline', title: 'Stock Management', subtitle: 'Inventory & availability' },
//     { icon: 'pricetags-outline', title: 'Category & Tags', subtitle: 'Classification & attributes' },
//     { icon: 'camera-outline', title: 'Product Images', subtitle: 'Photos & gallery' }
//   ];

//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <View>
//             <BasicInfoComponent
//               formData={formData}
//               updateFormData={updateFormData}
//               errors={errors}
//             />
//             {(() => {
//               const discount = calculateDiscount();
//               return discount ? (
//                 <View style={styles.discountBanner}>
//                   <Ionicons name="pricetag" size={20} color="#10b981" />
//                   <View style={styles.discountContent}>
//                     <Text style={styles.discountTitle}>
//                       🎉 {discount.percentage}% OFF!
//                     </Text>
//                     <Text style={styles.discountSubtitle}>
//                       Customers save ₹{discount.discount.toLocaleString('en-IN')}
//                     </Text>
//                   </View>
//                 </View>
//               ) : null;
//             })()}
//           </View>
//         );
//       case 2:
//         return (
//           <StockManagementComponent
//             formData={formData}
//             updateFormData={updateFormData}
//             errors={errors}
//           />
//         );
//       case 3:
//         return (
//           <CategorySelectorComponent
//             selectedCategory={formData.category}
//             onCategorySelect={(categoryId: number) => {
//               console.log('📋 Category selected:', categoryId);
//               updateFormData({ category: categoryId });
//             }}
//             onAttributesChange={(attributes: { [key: string]: string }) => {
//               console.log('📋 Attributes changed:', attributes);
//               updateFormData({ attributes });
//             }}
//             error={errors.category}
//             existingAttributes={formData.attributes}
//           />
//         );
//       case 4:
//         return (
//           <View>
//             <ImageUploadComponent
//   mainImage={mainImage}
//   subImages={subImages}
//   existingMainImage={existingMainImage}
//   existingSubImages={existingSubImages}
//   onMainImageChange={setMainImage}
//   onSubImagesChange={(newSubImages: string[]) => {
//     // ✅ Enforce 4-image limit
//     if (newSubImages.length <= 4) {
//       setSubImages(newSubImages);
//     } else {
//       Alert.alert(
//         '⚠️ Maximum Limit Reached',
//         'You can only upload up to 4 additional images (5 total including main image).',
//         [{ text: 'OK' }]
//       );
//     }
//   }}
//   maxSubImages={4}  // ✅ Pass limit to component
//   error={errors.mainImage}
// />

//             {isUploading && (
//               <View style={styles.uploadProgressContainer}>
//                 <View style={styles.uploadProgressHeader}>
//                   <ActivityIndicator size="small" color="#3b82f6" />
//                   <Text style={styles.uploadProgressTitle}>
//                     Uploading to cloud storage...
//                   </Text>
//                 </View>
//                 {Object.entries(uploadProgress).map(([key, progress]) => (
//                   <View key={key} style={styles.progressItemContainer}>
//                     <View style={styles.progressItemHeader}>
//                       <Text style={styles.progressLabel}>
//                         {key === 'main' ? '📸 Main Image' : `🖼️ Sub Image ${parseInt(key.split('_')[1]) + 1}`}
//                       </Text>
//                       <Text style={styles.progressPercentage}>{progress}%</Text>
//                     </View>
//                     <View style={styles.progressBar}>
//                       <View style={[styles.progressFill, { width: `${progress}%` }]} />
//                     </View>
//                   </View>
//                 ))}
//               </View>
//             )}
//           </View>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       {renderStepIndicator()}

//       <View style={styles.stepInfoContainer}>
//         <View style={styles.stepInfoHeader}>
//           <View style={styles.stepIconContainer}>
//             <Ionicons 
//               name={isEditing ? "pencil" : stepTitles[currentStep - 1].icon as any} 
//               size={24} 
//               color="#3b82f6" 
//             />
//           </View>
//           <View style={styles.stepInfoText}>
//             <Text style={styles.stepTitle}>
//               {isEditing ? `Edit: ${existingProduct?.name || 'Product'}` : stepTitles[currentStep - 1].title}
//             </Text>
//             <Text style={styles.stepSubtitle}>
//               {isEditing ? 'Update product information' : stepTitles[currentStep - 1].subtitle}
//             </Text>
//           </View>
//           <View style={styles.stepCounter}>
//             <Text style={styles.stepCounterText}>{currentStep}/4</Text>
//           </View>
//         </View>
        
//         <View style={styles.progressContainer}>
//           <View style={styles.progressBarFull}>
//             <View style={[
//               styles.progressFillFull,
//               { width: `${(currentStep / 4) * 100}%` }
//             ]} />
//           </View>
//         </View>
//       </View>

//       <ScrollView 
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//       >
//         {renderStepContent()}
//       </ScrollView>

//       <View style={styles.navigationContainer}>
//         <View style={styles.buttonRow}>
//           {currentStep > 1 && (
//             <TouchableOpacity
//               style={styles.previousButton}
//               onPress={handlePrevious}
//             >
//               <Ionicons name="chevron-back" size={20} color="#6b7280" />
//               <Text style={styles.previousButtonText}>Previous</Text>
//             </TouchableOpacity>
//           )}

//           <View style={styles.buttonSpacer} />

//           {currentStep < 4 ? (
//             <TouchableOpacity
//               style={[
//                 styles.nextButton,
//                 !canGoNext() && styles.nextButtonDisabled
//               ]}
//               onPress={handleNext}
//               disabled={!canGoNext()}
//             >
//               <Text style={[
//                 styles.nextButtonText,
//                 !canGoNext() && styles.nextButtonTextDisabled
//               ]}>
//                 Continue
//               </Text>
//               <Ionicons 
//                 name="chevron-forward" 
//                 size={20} 
//                 color={!canGoNext() ? '#9ca3af' : 'white'} 
//               />
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity
//               style={[
//                 styles.submitButton,
//                 (isSubmitting || isUploading || !canGoNext()) && styles.submitButtonDisabled
//               ]}
//               onPress={handleSubmit}
//               disabled={isSubmitting || isUploading || !canGoNext()}
//             >
//               {isSubmitting || isUploading ? (
//                 <View style={styles.submitButtonContent}>
//                   <ActivityIndicator color="white" size="small" />
//                   <Text style={styles.submitButtonText}>
//                     {isUploading ? 'Uploading...' : isEditing ? 'Updating...' : 'Creating...'}
//                   </Text>
//                 </View>
//               ) : (
//                 <View style={styles.submitButtonContent}>
//                   <Ionicons 
//                     name={isEditing ? "checkmark-circle" : "add-circle"} 
//                     size={20} 
//                     color="white" 
//                   />
//                   <Text style={styles.submitButtonText}>
//                     {isEditing ? 'Update Product' : 'Create Product'}
//                   </Text>
//                 </View>
//               )}
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// // ============================================================================
// // ✅ STYLES
// // ============================================================================

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f8fafc' },
  
//   stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
//   stepItemContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
//   stepDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
//   stepDotActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
//   stepDotInactive: { backgroundColor: 'white', borderColor: '#d1d5db' },
//   stepNumber: { fontSize: 14, fontWeight: 'bold' },
//   stepNumberActive: { color: 'white' },
//   stepNumberInactive: { color: '#9ca3af' },
//   stepLine: { flex: 1, height: 2, marginHorizontal: 8 },
//   stepLineActive: { backgroundColor: '#3b82f6' },
//   stepLineInactive: { backgroundColor: '#e5e7eb' },

//   stepInfoContainer: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
//   stepInfoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
//   stepIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
//   stepInfoText: { flex: 1 },
//   stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
//   stepSubtitle: { fontSize: 13, color: '#6b7280' },
//   stepCounter: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 12 },
//   stepCounterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
//   progressContainer: { marginTop: 8 },
//   progressBarFull: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
//   progressFillFull: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },

//   discountBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#d1fae5', borderRadius: 12, marginTop: 16, gap: 12 },
//   discountContent: { flex: 1 },
//   discountTitle: { fontSize: 16, fontWeight: '700', color: '#047857', marginBottom: 4 },
//   discountSubtitle: { fontSize: 14, color: '#059669' },

//   uploadProgressContainer: { padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, marginTop: 16, gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
//   uploadProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   uploadProgressTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
//   progressItemContainer: { gap: 6 },
//   progressItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   progressLabel: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
//   progressPercentage: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
//   progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
//   progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },

//   content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

//   navigationContainer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
//   buttonRow: { flexDirection: 'row', alignItems: 'center' },
//   buttonSpacer: { flex: 1 },
//   previousButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', gap: 6 },
//   previousButtonText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
//   nextButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#3b82f6', gap: 6 },
//   nextButtonDisabled: { backgroundColor: '#d1d5db' },
//   nextButtonText: { fontSize: 14, fontWeight: '600', color: 'white' },
//   nextButtonTextDisabled: { color: '#9ca3af' },
//   submitButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#10b981' },
//   submitButtonDisabled: { backgroundColor: '#d1d5db' },
//   submitButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   submitButtonText: { fontSize: 14, fontWeight: '600', color: 'white' },
// });

// export default AddProductScreen;
// src/screens/products/AddProductScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BasicInfoComponent        from '../../components/products/BasicInfoComponent';
import StockManagementComponent  from '../../components/products/StockManagementComponent';
import CategorySelectorComponent from '../../components/products/CategorySelectorComponent';
import ImageUploadComponent      from '../../components/products/ImageUploadComponent';
import ProductService            from '../../services/ProductService';

type Props = {
  navigation: StackNavigationProp<any>;
  route?: { params?: { product?: any } };
};

interface ProductFormData {
  name:        string;
  model_name:  string;
  description: string;
  price:       string;
  mrp:         string;
  total_stock:   number;
  online_stock:  number;
  sale_type:   'BOTH' | 'ONLINE' | 'OFFLINE';
  category:    number | null;
  attributes:  Record<string, string>;
  sku?:        string;
}

// ── Cloudinary ────────────────────────────────────────────────────────────────

const CLD = {
  cloud_name:    'dnmbfeckd',
  upload_preset: 'kerala_sellers_preset',
  fallbacks:     ['ml_default', 'kerala_sellers_unsigned', 'unsigned_preset'],
};

const uploadToCloudinary = async (
  uri: string,
  type: 'main' | 'sub' = 'main',
  onProgress?: (n: number) => void,
): Promise<{ url: string; public_id: string }> => {
  const presets = [CLD.upload_preset, ...CLD.fallbacks];
  let lastErr: Error | null = null;

  for (let i = 0; i < presets.length; i++) {
    try {
      const fd = new FormData();
      fd.append('file', { uri: uri.trim().replace(/^fiile:\/\//, 'file://'), type: 'image/jpeg', name: `product_${type}_${Date.now()}.jpg` } as any);
      fd.append('upload_preset', presets[i]);
      fd.append('cloud_name',    CLD.cloud_name);
      fd.append('folder',        `kerala-sellers/products/${type}`);

      const res: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 99));
        xhr.onload    = () => xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(`${xhr.status}`));
        xhr.onerror   = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Timeout'));
        xhr.timeout   = 60_000;
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLD.cloud_name}/image/upload`);
        xhr.send(fd);
      });

      onProgress?.(100);
      return { url: res.secure_url, public_id: res.public_id };
    } catch (e: any) {
      lastErr = e;
      if (i < presets.length - 1) await new Promise(r => setTimeout(r, 1_000));
    }
  }
  throw new Error(`Upload failed: ${lastErr?.message}`);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const extractCategoryId = (p: any): number | null => {
  if (!p) return null;
  if (typeof p.category === 'number') return p.category;
  if (p.category?.id) return p.category.id;
  if (p.category_id) return p.category_id;
  if (typeof p.category === 'string' && !isNaN(parseInt(p.category))) return parseInt(p.category);
  return null;
};

const extractAttributes = (p: any): Record<string, string> => {
  if (!p) return {};
  if (p.attributes && typeof p.attributes === 'object' && !Array.isArray(p.attributes)) return p.attributes;
  if (typeof p.attributes === 'string') { try { return JSON.parse(p.attributes) || {}; } catch { return {}; } }
  return {};
};

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { icon: 'document-text-outline' as const, label: 'Info',     sub: 'Name & price' },
  { icon: 'cube-outline'          as const, label: 'Stock',    sub: 'Inventory' },
  { icon: 'pricetags-outline'     as const, label: 'Category', sub: 'Classification' },
  { icon: 'camera-outline'        as const, label: 'Images',   sub: 'Photos' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const AddProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets           = useSafeAreaInsets();
  const existingProduct  = route?.params?.product;
  const isEditing        = !!existingProduct;

  const [formData, setFormData] = useState<ProductFormData>({
    name:         existingProduct?.name          || '',
    model_name:   existingProduct?.model_name    || '',
    description:  existingProduct?.description   || '',
    price:        existingProduct?.price?.toString() || '',
    mrp:          existingProduct?.mrp?.toString()   || '',
    total_stock:  existingProduct?.total_stock   ?? 0,
    online_stock: existingProduct?.online_stock  ?? 0,
    sale_type:    existingProduct?.sale_type      || 'BOTH',
    category:     extractCategoryId(existingProduct),
    attributes:   extractAttributes(existingProduct),
    sku:          existingProduct?.sku            || '',
  });

  const [mainImage,         setMainImage]         = useState('');
  const [subImages,         setSubImages]         = useState<string[]>([]);
  const [existingMainImage] = useState(existingProduct?.main_image_url || '');
  const [existingSubImages] = useState<string[]>(
    existingProduct?.sub_images?.map((i: any) => i.image_url || i.url) || []
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading,    setIsUploading]    = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [currentStep,    setCurrentStep]    = useState(1);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [submitError,    setSubmitError]    = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Transitions ───────────────────────────────────────────────────────────

  const animateStep = (next: number) => {
    const dir = next > currentStep ? 40 : -40;
    slideAnim.setValue(dir);
    setCurrentStep(next);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 9 }).start();
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const discount = (() => {
    const mrp = parseFloat(formData.mrp), price = parseFloat(formData.price);
    if (mrp > price && !isNaN(mrp) && !isNaN(price))
      return { amount: mrp - price, pct: Math.round(((mrp - price) / mrp) * 100) };
    return null;
  })();

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1: return !!(formData.name.trim() && formData.price && parseFloat(formData.price) > 0);
      case 2: return formData.online_stock >= 0 && formData.total_stock >= 0 && formData.online_stock <= formData.total_stock;
      case 3: return formData.category !== null;
      case 4: return !!(mainImage || existingMainImage);
      default: return false;
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      if (updates.total_stock !== undefined && updates.total_stock < prev.online_stock)
        next.online_stock = updates.total_stock;
      return next;
    });
    const cleaned = { ...errors };
    Object.keys(updates).forEach(k => { delete cleaned[k]; if (k === 'total_stock' || k === 'online_stock') delete cleaned.stock; });
    setErrors(cleaned);
    setSubmitError('');
  };

  const validateForm = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim())                                          e.name      = 'Product name is required';
    else if (formData.name.length < 3)                                  e.name      = 'Name must be at least 3 characters';
    if (!formData.price || parseFloat(formData.price) <= 0)             e.price     = 'Valid price is required';
    if (formData.mrp && parseFloat(formData.mrp) < parseFloat(formData.price)) e.mrp = 'MRP must be ≥ selling price';
    if (formData.online_stock > formData.total_stock)                   e.online_stock = 'Online stock cannot exceed total stock';
    if (!formData.category)                                             e.category  = 'Please select a category';
    if (!isEditing && !mainImage && !existingMainImage)                 e.mainImage = 'Main product image is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadImages = async () => {
    const result: { main_image_url?: string; sub_image_urls?: { url: string; public_id: string }[] } = {};
    setIsUploading(true);
    try {
      if (mainImage) {
        const r = await uploadToCloudinary(mainImage, 'main', p => setUploadProgress(prev => ({ ...prev, main: p })));
        result.main_image_url = r.url;
      }
      if (subImages.length > 0) {
        result.sub_image_urls = [];
        for (let i = 0; i < subImages.length; i++) {
          const r = await uploadToCloudinary(subImages[i], 'sub', p => setUploadProgress(prev => ({ ...prev, [`sub_${i}`]: p })));
          result.sub_image_urls!.push(r);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
    return result;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!validateForm()) {
      setSubmitError(Object.values(errors)[0] || 'Please fix the errors and try again');
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls = (mainImage || subImages.length > 0) ? await uploadImages() : {};
      const payload: any = {
        name:         formData.name.trim(),
        model_name:   formData.model_name.trim(),
        description:  formData.description.trim(),
        price:        parseFloat(formData.price),
        mrp:          parseFloat(formData.mrp || formData.price),
        total_stock:  parseInt(formData.total_stock.toString()),
        online_stock: parseInt(formData.online_stock.toString()),
        sale_type:    formData.sale_type,
        category:     formData.category,
        attributes:   formData.attributes || {},
      };
      if (formData.sku?.trim())                  payload.sku             = formData.sku.trim();
      if (imageUrls.main_image_url)              payload.main_image_url  = imageUrls.main_image_url;
      if (imageUrls.sub_image_urls?.length)      payload.sub_image_urls  = imageUrls.sub_image_urls;

      if (isEditing) {
        await ProductService.updateProductWithoutImages(existingProduct.id, payload);
      } else {
        await ProductService.createProductWithoutImages(payload);
      }

      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Products' } }] });
    } catch (e: any) {
      setSubmitError(
        e.message?.includes('upload')  ? 'Image upload failed. Check your connection.' :
        e.message?.includes('Network') ? 'Network error. Please try again.' :
        e.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[s.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.headerBackBtn}
          onPress={() => currentStep > 1 ? animateStep(currentStep - 1) : navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        <View style={s.headerMid}>
          <Text style={s.headerTitle}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
          <Text style={s.headerSub}>{STEPS[currentStep - 1].label} · {STEPS[currentStep - 1].sub}</Text>
        </View>

        <View style={s.stepBadge}>
          <Text style={s.stepBadgeText}>{currentStep} / 4</Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
      </View>

      {/* ── Step indicator ── */}
      <View style={s.stepsRow}>
        {STEPS.map((step, i) => {
          const n      = i + 1;
          const done   = currentStep > n;
          const active = currentStep === n;
          return (
            <React.Fragment key={n}>
              <View style={s.stepItem}>
                <View style={[s.stepDot, done && s.stepDotDone, active && s.stepDotActive]}>
                  {done
                    ? <Ionicons name="checkmark" size={13} color="white" />
                    : <Ionicons name={step.icon} size={14} color={active ? 'white' : '#9ca3af'} />
                  }
                </View>
                <Text style={[s.stepLabel, active && s.stepLabelActive, done && s.stepLabelDone]}>
                  {step.label}
                </Text>
              </View>
              {i < 3 && <View style={[s.stepConnector, done && s.stepConnectorDone]} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

          {/* Submit error banner */}
          {!!submitError && (
            <View style={s.submitError}>
              <Ionicons name="alert-circle" size={15} color="#991b1b" />
              <Text style={s.submitErrorText}>{submitError}</Text>
            </View>
          )}

          {/* Step 1 */}
          {currentStep === 1 && (
            <>
              <BasicInfoComponent formData={formData} updateFormData={updateFormData} errors={errors} />
              {discount && (
                <View style={s.discountCard}>
                  <View style={s.discountIconWrap}>
                    <Ionicons name="pricetag" size={18} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.discountTitle}>{discount.pct}% discount for customers</Text>
                    <Text style={s.discountSub}>Customers save ₹{discount.amount.toLocaleString('en-IN')} per unit</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <StockManagementComponent formData={formData} updateFormData={updateFormData} errors={errors} />
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <CategorySelectorComponent
              selectedCategory={formData.category}
              onCategorySelect={(id: number) => updateFormData({ category: id })}
              onAttributesChange={(attrs: Record<string, string>) => updateFormData({ attributes: attrs })}
              error={errors.category}
              existingAttributes={formData.attributes}
            />
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <>
              <ImageUploadComponent
                mainImage={mainImage}
                subImages={subImages}
                existingMainImage={existingMainImage}
                existingSubImages={existingSubImages}
                onMainImageChange={setMainImage}
                onSubImagesChange={(imgs: string[]) => {
                  if (imgs.length <= 4) setSubImages(imgs);
                }}
                maxSubImages={4}
                error={errors.mainImage}
              />

              {/* Upload progress */}
              {isUploading && (
                <View style={s.uploadCard}>
                  <View style={s.uploadCardHeader}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={s.uploadCardTitle}>Uploading images…</Text>
                  </View>
                  {Object.entries(uploadProgress).map(([key, pct]) => (
                    <View key={key} style={s.uploadRow}>
                      <View style={s.uploadRowTop}>
                        <Text style={s.uploadRowLabel}>
                          {key === 'main' ? 'Main image' : `Image ${parseInt(key.split('_')[1]) + 1}`}
                        </Text>
                        <Text style={s.uploadRowPct}>{pct}%</Text>
                      </View>
                      <View style={s.uploadTrack}>
                        <View style={[s.uploadFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

        </Animated.View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        {currentStep > 1 ? (
          <TouchableOpacity style={s.backFooterBtn} onPress={() => animateStep(currentStep - 1)}>
            <Ionicons name="chevron-back" size={17} color="#6b7280" />
            <Text style={s.backFooterText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.backFooterBtn} />
        )}

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[s.nextBtn, !canGoNext() && s.btnDisabled]}
            onPress={() => canGoNext() && animateStep(currentStep + 1)}
            disabled={!canGoNext()}
            activeOpacity={0.85}
          >
            <Text style={[s.nextBtnText, !canGoNext() && s.btnTextDisabled]}>Continue</Text>
            <Ionicons name="chevron-forward" size={17} color={canGoNext() ? 'white' : '#9ca3af'} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.submitBtn, (isSubmitting || isUploading || !canGoNext()) && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || isUploading || !canGoNext()}
            activeOpacity={0.85}
          >
            {isSubmitting || isUploading ? (
              <><ActivityIndicator size="small" color="white" /><Text style={s.submitBtnText}>{isUploading ? 'Uploading…' : isEditing ? 'Updating…' : 'Creating…'}</Text></>
            ) : (
              <><Ionicons name={isEditing ? 'checkmark-circle' : 'add-circle'} size={18} color="white" /><Text style={s.submitBtnText}>{isEditing ? 'Update Product' : 'Create Product'}</Text></>
            )}
          </TouchableOpacity>
        )}
      </View>

    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header:           { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white',
                      paddingHorizontal: 16, paddingVertical: 13,
                      borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
                      ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } }) },
  headerBackBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  headerMid:        { flex: 1 },
  headerTitle:      { fontSize: 16, fontWeight: '800', color: '#111827' },
  headerSub:        { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  stepBadge:        { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepBadgeText:    { fontSize: 12, fontWeight: '700', color: '#3b82f6' },

  // Progress bar
  progressTrack:    { height: 3, backgroundColor: '#e5e7eb' },
  progressFill:     { height: 3, backgroundColor: '#3b82f6' },

  // Step indicator
  stepsRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  stepItem:         { alignItems: 'center', gap: 5 },
  stepDot:          { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  stepDotActive:    { backgroundColor: '#3b82f6', borderColor: '#3b82f6',
                      shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  stepDotDone:      { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepLabel:        { fontSize: 9, color: '#9ca3af', fontWeight: '600', textAlign: 'center' },
  stepLabelActive:  { color: '#3b82f6', fontWeight: '700' },
  stepLabelDone:    { color: '#10b981' },
  stepConnector:    { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginBottom: 14 },
  stepConnectorDone:{ backgroundColor: '#10b981' },

  // Scroll
  scroll:           { flex: 1 },
  scrollContent:    { padding: 16, paddingBottom: 32 },

  // Submit error banner
  submitError:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2',
                      borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 14 },
  submitErrorText:  { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },

  // Discount card
  discountCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0fdf4',
                      borderRadius: 12, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  discountIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  discountTitle:    { fontSize: 13, fontWeight: '700', color: '#15803d' },
  discountSub:      { fontSize: 12, color: '#16a34a', marginTop: 2 },

  // Upload progress card
  uploadCard:       { backgroundColor: 'white', borderRadius: 14, padding: 16, marginTop: 14, gap: 12,
                      borderWidth: 1, borderColor: '#e5e7eb',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  uploadCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadCardTitle:  { fontSize: 13, fontWeight: '600', color: '#374151' },
  uploadRow:        { gap: 6 },
  uploadRowTop:     { flexDirection: 'row', justifyContent: 'space-between' },
  uploadRowLabel:   { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  uploadRowPct:     { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  uploadTrack:      { height: 5, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  uploadFill:       { height: 5, backgroundColor: '#3b82f6', borderRadius: 3 },

  // Footer
  footer:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: 'white', paddingHorizontal: 16, paddingTop: 12,
                      borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 10,
                      ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 4 } }) },
  backFooterBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16,
                      paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6', minWidth: 84, justifyContent: 'center' },
  backFooterText:   { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  nextBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                      backgroundColor: '#3b82f6', paddingVertical: 13, borderRadius: 12,
                      shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  nextBtnText:      { fontSize: 15, fontWeight: '700', color: 'white' },
  submitBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                      backgroundColor: '#10b981', paddingVertical: 13, borderRadius: 12,
                      shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  submitBtnText:    { fontSize: 15, fontWeight: '700', color: 'white' },
  btnDisabled:      { backgroundColor: '#e5e7eb', shadowOpacity: 0, elevation: 0 },
  btnTextDisabled:  { color: '#9ca3af' },
});

export default AddProductScreen;
