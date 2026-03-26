// screens/Orders/OrderDetailsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Modal,
  TextInput, Clipboard, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import OrderService from '../../services/OrderService';
import { ApiError } from '../../types/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { orderId: number; onRefresh?: () => void } }, 'params'>;
};

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  product?: { name: string; model_name?: string };
  product_name?: string;
}

interface Order {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  total_amount: string;
  status: string;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
  updated_at?: string;
  shipping_address?: string;
  shipping_provider?: string;
  tracking_id?: string;
  order_type?: string;
  items?: OrderItem[];
  cancel_reason?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:    { label: 'Pending',    color: '#92400e', bg: '#fffbeb', icon: 'time-outline' },
  PROCESSING: { label: 'Processing', color: '#1e40af', bg: '#eff6ff', icon: 'refresh-outline' },
  SHIPPED:    { label: 'Shipped',    color: '#065f46', bg: '#f0fdf4', icon: 'car-outline' },
  DELIVERED:  { label: 'Delivered',  color: '#065f46', bg: '#f0fdf4', icon: 'checkmark-circle-outline' },
  CANCELLED:  { label: 'Cancelled',  color: '#991b1b', bg: '#fef2f2', icon: 'close-circle-outline' },
};

const TIMELINE_STEPS = [
  { key: 'PENDING',    label: 'Order Placed', icon: 'bag-check-outline' as const,       reached: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
  { key: 'PROCESSING', label: 'Processing',   icon: 'cube-outline' as const,            reached: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
  { key: 'SHIPPED',    label: 'Shipped',       icon: 'car-outline' as const,             reached: ['SHIPPED', 'DELIVERED'] },
  { key: 'DELIVERED',  label: 'Delivered',     icon: 'checkmark-circle-outline' as const, reached: ['DELIVERED'] },
];

const SHIPPING_PROVIDERS = ['DTDC', 'Blue Dart', 'FedEx', 'Delhivery', 'Ecom Express', 'India Post', 'Other'];

const STATUS_OPTIONS = [
  { value: 'PENDING',    label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED',    label: 'Shipped' },
  { value: 'DELIVERED',  label: 'Delivered' },
  { value: 'CANCELLED',  label: 'Cancelled' },
];

const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Timeline sub-component ────────────────────────────────────────────────────

const OrderTimeline: React.FC<{ order: Order }> = ({ order }) => {
  if (order.status === 'CANCELLED') return (
    <View style={s.cancelBox}>
      <View style={s.cancelIconWrap}>
        <Ionicons name="close-circle" size={22} color="#ef4444" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cancelTitle}>Order Cancelled</Text>
        <Text style={s.cancelDate}>
          on {new Date(order.updated_at || order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        {!!order.cancel_reason && (
          <View style={s.cancelReasonBox}>
            <Text style={s.cancelReasonLabel}>Reason</Text>
            <Text style={s.cancelReasonText}>{order.cancel_reason}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={s.timeline}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done    = step.reached.includes(order.status);
        const current = step.key === order.status;
        return (
          <View key={step.key}>
            <View style={s.timelineRow}>
              <View style={[s.timelineCircle, done && s.timelineCircleDone]}>
                <Ionicons name={step.icon} size={18} color={done ? '#fff' : '#d1d5db'} />
                {current && <View style={s.timelinePulse} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.timelineLabel, { color: done ? '#111827' : '#9ca3af', fontWeight: current ? '800' : done ? '600' : '400' }]}>
                  {step.label}
                </Text>
                {current && (
                  <View style={s.timelineCurrent}>
                    <View style={s.timelineCurrentDot} />
                    <Text style={s.timelineCurrentText}>Current Status</Text>
                  </View>
                )}
              </View>
            </View>
            {idx < TIMELINE_STEPS.length - 1 && (
              <View style={[s.timelineConnector, done && s.timelineConnectorDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

// ── Detail row helper ─────────────────────────────────────────────────────────

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={s.detailRow}>
    <Text style={s.detailLabel}>{label}</Text>
    <View style={{ flex: 1 }}>{children}</View>
  </View>
);

// ── Main component ────────────────────────────────────────────────────────────

const OrderDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, onRefresh: parentRefresh } = route.params;

  const [order, setOrder]               = useState<Order | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [newStatus, setNewStatus]       = useState('');
  const [trackingId, setTrackingId]     = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [notes, setNotes]               = useState('');
  const [isUpdating, setIsUpdating]     = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await OrderService.getOrder(orderId);
      setOrder(res.data);
      setNewStatus(res.data.status);
      setTrackingId(res.data.tracking_id || '');
      setShippingProvider(res.data.shipping_provider || '');
    } catch (e: any) {
      const err = e as ApiError;
      if (err.response?.status === 401) setError('Session expired. Please login again.');
      else if (err.response?.status === 404) setError('Order not found.');
      else setError(err.message || 'Failed to load order details');
    } finally { setIsLoading(false); setRefreshing(false); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const canModify     = order?.status !== 'CANCELLED' && order?.status !== 'DELIVERED';
  const isCancelled   = order?.status === 'CANCELLED';
  const isDelivered   = order?.status === 'DELIVERED';

  const handleUpdate = async () => {
    if (!order) return;
    if (newStatus === 'SHIPPED' && (!trackingId.trim() || !shippingProvider.trim())) {
      Alert.alert('Missing Info', 'Please provide shipping provider and tracking ID.');
      return;
    }
    Alert.alert('Confirm Update', `Update order #${order.id} to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: performUpdate },
    ]);
  };

  const performUpdate = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const data: any = { status: newStatus };
      if (newStatus === 'SHIPPED') { data.tracking_id = trackingId.trim(); data.shipping_provider = shippingProvider.trim(); }
      if (notes.trim()) data.notes = notes.trim();
      await OrderService.updateOrderStatus(order.id, data);
      setShowModal(false); setNotes('');
      await load();
      parentRefresh?.();
      Alert.alert('Updated!', `Order #${order.id} is now "${newStatus}".`);
    } catch (e: any) {
      Alert.alert('Update Failed', e.response?.data?.message || 'Please try again.');
    } finally { setIsUpdating(false); }
  };

  const copyTracking = async () => {
    try { await Clipboard.setString(order!.tracking_id!); Alert.alert('Copied!', 'Tracking ID copied.'); } catch {}
  };

  const shareOrder = async () => {
    if (!order) return;
    const txt = `Order #${order.id}\nCustomer: ${order.customer_name || 'Guest'}\nAmount: ₹${order.total_amount}\nStatus: ${order.status}${order.tracking_id ? `\nTracking: ${order.tracking_id}` : ''}`;
    try { await Share.share({ message: txt, title: `Order #${order.id}` }); } catch {}
  };

  // ── States ─────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <View style={[s.screen, s.centered]}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={s.loadingText}>Loading order details...</Text>
    </View>
  );

  if (error && !order) return (
    <View style={[s.screen, s.centered]}>
      <View style={s.errorIcon}><Ionicons name="alert-circle-outline" size={40} color="#ef4444" /></View>
      <Text style={s.errorTitle}>Something went wrong</Text>
      <Text style={s.errorMsg}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={load}>
        <Ionicons name="refresh" size={16} color="white" />
        <Text style={s.retryText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={16} color="#3b82f6" />
        <Text style={s.backLinkText}>Back to Orders</Text>
      </TouchableOpacity>
    </View>
  );

  if (!order) return (
    <View style={[s.screen, s.centered]}>
      <Ionicons name="cube-outline" size={48} color="#d1d5db" />
      <Text style={s.errorTitle}>Order not found</Text>
      <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={16} color="#3b82f6" />
        <Text style={s.backLinkText}>Back to Orders</Text>
      </TouchableOpacity>
    </View>
  );

  const cfg = STATUS_CFG[order.status] || STATUS_CFG.PENDING;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView
        style={s.screen}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >

        {/* Page header */}
        <View style={s.pageHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color="#3b82f6" />
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>Order #{order.id}</Text>
            <View style={s.pageMeta}>
              <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
              <Text style={s.pageDate}>{formatDate(order.created_at)}</Text>
            </View>
          </View>
          <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[s.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <TouchableOpacity style={s.shareBtn} onPress={shareOrder} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#f3f4f6' }]}
            onPress={() => Alert.alert('Bill Generation', 'Coming soon!')}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={16} color="#374151" />
            <Text style={[s.actionBtnText, { color: '#374151' }]}>View Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: canModify ? '#3b82f6' : '#f0fdf4', borderColor: canModify ? undefined : '#bbf7d0' }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name={canModify ? 'create-outline' : 'information-circle-outline'} size={16} color={canModify ? 'white' : '#059669'} />
            <Text style={[s.actionBtnText, { color: canModify ? 'white' : '#059669' }]}>
              {canModify ? 'Update Status' : 'View Details'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order Progress */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="navigate-circle-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={s.cardTitle}>Order Progress</Text>
          </View>
          <OrderTimeline order={order} />
        </View>

        {/* Customer Details */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="person-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={s.cardTitle}>Customer</Text>
          </View>
          <View style={s.detailList}>
            <DetailRow label="Name">
              <Text style={s.detailValue}>{order.customer_name || 'Guest Customer'}</Text>
            </DetailRow>
            {!!order.customer_phone && (
              <DetailRow label="Phone">
                <Text style={s.detailValue}>+91 {order.customer_phone}</Text>
              </DetailRow>
            )}
            {!!order.shipping_address && (
              <DetailRow label="Address">
                <Text style={[s.detailValue, { lineHeight: 20 }]}>{order.shipping_address}</Text>
              </DetailRow>
            )}
            <DetailRow label="Order Type">
              <View style={[s.typePill, { backgroundColor: order.order_type === 'LOCAL' ? '#fffbeb' : '#eff6ff' }]}>
                <Text style={[s.typePillText, { color: order.order_type === 'LOCAL' ? '#92400e' : '#1e40af' }]}>
                  {order.order_type === 'LOCAL' ? '🏪 Local Bill' : '🛒 Online Order'}
                </Text>
              </View>
            </DetailRow>
          </View>
        </View>

        {/* Shipping Details */}
        {!!order.shipping_provider && (
          <View style={s.card}>
            <View style={s.cardHead}>
              <View style={[s.cardHeadIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="car-outline" size={20} color="#3b82f6" />
              </View>
              <Text style={s.cardTitle}>Shipping</Text>
            </View>
            <View style={s.detailList}>
              <DetailRow label="Provider">
                <Text style={s.detailValue}>{order.shipping_provider}</Text>
              </DetailRow>
              {!!order.tracking_id && (
                <DetailRow label="Tracking">
                  <View style={s.trackingRow}>
                    <Text style={s.trackingCode}>{order.tracking_id}</Text>
                    <TouchableOpacity style={s.copyBtn} onPress={copyTracking}>
                      <Ionicons name="copy-outline" size={12} color="white" />
                      <Text style={s.copyBtnText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </DetailRow>
              )}
            </View>
          </View>
        )}

        {/* Payment */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name={order.payment_method === 'ONLINE' ? 'card-outline' : 'wallet-outline'} size={20} color="#3b82f6" />
            </View>
            <Text style={s.cardTitle}>Payment</Text>
          </View>
          <View style={s.detailList}>
            <DetailRow label="Method">
              <Text style={s.detailValue}>{order.payment_method === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'}</Text>
            </DetailRow>
            {!!order.payment_status && (
              <DetailRow label="Status">
                <View style={[s.typePill, { backgroundColor: ['Paid', 'PAID'].includes(order.payment_status) ? '#f0fdf4' : '#eff6ff' }]}>
                  <Text style={[s.typePillText, { color: ['Paid', 'PAID'].includes(order.payment_status) ? '#065f46' : '#1e40af' }]}>
                    {order.payment_status}
                  </Text>
                </View>
              </DetailRow>
            )}
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalValue}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="cube-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={s.cardTitle}>Items</Text>
            <View style={s.itemCountBadge}>
              <Text style={s.itemCountText}>{order.items?.length ?? 0}</Text>
            </View>
          </View>

          {order.items && order.items.length > 0 ? (
            <>
              {order.items.map((item, idx) => (
                <View key={item.id ?? idx} style={s.itemCard}>
                  <View style={s.itemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.product?.name || item.product_name || 'Product'}</Text>
                      {!!item.product?.model_name && <Text style={s.itemModel}>{item.product.model_name}</Text>}
                    </View>
                    <Text style={s.itemTotal}>₹{(parseFloat(item.price || '0') * item.quantity).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={s.itemBot}>
                    <View style={s.qtyPill}>
                      <Text style={s.qtyText}>{item.quantity}×</Text>
                    </View>
                    <Text style={s.unitPrice}>₹{parseFloat(item.price || '0').toLocaleString('en-IN')} each</Text>
                  </View>
                </View>
              ))}
              <View style={s.grandTotalRow}>
                <Text style={s.grandTotalLabel}>Grand Total</Text>
                <Text style={s.grandTotalValue}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</Text>
              </View>
            </>
          ) : (
            <View style={s.emptyItems}>
              <Ionicons name="cube-outline" size={36} color="#d1d5db" />
              <Text style={s.emptyItemsText}>No items found</Text>
            </View>
          )}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── Update Status Modal ───────────────────────────────────────────── */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={s.modal}>

          {/* Modal header */}
          <View style={s.modalHead}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>
                {canModify ? `Update Order #${order.id}` : `Order #${order.id} Details`}
              </Text>
            </View>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>

            {/* Cancelled / Delivered notice */}
            {isCancelled && (
              <View style={[s.noticeBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={[s.noticeTitle, { color: '#dc2626' }]}>Order Cancelled</Text>
                  <Text style={[s.noticeText, { color: '#991b1b' }]}>This order cannot be modified.</Text>
                  {!!order.cancel_reason && <Text style={[s.noticeText, { color: '#991b1b', marginTop: 4 }]}>Reason: {order.cancel_reason}</Text>}
                </View>
              </View>
            )}
            {isDelivered && (
              <View style={[s.noticeBanner, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={[s.noticeTitle, { color: '#059669' }]}>Order Delivered</Text>
                  <Text style={[s.noticeText, { color: '#065f46' }]}>This order has been successfully delivered.</Text>
                </View>
              </View>
            )}

            {/* Summary */}
            <View style={s.modalSummary}>
              <View style={s.modalSummaryRow}>
                <Text style={s.modalSummaryLabel}>Customer</Text>
                <Text style={s.modalSummaryValue}>{order.customer_name || 'Guest'}</Text>
              </View>
              <View style={s.modalSummaryRow}>
                <Text style={s.modalSummaryLabel}>Amount</Text>
                <Text style={[s.modalSummaryValue, { color: '#059669', fontWeight: '800' }]}>
                  ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Current status */}
            <View style={s.modalField}>
              <Text style={s.modalFieldLabel}>Current Status</Text>
              <View style={[s.statusPill, { backgroundColor: cfg.bg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7 }]}>
                <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                <Text style={[s.statusPillText, { color: cfg.color, fontSize: 13 }]}>{cfg.label}</Text>
              </View>
            </View>

            {/* New status picker */}
            {canModify && (
              <View style={s.modalField}>
                <Text style={s.modalFieldLabel}>New Status <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <View style={s.pickerWrap}>
                  <Picker selectedValue={newStatus} onValueChange={setNewStatus} enabled={!isUpdating}>
                    {STATUS_OPTIONS.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
                  </Picker>
                </View>
              </View>
            )}

            {/* Shipping fields */}
            {newStatus === 'SHIPPED' && canModify && (
              <>
                <View style={s.modalField}>
                  <Text style={s.modalFieldLabel}>Shipping Provider <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <View style={s.pickerWrap}>
                    <Picker selectedValue={shippingProvider} onValueChange={setShippingProvider} enabled={!isUpdating}>
                      <Picker.Item label="Select provider..." value="" />
                      {SHIPPING_PROVIDERS.map(p => <Picker.Item key={p} label={p} value={p} />)}
                    </Picker>
                  </View>
                </View>
                <View style={s.modalField}>
                  <Text style={s.modalFieldLabel}>Tracking ID <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TextInput
                    style={s.input}
                    value={trackingId}
                    onChangeText={setTrackingId}
                    placeholder="Enter tracking number"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    editable={!isUpdating}
                  />
                </View>
              </>
            )}

            {/* Notes */}
            <View style={s.modalField}>
              <Text style={s.modalFieldLabel}>{canModify ? 'Additional Notes' : 'Notes'}</Text>
              <TextInput
                style={[s.input, s.textarea]}
                value={notes}
                onChangeText={setNotes}
                placeholder={canModify ? 'Add any notes...' : 'No notes'}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={canModify && !isUpdating}
              />
              {canModify && <Text style={s.charCount}>{notes.length}/500</Text>}
            </View>

          </ScrollView>

          {/* Modal footer */}
          <View style={s.modalFoot}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowModal(false)} disabled={isUpdating}>
              <Text style={s.modalCancelText}>{canModify ? 'Cancel' : 'Close'}</Text>
            </TouchableOpacity>
            {canModify && (
              <TouchableOpacity
                style={[s.modalUpdateBtn, isUpdating && { opacity: 0.6 }]}
                onPress={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating
                  ? <ActivityIndicator color="white" size="small" />
                  : <><Ionicons name="checkmark-circle-outline" size={18} color="white" /><Text style={s.modalUpdateText}>Update Status</Text></>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#f1f5f9' },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },

  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  errorIcon:   { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  errorTitle:  { fontSize: 18, fontWeight: '800', color: '#111827' },
  errorMsg:    { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  retryBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  retryText:   { color: 'white', fontSize: 14, fontWeight: '700' },
  backLink:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLinkText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },

  // Page header
  pageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },
  pageTitle:   { fontSize: 16, fontWeight: '800', color: '#111827' },
  pageMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pageDate:    { fontSize: 11, color: '#9ca3af' },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  shareBtn:    { width: 34, height: 34, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },

  // Actions
  actions: {
    flexDirection: 'row', gap: 10,
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: 'white', marginHorizontal: 14, marginTop: 14,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  cardHeadIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', flex: 1 },
  itemCountBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  itemCountText: { fontSize: 12, fontWeight: '700', color: 'white' },

  // Detail rows
  detailList: { gap: 14 },
  detailRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', minWidth: 72, paddingTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  typePill:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typePillText: { fontSize: 12, fontWeight: '600' },

  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trackingCode: { flex: 1, backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, fontSize: 13, fontWeight: '600', color: '#111827' },
  copyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  copyBtnText: { fontSize: 11, fontWeight: '700', color: 'white' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#f3f4f6' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  totalValue: { fontSize: 20, fontWeight: '900', color: '#059669' },

  // Items
  itemCard:  { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 10 },
  itemTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  itemName:  { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  itemModel: { fontSize: 12, color: '#9ca3af' },
  itemTotal: { fontSize: 15, fontWeight: '900', color: '#059669' },
  itemBot:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyPill:   { backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  qtyText:   { fontSize: 12, fontWeight: '800', color: 'white' },
  unitPrice: { fontSize: 12, color: '#6b7280' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4, borderTopWidth: 2, borderTopColor: '#e5e7eb' },
  grandTotalLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  grandTotalValue: { fontSize: 22, fontWeight: '900', color: '#059669' },
  emptyItems: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyItemsText: { fontSize: 14, color: '#9ca3af' },

  // Timeline
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  timelineCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  timelineCircleDone: { backgroundColor: '#059669' },
  timelinePulse: { position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: '#f59e0b', borderWidth: 2, borderColor: 'white' },
  timelineLabel: { fontSize: 14 },
  timelineCurrent: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  timelineCurrentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3b82f6' },
  timelineCurrentText: { fontSize: 11, color: '#3b82f6', fontWeight: '700' },
  timelineConnector: { width: 3, height: 28, marginLeft: 20.5, backgroundColor: '#e5e7eb' },
  timelineConnectorDone: { backgroundColor: '#059669' },

  // Cancel box
  cancelBox: { flexDirection: 'row', gap: 14, backgroundColor: '#fef2f2', padding: 16, borderRadius: 12 },
  cancelIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  cancelTitle: { fontSize: 15, fontWeight: '800', color: '#dc2626', marginBottom: 2 },
  cancelDate:  { fontSize: 12, color: '#991b1b' },
  cancelReasonBox:   { marginTop: 10, padding: 10, backgroundColor: 'white', borderRadius: 8 },
  cancelReasonLabel: { fontSize: 11, fontWeight: '700', color: '#991b1b', marginBottom: 3, textTransform: 'uppercase' },
  cancelReasonText:  { fontSize: 13, color: '#991b1b', lineHeight: 18 },

  // Modal
  modal:    { flex: 1, backgroundColor: '#f1f5f9' },
  modalHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  modalBody: { flex: 1, padding: 16 },
  noticeBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  noticeTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  noticeText:  { fontSize: 13, lineHeight: 18 },
  modalSummary: { backgroundColor: 'white', borderRadius: 12, padding: 14, gap: 12, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  modalSummaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalSummaryLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  modalSummaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  modalField:      { marginBottom: 18 },
  modalFieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  pickerWrap: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  input:     { backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827' },
  textarea:  { minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 5 },
  modalFoot: { flexDirection: 'row', gap: 10, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  modalCancelBtn:  { flex: 1, paddingVertical: 14, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  modalUpdateBtn:  { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#3b82f6', borderRadius: 10 },
  modalUpdateText: { fontSize: 15, fontWeight: '700', color: 'white' },
});

export default OrderDetailsScreen;
