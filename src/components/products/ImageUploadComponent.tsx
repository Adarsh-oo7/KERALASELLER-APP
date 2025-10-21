/**
 * ImageUploadComponent.tsx  
 * Enhanced with image compression for faster Cloudinary uploads
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface ImageUploadComponentProps {
  mainImage: string;
  subImages: string[];
  existingMainImage: string;
  existingSubImages: string[];
  onMainImageChange: (uri: string) => void;
  onSubImagesChange: (uris: string[]) => void;
  error?: string;
}

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  mainImage,
  subImages,
  existingMainImage,
  existingSubImages,
  onMainImageChange,
  onSubImagesChange,
  error,
}) => {
  
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const selectImage = async (type: 'main' | 'sub') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose how you want to add your image',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: '📷 Take Photo', 
          onPress: () => openCamera(type) 
        },
        { 
          text: '🖼️ Choose from Gallery', 
          onPress: () => openGallery(type) 
        },
      ]
    );
  };

  const openCamera = async (type: 'main' | 'sub') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // ✅ Compress to 80% quality
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        handleImageSelected(imageUri, type);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openGallery = async (type: 'main' | 'sub') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // ✅ Compress to 80% quality
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        handleImageSelected(imageUri, type);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  // ✅ ENHANCED: Centralized image handling with validation
  const handleImageSelected = (imageUri: string, type: 'main' | 'sub') => {
    console.log(`✅ ${type} image selected:`, imageUri);
    
    if (type === 'main') {
      onMainImageChange(imageUri);
    } else {
      if (subImages.length < 4) {
        onSubImagesChange([...subImages, imageUri]);
      } else {
        Alert.alert(
          'Limit Reached',
          'You can only add up to 4 additional images.\n\nTip: Choose your best product angles!',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const removeSubImage = (index: number) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedImages = subImages.filter((_, i) => i !== index);
            onSubImagesChange(updatedImages);
            console.log('🗑️ Sub image removed at index:', index);
          },
        },
      ]
    );
  };

  // ✅ ENHANCED: Clear main image
  const clearMainImage = () => {
    Alert.alert(
      'Remove Main Image',
      'Are you sure? This is the primary product image.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onMainImageChange('');
            console.log('🗑️ Main image cleared');
          },
        },
      ]
    );
  };

  const currentMainImage = mainImage || existingMainImage;
  const allSubImages = [...subImages, ...existingSubImages];

  return (
    <View style={styles.container}>
      {/* Main Image */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="image" size={20} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Main Product Image *</Text>
        </View>
        <Text style={styles.sectionDescription}>
          This will be the primary image customers see first
        </Text>
        
        <TouchableOpacity
          style={[styles.mainImageContainer, error && styles.mainImageError]}
          onPress={() => selectImage('main')}
          activeOpacity={0.8}
        >
          {currentMainImage ? (
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: currentMainImage }} 
                style={styles.mainImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={16} color="white" />
                <Text style={styles.changeText}>Tap to change</Text>
              </View>
              {/* ✅ NEW: Clear button */}
              <TouchableOpacity
                style={styles.clearMainImageButton}
                onPress={(e) => {
                  e.stopPropagation();
                  clearMainImage();
                }}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color="#3b82f6" />
              <Text style={styles.placeholderText}>Add Main Image</Text>
              <Text style={styles.placeholderSubtext}>Tap to upload or take photo</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Additional Images */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="images" size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Additional Images (Optional)</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Add up to 4 more images to showcase different angles
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subImagesScrollContent}
        >
          <View style={styles.subImagesContainer}>
            {/* Existing sub images */}
            {allSubImages.map((imageUri, index) => (
              <View key={index} style={styles.subImageWrapper}>
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.subImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeSubImage(index)}
                >
                  <Ionicons name="close" size={14} color="white" />
                </TouchableOpacity>
                {/* ✅ NEW: Image number badge */}
                <View style={styles.imageNumberBadge}>
                  <Text style={styles.imageNumberText}>{index + 1}</Text>
                </View>
              </View>
            ))}
            
            {/* Add more button */}
            {allSubImages.length < 4 && (
              <TouchableOpacity
                style={styles.addSubImageButton}
                onPress={() => selectImage('sub')}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={32} color="#6b7280" />
                <Text style={styles.addText}>Add Image</Text>
                <Text style={styles.addSubtext}>{4 - allSubImages.length} left</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        
        <View style={styles.imageCountContainer}>
          <Ionicons 
            name={allSubImages.length === 4 ? "checkmark-circle" : "information-circle"} 
            size={14} 
            color={allSubImages.length === 4 ? "#10b981" : "#6b7280"} 
          />
          <Text style={[
            styles.imageCount,
            allSubImages.length === 4 && styles.imageCountComplete
          ]}>
            {allSubImages.length}/4 additional images
            {allSubImages.length === 4 && ' ✓'}
          </Text>
        </View>
      </View>

      {/* Image Guidelines */}
      <View style={styles.guidelinesContainer}>
        <View style={styles.guidelinesHeader}>
          <Ionicons name="list" size={18} color="#1e40af" />
          <Text style={styles.guidelinesTitle}>Image Guidelines</Text>
        </View>
        <View style={styles.guidelinesList}>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.guideline}>Use high-quality, clear images</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.guideline}>Show product from different angles</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.guideline}>Ensure good lighting and focus</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.guideline}>Avoid watermarks or text overlays</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.guideline}>Square images (1:1) work best</Text>
          </View>
        </View>
      </View>

      {/* Preview */}
      {currentMainImage && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Ionicons name="eye" size={18} color="#374151" />
            <Text style={styles.previewTitle}>Preview</Text>
          </View>
          <Text style={styles.previewDescription}>
            How customers will see your product
          </Text>
          
          <View style={styles.previewCard}>
            <Image 
              source={{ uri: currentMainImage }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.previewContent}>
              <Text style={styles.previewProductName}>Your Product Name</Text>
              <Text style={styles.previewPrice}>₹ Your Price</Text>
              {allSubImages.length > 0 && (
                <View style={styles.previewBadge}>
                  <Ionicons name="images" size={10} color="#6b7280" />
                  <Text style={styles.previewBadgeText}>
                    +{allSubImages.length} more {allSubImages.length === 1 ? 'photo' : 'photos'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  mainImageContainer: {
    width: 220,
    height: 220,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  mainImageError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  changeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  clearMainImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  subImagesScrollContent: {
    paddingRight: 20,
  },
  subImagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  subImageWrapper: {
    position: 'relative',
  },
  subImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  imageNumberBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addSubImageButton: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  addText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 4,
  },
  addSubtext: {
    fontSize: 10,
    color: '#9ca3af',
  },
  imageCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  imageCount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  imageCountComplete: {
    color: '#10b981',
    fontWeight: '600',
  },
  guidelinesContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  guidelinesList: {
    gap: 8,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  guideline: {
    flex: 1,
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  previewContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  previewDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  previewBadgeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default ImageUploadComponent;
