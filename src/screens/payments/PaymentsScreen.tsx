// src/screens/payments/PaymentsScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { api } from '../../config/api';
import MainLayout from '../../components/layout/MainLayout';
import RazorpaySetupModal from '../../components/RazorpaySetupModal';

interface GatewayInfo {
  connected: boolean;
  verified: boolean;
  status: string;
  account_id?: string;
}

interface GatewayStatus {
  razorpay: GatewayInfo;
  cashfree: GatewayInfo;
  primary_gateway: string | null;
  is_ready: boolean;
}

interface Payout {
  id: number;
  created_at: string;
  amount: string;
  gateway_display?: string;
  gateway_used: string;
  status: string;
  status_display?: string;
}

export default function PaymentsScreen({ navigation }: { navigation: any }) {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({
    razorpay: { connected: false, verified: false, status: 'pending' },
    cashfree: { connected: false, verified: false, status: 'pending' },
    primary_gateway: null,
    is_ready: false
  });
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const fetchPaymentData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // ✅ FIXED: Using API methods instead of direct .get()
      const [statusRes, payoutRes] = await Promise.allSettled([
        api.getGatewayStatus(),
        api.getPayoutHistory()
      ]);

      if (statusRes.status === 'fulfilled') {
        setGatewayStatus(statusRes.value);  // ✅ Removed .data
      } else {
        console.log('Gateway status fetch failed:', statusRes.reason);
        setGatewayStatus({
          razorpay: { connected: false, verified: false, status: 'pending' },
          cashfree: { connected: false, verified: false, status: 'pending' },
          primary_gateway: null,
          is_ready: false
        });
      }

      if (payoutRes.status === 'fulfilled') {
        setPayoutHistory(payoutRes.value.payouts || []);  // ✅ Removed .data
      } else {
        console.log('Payout history fetch failed:', payoutRes.reason);
        setPayoutHistory([]);
      }

      setErrorMsg('');
    } catch (error: any) {
      console.error('Error fetching payment data:', error);
      setErrorMsg('Failed to load payment data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleRazorpayClick = useCallback(() => {
    setEditMode(false);
    setRazorpayModalOpen(true);
  }, []);

  const handleEditRazorpay = useCallback(() => {
    setEditMode(true);
    setRazorpayModalOpen(true);
  }, []);

  const handleRazorpaySuccess = useCallback(() => {
    setSuccessMsg(editMode ? '✅ Razorpay keys updated!' : '✅ Connected to Razorpay!');
    setEditMode(false);
    fetchPaymentData();
  }, [editMode, fetchPaymentData]);

  const payoutSummary = useMemo(() => {
    const successful = payoutHistory.filter(p => p.status === 'success');
    const pending = payoutHistory.filter(p => p.status === 'pending');
    
    return {
      successCount: successful.length,
      successAmount: successful.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
    };
  }, [payoutHistory]);

  if (loading) {
    return (
      <MainLayout navigation={navigation} currentTab="payments" headerTitle="Payments">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payment data...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation} currentTab="payments" headerTitle="Payments">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPaymentData} colors={[COLORS.primary]} />
        }
      >
        <RazorpaySetupModal
          visible={razorpayModalOpen}
          onClose={() => {
            setRazorpayModalOpen(false);
            setEditMode(false);
          }}
          onSuccess={handleRazorpaySuccess}
          editMode={editMode}
        />

        {/* Header */}
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.headerGradient}>
          <Ionicons name="card" size={40} color={COLORS.surface} />
          <Text style={styles.headerTitle}>💰 Payment Gateways</Text>
          <Text style={styles.headerSubtitle}>Manage your payment methods & receive instant payouts</Text>
        </LinearGradient>

        {/* Success/Error Messages */}
        {successMsg ? (
          <View style={styles.successAlert}>
            <Ionicons name="checkmark-circle" size={18} color="#065f46" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={18} color="#991b1b" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Gateway Cards */}
        <View style={styles.gatewaysContainer}>
          {/* Razorpay Card */}
          <View style={styles.gatewayCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="card" size={24} color="#3b82f6" />
                <Text style={styles.cardTitle}>🔵 Razorpay</Text>
              </View>
              {gatewayStatus.razorpay?.verified && (
                <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.badgeText}>✅ Live</Text>
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>STATUS</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: gatewayStatus.razorpay?.verified ? COLORS.success : COLORS.warning }
                  ]}
                >
                  {gatewayStatus.razorpay?.status?.toUpperCase() || 'PENDING'}
                </Text>
              </View>

              {gatewayStatus.razorpay?.account_id && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>ACCOUNT ID</Text>
                  <Text style={styles.infoValue}>{gatewayStatus.razorpay.account_id}</Text>
                </View>
              )}

              {!gatewayStatus.razorpay?.connected ? (
                <TouchableOpacity style={styles.connectButton} onPress={handleRazorpayClick}>
                  <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.buttonGradient}>
                    <Ionicons name="link" size={16} color={COLORS.surface} />
                    <Text style={styles.buttonText}>Connect Razorpay</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.connectButton, { flex: 1 }]} onPress={handleEditRazorpay}>
                    <View style={[styles.buttonGradient, { backgroundColor: COLORS.warning }]}>
                      <Ionicons name="create" size={16} color={COLORS.surface} />
                      <Text style={styles.buttonText}>Edit Keys</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={[styles.connectButton, { flex: 1, opacity: 0.6 }]}>
                    <View style={[styles.buttonGradient, { backgroundColor: COLORS.success }]}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.surface} />
                      <Text style={styles.buttonText}>Connected</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Cashfree Card (Coming Soon) */}
          <View style={[styles.gatewayCard, { opacity: 0.6 }]}>
            <View style={styles.comingSoonBadge}>
              <Ionicons name="time" size={14} color="#92400e" />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>

            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="card" size={24} color="#10b981" />
                <Text style={styles.cardTitle}>🟢 Cashfree</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>STATUS</Text>
                <Text style={[styles.infoValue, { color: COLORS.textTertiary }]}>COMING SOON</Text>
              </View>

              <Text style={styles.comingSoonDesc}>
                💡 Cashfree payout integration is launching soon! Connect your bank account and get automatic
                weekly payouts.
              </Text>

              <View style={[styles.connectButton, { opacity: 0.5 }]}>
                <View style={[styles.buttonGradient, { backgroundColor: COLORS.border }]}>
                  <Ionicons name="hourglass" size={16} color={COLORS.textTertiary} />
                  <Text style={[styles.buttonText, { color: COLORS.textTertiary }]}>Coming Soon</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stripe Card (Q1 2026) */}
          <View style={[styles.gatewayCard, { opacity: 0.6 }]}>
            <View style={styles.comingSoonBadge}>
              <Ionicons name="time" size={14} color="#92400e" />
              <Text style={styles.comingSoonText}>Q1 2026</Text>
            </View>

            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="card" size={24} color="#6366f1" />
                <Text style={styles.cardTitle}>🟣 Stripe</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>STATUS</Text>
                <Text style={[styles.infoValue, { color: COLORS.textTertiary }]}>COMING Q1 2026</Text>
              </View>

              <Text style={styles.comingSoonDesc}>
                🌍 International payments & global payouts with Stripe. Coming in Q1 2026.
              </Text>

              <View style={[styles.connectButton, { opacity: 0.5 }]}>
                <View style={[styles.buttonGradient, { backgroundColor: COLORS.border }]}>
                  <Ionicons name="calendar" size={16} color={COLORS.textTertiary} />
                  <Text style={[styles.buttonText, { color: COLORS.textTertiary }]}>Q1 2026</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Payout Summary */}
        {payoutHistory.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>✅ SUCCESSFUL</Text>
              <Text style={[styles.summaryAmount, { color: COLORS.success }]}>
                ₹{payoutSummary.successAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.summaryCount}>{payoutSummary.successCount} payouts</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>⏳ PENDING</Text>
              <Text style={[styles.summaryAmount, { color: COLORS.warning }]}>
                ₹{payoutSummary.pendingAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.summaryCount}>{payoutSummary.pendingCount} payouts</Text>
            </View>
          </View>
        )}

        {/* Payout History */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>📊 Payout History</Text>

          {payoutHistory.length > 0 ? (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Date</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Amount</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Gateway</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Status</Text>
              </View>

              {payoutHistory.map((payout) => (
                <View key={payout.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {new Date(payout.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '700', color: COLORS.success }]}>
                    ₹{parseFloat(payout.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {payout.gateway_display || payout.gateway_used}
                  </Text>
                  <View style={{ flex: 2 }}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: payout.status === 'success' ? '#d1fae5' : '#fef3c7',
                          borderColor: payout.status === 'success' ? '#10b981' : '#f59e0b'
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: payout.status === 'success' ? '#065f46' : '#92400e' }
                        ]}
                      >
                        {payout.status_display || payout.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No payouts yet</Text>
              <Text style={styles.emptyText}>Your payouts will appear here once processed</Text>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoCardTitle}>💡 Multiple Payment Methods Coming Soon</Text>
          </View>

          <View style={styles.infoList}>
            <Text style={styles.infoListItem}>✅ <Text style={styles.bold}>Razorpay</Text> - Live now! Connect your Razorpay account</Text>
            <Text style={styles.infoListItem}>⏳ <Text style={styles.bold}>Cashfree</Text> - Launching next (automatic bank payouts)</Text>
            <Text style={styles.infoListItem}>📅 <Text style={styles.bold}>Stripe</Text> - Q1 2026 (international support)</Text>
            <Text style={styles.infoListItem}>🔜 <Text style={styles.bold}>PayPal</Text> - Coming soon</Text>
            <Text style={styles.infoListItem}>✅ 0% Commission - You keep 100% of all sales</Text>
            <Text style={styles.infoListItem}>✅ Instant payouts - Get paid as soon as customers pay</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: 8,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: COLORS.error,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
  },
  gatewaysContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  gatewayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    position: 'relative',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 20,
    zIndex: 1,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  cardContent: {
    gap: 16,
  },
  infoBox: {
    padding: 12,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  connectButton: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  comingSoonDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryCount: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  tableContainer: {
    gap: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 6,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableCell: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  infoCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: 12,
    padding: 20,
    margin: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  infoList: {
    gap: 8,
  },
  infoListItem: {
    fontSize: 13,
    color: '#065f46',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
});
