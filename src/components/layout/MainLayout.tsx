import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MainLayoutProps {
  children: React.ReactNode;
  navigation: any;
  currentTab?: string;
  headerTitle?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  navigation, 
  currentTab, 
  headerTitle 
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle || 'Kerala Sellers'}</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40, // To center the title
  },
  content: {
    flex: 1,
  },
});

export default MainLayout;
