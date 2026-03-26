// src/screens/payments/PaymentsScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { api } from '../../config/api';
import MainLayout from '../../components/layout/MainLayout';
import RazorpaySetupModal from '../../components/RazorpaySetupModal';

// ── Types ─────────────────────────────────────────────────────────────────────

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

type Tab = 'overview' | 'transactions' | 'settlements';

// ── Config ────────────────────────────────────────────────────────────────────

const SHADOW = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 3 },
});

const DEFAULT_GATEWAY: GatewayStatus = {
  razorpay: { connected: false, verified: false, status: 'pending' },
  cashfree: { connected: false, verified: false, status: 'pending' },
  primary_gateway: null,
  is_ready: false,
};

const statusColor = (s: string) => ({
  text:   s === 'success' ? '#065f46' : s === 'pending' ? '#92400e' : '#991b1b',
  bg:     s === 'success' ? '#dcfce7' : s === 'pending' ? '#fef3c7' : '#fee2e2',
  border: s === 'success' ? '#86efac' : s === 'pending' ? '#fcd34d' : '#fca5a5',
});

const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Sub-components ────────────────────────────────────────────────────────────

const Toast: React.FC<{ msg: string; type: 'success' | 'error' }> = ({ msg, type }) => (
  <View style={[t.toast, type === 'success' ? t.toastSuccess : t.toastError]}>
    <Ionicons
      name={type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
      size={16}
      color={type === 'success' ? '#065f46' : '#991b1b'}
    />
    <Text style={[t.toastText, { color: type === 'success' ? '#065f46' : '#991b1b' }]}>{msg}</Text>
  </View>
);

const t = StyleSheet.create({
  toast:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  toastSuccess: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  toastError:   { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  toastText:    { flex: 1, fontSize: 13, fontWeight: '600' },
});

// ── Main Component ────────────────────────────────────────────────────────────

export default function PaymentsScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab]             = useState<Tab>('overview');
  const [gatewayStatus, setGatewayStatus]     = useState<GatewayStatus>(DEFAULT_GATEWAY);
  const [payouts, setPayouts]                 = useState<Payout[]>([]);
  const [transactions, setTransactions]       = useState<Transaction[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [successMsg, setSuccessMsg]           = useState('');
  const [errorMsg, setErrorMsg]               = useState('');
  const [razorpayModal, setRazorpayModal]     = useState(false);
  const [editMode, setEditMode]               = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statusRes, settlementsRes, txnRes] = await Promise.allSettled([
        api.getGatewayStatus(),
        api.getLiveSettlements(),
        api.getTransactions(),
      ]);

      setGatewayStatus(statusRes.status === 'fulfilled' ? statusRes.value : DEFAULT_GATEWAY);

      if (settlementsRes.status === 'fulfilled') {
        const d = settlementsRes.value;
        const arr = d?.settlements || d?.items || d?.payouts || d || [];
        setPayouts(Array.isArray(arr) ? arr : []);
      } else { setPayouts([]); }

      if (txnRes.status === 'fulfilled') {
        const d = txnRes.value;
        const arr = d?.transactions || d?.items || d || [];
        setTransactions(Array.isArray(arr) ? arr : []);
      } else { setTransactions([]); }

      setErrorMsg('');
    } catch {
      setErrorMsg('Failed to load payment data. Pull to refresh.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(''), 5000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openRazorpay  = useCallback(() => { setEditMode(false); setRazorpayModal(true); }, []);
  const editRazorpay  = useCallback(() => { setEditMode(true);  setRazorpayModal(true); }, []);
  const closeRazorpay = useCallback(() => { setRazorpayModal(false); setEditMode(false); }, []);

  const onRazorpaySuccess = useCallback(() => {
    setSuccessMsg(editMode ? 'Razorpay keys updated successfully!' : 'Connected to Razorpay!');
    setEditMode(false);
    fetchData();
  }, [editMode, fetchData]);

  // ── Memos ─────────────────────────────────────────────────────────────────

  const payoutSummary = useMemo(() => {
    const byStatus = (s: string) => payouts.filter(p => p.status === s);
    const sum      = (arr: Payout[]) => arr.reduce((n, p) => n + parseFloat(p.amount || '0'), 0);
    const success  = byStatus('success');
    const pending  = byStatus('pending');
    const failed   = byStatus('failed');
    return {
      successCount: success.length, successAmt: sum(success),
      pendingCount: pending.length, pendingAmt: sum(pending),
      failedCount:  failed.length,  failedAmt:  sum(failed),
      total: sum(payouts),
    };
  }, [payouts]);

  const txnSummary = useMemo(() => ({
    totalSales:    transactions.reduce((n, t) => n + parseFloat(t.amount     || '0'), 0),
    commission:    transactions.reduce((n, t) => n + parseFloat(t.commission || '0'), 0),
    netEarnings:   transactions.reduce((n, t) => n + parseFloat(t.net_amount || '0'), 0),
    count:         transactions.length,
  }), [transactions]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <MainLayout navigation={navigation} currentTab="payments" headerTitle="Payments">
      <View style={s.loadingWrap}>
        <View style={s.loadingIconWrap}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
        <Text style={s.loadingTitle}>Loading Payments</Text>
        <Text style={s.loadingSubtitle}>Fetching your payment data...</Text>
      </View>
    </MainLayout>
  );

  const rp = gatewayStatus.razorpay;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <MainLayout navigation={navigation} currentTab="payments" headerTitle="Payments">
      <RazorpaySetupModal
        visible={razorpayModal}
        onClose={closeRazorpay}
        onSuccess={onRazorpaySuccess}
        editMode={editMode}
      />

      <ScrollView
        style={s.screen}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#3b82f6" />}
      >
        {/* ── Page header ── */}
        <View style={s.pageHeader}>
          <View style={s.pageHeaderIcon}>
            <Ionicons name="card-outline" size={22} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>Payment Gateways</Text>
            <Text style={s.pageSubtitle}>Manage payments, transactions & settlements</Text>
          </View>
          {gatewayStatus.is_ready && (
            <View style={s.readyBadge}>
              <View style={s.readyDot} />
              <Text style={s.readyText}>Live</Text>
            </View>
          )}
        </View>

        {/* ── Toasts ── */}
        {!!successMsg && <Toast msg={successMsg} type="success" />}
        {!!errorMsg   && <Toast msg={errorMsg}   type="error" />}

        {/* ── Tab bar ── */}
        <View style={s.tabs}>
          {([
            { key: 'overview',      label: 'Overview',      icon: 'grid-outline' },
            { key: 'transactions',  label: 'Transactions',  icon: 'swap-horizontal-outline' },
            { key: 'settlements',   label: 'Settlements',   icon: 'wallet-outline' },
          ] as { key: Tab; label: string; icon: any }[]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? '#3b82f6' : '#9ca3af'}
              />
              <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ════════════════════ OVERVIEW ════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Summary stats */}
            <View style={s.statsRow}>
              <View style={[s.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={s.statLabel}>Total Sales</Text>
                <Text style={[s.statVal, { color: '#3b82f6' }]}>₹{fmt(txnSummary.totalSales)}</Text>
                <Text style={s.statSub}>{txnSummary.count} orders</Text>
              </View>
              <View style={[s.statCard, { borderLeftColor: '#059669' }]}>
                <Text style={s.statLabel}>Net Earnings</Text>
                <Text style={[s.statVal, { color: '#059669' }]}>₹{fmt(txnSummary.netEarnings)}</Text>
                <Text style={s.statSub}>After commission</Text>
              </View>
            </View>

            {/* Gateway cards */}
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Payment Gateways</Text>
            </View>

            {/* Razorpay */}
            <View style={[s.gatewayCard, rp.verified && s.gatewayCardActive]}>
              <View style={s.gatewayTop}>
                <View style={s.gatewayLeft}>
                  <View style={[s.gatewayIconWrap, { backgroundColor: '#eff6ff' }]}>
                    <Ionicons name="card-outline" size={20} color="#3b82f6" />
                  </View>
                  <View>
                    <Text style={s.gatewayName}>Razorpay</Text>
                    <Text style={s.gatewayTag}>Online Payment Gateway</Text>
                  </View>
                </View>
                <View style={[s.gStatusPill, { backgroundColor: rp.verified ? '#dcfce7' : '#fef3c7', borderColor: rp.verified ? '#86efac' : '#fcd34d' }]}>
                  <View style={[s.gStatusDot, { backgroundColor: rp.verified ? '#059669' : '#d97706' }]} />
                  <Text style={[s.gStatusText, { color: rp.verified ? '#065f46' : '#92400e' }]}>
                    {rp.verified ? 'Live' : rp.status?.toUpperCase() || 'PENDING'}
                  </Text>
                </View>
              </View>

              {rp.account_id && (
                <View style={s.accountRow}>
                  <Ionicons name="id-card-outline" size={13} color="#9ca3af" />
                  <Text style={s.accountId}>{rp.account_id}</Text>
                </View>
              )}

              <View style={s.gatewayActions}>
                {!rp.connected ? (
                  <TouchableOpacity style={s.primaryBtn} onPress={openRazorpay} activeOpacity={0.8}>
                    <Ionicons name="link-outline" size={15} color="white" />
                    <Text style={s.primaryBtnText}>Connect Razorpay</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.actionRow}>
                    <TouchableOpacity style={[s.secondaryBtn, { flex: 1 }]} onPress={editRazorpay} activeOpacity={0.8}>
                      <Ionicons name="create-outline" size={14} color="#3b82f6" />
                      <Text style={s.secondaryBtnText}>Edit Keys</Text>
                    </TouchableOpacity>
                    <View style={[s.connectedBtn, { flex: 1 }]}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                      <Text style={s.connectedBtnText}>Connected</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Cashfree */}
            <View style={[s.gatewayCard, { opacity: 0.65 }]}>
              <View style={s.comingSoonBadge}>
                <Ionicons name="time-outline" size={12} color="#92400e" />
                <Text style={s.comingSoonText}>Coming Soon</Text>
              </View>
              <View style={s.gatewayTop}>
                <View style={s.gatewayLeft}>
                  <View style={[s.gatewayIconWrap, { backgroundColor: '#f0fdf4' }]}>
                    <Ionicons name="card-outline" size={20} color="#10b981" />
                  </View>
                  <View>
                    <Text style={s.gatewayName}>Cashfree</Text>
                    <Text style={s.gatewayTag}>Payouts & Settlements</Text>
                  </View>
                </View>
                <View style={[s.gStatusPill, { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }]}>
                  <View style={[s.gStatusDot, { backgroundColor: '#9ca3af' }]} />
                  <Text style={[s.gStatusText, { color: '#6b7280' }]}>Soon</Text>
                </View>
              </View>
              <Text style={s.comingSoonDesc}>
                Automatic weekly payouts directly to your bank account — launching soon.
              </Text>
              <View style={[s.primaryBtn, { backgroundColor: '#e5e7eb' }]}>
                <Ionicons name="hourglass-outline" size={14} color="#9ca3af" />
                <Text style={[s.primaryBtnText, { color: '#9ca3af' }]}>Not Available Yet</Text>
              </View>
            </View>

            {/* How it works */}
            <View style={s.howCard}>
              <View style={s.howHead}>
                <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
                <Text style={s.howTitle}>How Settlements Work</Text>
              </View>
              {[
                { icon: 'flash-outline',          color: '#3b82f6', text: 'Instant Payouts directly to your account' },
                { icon: 'trending-up-outline',    color: '#059669', text: '0% Commission — keep 100% of sales' },
                { icon: 'bar-chart-outline',      color: '#7c3aed', text: 'Real-time tracking for all transactions' },
                { icon: 'shield-checkmark-outline', color: '#10b981', text: 'Bank-grade security & encryption' },
                { icon: 'phone-portrait-outline', color: '#f59e0b', text: 'Mobile-first payments management' },
              ].map((item, i) => (
                <View key={i} style={s.howRow}>
                  <View style={[s.howIconWrap, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={15} color={item.color} />
                  </View>
                  <Text style={s.howText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ════════════════════ TRANSACTIONS ════════════════════ */}
        {activeTab === 'transactions' && (
          <>
            {/* Summary */}
            <View style={s.statsRow}>
              <View style={[s.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={s.statLabel}>Total Sales</Text>
                <Text style={[s.statVal, { color: '#3b82f6' }]}>₹{fmt(txnSummary.totalSales)}</Text>
                <Text style={s.statSub}>{txnSummary.count} transactions</Text>
              </View>
              <View style={[s.statCard, { borderLeftColor: '#dc2626' }]}>
                <Text style={s.statLabel}>Commission</Text>
                <Text style={[s.statVal, { color: '#dc2626' }]}>₹{fmt(txnSummary.commission)}</Text>
                <Text style={s.statSub}>Platform fee</Text>
              </View>
            </View>
            <View style={[s.statsRow, { marginTop: 0 }]}>
              <View style={[s.statCard, { borderLeftColor: '#059669', flex: 1 }]}>
                <Text style={s.statLabel}>Net Earnings</Text>
                <Text style={[s.statVal, { color: '#059669' }]}>₹{fmt(txnSummary.netEarnings)}</Text>
                <Text style={s.statSub}>After all deductions</Text>
              </View>
            </View>

            {/* Table */}
            <View style={s.listCard}>
              <Text style={s.listTitle}>Transaction History</Text>
              {transactions.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    {/* Table header */}
                    <View style={s.tHead}>
                      {['Date', 'Order ID', 'Amount', 'Commission', 'Net', 'Gateway', 'Status'].map((h, i) => (
                        <Text key={i} style={[s.tHeadCell, { width: [90, 110, 90, 90, 90, 90, 80][i] }]}>{h}</Text>
                      ))}
                    </View>
                    {/* Rows */}
                    {transactions.map((tx, idx) => {
                      const sc = statusColor(tx.status);
                      return (
                        <View key={tx.id} style={[s.tRow, idx % 2 === 0 && s.tRowAlt]}>
                          <Text style={[s.tCell, { width: 90 }]}>
                            {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </Text>
                          <Text style={[s.tCell, { width: 110 }]} numberOfLines={1}>
                            #{tx.order_id.slice(0, 10)}
                          </Text>
                          <Text style={[s.tCell, { width: 90, fontWeight: '700', color: '#111827' }]}>
                            ₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[s.tCell, { width: 90, color: '#dc2626' }]}>
                            -₹{parseFloat(tx.commission).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[s.tCell, { width: 90, fontWeight: '700', color: '#059669' }]}>
                            ₹{parseFloat(tx.net_amount).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[s.tCell, { width: 90 }]}>{tx.gateway}</Text>
                          <View style={{ width: 80, justifyContent: 'center' }}>
                            <View style={[s.pill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                              <Text style={[s.pillText, { color: sc.text }]}>{tx.status}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : (
                <EmptyState icon="receipt-outline" title="No transactions yet" sub="Your sales transactions will appear here" />
              )}
            </View>
          </>
        )}

        {/* ════════════════════ SETTLEMENTS ════════════════════ */}
        {activeTab === 'settlements' && (
          <>
            {/* Summary */}
            <View style={s.statsRow}>
              <View style={[s.statCard, { borderLeftColor: '#059669' }]}>
                <Text style={s.statLabel}>Settled</Text>
                <Text style={[s.statVal, { color: '#059669' }]}>₹{fmt(payoutSummary.successAmt)}</Text>
                <Text style={s.statSub}>{payoutSummary.successCount} payouts</Text>
              </View>
              <View style={[s.statCard, { borderLeftColor: '#d97706' }]}>
                <Text style={s.statLabel}>Pending</Text>
                <Text style={[s.statVal, { color: '#d97706' }]}>₹{fmt(payoutSummary.pendingAmt)}</Text>
                <Text style={s.statSub}>{payoutSummary.pendingCount} payouts</Text>
              </View>
            </View>

            {payoutSummary.failedCount > 0 && (
              <View style={[s.statsRow, { marginTop: 0 }]}>
                <View style={[s.statCard, { borderLeftColor: '#dc2626', flex: 1 }]}>
                  <Text style={s.statLabel}>Failed</Text>
                  <Text style={[s.statVal, { color: '#dc2626' }]}>₹{fmt(payoutSummary.failedAmt)}</Text>
                  <Text style={s.statSub}>{payoutSummary.failedCount} payouts</Text>
                </View>
              </View>
            )}

            {/* Payout list */}
            <View style={s.listCard}>
              <Text style={s.listTitle}>Settlement History</Text>
              {payouts.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {payouts.map(payout => {
                    const sc = statusColor(payout.status);
                    return (
                      <View key={payout.id} style={s.payoutCard}>
                        <View style={s.payoutTop}>
                          <View>
                            <Text style={s.payoutAmount}>₹{parseFloat(payout.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                            <Text style={s.payoutDate}>
                              {new Date(payout.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          </View>
                          <View style={[s.pill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                            <Text style={[s.pillText, { color: sc.text }]}>
                              {payout.status_display || payout.status}
                            </Text>
                          </View>
                        </View>

                        <View style={s.payoutDivider} />

                        <View style={{ gap: 6 }}>
                          <PayoutRow label="Gateway" value={payout.gateway_display || payout.gateway_used} />
                          {!!payout.utr_number    && <PayoutRow label="UTR"      value={payout.utr_number} mono />}
                          {!!payout.bank_reference && <PayoutRow label="Bank Ref" value={payout.bank_reference} mono />}
                          {!!payout.description   && <PayoutRow label="Note"     value={payout.description} />}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <EmptyState icon="time-outline" title="No settlements yet" sub="Your payouts will appear here once processed" />
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const PayoutRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <View style={pr.row}>
    <Text style={pr.label}>{label}</Text>
    <Text style={[pr.value, mono && pr.mono]} numberOfLines={1}>{value}</Text>
  </View>
);

const pr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  value: { fontSize: 13, color: '#111827', fontWeight: '600', maxWidth: '65%', textAlign: 'right' },
  mono:  { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 },
});

const EmptyState: React.FC<{ icon: any; title: string; sub: string }> = ({ icon, title, sub }) => (
  <View style={e.wrap}>
    <View style={e.iconWrap}>
      <Ionicons name={icon} size={32} color="#d1d5db" />
    </View>
    <Text style={e.title}>{title}</Text>
    <Text style={e.sub}>{sub}</Text>
  </View>
);

const e = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 15, fontWeight: '700', color: '#374151' },
  sub:      { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#f1f5f9' },

  // Loading
  loadingWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingIconWrap:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  loadingTitle:     { fontSize: 17, fontWeight: '800', color: '#111827' },
  loadingSubtitle:  { fontSize: 13, color: '#9ca3af' },

  // Page header
  pageHeader:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pageHeaderIcon:   { width: 42, height: 42, borderRadius: 21, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  pageTitle:        { fontSize: 17, fontWeight: '900', color: '#111827' },
  pageSubtitle:     { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  readyBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#86efac' },
  readyDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: '#059669' },
  readyText:        { fontSize: 11, fontWeight: '800', color: '#065f46' },

  // Tabs
  tabs:             { flexDirection: 'row', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab:              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 9, backgroundColor: '#f9fafb' },
  tabActive:        { backgroundColor: '#eff6ff', ...SHADOW },
  tabLabel:         { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  tabLabelActive:   { color: '#3b82f6' },

  // Stats
  statsRow:         { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  statCard:         { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 14, borderLeftWidth: 3, ...SHADOW },
  statLabel:        { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  statVal:          { fontSize: 20, fontWeight: '900', marginBottom: 3 },
  statSub:          { fontSize: 11, color: '#9ca3af' },

  // Section head
  sectionHead:      { paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionTitle:     { fontSize: 14, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4 },

  // Gateway cards
  gatewayCard:      { backgroundColor: 'white', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', ...SHADOW },
  gatewayCardActive: { borderColor: '#3b82f6', borderWidth: 1.5 },
  gatewayTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  gatewayLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gatewayIconWrap:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  gatewayName:      { fontSize: 16, fontWeight: '800', color: '#111827' },
  gatewayTag:       { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  gStatusPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  gStatusDot:       { width: 6, height: 6, borderRadius: 3 },
  gStatusText:      { fontSize: 11, fontWeight: '800' },
  accountRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 14 },
  accountId:        { fontSize: 12, color: '#6b7280', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  gatewayActions:   {},
  actionRow:        { flexDirection: 'row', gap: 8 },

  // Buttons
  primaryBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 10 },
  primaryBtnText:   { fontSize: 14, fontWeight: '700', color: 'white' },
  secondaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#3b82f6', paddingVertical: 11, borderRadius: 10 },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },
  connectedBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac', paddingVertical: 11, borderRadius: 10 },
  connectedBtnText: { fontSize: 13, fontWeight: '700', color: '#059669' },

  // Cashfree coming soon
  comingSoonBadge:  { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  comingSoonText:   { fontSize: 11, fontWeight: '700', color: '#92400e' },
  comingSoonDesc:   { fontSize: 12, color: '#9ca3af', lineHeight: 18, marginBottom: 12 },

  // How it works
  howCard:          { backgroundColor: 'white', borderRadius: 14, padding: 16, marginHorizontal: 16, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', ...SHADOW },
  howHead:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  howTitle:         { fontSize: 14, fontWeight: '800', color: '#111827' },
  howRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  howIconWrap:      { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  howText:          { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },

  // List card (transactions / settlements)
  listCard:         { backgroundColor: 'white', borderRadius: 14, padding: 16, marginHorizontal: 16, marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', ...SHADOW },
  listTitle:        { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 14 },

  // Table
  tHead:            { flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 4 },
  tHeadCell:        { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  tRow:             { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  tRowAlt:          { backgroundColor: '#fafafa' },
  tCell:            { fontSize: 12, color: '#374151' },

  // Pill (status badge)
  pill:             { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  pillText:         { fontSize: 11, fontWeight: '700' },

  // Payout card
  payoutCard:       { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  payoutTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  payoutAmount:     { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 2 },
  payoutDate:       { fontSize: 12, color: '#9ca3af' },
  payoutDivider:    { height: 1, backgroundColor: '#e5e7eb', marginBottom: 10 },
});
