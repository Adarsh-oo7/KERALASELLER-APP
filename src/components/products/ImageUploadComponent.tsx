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
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera(type) },
        { text: 'Gallery', onPress: () => openGallery(type) },
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ Use MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (type === 'main') {
          onMainImageChange(imageUri);
        } else {
          if (subImages.length < 4) {
            onSubImagesChange([...subImages, imageUri]);
          } else {
            Alert.alert('Limit Reached', 'You can only add up to 4 additional images');
          }
        }
        console.log(`✅ ${type} image selected:`, imageUri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openGallery = async (type: 'main' | 'sub') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ Use MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (type === 'main') {
          onMainImageChange(imageUri);
        } else {
          if (subImages.length < 4) {
            onSubImagesChange([...subImages, imageUri]);
          } else {
            Alert.alert('Limit Reached', 'You can only add up to 4 additional images');
          }
        }
        console.log(`✅ ${type} image selected:`, imageUri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const removeSubImage = (index: number) => {
    const updatedImages = subImages.filter((_, i) => i !== index);
    onSubImagesChange(updatedImages);
  };

  const currentMainImage = mainImage || existingMainImage;
  const allSubImages = [...subImages, ...existingSubImages];

  return (
    <View style={styles.container}>
      {/* Main Image */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Main Product Image *</Text>
        <Text style={styles.sectionDescription}>
          This will be the primary image customers see first
        </Text>
        
        <TouchableOpacity
          style={[styles.mainImageContainer, error && styles.mainImageError]}
          onPress={() => selectImage('main')}
        >
          {currentMainImage ? (
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: currentMainImage }} 
                style={styles.mainImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.changeText}>Tap to change</Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>Add Main Image</Text>
              <Text style={styles.placeholderSubtext}>Tap to upload</Text>
            </View>
          )}
        </TouchableOpacity>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Additional Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Images (Optional)</Text>
        <Text style={styles.sectionDescription}>
          Add up to 4 more images to showcase different angles
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add more button */}
            {allSubImages.length < 4 && (
              <TouchableOpacity
                style={styles.addSubImageButton}
                onPress={() => selectImage('sub')}
              >
                <Text style={styles.addIcon}>+</Text>
                <Text style={styles.addText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        
        <Text style={styles.imageCount}>
          {allSubImages.length}/4 additional images
        </Text>
      </View>

      {/* Image Guidelines */}
      <View style={styles.guidelinesContainer}>
        <Text style={styles.guidelinesTitle}>📋 Image Guidelines:</Text>
        <Text style={styles.guideline}>• Use high-quality, clear images</Text>
        <Text style={styles.guideline}>• Show product from different angles</Text>
        <Text style={styles.guideline}>• Ensure good lighting and focus</Text>
        <Text style={styles.guideline}>• Avoid watermarks or text overlays</Text>
        <Text style={styles.guideline}>• Square images (1:1 ratio) work best</Text>
      </View>

      {/* Image Preview */}
      {currentMainImage && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Preview:</Text>
          <Text style={styles.previewDescription}>How customers will see your product</Text>
          
          <View style={styles.previewCard}>
            <Image 
              source={{ uri: currentMainImage }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.previewContent}>
              <Text style={styles.previewProductName}>Your Product Name</Text>
              <Text style={styles.previewPrice}>₹ Your Price</Text>
              <Text style={styles.previewBadge}>
                {allSubImages.length > 0 ? `+${allSubImages.length} more photos` : 'Single photo'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ... styles remain the same as before ...

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  mainImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    alignSelf: 'center',
  },
  mainImageError: {
    borderColor: '#ef4444',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
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
    padding: 8,
    alignItems: 'center',
  },
  changeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderIcon: {
    fontSize: 32,
  },
  placeholderText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  subImagesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  subImageWrapper: {
    position: 'relative',
  },
  subImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addSubImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  addIcon: {
    fontSize: 24,
    color: '#6b7280',
    marginBottom: 4,
  },
  addText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  imageCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  guidelinesContainer: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  guideline: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
  previewContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  previewBadge: {
    fontSize: 10,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});

export default ImageUploadComponent;
