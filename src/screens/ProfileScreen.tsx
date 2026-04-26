import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  primary: '#2B4B39',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1D1D1F',
  textSecondary: '#86868B',
  error: '#FF3B30',
  border: '#E5E5E7',
};

type Props = {
  onLogout: () => void;
};

export default function ProfileScreen({ onLogout }: Props) {
  const [sellerName, setSellerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const name = await AsyncStorage.getItem('sellerName');
    const shop = await AsyncStorage.getItem('shopName');
    const ph = await AsyncStorage.getItem('userPhone');
    setSellerName(name || '');
    setShopName(shop || '');
    setPhone(ph || '');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {sellerName ? sellerName[0].toUpperCase() : 'S'}
          </Text>
        </View>
        <Text style={styles.name}>{sellerName || 'Seller'}</Text>
        <Text style={styles.shop}>{shopName || 'My Shop'}</Text>
        <Text style={styles.phone}>+91 {phone}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Name</Text>
          <Text style={styles.rowValue}>{sellerName || '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Shop</Text>
          <Text style={styles.rowValue}>{shopName || '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Phone</Text>
          <Text style={styles.rowValue}>+91 {phone}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  shop: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 2 },
  phone: { fontSize: 13, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 14, color: COLORS.textSecondary },
  rowValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border },
  logoutButton: {
    backgroundColor: '#FFF0EE', borderRadius: 10, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#FFDAD4',
  },
  logoutText: { color: COLORS.error, fontSize: 15, fontWeight: '700' },
});
