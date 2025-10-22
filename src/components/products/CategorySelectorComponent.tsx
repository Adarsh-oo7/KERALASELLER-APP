/**
 * CategorySelectorComponent.tsx
 * Complete category selector with hierarchical navigation
 * NOW USES CENTRALIZED API CONFIG! ✅
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseURL } from '../../config/api'; // ✅ ADDED THIS!

interface CategorySelectorComponentProps {
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number) => void;
  onAttributesChange: (attributes: { [key: string]: string }) => void;
  error?: string;
  existingAttributes?: { [key: string]: string };
}

interface Category {
  id: number;
  name: string;
  description?: string;
  parent?: number | null;
  attributes?: Array<{
    name: string;
    required: boolean;
    options?: string[];
  }>;
}

const CategorySelectorComponent: React.FC<CategorySelectorComponentProps> = ({
  selectedCategory,
  onCategorySelect,
  onAttributesChange,
  error,
  existingAttributes = {},
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [attributes, setAttributes] = useState<{ [key: string]: string }>(existingAttributes);

  useEffect(() => {
    console.log('📋 CategorySelector initialized');
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      if (selectedCategoryData?.attributes) {
        const newAttributes = { ...existingAttributes };
        selectedCategoryData.attributes.forEach(attr => {
          if (!newAttributes[attr.name]) {
            newAttributes[attr.name] = '';
          }
        });
        setAttributes(newAttributes);
        onAttributesChange(newAttributes);
      }
    }
  }, [selectedCategory, categories]);

  // ✅ FIXED: Now uses centralized API config!
  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching categories from API...');
      
      const API_URL = `${getBaseURL()}/api/categories/`; // ✅ CHANGED THIS LINE!
      const token = await AsyncStorage.getItem('access_token');
      
      console.log('📡 API URL:', API_URL);
      console.log('🔑 Token available:', !!token);

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Categories fetched:', data.length || 0);
      console.log('📋 Sample category:', data[0]);
      
      setCategories(data || []);
    } catch (error: any) {
      console.error('❌ Failed to fetch categories:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
      });
      
      Alert.alert(
        'Error Loading Categories',
        'Failed to load categories. Please check your internet connection and try again.\n\n' + 
        `Error: ${error.message}`,
        [
          { text: 'Retry', onPress: fetchCategories },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleCategorySelect = (categoryId: number) => {
    console.log('📋 Category selected:', categoryId);
    onCategorySelect(categoryId);
    
    if (categoryId === 0) {
      setAttributes({});
      onAttributesChange({});
    }
  };

  const handleAttributeChange = (attributeName: string, value: string) => {
    console.log('📋 Attribute changed:', attributeName, '=', value);
    const newAttributes = { ...attributes, [attributeName]: value };
    setAttributes(newAttributes);
    onAttributesChange(newAttributes);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading categories...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </View>
      </View>
    );
  }

  if (categories.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Product Category *</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>No Categories Available</Text>
          <Text style={styles.errorText}>
            Unable to load categories. Please check your internet connection.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchCategories}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.label}>Product Category *</Text>
        {categories.length > 0 && (
          <Text style={styles.categoryCount}>
            {categories.length} available
          </Text>
        )}
      </View>

      {categories.length > 5 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor="#9ca3af"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {selectedCategory && selectedCategoryData && (
        <View style={styles.selectedCategoryContainer}>
          <Text style={styles.selectedLabel}>Selected Category:</Text>
          <View style={styles.selectedCategory}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.selectedCategoryText}>
              {selectedCategoryData.name}
            </Text>
            <TouchableOpacity 
              onPress={() => handleCategorySelect(0)}
              style={styles.clearButton}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <ScrollView 
        style={styles.categoriesContainer} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {filteredCategories.length === 0 ? (
          <View style={styles.noCategoriesContainer}>
            <Ionicons name="search-outline" size={48} color="#9ca3af" />
            <Text style={styles.noCategoriesText}>
              {searchQuery ? `No categories found for "${searchQuery}"` : 'No categories available'}
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryOption,
                selectedCategory === category.id && styles.categoryOptionActive
              ]}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.categoryNameActive
                  ]}>
                    {category.name}
                  </Text>
                  {selectedCategory === category.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  )}
                </View>
                
                {category.description && (
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                )}
                
                {category.attributes && category.attributes.length > 0 && (
                  <View style={styles.attributesBadge}>
                    <Ionicons name="pricetags" size={12} color="#3b82f6" />
                    <Text style={styles.attributesInfo}>
                      {category.attributes.length} attributes
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedCategoryData?.attributes && selectedCategoryData.attributes.length > 0 && (
        <View style={styles.attributesContainer}>
          <View style={styles.attributesHeader}>
            <Ionicons name="list" size={20} color="#3b82f6" />
            <Text style={styles.attributesTitle}>Additional Details</Text>
          </View>
          <Text style={styles.attributesSubtitle}>
            Complete these fields to help customers find your product
          </Text>
          
          {selectedCategoryData.attributes.map((attribute, index) => (
            <View key={index} style={styles.attributeGroup}>
              <Text style={styles.attributeLabel}>
                {attribute.name}
                {attribute.required && <Text style={styles.required}> *</Text>}
              </Text>
              
              {attribute.options && attribute.options.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.optionsScroll}
                >
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        !attributes[attribute.name] && styles.optionButtonActive
                      ]}
                      onPress={() => handleAttributeChange(attribute.name, '')}
                    >
                      <Text style={[
                        styles.optionText,
                        !attributes[attribute.name] && styles.optionTextActive
                      ]}>
                        None
                      </Text>
                    </TouchableOpacity>
                    {attribute.options.map((option, optionIndex) => (
                      <TouchableOpacity
                        key={optionIndex}
                        style={[
                          styles.optionButton,
                          attributes[attribute.name] === option && styles.optionButtonActive
                        ]}
                        onPress={() => handleAttributeChange(attribute.name, option)}
                      >
                        <Text style={[
                          styles.optionText,
                          attributes[attribute.name] === option && styles.optionTextActive
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <TextInput
                  style={styles.attributeInput}
                  value={attributes[attribute.name] || ''}
                  onChangeText={(value) => handleAttributeChange(attribute.name, value)}
                  placeholder={`Enter ${attribute.name.toLowerCase()}`}
                  placeholderTextColor="#9ca3af"
                />
              )}
            </View>
          ))}
        </View>
      )}

      {!selectedCategory && categories.length > 0 && (
        <View style={styles.popularContainer}>
          <Text style={styles.popularTitle}>
            <Ionicons name="flash" size={14} color="#f59e0b" /> Quick Select:
          </Text>
          <View style={styles.popularList}>
            {categories.slice(0, 5).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.popularTag}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text style={styles.popularTagText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.helpContainer}>
        <Ionicons name="information-circle" size={14} color="#9ca3af" />
        <Text style={styles.helpText}>
          Choose a category that best matches your product
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  selectedCategoryContainer: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 8,
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#ef4444',
  },
  categoriesContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  noCategoriesContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  noCategoriesText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  clearSearchButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearSearchText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionActive: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  categoryContent: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  categoryNameActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  attributesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attributesInfo: {
    fontSize: 10,
    color: '#3b82f6',
    fontStyle: 'italic',
  },
  attributesContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  attributesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attributesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  attributesSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  attributeGroup: {
    gap: 8,
  },
  attributeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  attributeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    color: '#374151',
  },
  optionsScroll: {
    marginVertical: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  optionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  popularContainer: {
    marginBottom: 16,
    gap: 8,
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  popularList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  popularTagText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  helpText: {
    flex: 1,
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default CategorySelectorComponent;
