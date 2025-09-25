import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const COLORS = {
  primary: '#0077B5',
  background: '#F3F2F0',
  surface: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#5E5E5E',
};

export default function ProductsScreen() {
  const handleAddProduct = () => {
    Alert.alert('Coming Soon', 'Add product feature coming soon!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Products</Text>
      <Text style={styles.subtitle}>Manage your product catalog</Text>
      
      <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
        <Text style={styles.addButtonText}>➕ Add New Product</Text>
      </TouchableOpacity>
      
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>📦</Text>
        <Text style={styles.placeholderTitle}>No Products Yet</Text>
        <Text style={styles.placeholderSubtitle}>Start by adding your first product</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 40,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
