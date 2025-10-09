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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import our components
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
      product?: any; // For editing existing product
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
}

// ✅ HELPER FUNCTIONS: Add these before the component
const extractCategoryId = (product: any): number | null => {
  if (!product) {
    console.log('📋 No product provided for category extraction');
    return null;
  }
  
  console.log('📋 Raw product category:', product.category);
  console.log('📋 Category type:', typeof product.category);
  
  // If category is a number, return it directly
  if (typeof product.category === 'number') {
    console.log('✅ Category is number:', product.category);
    return product.category;
  }
  
  // If category is an object with id property
  if (product.category && typeof product.category === 'object' && product.category.id) {
    console.log('✅ Category from object.id:', product.category.id);
    return product.category.id;
  }
  
  // Try category_id field
  if (product.category_id) {
    console.log('✅ Category from category_id:', product.category_id);
    return product.category_id;
  }
  
  // Try stringified number
  if (typeof product.category === 'string' && !isNaN(parseInt(product.category))) {
    const categoryId = parseInt(product.category);
    console.log('✅ Category from string:', categoryId);
    return categoryId;
  }
  
  console.log('❌ No valid category found');
  return null;
};

const extractAttributes = (product: any): { [key: string]: string } => {
  if (!product) {
    console.log('📋 No product for attributes extraction');
    return {};
  }
  
  console.log('📋 Raw product attributes:', product.attributes);
  console.log('📋 Attributes type:', typeof product.attributes);
  
  // If attributes is already an object
  if (product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)) {
    console.log('✅ Attributes is object:', product.attributes);
    return product.attributes;
  }
  
  // If attributes is a JSON string
  if (typeof product.attributes === 'string') {
    try {
      const parsed = JSON.parse(product.attributes);
      console.log('✅ Parsed attributes:', parsed);
      return parsed || {};
    } catch (error) {
      console.log('❌ Failed to parse attributes:', error);
      return {};
    }
  }
  
  console.log('📋 Using empty attributes');
  return {};
};

const AddProductScreen: React.FC<AddProductScreenProps> = ({ navigation, route }) => {
  const existingProduct = route?.params?.product;
  const isEditing = !!existingProduct;

  // ✅ ENHANCED DEBUG: Log the editing state and product data
  useEffect(() => {
    console.log('🔍 AddProductScreen initialized:');
    console.log('📝 Is Editing:', isEditing);
    console.log('📦 Existing Product:', existingProduct);
    if (isEditing && existingProduct) {
      console.log('📋 Product ID:', existingProduct.id);
      console.log('📋 Product Name:', existingProduct.name);
      console.log('📋 Full Product Data:', JSON.stringify(existingProduct, null, 2));
      console.log('📋 Extracted Category:', extractCategoryId(existingProduct));
      console.log('📋 Extracted Attributes:', extractAttributes(existingProduct));
    }
  }, []);

  // ✅ FIXED: Form state with proper category and attributes extraction
  const [formData, setFormData] = useState<ProductFormData>({
    name: existingProduct?.name || '',
    model_name: existingProduct?.model_name || '',
    description: existingProduct?.description || '',
    price: existingProduct?.price?.toString() || '',
    mrp: existingProduct?.mrp?.toString() || '',
    total_stock: existingProduct?.total_stock || 0,
    online_stock: existingProduct?.online_stock || 0,
    sale_type: existingProduct?.sale_type || 'BOTH',
    category: extractCategoryId(existingProduct), // ✅ FIXED: Proper category extraction
    attributes: extractAttributes(existingProduct), // ✅ FIXED: Proper attributes extraction
  });

  // ✅ DEBUG: Log form data after initialization
  useEffect(() => {
    console.log('📋 Form Data initialized:');
    console.log('📋 Category in formData:', formData.category);
    console.log('📋 Attributes in formData:', formData.attributes);
  }, [formData.category, formData.attributes]);

  // Image states
  const [mainImage, setMainImage] = useState<string>('');
  const [subImages, setSubImages] = useState<string[]>([]);
  const [existingMainImage, setExistingMainImage] = useState<string>(existingProduct?.main_image_url || '');
  const [existingSubImages, setExistingSubImages] = useState<string[]>(
    existingProduct?.sub_images?.map((img: any) => img.image_url) || []
  );

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ✅ TESTING METHOD: Basic connectivity test
  const testBasicConnectivity = async (): Promise<void> => {
    try {
      console.log('🧪 Testing basic connectivity...');
      
      // Test 1: Can we reach the server?
      const response = await fetch('http://192.168.1.4:8000/', {
        method: 'GET',
      });
      console.log('✅ Server reachable:', response.status);
      
      // Test 2: Can we access the API?
      const token = await AsyncStorage.getItem('access_token');
      const apiResponse = await fetch('http://192.168.1.4:8000/user/store/products/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      console.log('✅ API accessible:', apiResponse.status);
      
      Alert.alert(
        'Connectivity Test',
        `Server: ${response.status}\nAPI: ${apiResponse.status}\n\nBoth should be 200 or similar.`
      );
      
    } catch (error: any) {
      console.error('❌ Connectivity test failed:', error);
      Alert.alert('Connectivity Failed', `Error: ${error.message}`);
    }
  };

  // ✅ CREATE PRODUCT WITHOUT IMAGES: For testing
  const createProductWithoutImages = async (): Promise<void> => {
    if (!formData.name.trim() || !formData.price || !formData.category) {
      Alert.alert('Missing Info', 'Please fill at least name, price, and category first');
      return;
    }
    
    try {
      console.log('🧪 Testing product creation without images...');
      
      const productData = {
        name: formData.name,
        model_name: formData.model_name,
        description: formData.description,
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp || formData.price),
        total_stock: formData.total_stock,
        online_stock: formData.online_stock,
        sale_type: formData.sale_type,
        category: formData.category,
        attributes: formData.attributes,
      };
      
      console.log('📋 Product data:', productData);
      
      let result;
      if (isEditing) {
        result = await ProductService.updateProductWithoutImages(existingProduct.id, productData);
      } else {
        result = await ProductService.createProductWithoutImages(productData);
      }
      
      console.log(`✅ Product ${isEditing ? 'updated' : 'created'} without images:`, result);
      Alert.alert(
        'Success! 🎉',
        `Product ${isEditing ? 'updated' : 'created'} without images! The service is working correctly.`,
        [
          {
            text: 'View Products',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Products' })
          }
        ]
      );
      
    } catch (error: any) {
      console.error(`❌ Product ${isEditing ? 'update' : 'creation'} failed:`, error);
      Alert.alert('Error', error.message);
    }
  };

  // ✅ FIXED: Native fetch with proper edit handling
  const createProductWithNativeFetch = async (): Promise<void> => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log(`🔄 ${isEditing ? 'Updating' : 'Creating'} product with native fetch...`);
      console.log('📋 Is Editing:', isEditing);
      if (isEditing) {
        console.log('📋 Product ID:', existingProduct.id);
      }
      
      // ✅ SMART DECISION: Check if we have new images to upload
      const hasNewImages = mainImage || subImages.length > 0;
      const hasExistingImages = existingMainImage || existingSubImages.length > 0;
      
      console.log('📸 Has new images:', hasNewImages);
      console.log('📸 Has existing images:', hasExistingImages);

      if (!hasNewImages && (!isEditing || hasExistingImages)) {
        // ✅ NO NEW IMAGES: Use JSON approach (faster and more reliable)
        console.log('📝 Using JSON approach (no new images)...');
        
        const productData = {
          name: formData.name,
          model_name: formData.model_name,
          description: formData.description,
          price: parseFloat(formData.price),
          mrp: parseFloat(formData.mrp || formData.price),
          total_stock: formData.total_stock,
          online_stock: formData.online_stock,
          sale_type: formData.sale_type,
          category: formData.category,
          attributes: formData.attributes,
        };

        let result;
        if (isEditing) {
          result = await ProductService.updateProductWithoutImages(existingProduct.id, productData);
        } else {
          result = await ProductService.createProductWithoutImages(productData);
        }

        console.log('✅ Product saved without new images:', result);
        
        Alert.alert(
          'Success! 🎉',
          `Product ${isEditing ? 'updated' : 'created'} successfully!${!hasNewImages && !hasExistingImages ? ' You can add images later by editing the product.' : ''}`,
          [
            {
              text: 'View Products',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Products' })
            }
          ]
        );
        
      } else {
        // ✅ HAS NEW IMAGES: Use FormData approach with native fetch
        console.log('📸 Using FormData approach (with new images)...');
        
        const productData = new FormData();
        
        // Add text fields
        productData.append('name', formData.name);
        productData.append('model_name', formData.model_name);
        productData.append('description', formData.description);
        productData.append('price', formData.price);
        productData.append('mrp', formData.mrp || formData.price);
        productData.append('total_stock', formData.total_stock.toString());
        productData.append('online_stock', formData.online_stock.toString());
        productData.append('sale_type', formData.sale_type);
        productData.append('category', formData.category?.toString() || '');
        productData.append('attributes', JSON.stringify(formData.attributes));
        
        // Add new images if they exist
        if (mainImage) {
          console.log('📸 Adding new main image:', mainImage);
          productData.append('main_image', {
            uri: mainImage,
            type: 'image/jpeg',
            name: 'main_image.jpg',
          } as any);
        }
        
        if (subImages.length > 0) {
          subImages.forEach((imageUri, index) => {
            console.log(`📸 Adding new sub image ${index}:`, imageUri);
            productData.append('sub_images', {
              uri: imageUri,
              type: 'image/jpeg',
              name: `sub_image_${index}.jpg`,
            } as any);
          });
        }
        
        console.log('📋 FormData keys:', Array.from(productData.keys()));
        
        let result;
        if (isEditing) {
          console.log('🔄 Calling updateProduct service with FormData...');
          result = await ProductService.updateProduct(existingProduct.id, productData);
        } else {
          console.log('🔄 Calling createProduct service with FormData...');
          result = await ProductService.createProduct(productData);
        }

        console.log('✅ Product saved with new images:', result);

        Alert.alert(
          'Success! 🎉',
          `Product ${isEditing ? 'updated' : 'created'} successfully with images!`,
          [
            {
              text: 'View Products',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Products' })
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('❌ Native fetch failed:', error);
      
      if (error.message === 'Network request failed') {
        Alert.alert(
          'Network Error',
          'Cannot connect to server. Please check:\n\n1. Django server is running\n2. Same WiFi network\n3. IP address is correct'
        );
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.total_stock < 0) {
      newErrors.total_stock = 'Stock cannot be negative';
    }

    if (formData.online_stock < 0) {
      newErrors.online_stock = 'Online stock cannot be negative';
    }

    if (formData.online_stock > formData.total_stock) {
      newErrors.online_stock = 'Online stock cannot exceed total stock';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // ✅ FIXED: For editing, don't require new images if existing images are present
    if (!mainImage && !existingMainImage) {
      newErrors.mainImage = 'Main product image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ OPTIMIZED: Smart submit handler with automatic approach selection
  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(`🔄 Submitting product for ${isEditing ? 'update' : 'creation'}...`);
      console.log('📋 Form data being submitted:', formData);
      if (isEditing) {
        console.log('📋 Updating product ID:', existingProduct.id);
      }

      // ✅ SMART DECISION: Check if we have new images to upload
      const hasNewImages = mainImage || subImages.length > 0;
      const hasExistingImages = existingMainImage || existingSubImages.length > 0;
      
      console.log('📸 Has new images:', hasNewImages);
      console.log('📸 Has existing images:', hasExistingImages);

      if (!hasNewImages && (!isEditing || hasExistingImages)) {
        // ✅ NO NEW IMAGES: Use JSON approach (faster and more reliable)
        console.log('📝 Using JSON approach (no new images)...');
        
        const productData = {
          name: formData.name,
          model_name: formData.model_name,
          description: formData.description,
          price: parseFloat(formData.price),
          mrp: parseFloat(formData.mrp || formData.price),
          total_stock: formData.total_stock,
          online_stock: formData.online_stock,
          sale_type: formData.sale_type,
          category: formData.category,
          attributes: formData.attributes,
        };

        let result;
        if (isEditing) {
          result = await ProductService.updateProductWithoutImages(existingProduct.id, productData);
        } else {
          result = await ProductService.createProductWithoutImages(productData);
        }

        console.log('✅ Product saved without new images:', result);
        
        Alert.alert(
          'Success! 🎉',
          `Product ${isEditing ? 'updated' : 'created'} successfully!${!hasNewImages && !hasExistingImages ? ' You can add images later by editing the product.' : ''}`,
          [
            {
              text: 'View Products',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Products' })
            }
          ]
        );
        
      } else {
        // ✅ HAS NEW IMAGES: Use FormData approach with native fetch
        console.log('📸 Using FormData approach (with new images)...');
        
        const productData = new FormData();

        // Add form fields
        Object.keys(formData).forEach(key => {
          if (key === 'attributes') {
            productData.append(key, JSON.stringify(formData[key]));
          } else {
            productData.append(key, formData[key as keyof ProductFormData]?.toString() || '');
          }
        });

        // Add new main image if selected
        if (mainImage) {
          console.log('📸 Adding new main image to FormData');
          productData.append('main_image', {
            uri: mainImage,
            type: 'image/jpeg',
            name: 'main_image.jpg',
          } as any);
        }

        // Add new sub images
        if (subImages.length > 0) {
          subImages.forEach((imageUri, index) => {
            console.log(`📸 Adding new sub image ${index} to FormData`);
            productData.append('sub_images', {
              uri: imageUri,
              type: 'image/jpeg',
              name: `sub_image_${index}.jpg`,
            } as any);
          });
        }

        let result;
        if (isEditing) {
          console.log('🔄 Calling updateProduct service with FormData...');
          result = await ProductService.updateProduct(existingProduct.id, productData);
        } else {
          console.log('🔄 Calling createProduct service with FormData...');
          result = await ProductService.createProduct(productData);
        }

        console.log('✅ Product saved with new images:', result);

        Alert.alert(
          'Success! 🎉',
          `Product ${isEditing ? 'updated' : 'created'} successfully with images!`,
          [
            {
              text: 'View Products',
              onPress: () => navigation.navigate('MainTabs', { screen: 'Products' })
            }
          ]
        );
      }

    } catch (error: any) {
      console.error('❌ Product submission failed:', error);
      
      let errorMessage = `Failed to ${isEditing ? 'update' : 'save'} product`;
      
      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    console.log('📋 Updating form data:', updates);
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear related errors
    const updatedErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete updatedErrors[key];
    });
    setErrors(updatedErrors);
  };

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
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
            // ✅ ADDED: Pass existing attributes for editing
            existingAttributes={formData.attributes}
          />
        );
      case 4:
        return (
          <ImageUploadComponent
            mainImage={mainImage}
            subImages={subImages}
            existingMainImage={existingMainImage}
            existingSubImages={existingSubImages}
            onMainImageChange={setMainImage}
            onSubImagesChange={setSubImages}
            error={errors.mainImage}
          />
        );
      default:
        return null;
    }
  };

  const stepTitles = [
    { icon: 'document-text-outline', title: 'Basic Information', subtitle: 'Name, price, description' },
    { icon: 'cube-outline', title: 'Stock Management', subtitle: 'Inventory & availability' },
    { icon: 'pricetags-outline', title: 'Category & Tags', subtitle: 'Classification & attributes' },
    { icon: 'camera-outline', title: 'Product Images', subtitle: 'Photos & gallery' }
  ];

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.price && parseFloat(formData.price) > 0;
      case 2:
        return formData.total_stock >= 0 && formData.online_stock >= 0 && formData.online_stock <= formData.total_stock;
      case 3:
        return formData.category !== null;
      case 4:
        return mainImage || existingMainImage;
      default:
        return false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderStepIndicator()}

      {/* ✅ UPDATED: Header shows edit/create mode */}
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
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
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

      {/* ✅ ENHANCED: Navigation Buttons with Testing */}
      <View style={styles.navigationContainer}>
        {/* ✅ TESTING BUTTONS: Remove these once working */}
        <View style={styles.testingButtons}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testBasicConnectivity}
          >
            <Text style={styles.testButtonText}>🧪 Test Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={createProductWithoutImages}
          >
            <Text style={styles.testButtonText}>📝 No Images</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={createProductWithNativeFetch}
          >
            <Text style={styles.testButtonText}>🚀 Native Fetch</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.previousButton}
              onPress={() => setCurrentStep(currentStep - 1)}
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
              onPress={() => setCurrentStep(currentStep + 1)}
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
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !canGoNext()}
            >
              {isSubmitting ? (
                <View style={styles.submitButtonContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Updating...' : 'Creating...'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepDotActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  stepDotInactive: {
    backgroundColor: 'white',
    borderColor: '#d1d5db',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepNumberInactive: {
    color: '#9ca3af',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#3b82f6',
  },
  stepLineInactive: {
    backgroundColor: '#e5e7eb',
  },

  // Step Info
  stepInfoContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepInfoText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  stepCounter: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  stepCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Navigation Buttons
  navigationContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  
  // Testing button styles
  testingButtons: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  testButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    flex: 1,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  previousButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    gap: 6,
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default AddProductScreen;
