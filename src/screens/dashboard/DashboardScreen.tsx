import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

const COLORS = {
  primary: '#2B4B39',
  primaryLight: '#3A5D47',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1D1D1F',
  textSecondary: '#86868B',
  success: '#4A6B52',
};

interface SellerData {
  id: number;
  name: string;
  phone: string;
  shop_name: string;
  email: string;
}

export default function DashboardScreen() {
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSellerData(); }, []);

  const loadSellerData = async () => {
    try {
      const sellerData = await AsyncStorage.getItem('sellerData');
      if (sellerData) setSeller(JSON.parse(sellerData));
    } catch (error) {
      console.error('Failed to load seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProtectedAPI = async () => {
    try {
      // Uses apiClient — auto production/dev URL, no hardcoded IP
      const response = await apiClient.get('/api/user/test-auth-protected/');
      const { data } = response;
      alert(`✅ API OK\nUser: ${data.user}\nAuthenticated: ${data.is_authenticated}`);
    } catch (error: any) {
      alert(`❌ API Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.sellerName}>{seller?.name || 'Seller'}</Text>
            <Text style={styles.shopName}>{seller?.shop_name || 'Shop'}</Text>
          </View>
          <Ionicons name="storefront" size={36} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seller Information</Text>
          <InfoRow icon="person-outline" value={seller?.name} />
          <InfoRow icon="storefront-outline" value={seller?.shop_name} />
          <InfoRow icon="call-outline" value={seller?.phone ? `+91${seller.phone}` : undefined} />
          <InfoRow icon="mail-outline" value={seller?.email} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={testProtectedAPI}>
            <LinearGradient colors={[COLORS.success, '#5A8B63']} style={styles.actionGradient}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
              <Text style={styles.actionText}>Test API Connection</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <StatusRow label="Successfully authenticated" />
          <StatusRow label="Shop profile active" />
          <StatusRow label="Mobile app connected" />
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, value }: { icon: any; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.infoText}>{value}</Text>
    </View>
  );
}

function StatusRow({ label }: { label: string }) {
  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusDot} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textSecondary },
  header: { paddingTop: 55, paddingBottom: 30, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeSection: { flex: 1 },
  welcomeText: { fontSize: 15, color: '#fff', opacity: 0.9, marginBottom: 4 },
  sellerName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  shopName: { fontSize: 16, color: '#fff', opacity: 0.8 },
  content: { padding: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 15, color: COLORS.textPrimary, marginLeft: 12 },
  actionButton: { borderRadius: 12, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  actionText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 12 },
  statusText: { fontSize: 14, color: COLORS.textPrimary },
});
