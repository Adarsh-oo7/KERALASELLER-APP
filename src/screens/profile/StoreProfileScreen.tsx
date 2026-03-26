// src/screens/profile/StoreProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AuthService, { SellerUser } from '../../services/AuthService';

type Nav = StackNavigationProp<any>;

const StoreProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [user,    setUser]    = useState<SellerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthService.getCurrentUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => AuthService.logout(),
        },
      ],
    );
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <View style={s.root}>

      {/* Profile card */}
      <View style={s.card}>
        {user?.logo_url ? (
          <Image source={{ uri: user.logo_url }} style={s.avatar} />
        ) : (
          <View style={s.avatarFallback}>
            <Ionicons name="storefront-outline" size={36} color="#3b82f6" />
          </View>
        )}

        <Text style={s.shopName}>{user?.shop_name ?? 'Your Store'}</Text>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.meta}>{user?.phone}</Text>
        {user?.email ? <Text style={s.meta}>{user.email}</Text> : null}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => navigation.navigate('CreateShop')}
        >
          <Ionicons name="settings-outline" size={20} color="#3b82f6" />
          <Text style={s.actionText}>Store Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => navigation.navigate('Payments')}
        >
          <Ionicons name="card-outline" size={20} color="#3b82f6" />
          <Text style={s.actionText}>Payment Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Ionicons name="star-outline" size={20} color="#f59e0b" />
          <Text style={s.actionText}>Subscription Plan</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={s.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </View>
  );
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card:           { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 2 },
  avatar:         { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarFallback: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  shopName:       { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  name:           { fontSize: 15, fontWeight: '500', color: '#374151' },
  meta:           { fontSize: 13, color: '#9ca3af', marginTop: 2 },

  actions:        { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 20, elevation: 2 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actionText:     { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },

  logoutBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  logoutText:     { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});

export default StoreProfileScreen;
