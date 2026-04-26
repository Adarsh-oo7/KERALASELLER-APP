// // screens/Subscription/SubscriptionScreen.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TouchableOpacity,
//   ActivityIndicator, Alert, RefreshControl, Platform,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { StackNavigationProp } from '@react-navigation/stack';
// import apiClient from '../../services/ApiClient';
// import SubscriptionService from '../../services/SubscriptionService';
// import { ApiError } from '../../types/api';
// import RazorpayWebView from '../../components/RazorpayWebView';

// // ── Config ────────────────────────────────────────────────────────────────────

// const RAZORPAY_KEY_ID = 'rzp_test_RClyCqWG0I7Frn';

// // ── Types ─────────────────────────────────────────────────────────────────────

// type SubscriptionScreenProps = { navigation: StackNavigationProp<any> };

// interface Plan {
//   id: number;
//   name: string;
//   price: string;
//   yearly_price?: string;
//   duration_days: number;
//   product_limit?: number;
//   description?: string;
//   created_at: string;
//   updated_at: string;
// }

// interface CurrentSubscription {
//   id: number;
//   plan: Plan;
//   seller: number;
//   start_date: string;
//   end_date: string;
//   is_active: boolean;
//   days_remaining: number;
//   razorpay_order_id?: string;
//   razorpay_payment_id?: string;
//   created_at: string;
//   updated_at: string;
// }

// type StoreStatusType = 'ACTIVE' | 'GRACE_PERIOD' | 'OFFLINE' | 'ARCHIVED';

// interface StoreStatus {
//   subscription: {
//     status: StoreStatusType;
//     message: string;
//     can_sell: boolean;
//     days_until_archive?: number;
//   };
// }

// interface CurrentPlanCardProps {
//   subscription: CurrentSubscription | null;
//   isLoading: boolean;
//   error: string;
//   onRefresh: () => void;
//   storeId?: number | null;
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const STATUS_CFG: Record<StoreStatusType, { label: string; color: string; bg: string; border: string; icon: any }> = {
//   ACTIVE:       { label: 'Active',       color: '#065f46', bg: '#dcfce7', border: '#22c55e', icon: 'checkmark-circle' },
//   GRACE_PERIOD: { label: 'Grace Period', color: '#92400e', bg: '#fef3c7', border: '#f59e0b', icon: 'time' },
//   OFFLINE:      { label: 'Offline',      color: '#991b1b', bg: '#fee2e2', border: '#ef4444', icon: 'close-circle' },
//   ARCHIVED:     { label: 'Archived',     color: '#374151', bg: '#f3f4f6', border: '#9ca3af', icon: 'archive' },
// };

// const daysColor = (days: number) => days <= 3 ? '#dc2626' : days <= 7 ? '#d97706' : '#059669';

// // ── CurrentPlanCard ───────────────────────────────────────────────────────────

// const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
//   subscription, isLoading, error, onRefresh, storeId,
// }) => {
//   const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
//   const [statusLoading, setStatusLoading] = useState(false);

//   const loadStoreStatus = useCallback(async () => {
//     if (!storeId) return;
//     setStatusLoading(true);
//     try {
//       const res = await apiClient.get(`/api/subscriptions/stores/${storeId}/status/`);
//       setStoreStatus(res.data);
//     } catch (e) {
//       console.error('Failed to load store status:', e);
//     } finally {
//       setStatusLoading(false);
//     }
//   }, [storeId]);

//   useEffect(() => {
//     loadStoreStatus();
//     const iv = setInterval(loadStoreStatus, 2 * 60 * 1000);
//     return () => clearInterval(iv);
//   }, [loadStoreStatus]);

//   // ── Loading ──
//   if (isLoading) return (
//     <View style={[c.card, c.centered]}>
//       <View style={c.spinnerWrap}>
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//       <Text style={c.loadingText}>Loading subscription...</Text>
//     </View>
//   );

//   // ── Error ──
//   if (error) return (
//     <View style={[c.card, c.errorCard]}>
//       <View style={c.errorIconWrap}>
//         <Ionicons name="alert-circle-outline" size={28} color="#dc2626" />
//       </View>
//       <Text style={c.errorHeading}>Unable to load subscription</Text>
//       <Text style={c.errorBody}>{error}</Text>
//       <TouchableOpacity style={c.retryBtn} onPress={onRefresh}>
//         <Ionicons name="refresh-outline" size={14} color="white" />
//         <Text style={c.retryBtnText}>Try Again</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // ── No plan ──
//   if (!subscription || !subscription.is_active) {
//     return (
//       <View style={[c.card, c.noPlanCard]}>
//         <View style={c.noPlanIconWrap}>
//           <Ionicons name="ribbon-outline" size={32} color="#d97706" />
//         </View>
//         <Text style={c.noPlanTitle}>No Active Plan</Text>
//         <Text style={c.noPlanText}>Subscribe to a plan below to start selling online.</Text>

//         {storeStatus && (
//           <View style={c.statusSection}>
//             <View style={c.divider} />
//             <StoreStatusBanner status={storeStatus} loading={statusLoading} onRefresh={loadStoreStatus} />
//           </View>
//         )}
//       </View>
//     );
//   }

//   // ── Active plan ──
//   const days = subscription.days_remaining || 0;
//   const expiringSoon = days <= 7;
//   const ss = storeStatus ? STATUS_CFG[storeStatus.subscription.status] : null;

//   return (
//     <View style={[c.card, ss && { borderColor: ss.border, borderWidth: 1.5 }]}>
//       {/* Plan name + shield */}
//       <View style={c.planRow}>
//         <View style={{ flex: 1 }}>
//           <Text style={c.planLabel}>Current Plan</Text>
//           <Text style={c.planName}>{subscription.plan.name}</Text>
//         </View>
//         <View style={[c.shieldWrap, ss && { backgroundColor: ss.bg }]}>
//           <Ionicons name="shield-checkmark" size={22} color={ss?.color ?? '#4f46e5'} />
//         </View>
//       </View>

//       {/* Stats row */}
//       <View style={c.statsRow}>
//         <View style={[c.statBox, { borderColor: daysColor(days) + '30', backgroundColor: daysColor(days) + '0d' }]}>
//           <Ionicons name="calendar-outline" size={16} color={daysColor(days)} />
//           <Text style={[c.statVal, { color: daysColor(days) }]}>{days}</Text>
//           <Text style={c.statLabel}>days left</Text>
//         </View>
//         <View style={c.statBox}>
//           <Ionicons name="cube-outline" size={16} color="#3b82f6" />
//           <Text style={[c.statVal, { color: '#3b82f6' }]}>
//             {subscription.plan.product_limit ?? '∞'}
//           </Text>
//           <Text style={c.statLabel}>products</Text>
//         </View>
//         <View style={c.statBox}>
//           <Ionicons name="storefront-outline" size={16} color="#7c3aed" />
//           <Text style={[c.statVal, { color: '#7c3aed', fontSize: 11 }]}>
//             {ss?.label ?? 'Loading'}
//           </Text>
//           <Text style={c.statLabel}>store</Text>
//         </View>
//       </View>

//       {/* Progress bar */}
//       <View style={c.progressSection}>
//         <View style={c.progressTrack}>
//           <View style={[c.progressFill, {
//             width: `${Math.min((days / (subscription.plan.duration_days || 30)) * 100, 100)}%`,
//             backgroundColor: daysColor(days),
//           }]} />
//         </View>
//         <Text style={c.progressLabel}>
//           Valid until {new Date(subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
//         </Text>
//       </View>

//       {/* Expiring soon warning */}
//       {expiringSoon && (
//         <View style={c.expiryWarning}>
//           <Ionicons name="warning-outline" size={15} color="#92400e" />
//           <Text style={c.expiryWarningText}>
//             {days === 0 ? 'Expires today!' : `Expires in ${days} day${days === 1 ? '' : 's'}. Renew now to avoid interruption.`}
//           </Text>
//         </View>
//       )}

//       {/* Store status */}
//       {storeStatus && (
//         <View style={c.statusSection}>
//           <View style={c.divider} />
//           <StoreStatusBanner status={storeStatus} loading={statusLoading} onRefresh={loadStoreStatus} />
//         </View>
//       )}
//     </View>
//   );
// };

// // ── StoreStatusBanner sub-component ──────────────────────────────────────────

// const StoreStatusBanner: React.FC<{
//   status: StoreStatus;
//   loading: boolean;
//   onRefresh: () => void;
// }> = ({ status, loading, onRefresh }) => {
//   const cfg = STATUS_CFG[status.subscription.status];
//   const canSell = status.subscription.can_sell;

//   return (
//     <>
//       <Text style={c.statusSectionTitle}>Store Status</Text>
//       <View style={[c.statusBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
//         <View style={[c.statusIconWrap, { backgroundColor: cfg.border + '25' }]}>
//           <Ionicons name={cfg.icon} size={18} color={cfg.color} />
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={[c.statusBannerTitle, { color: cfg.color }]}>{cfg.label}</Text>
//           <Text style={[c.statusBannerMsg, { color: cfg.color + 'cc' }]}>{status.subscription.message}</Text>
//         </View>
//         <View style={[c.sellBadge, { backgroundColor: canSell ? '#dcfce7' : '#fee2e2' }]}>
//           <Ionicons name={canSell ? 'checkmark' : 'close'} size={11} color={canSell ? '#065f46' : '#991b1b'} />
//           <Text style={[c.sellBadgeText, { color: canSell ? '#065f46' : '#991b1b' }]}>
//             {canSell ? 'Live' : 'Off'}
//           </Text>
//         </View>
//       </View>

//       {status.subscription.status === 'OFFLINE' &&
//        (status.subscription.days_until_archive ?? 0) > 0 && (
//         <View style={c.archiveBanner}>
//           <Ionicons name="time-outline" size={13} color="#991b1b" />
//           <Text style={c.archiveBannerText}>
//             Store archives in {status.subscription.days_until_archive} day{status.subscription.days_until_archive === 1 ? '' : 's'} — subscribe now to prevent data loss
//           </Text>
//         </View>
//       )}

//       <TouchableOpacity style={c.refreshStatusBtn} onPress={onRefresh} disabled={loading}>
//         <Ionicons name="refresh-outline" size={13} color={loading ? '#9ca3af' : '#6b7280'} />
//         <Text style={[c.refreshStatusText, loading && { color: '#9ca3af' }]}>
//           {loading ? 'Refreshing...' : 'Refresh Status'}
//         </Text>
//       </TouchableOpacity>
//     </>
//   );
// };

// // ── PlanCard sub-component ────────────────────────────────────────────────────

// const PlanCard: React.FC<{
//   plan: Plan;
//   index: number;
//   isCurrentPlan: boolean;
//   isPopular: boolean;
//   isProcessing: boolean;
//   billingCycle: 'monthly' | 'yearly';
//   onChoose: () => void;
// }> = ({ plan, isCurrentPlan, isPopular, isProcessing, billingCycle, onChoose }) => {
//   const basePrice    = parseFloat(plan.price) || 0;
//   const yearlyPrice  = parseFloat(plan.yearly_price || '') || (basePrice * 12 * 0.85);
//   const displayPrice = billingCycle === 'yearly' ? yearlyPrice : basePrice;
//   const saving       = Math.round((basePrice * 12) - yearlyPrice);

//   const FEATURES = [
//     { icon: 'cube-outline',       label: plan.product_limit ? `${plan.product_limit} Online Products` : 'Unlimited Online Products', highlight: false },
//     { icon: 'layers-outline',     label: 'Unlimited Stock Management',   highlight: false },
//     { icon: 'storefront-outline', label: 'Professional Storefront',      highlight: false },
//     { icon: 'logo-whatsapp',      label: 'WhatsApp Integration',         highlight: false },
//     { icon: 'headset-outline',    label: '24/7 Customer Support',        highlight: false },
//     ...(isPopular ? [
//       { icon: 'flash-outline',       label: 'Priority Support',    highlight: true },
//       { icon: 'trending-up-outline', label: 'Advanced Analytics', highlight: true },
//     ] : []),
//   ];

//   return (
//     <View style={[p.card, isPopular && p.popularCard, isCurrentPlan && p.currentCard]}>

//       {/* Popular badge */}
//       {isPopular && (
//         <View style={p.badgeWrap}>
//           <View style={p.badge}>
//             <Ionicons name="star" size={11} color="white" />
//             <Text style={p.badgeText}>Most Popular</Text>
//           </View>
//         </View>
//       )}

//       {/* Header */}
//       <View style={p.header}>
//         <View style={[p.planIconWrap, { backgroundColor: isPopular ? '#eff6ff' : '#f9fafb' }]}>
//           <Ionicons
//             name={isPopular ? 'rocket-outline' : 'cube-outline'}
//             size={22}
//             color={isPopular ? '#3b82f6' : '#6b7280'}
//           />
//         </View>
//         <Text style={p.planName}>{plan.name}</Text>
//         {plan.description && <Text style={p.planDesc}>{plan.description}</Text>}

//         {/* Price */}
//         <View style={p.priceRow}>
//           <Text style={p.currency}>₹</Text>
//           <Text style={[p.price, isPopular && { color: '#3b82f6' }]}>
//             {Math.round(displayPrice).toLocaleString('en-IN')}
//           </Text>
//           <Text style={p.pricePeriod}>/{billingCycle === 'yearly' ? 'yr' : 'mo'}</Text>
//         </View>

//         {billingCycle === 'yearly' && saving > 0 && (
//           <View style={p.savingsBadge}>
//             <Ionicons name="trending-down-outline" size={12} color="#065f46" />
//             <Text style={p.savingsText}>Save ₹{saving.toLocaleString('en-IN')} / year</Text>
//           </View>
//         )}
//       </View>

//       {/* Divider */}
//       <View style={p.divider} />

//       {/* Features */}
//       <View style={p.features}>
//         {FEATURES.map((f, i) => (
//           <View key={i} style={p.featureRow}>
//             <View style={[p.featureIcon, { backgroundColor: f.highlight ? '#fffbeb' : '#f0fdf4' }]}>
//               <Ionicons
//                 name={f.icon as any}
//                 size={13}
//                 color={f.highlight ? '#d97706' : '#059669'}
//               />
//             </View>
//             <Text style={[p.featureText, f.highlight && { color: '#92400e', fontWeight: '600' }]}>
//               {f.label}
//             </Text>
//           </View>
//         ))}
//       </View>

//       {/* CTA */}
//       <TouchableOpacity
//         style={[
//           p.cta,
//           isPopular && !isCurrentPlan && p.ctaPopular,
//           isCurrentPlan && p.ctaCurrent,
//           isProcessing && p.ctaProcessing,
//         ]}
//         onPress={onChoose}
//         disabled={isCurrentPlan || isProcessing}
//         activeOpacity={0.8}
//       >
//         {isProcessing ? (
//           <>
//             <ActivityIndicator size="small" color="white" />
//             <Text style={[p.ctaText, { color: 'white' }]}>Processing...</Text>
//           </>
//         ) : isCurrentPlan ? (
//           <>
//             <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
//             <Text style={[p.ctaText, { color: '#6b7280' }]}>Current Plan</Text>
//           </>
//         ) : (
//           <>
//             <Ionicons name="card-outline" size={16} color={isPopular ? 'white' : '#3b82f6'} />
//             <Text style={[p.ctaText, { color: isPopular ? 'white' : '#3b82f6' }]}>
//               Get Started
//             </Text>
//           </>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// };

// // ── Main Screen ───────────────────────────────────────────────────────────────

// const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
//   const [plans, setPlans]                           = useState<Plan[]>([]);
//   const [currentSub, setCurrentSub]                 = useState<CurrentSubscription | null>(null);
//   const [isLoading, setIsLoading]                   = useState(true);
//   const [subLoading, setSubLoading]                 = useState(true);
//   const [subError, setSubError]                     = useState('');
//   const [isProcessing, setIsProcessing]             = useState<number | null>(null);
//   const [billing, setBilling]                       = useState<'monthly' | 'yearly'>('monthly');
//   const [error, setError]                           = useState('');
//   const [refreshing, setRefreshing]                 = useState(false);
//   const [storeId, setStoreId]                       = useState<number | null>(null);
//   const [showPayment, setShowPayment]               = useState(false);
//   const [paymentData, setPaymentData]               = useState<{
//     orderId: string; amount: number; planName: string; planId: number;
//     userEmail: string; userName: string; userPhone: string;
//   } | null>(null);

//   // ── Data loaders ────────────────────────────────────────────────────────────

//   const loadStoreId = useCallback(async () => {
//     try {
//       const res = await apiClient.get('/user/store/profile/');
//       setStoreId(res.data.store_profile?.id ?? null);
//     } catch (e) { console.error('loadStoreId failed:', e); }
//   }, []);

//   const loadSub = useCallback(async () => {
//     setSubLoading(true); setSubError('');
//     try {
//       const res = await SubscriptionService.getCurrentSubscription();
//       setCurrentSub(res.data);
//     } catch (e: any) {
//       setCurrentSub(null);
//       const ae = e as ApiError;
//       if (ae.response?.status === 401) setSubError('Session expired. Please log in again.');
//       else if (ae.response?.status !== 404) setSubError('Failed to load subscription data.');
//     } finally { setSubLoading(false); }
//   }, []);

//   const loadPlans = useCallback(async () => {
//     try {
//       const res = await SubscriptionService.getPlans();
//       const data: Plan[] = res.data.results || res.data || [];
//       setPlans(data.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)));
//     } catch (e) { setError('Failed to load plans. Pull down to refresh.'); }
//   }, []);

//   const loadAll = useCallback(async () => {
//     setIsLoading(true); setError('');
//     await Promise.all([loadPlans(), loadSub(), loadStoreId()]);
//     setIsLoading(false);
//   }, [loadPlans, loadSub, loadStoreId]);

//   useEffect(() => { loadAll(); }, [loadAll]);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     loadAll().finally(() => setRefreshing(false));
//   }, [loadAll]);

//   // ── Wire up header after onRefresh is defined ────────────────────────────
//   useEffect(() => {
//     navigation.setOptions({
//       title: 'Subscription',
//       headerRight: () => (
//         <TouchableOpacity style={s.headerBtn} onPress={onRefresh}>
//           <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
//         </TouchableOpacity>
//       ),
//     });
//   }, [navigation, onRefresh]);

//   // ── Payment flow ─────────────────────────────────────────────────────────

//   const handleChoosePlan = (planId: number, planName: string) => {
//     const plan = plans.find(p => p.id === planId);
//     const base  = parseFloat(plan?.price || '0');
//     const yearly = parseFloat(plan?.yearly_price || '') || (base * 12 * 0.85);
//     const price  = billing === 'yearly' ? yearly : base;

//     Alert.alert(
//       `Subscribe to ${planName}`,
//       `₹${Math.round(price).toLocaleString('en-IN')}/${billing === 'yearly' ? 'year' : 'month'}\n\nProceed to payment?`,
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { text: 'Continue to Pay', onPress: () => processPlan(planId, planName) },
//       ],
//     );
//   };

//   const processPlan = async (planId: number, planName: string) => {
//     setIsProcessing(planId);
//     try {
//       const res = await SubscriptionService.createOrder({ plan_id: planId, billing_cycle: billing });
//       await openPayment(res.data.order_id, planName, res.data.amount, planId);
//     } catch (e: any) {
//       const ae = e as ApiError;
//       if (ae.response?.status === 401) Alert.alert('Session Expired', 'Please log in again.');
//       else Alert.alert('Error', ae.response?.data?.error || ae.response?.data?.message || 'Failed to create order.');
//       setIsProcessing(null);
//     }
//   };

//   const openPayment = async (orderId: string, planName: string, amount: number, planId: number) => {
//     try {
//       const res = await apiClient.get('/user/store/profile/');
//       const seller  = res.data.seller || {};
//       const profile = res.data.store_profile || {};

//       setPaymentData({
//         orderId, amount, planName, planId,
//         userEmail: seller.email || 'seller@keralasellers.com',
//         userName:  seller.name  || profile.owner_name || 'Kerala Seller',
//         userPhone: seller.phone || profile.seller_phone || profile.whatsapp_number || '',
//       });
//       setShowPayment(true);
//     } catch (e) {
//       Alert.alert('Error', 'Failed to initiate payment.');
//       setIsProcessing(null);
//     }
//   };

//   const handlePaymentSuccess = async (paymentId: string, orderId: string, signature: string) => {
//     setShowPayment(false);
//     await verifyPayment(paymentId, orderId, signature);
//   };

//   const handlePaymentFailure = (err: string) => {
//     setShowPayment(false); setIsProcessing(null);
//     Alert.alert('Payment Failed', err || 'Payment could not be completed.');
//   };

//   const handlePaymentClose = () => {
//     setShowPayment(false); setIsProcessing(null);
//     Alert.alert('Cancelled', 'Payment was cancelled.');
//   };

//   const verifyPayment = async (paymentId: string, orderId: string, signature: string) => {
//     if (!paymentData?.planId) {
//       Alert.alert('Error', 'Plan data missing. Please try again.');
//       setIsProcessing(null); return;
//     }
//     try {
//       await apiClient.post('/api/subscriptions/verify-payment/', {
//         razorpay_payment_id: paymentId,
//         razorpay_order_id:   orderId,
//         razorpay_signature:  signature,
//         plan_id:             paymentData.planId,
//         billing_cycle:       billing,
//       });
//       setIsProcessing(null);
//       Alert.alert('🎉 Subscribed!', `Your ${paymentData.planName} plan is now active!`, [
//         { text: 'Great!', onPress: () => { onRefresh(); navigation.navigate('Dashboard'); } },
//       ]);
//     } catch (e: any) {
//       setIsProcessing(null);
//       const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Verification failed.';
//       Alert.alert('Verification Failed', `${msg}\n\nPayment ID: ${paymentId}\n\nContact support if amount was deducted.`);
//     }
//   };

//   // ── Render ────────────────────────────────────────────────────────────────

//   if (isLoading) return (
//     <View style={[s.screen, s.centered]}>
//       <View style={s.loadingIconWrap}>
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//       <Text style={s.loadingTitle}>Loading Plans</Text>
//       <Text style={s.loadingSubtitle}>Fetching available subscription plans...</Text>
//     </View>
//   );

//   return (
//     <View style={s.screen}>
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
//       >
//         {/* ── Hero ── */}
//         <View style={s.hero}>
//           <View style={s.heroIcon}>
//             <Ionicons name="shield-checkmark" size={28} color="#3b82f6" />
//           </View>
//           <Text style={s.heroTitle}>Choose Your Plan</Text>
//           <Text style={s.heroSub}>Unlock premium features and grow your business</Text>
//         </View>

//         {/* ── Error banner ── */}
//         {!!error && (
//           <View style={s.errorBanner}>
//             <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
//             <Text style={s.errorBannerText}>{error}</Text>
//             <TouchableOpacity onPress={() => setError('')}>
//               <Ionicons name="close" size={15} color="#dc2626" />
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* ── Billing toggle ── */}
//         <View style={s.toggleWrap}>
//           <View style={s.toggle}>
//             {(['monthly', 'yearly'] as const).map(cycle => (
//               <TouchableOpacity
//                 key={cycle}
//                 style={[s.toggleOption, billing === cycle && s.toggleOptionActive]}
//                 onPress={() => setBilling(cycle)}
//                 activeOpacity={0.8}
//               >
//                 <Text style={[s.toggleLabel, billing === cycle && s.toggleLabelActive]}>
//                   {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
//                 </Text>
//                 {cycle === 'yearly' && (
//                   <View style={s.saveBadge}>
//                     <Text style={s.saveBadgeText}>15% off</Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>

//         {/* ── Current plan card ── */}
//         <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
//           <CurrentPlanCard
//             subscription={currentSub}
//             isLoading={subLoading}
//             error={subError}
//             onRefresh={loadSub}
//             storeId={storeId}
//           />
//         </View>

//         {/* ── Section header ── */}
//         <View style={s.sectionHead}>
//           <Text style={s.sectionTitle}>Available Plans</Text>
//           <Text style={s.sectionSub}>{plans.length} plan{plans.length !== 1 ? 's' : ''} available</Text>
//         </View>

//         {/* ── Plan cards ── */}
//         <View style={s.plansWrap}>
//           {plans.map((plan, idx) => {
//             const isCurrentPlan = currentSub?.plan?.id === plan.id && currentSub?.is_active === true;
//             const isPopular = plan.name.toLowerCase().includes('pro') ||
//                               plan.name.toLowerCase().includes('professional') ||
//                               idx === Math.floor(plans.length / 2);
//             return (
//               <PlanCard
//                 key={plan.id}
//                 plan={plan}
//                 index={idx}
//                 isCurrentPlan={isCurrentPlan}
//                 isPopular={isPopular}
//                 isProcessing={isProcessing === plan.id}
//                 billingCycle={billing}
//                 onChoose={() => handleChoosePlan(plan.id, plan.name)}
//               />
//             );
//           })}
//         </View>

//         {/* ── Benefits ── */}
//         <View style={s.benefits}>
//           <Text style={s.benefitsTitle}>Why Kerala Sellers?</Text>
//           <View style={s.benefitsGrid}>
//             {[
//               { icon: 'storefront-outline',  color: '#3b82f6', title: 'Professional Store',  desc: 'Mobile-optimized storefront' },
//               { icon: 'logo-whatsapp',        color: '#25D366', title: 'WhatsApp Orders',     desc: 'Direct customer chat' },
//               { icon: 'shield-checkmark',     color: '#10b981', title: '99.9% Uptime',        desc: 'Secure & always online' },
//               { icon: 'headset-outline',      color: '#f59e0b', title: 'Kerala Support',      desc: 'Local team, fast help' },
//             ].map((b, i) => (
//               <View key={i} style={s.benefitCard}>
//                 <View style={[s.benefitIconWrap, { backgroundColor: b.color + '15' }]}>
//                   <Ionicons name={b.icon as any} size={20} color={b.color} />
//                 </View>
//                 <Text style={s.benefitTitle}>{b.title}</Text>
//                 <Text style={s.benefitDesc}>{b.desc}</Text>
//               </View>
//             ))}
//           </View>
//         </View>

//         <View style={{ height: 32 }} />
//       </ScrollView>

//       {/* ── Razorpay WebView ── */}
//       {showPayment && paymentData && (
//         <RazorpayWebView
//           visible={showPayment}
//           orderId={paymentData.orderId}
//           amount={paymentData.amount}
//           keyId={RAZORPAY_KEY_ID}
//           userEmail={paymentData.userEmail}
//           userName={paymentData.userName}
//           userPhone={paymentData.userPhone}
//           planName={paymentData.planName}
//           onSuccess={handlePaymentSuccess}
//           onFailure={handlePaymentFailure}
//           onClose={handlePaymentClose}
//         />
//       )}
//     </View>
//   );
// };

// // ── Styles ────────────────────────────────────────────────────────────────────

// const SHADOW = Platform.select({
//   ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
//   android: { elevation: 3 },
// });

// // Screen styles
// const s = StyleSheet.create({
//   screen:           { flex: 1, backgroundColor: '#f1f5f9' },
//   centered:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
//   headerBtn:        { padding: 8, marginRight: 6 },

//   // Loading
//   loadingIconWrap:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   loadingTitle:     { fontSize: 18, fontWeight: '800', color: '#111827' },
//   loadingSubtitle:  { fontSize: 14, color: '#9ca3af', textAlign: 'center' },

//   // Hero
//   hero:             { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
//   heroIcon:         { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
//   heroTitle:        { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 },
//   heroSub:          { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },

//   // Error banner
//   errorBanner:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', margin: 16, padding: 14, borderRadius: 10 },
//   errorBannerText:  { flex: 1, fontSize: 13, color: '#dc2626' },

//   // Billing toggle
//   toggleWrap:       { paddingHorizontal: 16, paddingVertical: 16 },
//   toggle:           { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4 },
//   toggleOption:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 9, gap: 6 },
//   toggleOptionActive: { backgroundColor: 'white', ...SHADOW },
//   toggleLabel:      { fontSize: 14, fontWeight: '600', color: '#6b7280' },
//   toggleLabelActive: { color: '#1d4ed8', fontWeight: '800' },
//   saveBadge:        { backgroundColor: '#10b981', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
//   saveBadgeText:    { fontSize: 10, fontWeight: '800', color: 'white' },

//   // Section
//   sectionHead:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
//   sectionTitle:     { fontSize: 16, fontWeight: '800', color: '#111827' },
//   sectionSub:       { fontSize: 12, color: '#9ca3af', fontWeight: '500' },

//   plansWrap:        { paddingHorizontal: 16, gap: 14, marginBottom: 24 },

//   // Benefits
//   benefits:         { backgroundColor: 'white', marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f3f4f6', ...SHADOW },
//   benefitsTitle:    { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 16 },
//   benefitsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
//   benefitCard:      { width: '47%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
//   benefitIconWrap:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
//   benefitTitle:     { fontSize: 12, fontWeight: '800', color: '#111827', marginBottom: 3 },
//   benefitDesc:      { fontSize: 11, color: '#9ca3af', lineHeight: 16 },
// });

// // CurrentPlanCard styles
// const c = StyleSheet.create({
//   card:             { backgroundColor: 'white', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e5e7eb', ...SHADOW },
//   centered:         { alignItems: 'center', gap: 12, paddingVertical: 24 },
//   spinnerWrap:      { width: 52, height: 52, borderRadius: 26, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
//   loadingText:      { fontSize: 14, color: '#6b7280' },

//   // Error
//   errorCard:        { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
//   errorIconWrap:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
//   errorHeading:     { fontSize: 15, fontWeight: '800', color: '#991b1b' },
//   errorBody:        { fontSize: 13, color: '#dc2626', textAlign: 'center', lineHeight: 20 },
//   retryBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
//   retryBtnText:     { fontSize: 13, fontWeight: '700', color: 'white' },

//   // No plan
//   noPlanCard:       { borderColor: '#fcd34d', backgroundColor: '#fffbeb', alignItems: 'center', gap: 10, paddingVertical: 24 },
//   noPlanIconWrap:   { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
//   noPlanTitle:      { fontSize: 17, fontWeight: '900', color: '#92400e' },
//   noPlanText:       { fontSize: 13, color: '#b45309', textAlign: 'center', lineHeight: 20 },

//   // Active plan
//   planRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
//   planLabel:        { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
//   planName:         { fontSize: 20, fontWeight: '900', color: '#111827' },
//   shieldWrap:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },

//   // Stats row
//   statsRow:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
//   statBox:          { flex: 1, alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#f3f4f6', gap: 3 },
//   statVal:          { fontSize: 18, fontWeight: '900', color: '#111827' },
//   statLabel:        { fontSize: 10, color: '#9ca3af', fontWeight: '600' },

//   // Progress
//   progressSection:  { marginBottom: 4 },
//   progressTrack:    { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
//   progressFill:     { height: '100%', borderRadius: 3 },
//   progressLabel:    { fontSize: 11, color: '#9ca3af', textAlign: 'center' },

//   // Expiry warning
//   expiryWarning:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 8, padding: 12, marginTop: 12 },
//   expiryWarningText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#92400e', lineHeight: 18 },

//   // Divider
//   divider:          { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },
//   statusSection:    {},
//   statusSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

//   // Status banner
//   statusBanner:     { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, gap: 12, marginBottom: 10 },
//   statusIconWrap:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
//   statusBannerTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
//   statusBannerMsg:  { fontSize: 11, lineHeight: 16 },
//   sellBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
//   sellBadgeText:    { fontSize: 11, fontWeight: '800' },

//   // Archive
//   archiveBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 10, marginBottom: 10 },
//   archiveBannerText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#991b1b', lineHeight: 16 },

//   // Refresh status
//   refreshStatusBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', padding: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 7 },
//   refreshStatusText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
// });

// // PlanCard styles
// const p = StyleSheet.create({
//   card:         { backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'visible', ...SHADOW },
//   popularCard:  { borderColor: '#3b82f6', borderWidth: 2 },
//   currentCard:  { borderColor: '#10b981', borderWidth: 2 },

//   // Popular badge
//   badgeWrap:    { position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
//   badge:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
//   badgeText:    { fontSize: 12, fontWeight: '800', color: 'white' },

//   // Header
//   header:       { alignItems: 'center', marginBottom: 18, paddingTop: 10 },
//   planIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
//   planName:     { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 4 },
//   planDesc:     { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18, marginBottom: 8 },

//   // Price
//   priceRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 8 },
//   currency:     { fontSize: 18, fontWeight: '700', color: '#374151' },
//   price:        { fontSize: 36, fontWeight: '900', color: '#111827' },
//   pricePeriod:  { fontSize: 15, fontWeight: '600', color: '#9ca3af' },
//   savingsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
//   savingsText:  { fontSize: 12, fontWeight: '700', color: '#065f46' },

//   // Divider
//   divider:      { height: 1, backgroundColor: '#f3f4f6', marginBottom: 16 },

//   // Features
//   features:     { gap: 10, marginBottom: 20 },
//   featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   featureIcon:  { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
//   featureText:  { fontSize: 13, color: '#374151', flex: 1 },

//   // CTA
//   cta:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: 'white' },
//   ctaPopular:   { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
//   ctaCurrent:   { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
//   ctaProcessing: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
//   ctaText:      { fontSize: 15, fontWeight: '800', color: '#3b82f6' },
// });

// export default SubscriptionScreen;
// screens/Subscription/SubscriptionScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import apiClient from '../../services/ApiClient';
import SubscriptionService from '../../services/SubscriptionService';
import { ApiError } from '../../types/api';
import RazorpayCheckout from 'react-native-razorpay';

// ── Types ─────────────────────────────────────────────────────────────────────

type SubscriptionScreenProps = { navigation: StackNavigationProp<any> };

interface Plan {
  id: number;
  name: string;
  price: string;
  yearly_price?: string;
  duration_days: number;
  product_limit?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CurrentSubscription {
  id: number;
  plan: Plan;
  seller: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  days_remaining: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
}

type StoreStatusType = 'ACTIVE' | 'GRACE_PERIOD' | 'OFFLINE' | 'ARCHIVED';

interface StoreStatus {
  subscription: {
    status: StoreStatusType;
    message: string;
    can_sell: boolean;
    days_until_archive?: number;
  };
}

interface CurrentPlanCardProps {
  subscription: CurrentSubscription | null;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
  storeId?: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<StoreStatusType, { label: string; color: string; bg: string; border: string; icon: any }> = {
  ACTIVE:       { label: 'Active',       color: '#065f46', bg: '#dcfce7', border: '#22c55e', icon: 'checkmark-circle' },
  GRACE_PERIOD: { label: 'Grace Period', color: '#92400e', bg: '#fef3c7', border: '#f59e0b', icon: 'time' },
  OFFLINE:      { label: 'Offline',      color: '#991b1b', bg: '#fee2e2', border: '#ef4444', icon: 'close-circle' },
  ARCHIVED:     { label: 'Archived',     color: '#374151', bg: '#f3f4f6', border: '#9ca3af', icon: 'archive' },
};

const daysColor = (days: number) => days <= 3 ? '#dc2626' : days <= 7 ? '#d97706' : '#059669';

// ── CurrentPlanCard ───────────────────────────────────────────────────────────

const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  subscription, isLoading, error, onRefresh, storeId,
}) => {
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadStoreStatus = useCallback(async () => {
    if (!storeId) return;
    setStatusLoading(true);
    try {
      const res = await apiClient.get(`/api/subscriptions/stores/${storeId}/status/`);
      setStoreStatus(res.data);
    } catch (e) {
      console.error('Failed to load store status:', e);
    } finally {
      setStatusLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadStoreStatus();
    const iv = setInterval(loadStoreStatus, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, [loadStoreStatus]);

  if (isLoading) return (
    <View style={[c.card, c.centered]}>
      <View style={c.spinnerWrap}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
      <Text style={c.loadingText}>Loading subscription...</Text>
    </View>
  );

  if (error) return (
    <View style={[c.card, c.errorCard]}>
      <View style={c.errorIconWrap}>
        <Ionicons name="alert-circle-outline" size={28} color="#dc2626" />
      </View>
      <Text style={c.errorHeading}>Unable to load subscription</Text>
      <Text style={c.errorBody}>{error}</Text>
      <TouchableOpacity style={c.retryBtn} onPress={onRefresh}>
        <Ionicons name="refresh-outline" size={14} color="white" />
        <Text style={c.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (!subscription || !subscription.is_active) {
    return (
      <View style={[c.card, c.noPlanCard]}>
        <View style={c.noPlanIconWrap}>
          <Ionicons name="ribbon-outline" size={32} color="#d97706" />
        </View>
        <Text style={c.noPlanTitle}>No Active Plan</Text>
        <Text style={c.noPlanText}>Subscribe to a plan below to start selling online.</Text>
        {storeStatus && (
          <View style={c.statusSection}>
            <View style={c.divider} />
            <StoreStatusBanner status={storeStatus} loading={statusLoading} onRefresh={loadStoreStatus} />
          </View>
        )}
      </View>
    );
  }

  const days = subscription.days_remaining || 0;
  const expiringSoon = days <= 7;
  const ss = storeStatus ? STATUS_CFG[storeStatus.subscription.status] : null;

  return (
    <View style={[c.card, ss && { borderColor: ss.border, borderWidth: 1.5 }]}>
      <View style={c.planRow}>
        <View style={{ flex: 1 }}>
          <Text style={c.planLabel}>Current Plan</Text>
          <Text style={c.planName}>{subscription.plan.name}</Text>
        </View>
        <View style={[c.shieldWrap, ss && { backgroundColor: ss.bg }]}>
          <Ionicons name="shield-checkmark" size={22} color={ss?.color ?? '#4f46e5'} />
        </View>
      </View>

      <View style={c.statsRow}>
        <View style={[c.statBox, { borderColor: daysColor(days) + '30', backgroundColor: daysColor(days) + '0d' }]}>
          <Ionicons name="calendar-outline" size={16} color={daysColor(days)} />
          <Text style={[c.statVal, { color: daysColor(days) }]}>{days}</Text>
          <Text style={c.statLabel}>days left</Text>
        </View>
        <View style={c.statBox}>
          <Ionicons name="cube-outline" size={16} color="#3b82f6" />
          <Text style={[c.statVal, { color: '#3b82f6' }]}>
            {subscription.plan.product_limit ?? '∞'}
          </Text>
          <Text style={c.statLabel}>products</Text>
        </View>
        <View style={c.statBox}>
          <Ionicons name="storefront-outline" size={16} color="#7c3aed" />
          <Text style={[c.statVal, { color: '#7c3aed', fontSize: 11 }]}>
            {ss?.label ?? 'Loading'}
          </Text>
          <Text style={c.statLabel}>store</Text>
        </View>
      </View>

      <View style={c.progressSection}>
        <View style={c.progressTrack}>
          <View style={[c.progressFill, {
            width: `${Math.min((days / (subscription.plan.duration_days || 30)) * 100, 100)}%`,
            backgroundColor: daysColor(days),
          }]} />
        </View>
        <Text style={c.progressLabel}>
          Valid until {new Date(subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {expiringSoon && (
        <View style={c.expiryWarning}>
          <Ionicons name="warning-outline" size={15} color="#92400e" />
          <Text style={c.expiryWarningText}>
            {days === 0 ? 'Expires today!' : `Expires in ${days} day${days === 1 ? '' : 's'}. Renew now to avoid interruption.`}
          </Text>
        </View>
      )}

      {storeStatus && (
        <View style={c.statusSection}>
          <View style={c.divider} />
          <StoreStatusBanner status={storeStatus} loading={statusLoading} onRefresh={loadStoreStatus} />
        </View>
      )}
    </View>
  );
};

// ── StoreStatusBanner ─────────────────────────────────────────────────────────

const StoreStatusBanner: React.FC<{
  status: StoreStatus;
  loading: boolean;
  onRefresh: () => void;
}> = ({ status, loading, onRefresh }) => {
  const cfg = STATUS_CFG[status.subscription.status];
  const canSell = status.subscription.can_sell;

  return (
    <>
      <Text style={c.statusSectionTitle}>Store Status</Text>
      <View style={[c.statusBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <View style={[c.statusIconWrap, { backgroundColor: cfg.border + '25' }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[c.statusBannerTitle, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[c.statusBannerMsg, { color: cfg.color + 'cc' }]}>{status.subscription.message}</Text>
        </View>
        <View style={[c.sellBadge, { backgroundColor: canSell ? '#dcfce7' : '#fee2e2' }]}>
          <Ionicons name={canSell ? 'checkmark' : 'close'} size={11} color={canSell ? '#065f46' : '#991b1b'} />
          <Text style={[c.sellBadgeText, { color: canSell ? '#065f46' : '#991b1b' }]}>
            {canSell ? 'Live' : 'Off'}
          </Text>
        </View>
      </View>

      {status.subscription.status === 'OFFLINE' &&
       (status.subscription.days_until_archive ?? 0) > 0 && (
        <View style={c.archiveBanner}>
          <Ionicons name="time-outline" size={13} color="#991b1b" />
          <Text style={c.archiveBannerText}>
            Store archives in {status.subscription.days_until_archive} day{status.subscription.days_until_archive === 1 ? '' : 's'} — subscribe now to prevent data loss
          </Text>
        </View>
      )}

      <TouchableOpacity style={c.refreshStatusBtn} onPress={onRefresh} disabled={loading}>
        <Ionicons name="refresh-outline" size={13} color={loading ? '#9ca3af' : '#6b7280'} />
        <Text style={[c.refreshStatusText, loading && { color: '#9ca3af' }]}>
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </Text>
      </TouchableOpacity>
    </>
  );
};

// ── PlanCard ──────────────────────────────────────────────────────────────────

const PlanCard: React.FC<{
  plan: Plan;
  index: number;
  isCurrentPlan: boolean;
  isPopular: boolean;
  isProcessing: boolean;
  billingCycle: 'monthly' | 'yearly';
  onChoose: () => void;
}> = ({ plan, isCurrentPlan, isPopular, isProcessing, billingCycle, onChoose }) => {
  const basePrice   = parseFloat(plan.price) || 0;
  const yearlyPrice = parseFloat(plan.yearly_price || '') || (basePrice * 12 * 0.90);
  const displayPrice = billingCycle === 'yearly' ? yearlyPrice : basePrice;
  const saving      = Math.round((basePrice * 12) - yearlyPrice);

  const FEATURES = [
    { icon: 'cube-outline',       label: plan.product_limit ? `${plan.product_limit} Online Products` : 'Unlimited Online Products', highlight: false },
    { icon: 'layers-outline',     label: 'Unlimited Stock Management',   highlight: false },
    { icon: 'storefront-outline', label: 'Professional Storefront',      highlight: false },
    { icon: 'logo-whatsapp',      label: 'WhatsApp Integration',         highlight: false },
    { icon: 'headset-outline',    label: '24/7 Customer Support',        highlight: false },
    ...(isPopular ? [
      { icon: 'flash-outline',       label: 'Priority Support',    highlight: true },
      { icon: 'trending-up-outline', label: 'Advanced Analytics', highlight: true },
    ] : []),
  ];

  return (
    <View style={[p.card, isPopular && p.popularCard, isCurrentPlan && p.currentCard]}>
      {isPopular && (
        <View style={p.badgeWrap}>
          <View style={p.badge}>
            <Ionicons name="star" size={11} color="white" />
            <Text style={p.badgeText}>Most Popular</Text>
          </View>
        </View>
      )}

      <View style={p.header}>
        <View style={[p.planIconWrap, { backgroundColor: isPopular ? '#eff6ff' : '#f9fafb' }]}>
          <Ionicons
            name={isPopular ? 'rocket-outline' : 'cube-outline'}
            size={22}
            color={isPopular ? '#3b82f6' : '#6b7280'}
          />
        </View>
        <Text style={p.planName}>{plan.name}</Text>
        {plan.description && <Text style={p.planDesc}>{plan.description}</Text>}

        <View style={p.priceRow}>
          <Text style={p.currency}>₹</Text>
          <Text style={[p.price, isPopular && { color: '#3b82f6' }]}>
            {Math.round(displayPrice).toLocaleString('en-IN')}
          </Text>
          <Text style={p.pricePeriod}>/{billingCycle === 'yearly' ? 'yr' : 'mo'}</Text>
        </View>

        {billingCycle === 'yearly' && saving > 0 && (
          <View style={p.savingsBadge}>
            <Ionicons name="trending-down-outline" size={12} color="#065f46" />
            <Text style={p.savingsText}>Save ₹{saving.toLocaleString('en-IN')} / year</Text>
          </View>
        )}
      </View>

      <View style={p.divider} />

      <View style={p.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={p.featureRow}>
            <View style={[p.featureIcon, { backgroundColor: f.highlight ? '#fffbeb' : '#f0fdf4' }]}>
              <Ionicons
                name={f.icon as any}
                size={13}
                color={f.highlight ? '#d97706' : '#059669'}
              />
            </View>
            <Text style={[p.featureText, f.highlight && { color: '#92400e', fontWeight: '600' }]}>
              {f.label}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          p.cta,
          isPopular && !isCurrentPlan && p.ctaPopular,
          isCurrentPlan && p.ctaCurrent,
          isProcessing && p.ctaProcessing,
        ]}
        onPress={onChoose}
        disabled={isCurrentPlan || isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <>
            <ActivityIndicator size="small" color="white" />
            <Text style={[p.ctaText, { color: 'white' }]}>Processing...</Text>
          </>
        ) : isCurrentPlan ? (
          <>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={[p.ctaText, { color: '#6b7280' }]}>Current Plan</Text>
          </>
        ) : (
          <>
            <Ionicons name="card-outline" size={16} color={isPopular ? 'white' : '#3b82f6'} />
            <Text style={[p.ctaText, { color: isPopular ? 'white' : '#3b82f6' }]}>
              Get Started
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const [plans, setPlans]             = useState<Plan[]>([]);
  const [currentSub, setCurrentSub]   = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [subLoading, setSubLoading]   = useState(true);
  const [subError, setSubError]       = useState('');
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [billing, setBilling]         = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError]             = useState('');
  const [refreshing, setRefreshing]   = useState(false);
  const [storeId, setStoreId]         = useState<number | null>(null);

  // ── Data loaders ─────────────────────────────────────────────────────────

  const loadStoreId = useCallback(async () => {
    try {
      const res = await apiClient.get('/user/store/profile/');
      setStoreId(res.data.store_profile?.id ?? null);
    } catch (e) { console.error('loadStoreId failed:', e); }
  }, []);

  const loadSub = useCallback(async () => {
    setSubLoading(true); setSubError('');
    try {
      const res = await SubscriptionService.getCurrentSubscription();
      setCurrentSub(res.data);
    } catch (e: any) {
      setCurrentSub(null);
      const ae = e as ApiError;
      if (ae.response?.status === 401) setSubError('Session expired. Please log in again.');
      else if (ae.response?.status !== 404) setSubError('Failed to load subscription data.');
    } finally { setSubLoading(false); }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      const res = await SubscriptionService.getPlans();
      const data: Plan[] = res.data.results || res.data || [];
      setPlans(data.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)));
    } catch (e) { setError('Failed to load plans. Pull down to refresh.'); }
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true); setError('');
    await Promise.all([loadPlans(), loadSub(), loadStoreId()]);
    setIsLoading(false);
  }, [loadPlans, loadSub, loadStoreId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll().finally(() => setRefreshing(false));
  }, [loadAll]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Subscription',
      headerRight: () => (
        <TouchableOpacity style={s.headerBtn} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, onRefresh]);

  // ── Payment flow ──────────────────────────────────────────────────────────

  const handleChoosePlan = (planId: number, planName: string) => {
    const plan   = plans.find(pl => pl.id === planId);
    const base   = parseFloat(plan?.price || '0');
    const yearly = parseFloat(plan?.yearly_price || '') || (base * 12 * 0.90);
    const price  = billing === 'yearly' ? yearly : base;

    Alert.alert(
      `Subscribe to ${planName}`,
      `₹${Math.round(price).toLocaleString('en-IN')}/${billing === 'yearly' ? 'year' : 'month'}\n\nProceed to payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue to Pay', onPress: () => processPlan(planId, planName) },
      ],
    );
  };

  const processPlan = async (planId: number, planName: string) => {
    setIsProcessing(planId);
    try {
      const res = await SubscriptionService.createOrder({ plan_id: planId, billing_cycle: billing });
      await openPayment(res.data.order_id, planName, res.data.amount, planId, res.data.key_id);
    } catch (e: any) {
      const ae = e as ApiError;
      if (ae.response?.status === 401) Alert.alert('Session Expired', 'Please log in again.');
      else Alert.alert('Error', ae.response?.data?.error || ae.response?.data?.message || 'Failed to create order.');
      setIsProcessing(null);
    }
  };

  const openPayment = async (
    orderId: string, planName: string,
    amount: number, planId: number,
    keyId: string,
  ) => {
    try {
      const res     = await apiClient.get('/user/store/profile/');
      const seller  = res.data.seller || {};
      const profile = res.data.store_profile || {};

      const options = {
        description:  `${planName} Subscription`,
        currency:     'INR',
        key:          keyId,
        amount:       String(amount),   // in paise, as string
        order_id:     orderId,
        name:         'Kerala Sellers',
        prefill: {
          email:   seller.email   || 'seller@keralasellers.com',
          name:    seller.name    || profile.owner_name || 'Kerala Seller',
          contact: seller.phone   || profile.seller_phone || profile.whatsapp_number || '',
        },
        theme: { color: '#3b82f6' },
      };

      RazorpayCheckout.open(options)
        .then((data: any) => {
          // Payment success — verify on backend
          verifyPayment(
            data.razorpay_payment_id,
            data.razorpay_order_id,
            data.razorpay_signature,
            planId,
            planName,
          );
        })
        .catch((error: any) => {
          setIsProcessing(null);
          if (error.code === 0) {
            // User dismissed — no alert needed
          } else {
            Alert.alert('Payment Failed', error.description || 'Payment could not be completed. Please try again.');
          }
        });

    } catch (e) {
      Alert.alert('Error', 'Failed to initiate payment.');
      setIsProcessing(null);
    }
  };

  const verifyPayment = async (
    paymentId: string, orderId: string, signature: string,
    planId: number, planName: string,
  ) => {
    try {
      await apiClient.post('/api/subscriptions/verify-payment/', {
        razorpay_payment_id: paymentId,
        razorpay_order_id:   orderId,
        razorpay_signature:  signature,
        plan_id:             planId,
        billing_cycle:       billing,
      });
      setIsProcessing(null);
      Alert.alert('🎉 Subscribed!', `Your ${planName} plan is now active!`, [
        { text: 'Great!', onPress: () => { onRefresh(); navigation.navigate('Dashboard'); } },
      ]);
    } catch (e: any) {
      setIsProcessing(null);
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Verification failed.';
      Alert.alert(
        'Verification Failed',
        `${msg}\n\nPayment ID: ${paymentId}\n\nContact support if amount was deducted.`,
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return (
    <View style={[s.screen, s.centered]}>
      <View style={s.loadingIconWrap}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
      <Text style={s.loadingTitle}>Loading Plans</Text>
      <Text style={s.loadingSubtitle}>Fetching available subscription plans...</Text>
    </View>
  );

  return (
    <View style={s.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#3b82f6" />
          </View>
          <Text style={s.heroTitle}>Choose Your Plan</Text>
          <Text style={s.heroSub}>Unlock premium features and grow your business</Text>
        </View>

        {/* Error banner */}
        {!!error && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
            <Text style={s.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Ionicons name="close" size={15} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}

        {/* Billing toggle */}
        <View style={s.toggleWrap}>
          <View style={s.toggle}>
            {(['monthly', 'yearly'] as const).map(cycle => (
              <TouchableOpacity
                key={cycle}
                style={[s.toggleOption, billing === cycle && s.toggleOptionActive]}
                onPress={() => setBilling(cycle)}
                activeOpacity={0.8}
              >
                <Text style={[s.toggleLabel, billing === cycle && s.toggleLabelActive]}>
                  {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                </Text>
                {cycle === 'yearly' && (
                  <View style={s.saveBadge}>
                    <Text style={s.saveBadgeText}>10% off</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current plan card */}
        <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
          <CurrentPlanCard
            subscription={currentSub}
            isLoading={subLoading}
            error={subError}
            onRefresh={loadSub}
            storeId={storeId}
          />
        </View>

        {/* Section header */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>Available Plans</Text>
          <Text style={s.sectionSub}>{plans.length} plan{plans.length !== 1 ? 's' : ''} available</Text>
        </View>

        {/* Plan cards */}
        <View style={s.plansWrap}>
          {plans.map((plan, idx) => {
            const isCurrentPlan = currentSub?.plan?.id === plan.id && currentSub?.is_active === true;
            const isPopular = plan.name.toLowerCase().includes('pro') ||
                              plan.name.toLowerCase().includes('professional') ||
                              idx === Math.floor(plans.length / 2);
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={idx}
                isCurrentPlan={isCurrentPlan}
                isPopular={isPopular}
                isProcessing={isProcessing === plan.id}
                billingCycle={billing}
                onChoose={() => handleChoosePlan(plan.id, plan.name)}
              />
            );
          })}
        </View>

        {/* Benefits */}
        <View style={s.benefits}>
          <Text style={s.benefitsTitle}>Why Kerala Sellers?</Text>
          <View style={s.benefitsGrid}>
            {[
              { icon: 'storefront-outline', color: '#3b82f6', title: 'Professional Store', desc: 'Mobile-optimized storefront' },
              { icon: 'logo-whatsapp',       color: '#25D366', title: 'WhatsApp Orders',    desc: 'Direct customer chat' },
              { icon: 'shield-checkmark',    color: '#10b981', title: '99.9% Uptime',       desc: 'Secure & always online' },
              { icon: 'headset-outline',     color: '#f59e0b', title: 'Kerala Support',     desc: 'Local team, fast help' },
            ].map((b, i) => (
              <View key={i} style={s.benefitCard}>
                <View style={[s.benefitIconWrap, { backgroundColor: b.color + '15' }]}>
                  <Ionicons name={b.icon as any} size={20} color={b.color} />
                </View>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const SHADOW = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  android: { elevation: 3 },
});

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#f1f5f9' },
  centered:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  headerBtn:        { padding: 8, marginRight: 6 },
  loadingIconWrap:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  loadingTitle:     { fontSize: 18, fontWeight: '800', color: '#111827' },
  loadingSubtitle:  { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  hero:             { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  heroIcon:         { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle:        { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 },
  heroSub:          { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  errorBanner:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', margin: 16, padding: 14, borderRadius: 10 },
  errorBannerText:  { flex: 1, fontSize: 13, color: '#dc2626' },
  toggleWrap:       { paddingHorizontal: 16, paddingVertical: 16 },
  toggle:           { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4 },
  toggleOption:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 9, gap: 6 },
  toggleOptionActive: { backgroundColor: 'white', ...SHADOW },
  toggleLabel:      { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleLabelActive: { color: '#1d4ed8', fontWeight: '800' },
  saveBadge:        { backgroundColor: '#10b981', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  saveBadgeText:    { fontSize: 10, fontWeight: '800', color: 'white' },
  sectionHead:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:     { fontSize: 16, fontWeight: '800', color: '#111827' },
  sectionSub:       { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  plansWrap:        { paddingHorizontal: 16, gap: 14, marginBottom: 24 },
  benefits:         { backgroundColor: 'white', marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f3f4f6', ...SHADOW },
  benefitsTitle:    { fontSize: 15, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 16 },
  benefitsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benefitCard:      { width: '47%', backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  benefitIconWrap:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  benefitTitle:     { fontSize: 12, fontWeight: '800', color: '#111827', marginBottom: 3 },
  benefitDesc:      { fontSize: 11, color: '#9ca3af', lineHeight: 16 },
});

const c = StyleSheet.create({
  card:             { backgroundColor: 'white', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e5e7eb', ...SHADOW },
  centered:         { alignItems: 'center', gap: 12, paddingVertical: 24 },
  spinnerWrap:      { width: 52, height: 52, borderRadius: 26, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  loadingText:      { fontSize: 14, color: '#6b7280' },
  errorCard:        { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  errorIconWrap:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  errorHeading:     { fontSize: 15, fontWeight: '800', color: '#991b1b' },
  errorBody:        { fontSize: 13, color: '#dc2626', textAlign: 'center', lineHeight: 20 },
  retryBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  retryBtnText:     { fontSize: 13, fontWeight: '700', color: 'white' },
  noPlanCard:       { borderColor: '#fcd34d', backgroundColor: '#fffbeb', alignItems: 'center', gap: 10, paddingVertical: 24 },
  noPlanIconWrap:   { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  noPlanTitle:      { fontSize: 17, fontWeight: '900', color: '#92400e' },
  noPlanText:       { fontSize: 13, color: '#b45309', textAlign: 'center', lineHeight: 20 },
  planRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  planLabel:        { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  planName:         { fontSize: 20, fontWeight: '900', color: '#111827' },
  shieldWrap:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  statsRow:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox:          { flex: 1, alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#f3f4f6', gap: 3 },
  statVal:          { fontSize: 18, fontWeight: '900', color: '#111827' },
  statLabel:        { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
  progressSection:  { marginBottom: 4 },
  progressTrack:    { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill:     { height: '100%', borderRadius: 3 },
  progressLabel:    { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  expiryWarning:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 8, padding: 12, marginTop: 12 },
  expiryWarningText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#92400e', lineHeight: 18 },
  divider:          { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },
  statusSection:    {},
  statusSectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  statusBanner:     { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, gap: 12, marginBottom: 10 },
  statusIconWrap:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusBannerTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  statusBannerMsg:  { fontSize: 11, lineHeight: 16 },
  sellBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  sellBadgeText:    { fontSize: 11, fontWeight: '800' },
  archiveBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 10, marginBottom: 10 },
  archiveBannerText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#991b1b', lineHeight: 16 },
  refreshStatusBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', padding: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 7 },
  refreshStatusText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
});

const p = StyleSheet.create({
  card:         { backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'visible', ...SHADOW },
  popularCard:  { borderColor: '#3b82f6', borderWidth: 2 },
  currentCard:  { borderColor: '#10b981', borderWidth: 2 },
  badgeWrap:    { position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText:    { fontSize: 12, fontWeight: '800', color: 'white' },
  header:       { alignItems: 'center', marginBottom: 18, paddingTop: 10 },
  planIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  planName:     { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 4 },
  planDesc:     { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  priceRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 8 },
  currency:     { fontSize: 18, fontWeight: '700', color: '#374151' },
  price:        { fontSize: 36, fontWeight: '900', color: '#111827' },
  pricePeriod:  { fontSize: 15, fontWeight: '600', color: '#9ca3af' },
  savingsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  savingsText:  { fontSize: 12, fontWeight: '700', color: '#065f46' },
  divider:      { height: 1, backgroundColor: '#f3f4f6', marginBottom: 16 },
  features:     { gap: 10, marginBottom: 20 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon:  { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  featureText:  { fontSize: 13, color: '#374151', flex: 1 },
  cta:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: 'white' },
  ctaPopular:   { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  ctaCurrent:   { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  ctaProcessing: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  ctaText:      { fontSize: 15, fontWeight: '800', color: '#3b82f6' },
});

export default SubscriptionScreen;