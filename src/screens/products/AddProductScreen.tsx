/**
 * AddProductScreen.tsx
 * ✅ FIXED: Infinite loop resolved + Product creation with Cloudinary
 * Works perfectly with your Django backend - NO BACKEND CHANGES NEEDED!
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import components
import BasicInfoComponent from '../../components/products/BasicInfoComponent';
import StockManagementComponent from '../../components/products/StockManagementComponent';
import CategorySelectorComponent from '../../components/products/CategorySelectorComponent';
import ImageUploadComponent from '../../components/products/ImageUploadComponent';

// Services
import ProductService from '../../services/ProductService';
import { ApiError } from '../../types/api';

type AddProductScreenProps = {
  navigation: StackNavigationProp<any>;
  route?: {
    params?: {
      product?: any;
    };
  };
};

interface ProductFormData {
  name: string;
  model_name: string;
  description: string;
  price: string;
  mrp: string;
  total_stock: number;
  online_stock: number;
  sale_type: 'BOTH' | 'ONLINE' | 'OFFLINE';
  category: number | null;
  attributes: { [key: string]: string };
  sku?: string;
}

// ✅ CLOUDINARY CONFIGURATION
const CLOUDINARY_CONFIG = {
  cloud_name: 'dnmbfeckd',
  upload_preset: 'kerala_sellers_preset',
  fallback_presets: ['ml_default', 'kerala_sellers_unsigned', 'unsigned_preset'],
};

// ============================================================================
// ✅ HELPER FUNCTIONS
// ============================================================================

const extractCategoryId = (product: any): number | null => {
  if (!product) return null;
  
  if (typeof product.category === 'number') return product.category;
  if (product.category?.id) return product.category.id;
  if (product.category_id) return product.category_id;
  if (typeof product.category === 'string' && !isNaN(parseInt(product.category))) {
    return parseInt(product.category);
  }
  
  return null;
};

const extractAttributes = (product: any): { [key: string]: string } => {
  if (!product) return {};
  
  if (product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)) {
    return product.attributes;
  }
  
  if (typeof product.attributes === 'string') {
    try {
      return JSON.parse(product.attributes) || {};
    } catch {
      return {};
    }
  }
  
  return {};
};

const validatePositiveNumber = (value: string, fieldName: string): { isValid: boolean; error?: string; cleanedValue?: string } => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  
  if ((cleaned.match(/\./g) || []).length > 1) {
    return { isValid: false, error: `${fieldName} can only have one decimal point` };
  }
  
  const numValue = parseFloat(cleaned);
  
  if (isNaN(numValue) || numValue < 0) {
    return { isValid: false, error: `${fieldName} must be a positive number` };
  }
  
  return { isValid: true, cleanedValue: cleaned };
};

// ============================================================================
// ✅ CLOUDINARY UPLOAD FUNCTION
// ============================================================================

const uploadImageToCloudinary = async (
  imageUri: string,
  onProgress?: (progress: number) => void,
  imageType: 'main' | 'sub' = 'main'
): Promise<{ url: string; public_id: string }> => {
  console.log(`☁️ Starting Cloudinary upload for ${imageType} image:`, imageUri);
  
  const presetsToTry = [
    CLOUDINARY_CONFIG.upload_preset,
    ...CLOUDINARY_CONFIG.fallback_presets,
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < presetsToTry.length; i++) {
    const preset = presetsToTry[i];
    console.log(`🔄 Trying preset ${i + 1}/${presetsToTry.length}:`, preset);

    try {
      const formData = new FormData();
      
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `product_${imageType}_${Date.now()}.jpg`,
      } as any);
      
      formData.append('upload_preset', preset);
      formData.append('cloud_name', CLOUDINARY_CONFIG.cloud_name);
      formData.append('folder', `kerala-sellers/products/${imageType}`);
      formData.append('tags', 'kerala-sellers,product,mobile-app');

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.min(percentComplete, 99));
        }
      });

      const response: any = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              onProgress?.(100);
              resolve(parsed);
            } catch (err) {
              reject(new Error('Failed to parse Cloudinary response'));
            }
          } else {
            reject(new Error(`Cloudinary error: ${xhr.status} - ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error('Upload timeout'));
        xhr.timeout = 60000;
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`);
        xhr.send(formData);
      });

      console.log('✅ Cloudinary upload successful with preset:', preset);
      return {
        url: response.secure_url,
        public_id: response.public_id,
      };

    } catch (error: any) {
      lastError = error;
      console.log(`❌ Upload failed with preset ${preset}:`, error.message);
      
      if (i < presetsToTry.length - 1) {
        console.log('🔄 Retrying with next preset...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  throw new Error(
    `Image upload failed after trying ${presetsToTry.length} presets. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
};

// ============================================================================
// ✅ MAIN COMPONENT
// ============================================================================

const AddProductScreen: React.FC<AddProductScreenProps> = ({ navigation, route }) => {
  const existingProduct = route?.params?.product;
  const isEditing = !!existingProduct;

  const [formData, setFormData] = useState<ProductFormData>({
    name: existingProduct?.name || '',
    model_name: existingProduct?.model_name || '',
    description: existingProduct?.description || '',
    price: existingProduct?.price?.toString() || '',
    mrp: existingProduct?.mrp?.toString() || '',
    total_stock: existingProduct?.total_stock || 0,
    online_stock: existingProduct?.online_stock || 0,
    sale_type: existingProduct?.sale_type || 'BOTH',
    category: extractCategoryId(existingProduct),
    attributes: extractAttributes(existingProduct),
    sku: existingProduct?.sku || '',
  });

  const [mainImage, setMainImage] = useState<string>('');
  const [subImages, setSubImages] = useState<string[]>([]);
  const [existingMainImage, setExistingMainImage] = useState<string>(existingProduct?.main_image_url || '');
  const [existingSubImages, setExistingSubImages] = useState<string[]>(
    existingProduct?.sub_images?.map((img: any) => img.image_url || img.url) || []
  );

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ============================================================================
  // ✅ VALIDATION FUNCTIONS - FIXED TO PREVENT INFINITE LOOP
  // ============================================================================

  const calculateDiscount = () => {
    if (!formData.mrp || !formData.price) return null;
    
    const mrp = parseFloat(formData.mrp);
    const price = parseFloat(formData.price);
    
    if (mrp > price && !isNaN(mrp) && !isNaN(price)) {
      const discount = mrp - price;
      const percentage = Math.round((discount / mrp) * 100);
      return { discount, percentage };
    }
    
    return null;
  };

  // ✅ FIXED: Don't call setErrors inside this function
  const validateStock = (): boolean => {
    const { total_stock, online_stock } = formData;
    
    if (online_stock > total_stock) {
      return false;
    }
    
    if (online_stock < 0 || total_stock < 0) {
      return false;
    }
    
    return true;
  };

  // ✅ COMPREHENSIVE FORM VALIDATION
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    // Price validation
    const priceValidation = validatePositiveNumber(formData.price, 'Price');
    if (!priceValidation.isValid) {
      newErrors.price = priceValidation.error || 'Valid price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    // MRP validation
    if (formData.mrp) {
      const mrpValidation = validatePositiveNumber(formData.mrp, 'MRP');
      if (!mrpValidation.isValid) {
        newErrors.mrp = mrpValidation.error || 'Valid MRP is required';
      } else if (parseFloat(formData.mrp) < parseFloat(formData.price)) {
        newErrors.mrp = 'MRP must be greater than or equal to selling price';
      }
    }

    // ✅ FIXED: Stock validation logic here
    const { total_stock, online_stock } = formData;
    
    if (online_stock > total_stock) {
      newErrors.online_stock = 'Online stock cannot exceed total stock';
    }
    
    if (online_stock < 0 || total_stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Image validation (only for new products)
    if (!isEditing && !mainImage && !existingMainImage) {
      newErrors.mainImage = 'Main product image is required';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      console.log('❌ Validation failed:', firstError);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // ✅ IMAGE UPLOAD HANDLER
  // ============================================================================

  const uploadImagesToCloudinary = async (): Promise<{
    main_image_url?: string;
    sub_image_urls?: { url: string; public_id: string }[];
  }> => {
    const result: {
      main_image_url?: string;
      sub_image_urls?: { url: string; public_id: string }[];
    } = {};

    setIsUploading(true);
    console.log('☁️ Starting image uploads to Cloudinary...');

    try {
      if (mainImage) {
        console.log('📸 Uploading main image...');
        const mainImageResult = await uploadImageToCloudinary(mainImage, (progress) => {
          setUploadProgress(prev => ({ ...prev, main: progress }));
        }, 'main');
        result.main_image_url = mainImageResult.url;
        console.log('✅ Main image uploaded:', mainImageResult.url);
      }

      if (subImages.length > 0) {
        console.log(`📸 Uploading ${subImages.length} sub images...`);
        result.sub_image_urls = [];
        
        for (let i = 0; i < subImages.length; i++) {
          const subImageResult = await uploadImageToCloudinary(subImages[i], (progress) => {
            setUploadProgress(prev => ({ ...prev, [`sub_${i}`]: progress }));
          }, 'sub');
          result.sub_image_urls.push(subImageResult);
          console.log(`✅ Sub image ${i + 1}/${subImages.length} uploaded:`, subImageResult.url);
        }
      }

      console.log('✅ All images uploaded successfully!');

    } catch (error: any) {
      console.error('❌ Cloudinary upload failed:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }

    return result;
  };

  // ============================================================================
  // ✅ SUBMIT HANDLER - FIXED TO WORK WITH YOUR BACKEND!
  // ============================================================================

  const handleSubmit = async (): Promise<void> => {
    console.log('🚀 Submit button pressed');
    
    if (!validateForm()) {
      const errorMessages = Object.values(errors).join('\n');
      Alert.alert('Validation Error', errorMessages || 'Please fix the errors and try again');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log(`🔄 ${isEditing ? 'Updating' : 'Creating'} product...`);

      const hasNewImages = mainImage || subImages.length > 0;
      const totalNewImages = (mainImage ? 1 : 0) + subImages.length;

      let imageUrls: {
        main_image_url?: string;
        sub_image_urls?: { url: string; public_id: string }[];
      } = {};

      if (hasNewImages) {
        console.log(`☁️ Uploading ${totalNewImages} image(s) to Cloudinary...`);
        imageUrls = await uploadImagesToCloudinary();
        console.log('✅ All images uploaded to Cloudinary');
      }

      // ✅ FIXED: Prepare product data WITHOUT undefined values
      const productData: any = {
        name: formData.name.trim(),
        model_name: formData.model_name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp || formData.price),
        total_stock: parseInt(formData.total_stock.toString()),
        online_stock: parseInt(formData.online_stock.toString()),
        sale_type: formData.sale_type,
        category: formData.category,
        attributes: formData.attributes || {},
      };

      // ✅ ONLY add SKU if it has a value
      if (formData.sku && formData.sku.trim()) {
        productData.sku = formData.sku.trim();
      }

      // ✅ Add main image URL
      if (imageUrls.main_image_url) {
        productData.main_image_url = imageUrls.main_image_url;
        console.log('✅ Added main_image_url to product data');
      }

      // ✅ Add sub image URLs (your backend already handles this format!)
      if (imageUrls.sub_image_urls && imageUrls.sub_image_urls.length > 0) {
        productData.sub_image_urls = imageUrls.sub_image_urls;
        console.log(`✅ Added ${imageUrls.sub_image_urls.length} sub_image_urls`);
      }

      console.log('📋 Submitting product data:', JSON.stringify(productData, null, 2));

      // ✅ Submit to Django API
      let result;
      if (isEditing) {
        result = await ProductService.updateProductWithoutImages(existingProduct.id, productData);
        console.log('✅ Product updated:', result);
      } else {
        result = await ProductService.createProductWithoutImages(productData);
        console.log('✅ Product created:', result);
      }

      // ✅ Calculate success message with discount info
      const discount = calculateDiscount();
      let successMessage = `Product ${isEditing ? 'updated' : 'created'} successfully!`;
      
      if (discount) {
        successMessage += `\n\n🎉 You're offering ${discount.percentage}% off!`;
        successMessage += `\n💰 Customers save ₹${discount.discount.toLocaleString('en-IN')}`;
      }
      
      if (hasNewImages) {
        successMessage += `\n☁️ ${totalNewImages} image(s) uploaded to cloud`;
      }

      Alert.alert(
        '🎉 Success!',
        successMessage,
        [
          {
            text: 'View Products',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Products' } }],
              });
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Product submission failed:', error);
      
      let errorMessage = `Failed to ${isEditing ? 'update' : 'save'} product`;
      
      if (error.message.includes('Image upload failed')) {
        errorMessage = '☁️ Image upload failed. Please check your internet connection and try again.';
      } else if (error.message.includes('Network')) {
        errorMessage = '🌐 Network error. Please check your connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '⏱️ Request timeout. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('❌ Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // ✅ FORM DATA UPDATER
  // ============================================================================

  const updateFormData = (updates: Partial<ProductFormData>) => {
    console.log('📋 Updating form data:', updates);
    
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      if (updates.total_stock !== undefined && updates.total_stock < prev.online_stock) {
        newData.online_stock = updates.total_stock;
        console.log('⚠️ Auto-adjusted online stock to match total stock');
      }
      
      return newData;
    });
    
    const updatedErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete updatedErrors[key];
      if (key === 'total_stock' || key === 'online_stock') {
        delete updatedErrors.stock;
      }
    });
    setErrors(updatedErrors);
  };

  // ============================================================================
  // ✅ STEP NAVIGATION - FIXED
  // ============================================================================

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.name.trim() && 
          formData.price && 
          parseFloat(formData.price) > 0
        );
      case 2:
        // ✅ FIXED: Just check the values, don't call validateStock()
        return formData.online_stock >= 0 && 
               formData.total_stock >= 0 && 
               formData.online_stock <= formData.total_stock;
      case 3:
        return formData.category !== null;
      case 4:
        return !!(mainImage || existingMainImage);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ============================================================================
  // ✅ RENDER FUNCTIONS
  // ============================================================================

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={styles.stepItemContainer}>
          <View
            style={[
              styles.stepDot,
              currentStep >= step ? styles.stepDotActive : styles.stepDotInactive
            ]}
          >
            <Text style={[
              styles.stepNumber,
              currentStep >= step ? styles.stepNumberActive : styles.stepNumberInactive
            ]}>
              {step}
            </Text>
          </View>
          {step < 4 && (
            <View style={[
              styles.stepLine,
              currentStep > step ? styles.stepLineActive : styles.stepLineInactive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const stepTitles = [
    { icon: 'document-text-outline', title: 'Basic Information', subtitle: 'Name, price, description' },
    { icon: 'cube-outline', title: 'Stock Management', subtitle: 'Inventory & availability' },
    { icon: 'pricetags-outline', title: 'Category & Tags', subtitle: 'Classification & attributes' },
    { icon: 'camera-outline', title: 'Product Images', subtitle: 'Photos & gallery' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <BasicInfoComponent
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
            />
            {(() => {
              const discount = calculateDiscount();
              return discount ? (
                <View style={styles.discountBanner}>
                  <Ionicons name="pricetag" size={20} color="#10b981" />
                  <View style={styles.discountContent}>
                    <Text style={styles.discountTitle}>
                      🎉 {discount.percentage}% OFF!
                    </Text>
                    <Text style={styles.discountSubtitle}>
                      Customers save ₹{discount.discount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              ) : null;
            })()}
          </View>
        );
      case 2:
        return (
          <StockManagementComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <CategorySelectorComponent
            selectedCategory={formData.category}
            onCategorySelect={(categoryId: number) => {
              console.log('📋 Category selected:', categoryId);
              updateFormData({ category: categoryId });
            }}
            onAttributesChange={(attributes: { [key: string]: string }) => {
              console.log('📋 Attributes changed:', attributes);
              updateFormData({ attributes });
            }}
            error={errors.category}
            existingAttributes={formData.attributes}
          />
        );
      case 4:
        return (
          <View>
            <ImageUploadComponent
              mainImage={mainImage}
              subImages={subImages}
              existingMainImage={existingMainImage}
              existingSubImages={existingSubImages}
              onMainImageChange={setMainImage}
              onSubImagesChange={setSubImages}
              error={errors.mainImage}
            />
            {isUploading && (
              <View style={styles.uploadProgressContainer}>
                <View style={styles.uploadProgressHeader}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.uploadProgressTitle}>
                    Uploading to cloud storage...
                  </Text>
                </View>
                {Object.entries(uploadProgress).map(([key, progress]) => (
                  <View key={key} style={styles.progressItemContainer}>
                    <View style={styles.progressItemHeader}>
                      <Text style={styles.progressLabel}>
                        {key === 'main' ? '📸 Main Image' : `🖼️ Sub Image ${parseInt(key.split('_')[1]) + 1}`}
                      </Text>
                      <Text style={styles.progressPercentage}>{progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderStepIndicator()}

      <View style={styles.stepInfoContainer}>
        <View style={styles.stepInfoHeader}>
          <View style={styles.stepIconContainer}>
            <Ionicons 
              name={isEditing ? "pencil" : stepTitles[currentStep - 1].icon as any} 
              size={24} 
              color="#3b82f6" 
            />
          </View>
          <View style={styles.stepInfoText}>
            <Text style={styles.stepTitle}>
              {isEditing ? `Edit: ${existingProduct?.name || 'Product'}` : stepTitles[currentStep - 1].title}
            </Text>
            <Text style={styles.stepSubtitle}>
              {isEditing ? 'Update product information' : stepTitles[currentStep - 1].subtitle}
            </Text>
          </View>
          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>{currentStep}/4</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarFull}>
            <View style={[
              styles.progressFillFull,
              { width: `${(currentStep / 4) * 100}%` }
            ]} />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.previousButton}
              onPress={handlePrevious}
            >
              <Ionicons name="chevron-back" size={20} color="#6b7280" />
              <Text style={styles.previousButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonSpacer} />

          {currentStep < 4 ? (
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canGoNext() && styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!canGoNext()}
            >
              <Text style={[
                styles.nextButtonText,
                !canGoNext() && styles.nextButtonTextDisabled
              ]}>
                Continue
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={!canGoNext() ? '#9ca3af' : 'white'} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || isUploading || !canGoNext()) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || isUploading || !canGoNext()}
            >
              {isSubmitting || isUploading ? (
                <View style={styles.submitButtonContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.submitButtonText}>
                    {isUploading ? 'Uploading...' : isEditing ? 'Updating...' : 'Creating...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.submitButtonContent}>
                  <Ionicons 
                    name={isEditing ? "checkmark-circle" : "add-circle"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Update Product' : 'Create Product'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// ✅ STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  stepItemContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  stepDotActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  stepDotInactive: { backgroundColor: 'white', borderColor: '#d1d5db' },
  stepNumber: { fontSize: 14, fontWeight: 'bold' },
  stepNumberActive: { color: 'white' },
  stepNumberInactive: { color: '#9ca3af' },
  stepLine: { flex: 1, height: 2, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#3b82f6' },
  stepLineInactive: { backgroundColor: '#e5e7eb' },

  stepInfoContainer: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  stepInfoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepInfoText: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
  stepSubtitle: { fontSize: 13, color: '#6b7280' },
  stepCounter: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 12 },
  stepCounterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  progressContainer: { marginTop: 8 },
  progressBarFull: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFillFull: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },

  discountBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#d1fae5', borderRadius: 12, marginTop: 16, gap: 12 },
  discountContent: { flex: 1 },
  discountTitle: { fontSize: 16, fontWeight: '700', color: '#047857', marginBottom: 4 },
  discountSubtitle: { fontSize: 14, color: '#059669' },

  uploadProgressContainer: { padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, marginTop: 16, gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  uploadProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadProgressTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  progressItemContainer: { gap: 6 },
  progressItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  progressPercentage: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  navigationContainer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  buttonSpacer: { flex: 1 },
  previousButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', gap: 6 },
  previousButtonText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  nextButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#3b82f6', gap: 6 },
  nextButtonDisabled: { backgroundColor: '#d1d5db' },
  nextButtonText: { fontSize: 14, fontWeight: '600', color: 'white' },
  nextButtonTextDisabled: { color: '#9ca3af' },
  submitButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#10b981' },
  submitButtonDisabled: { backgroundColor: '#d1d5db' },
  submitButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitButtonText: { fontSize: 14, fontWeight: '600', color: 'white' },
});

export default AddProductScreen;
