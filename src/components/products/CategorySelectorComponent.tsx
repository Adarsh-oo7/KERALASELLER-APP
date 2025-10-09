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
import ProductService from '../../services/ProductService';

interface CategorySelectorComponentProps {
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number) => void;
  onAttributesChange: (attributes: { [key: string]: string }) => void;
  error?: string;
  existingAttributes?: { [key: string]: string }; // ✅ ADDED: For editing support
}

interface Category {
  id: number;
  name: string;
  description?: string;
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
  existingAttributes = {}, // ✅ ADDED: Default to empty object
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [attributes, setAttributes] = useState<{ [key: string]: string }>(existingAttributes);

  // ✅ ENHANCED: Debug logging
  useEffect(() => {
    console.log('📋 CategorySelector initialized with:');
    console.log('📋 Selected Category:', selectedCategory);
    console.log('📋 Existing Attributes:', existingAttributes);
    fetchCategories();
  }, []);

  // ✅ ENHANCED: Initialize attributes when category changes
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching categories...');
      
      const response = await ProductService.getCategories();
      console.log('✅ Categories fetched:', response.data?.length || 0);
      
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('❌ Failed to fetch categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please check your connection and try again.');
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
    
    // Reset attributes when category changes
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
        </View>
      </View>
    );
  }

  // ✅ ENHANCED: Better error handling
  if (categories.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Product Category *</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No categories available. Please check your internet connection.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchCategories}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ ENHANCED: Category Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.label}>Product Category *</Text>
        {categories.length > 0 && (
          <Text style={styles.categoryCount}>
            {categories.length} categories available
          </Text>
        )}
      </View>

      {/* Search */}
      {categories.length > 5 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for category..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      )}

      {/* Selected Category Display */}
      {selectedCategory && selectedCategoryData && (
        <View style={styles.selectedCategoryContainer}>
          <Text style={styles.selectedLabel}>Selected Category:</Text>
          <View style={styles.selectedCategory}>
            <Text style={styles.selectedCategoryText}>
              {selectedCategoryData.name}
            </Text>
            <TouchableOpacity 
              onPress={() => handleCategorySelect(0)}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Categories List */}
      <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
        {filteredCategories.length === 0 ? (
          <View style={styles.noCategoriesContainer}>
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
            >
              <View style={styles.categoryContent}>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameActive
                ]}>
                  {category.name}
                </Text>
                {category.description && (
                  <Text style={styles.categoryDescription} numberOfLines={2}>
                    {category.description}
                  </Text>
                )}
                {category.attributes && category.attributes.length > 0 && (
                  <Text style={styles.attributesInfo}>
                    {category.attributes.length} attributes available
                  </Text>
                )}
              </View>
              {selectedCategory === category.id && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Category Attributes */}
      {selectedCategoryData?.attributes && selectedCategoryData.attributes.length > 0 && (
        <View style={styles.attributesContainer}>
          <Text style={styles.attributesTitle}>Additional Details</Text>
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
                // Dropdown for predefined options
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                // Text input for free form
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

      {/* ✅ ENHANCED: Popular Categories with Search Integration */}
      {!selectedCategory && categories.length > 0 && (
        <View style={styles.popularContainer}>
          <Text style={styles.popularTitle}>Quick Select:</Text>
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

      {/* ✅ ADDED: Help text */}
      <Text style={styles.helpText}>
        Choose a category that best matches your product to help customers find it easily.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  
  // ✅ ENHANCED: Header styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#6b7280',
  },
  
  // ✅ ENHANCED: Error container
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  
  retryButton: {
    marginTop: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  searchContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#374151',
  },
  selectedCategoryContainer: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  categoriesContainer: {
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  
  // ✅ ENHANCED: No categories container
  noCategoriesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noCategoriesText: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionActive: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  
  // ✅ ENHANCED: Category content
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  categoryNameActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  attributesInfo: {
    fontSize: 10,
    color: '#3b82f6',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  checkMark: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
  },
  attributesContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attributesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  
  // ✅ ADDED: Attributes subtitle
  attributesSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  
  attributeGroup: {
    marginBottom: 16,
  },
  attributeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  attributeInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: 'white',
    color: '#374151',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
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
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
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
  
  // ✅ ADDED: Help text
  helpText: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default CategorySelectorComponent;
