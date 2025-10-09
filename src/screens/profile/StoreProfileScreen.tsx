import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AuthService from '../../services/AuthService';

const StoreProfileScreen: React.FC = () => {
  const handleLogout = async () => {
    await AuthService.logout();
    // The app will automatically navigate back to login due to auth state change
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏪 Store Setup</Text>
        <Text style={styles.subtitle}>Welcome to Kerala Sellers!</Text>
        <Text style={styles.subtitle}>Set up your store profile to start selling</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>✅ Login Successful!</Text>
        <Text style={styles.text}>You are now logged in to Kerala Sellers.</Text>
        <Text style={styles.text}>This is where you'll set up your store profile, add products, and manage orders.</Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 5,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 10,
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StoreProfileScreen;
