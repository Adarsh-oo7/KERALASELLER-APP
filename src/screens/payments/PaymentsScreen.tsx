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
  order_id?: string;
  utr_number?: string;
  bank_reference?: string;
  description?: string;
}

interface Transaction {
  id: number;
  order_id: string;
  amount: string;
  commission: string;
  net_amount: string;
  gateway: string;
  status: string;
  created_at: string;
  settlement_status?: string;
}

export default function PaymentsScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'settlements'>('overview');
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>({
    razorpay: { connected: false, verified: false, status: 'pending' },
    cashfree: { connected: false, verified: false, status: 'pending' },
    primary_gateway: null,
    is_ready: false
  });
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

const fetchPaymentData = useCallback(async () => {
  try {
    setRefreshing(true);
    console.log('🔄 Fetching payment data...');
    
    const [statusRes, settlementsRes, transactionsRes] = await Promise.allSettled([
      api.getGatewayStatus(),
      api.getLiveSettlements(),    // ✅ CHANGED from getPayoutHistory
      api.getTransactions()
    ]);

    if (statusRes.status === 'fulfilled') {
      setGatewayStatus(statusRes.value);
    } else {
      setGatewayStatus({
        razorpay: { connected: false, verified: false, status: 'pending' },
        cashfree: { connected: false, verified: false, status: 'pending' },
        primary_gateway: null,
        is_ready: false
      });
    }

    if (settlementsRes.status === 'fulfilled') {
      // Handle multiple possible response formats
      const settlements = settlementsRes.value?.settlements || 
                         settlementsRes.value?.items || 
                         settlementsRes.value?.payouts || 
                         settlementsRes.value || 
                         [];
      setPayoutHistory(Array.isArray(settlements) ? settlements : []);
    } else {
      setPayoutHistory([]);
    }

    if (transactionsRes.status === 'fulfilled') {
      const txns = transactionsRes.value?.transactions || 
                   transactionsRes.value?.items ||
                   transactionsRes.value || 
                   [];
      setTransactions(Array.isArray(txns) ? txns : []);
    } else {
      setTransactions([]);
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
    const failed = payoutHistory.filter(p => p.status === 'failed');
    
    return {
      successCount: successful.length,
      successAmount: successful.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
      failedCount: failed.length,
      failedAmount: failed.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
      totalAmount: payoutHistory.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
    };
  }, [payoutHistory]);

  const transactionSummary = useMemo(() => {
    const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    const commission = transactions.reduce((sum, t) => sum + parseFloat(t.commission || '0'), 0);
    const netAmount = transactions.reduce((sum, t) => sum + parseFloat(t.net_amount || '0'), 0);

    return {
      totalSales: total,
      totalCommission: commission,
      netEarnings: netAmount,
      transactionCount: transactions.length
    };
  }, [transactions]);

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
          <Text style={styles.headerSubtitle}>Manage payments, transactions & settlements</Text>
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

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Ionicons 
              name="home" 
              size={20} 
              color={activeTab === 'overview' ? COLORS.primary : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
            onPress={() => setActiveTab('transactions')}
          >
            <Ionicons 
              name="swap-horizontal" 
              size={20} 
              color={activeTab === 'transactions' ? COLORS.primary : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
              Transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'settlements' && styles.activeTab]}
            onPress={() => setActiveTab('settlements')}
          >
            <Ionicons 
              name="wallet" 
              size={20} 
              color={activeTab === 'settlements' ? COLORS.primary : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'settlements' && styles.activeTabText]}>
              Settlements
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>💰 TOTAL SALES</Text>
                <Text style={[styles.summaryAmount, { color: COLORS.primary }]}>
                  ₹{transactionSummary.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.summaryCount}>{transactionSummary.transactionCount} orders</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>✅ NET EARNINGS</Text>
                <Text style={[styles.summaryAmount, { color: COLORS.success }]}>
                  ₹{transactionSummary.netEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.summaryCount}>After commission</Text>
              </View>
            </View>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>📊 Transaction History</Text>

            {transactions.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Date</Text>
                    <Text style={[styles.tableHeaderText, { width: 120 }]}>Order ID</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Amount</Text>
                    <Text style={[styles.tableHeaderText, { width: 90 }]}>Commission</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Net Amount</Text>
                    <Text style={[styles.tableHeaderText, { width: 100 }]}>Gateway</Text>
                    <Text style={[styles.tableHeaderText, { width: 80 }]}>Status</Text>
                  </View>

                  {transactions.map((transaction) => (
                    <View key={transaction.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {new Date(transaction.created_at).toLocaleDateString('en-IN')}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]} numberOfLines={1}>
                        #{transaction.order_id.slice(0, 12)}...
                      </Text>
                      <Text style={[styles.tableCell, { width: 100, fontWeight: '600' }]}>
                        ₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tableCell, { width: 90, color: COLORS.error }]}>
                        -₹{parseFloat(transaction.commission).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100, fontWeight: '700', color: COLORS.success }]}>
                        ₹{parseFloat(transaction.net_amount).toLocaleString('en-IN')}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {transaction.gateway}
                      </Text>
                      <View style={{ width: 80 }}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: transaction.status === 'success' ? '#d1fae5' : '#fef3c7',
                              borderColor: transaction.status === 'success' ? '#10b981' : '#f59e0b'
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: transaction.status === 'success' ? '#065f46' : '#92400e' }
                            ]}
                          >
                            {transaction.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={40} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyText}>Your sales transactions will appear here</Text>
              </View>
            )}
          </View>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <>
            {/* Settlement Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>✅ SETTLED</Text>
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

            {/* Settlement History */}
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>💸 Settlement History</Text>

              {payoutHistory.length > 0 ? (
                <View style={styles.tableContainer}>
                  {payoutHistory.map((payout) => (
                    <View key={payout.id} style={styles.settlementCard}>
                      <View style={styles.settlementHeader}>
                        <View style={styles.settlementLeft}>
                          <Text style={styles.settlementAmount}>
                            ₹{parseFloat(payout.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Text>
                          <Text style={styles.settlementDate}>
                            {new Date(payout.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: 
                                payout.status === 'success' ? '#d1fae5' : 
                                payout.status === 'pending' ? '#fef3c7' : '#fee2e2',
                              borderColor: 
                                payout.status === 'success' ? '#10b981' : 
                                payout.status === 'pending' ? '#f59e0b' : '#ef4444'
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { 
                                color: 
                                  payout.status === 'success' ? '#065f46' : 
                                  payout.status === 'pending' ? '#92400e' : '#991b1b'
                              }
                            ]}
                          >
                            {payout.status_display || payout.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.settlementDetails}>
                        <View style={styles.settlementRow}>
                          <Text style={styles.settlementLabel}>Gateway:</Text>
                          <Text style={styles.settlementValue}>
                            {payout.gateway_display || payout.gateway_used}
                          </Text>
                        </View>

                        {payout.utr_number && (
                          <View style={styles.settlementRow}>
                            <Text style={styles.settlementLabel}>UTR:</Text>
                            <Text style={styles.settlementValue}>{payout.utr_number}</Text>
                          </View>
                        )}

                        {payout.bank_reference && (
                          <View style={styles.settlementRow}>
                            <Text style={styles.settlementLabel}>Bank Ref:</Text>
                            <Text style={styles.settlementValue}>{payout.bank_reference}</Text>
                          </View>
                        )}

                        {payout.description && (
                          <View style={styles.settlementRow}>
                            <Text style={styles.settlementLabel}>Note:</Text>
                            <Text style={[styles.settlementValue, { flex: 1 }]} numberOfLines={2}>
                              {payout.description}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={40} color={COLORS.border} />
                  <Text style={styles.emptyTitle}>No settlements yet</Text>
                  <Text style={styles.emptyText}>Your payouts will appear here once processed</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Info Box */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.success} />
            <Text style={styles.infoCardTitle}>💡 How Settlements Work</Text>
          </View>

          <View style={styles.infoList}>
            <Text style={styles.infoListItem}>✅ <Text style={styles.bold}>Instant Payouts</Text> - Get paid directly to your account</Text>
            <Text style={styles.infoListItem}>💰 <Text style={styles.bold}>0% Commission</Text> - Keep 100% of your sales</Text>
            <Text style={styles.infoListItem}>📊 <Text style={styles.bold}>Real-time Tracking</Text> - Monitor all transactions & settlements</Text>
            <Text style={styles.infoListItem}>🔒 <Text style={styles.bold}>Secure & Safe</Text> - Bank-grade security</Text>
            <Text style={styles.infoListItem}>📱 <Text style={styles.bold}>Mobile First</Text> - Manage payments on the go</Text>
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
    marginBottom: 0,
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  activeTab: {
    backgroundColor: COLORS.primarySoft,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  gatewaysContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    alignItems: 'center',
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
  settlementCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settlementLeft: {
    gap: 4,
  },
  settlementAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
  },
  settlementDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  settlementDetails: {
    gap: 8,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settlementLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginRight: 12,
  },
  settlementValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
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
