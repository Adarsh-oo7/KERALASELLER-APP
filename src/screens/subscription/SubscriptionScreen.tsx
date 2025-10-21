import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import apiClient from '../../services/ApiClient';
import SubscriptionService from '../../services/SubscriptionService';
import { ApiError } from '../../types/api';

// ✅ API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000'  // Android Emulator
  : 'https://keralaseller-backend.onrender.com';

// ✅ IMPORTANT: Replace with your actual Razorpay Key ID
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_ID'; // ⚠️ GET THIS FROM RAZORPAY DASHBOARD

console.log('🔧 Subscription API Base:', API_BASE_URL);

type SubscriptionScreenProps = {
  navigation: StackNavigationProp<any>;
};

// ✅ Interfaces
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

interface StoreStatus {
  subscription: {
    status: 'ACTIVE' | 'GRACE_PERIOD' | 'OFFLINE' | 'ARCHIVED';
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

// ✅ Helper: Status Icon
const getStatusIcon = (status: string): string => {
  const icons: { [key: string]: string } = {
    'ACTIVE': '🟢',
    'GRACE_PERIOD': '🟡',
    'OFFLINE': '🔴',
    'ARCHIVED': '⚫'
  };
  return icons[status] || '❓';
};

// ✅ ENHANCED CURRENT PLAN CARD (with Store Status)
const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ 
  subscription, 
  isLoading, 
  error, 
  onRefresh,
  storeId 
}) => {
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);

  const loadStoreStatus = useCallback(async () => {
    if (!storeId) return;
    
    setStatusLoading(true);
    try {
      const response = await apiClient.get(`/api/subscriptions/stores/${storeId}/status/`);
      setStoreStatus(response.data);
      console.log('✅ Store status loaded:', response.data);
    } catch (err) {
      console.error('❌ Failed to load store status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadStoreStatus();
    const interval = setInterval(loadStoreStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadStoreStatus]);

  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Ionicons name="alert-circle" size={32} color="#dc3545" />
        <Text style={styles.errorTitle}>Unable to load subscription</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={16} color="white" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!subscription || !subscription.is_active) {
    return (
      <View style={[styles.card, styles.noPlanCard]}>
        <Ionicons name="crown" size={32} color="#f59e0b" />
        <Text style={styles.noPlanTitle}>No Active Plan</Text>
        <Text style={styles.noPlanText}>
          Choose a plan below to unlock the full potential of your online store.
        </Text>
        
        {storeStatus && (
          <View style={styles.storeStatusInfo}>
            <View style={styles.statusDivider} />
            <Text style={styles.storeStatusTitle}>Store Status</Text>
            <View style={[
              styles.storeStatusBanner,
              storeStatus.subscription.can_sell ? styles.storeOnline : styles.storeOffline
            ]}>
              <Text style={styles.statusIcon}>
                {storeStatus.subscription.can_sell ? '🟢' : '🔴'}
              </Text>
              <Text style={styles.statusMessage}>
                {storeStatus.subscription.message}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  const remainingDays = subscription.days_remaining || 0;
  const isExpiringSoon = remainingDays <= 7;

  const getStatusStyle = () => {
    if (!storeStatus) return {};
    
    const status = storeStatus.subscription.status;
    switch (status) {
      case 'ACTIVE':
        return { backgroundColor: '#dcfce7', borderColor: '#22c55e' };
      case 'GRACE_PERIOD':
        return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
      case 'OFFLINE':
        return { backgroundColor: '#fee2e2', borderColor: '#ef4444' };
      case 'ARCHIVED':
        return { backgroundColor: '#f3f4f6', borderColor: '#6b7280' };
      default:
        return {};
    }
  };

  return (
    <View style={[
      styles.card,
      styles.currentPlanCard,
      isExpiringSoon && styles.expiringCard,
      getStatusStyle()
    ]}>
      <View style={styles.currentPlanHeader}>
        <View style={styles.currentPlanLeft}>
          <Text style={styles.currentPlanTitle}>Your Current Plan</Text>
          <Text style={styles.currentPlanName}>{subscription.plan.name}</Text>
        </View>
        <View style={styles.planIcon}>
          <Ionicons name="shield-checkmark" size={24} color="#4f46e5" />
        </View>
      </View>
      
      <View style={styles.currentPlanDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={20} color="#6b7280" />
          <Text style={[styles.detailText, isExpiringSoon && styles.expiringText]}>
            {remainingDays > 0 ? `${remainingDays} days remaining` : 'Expires today'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="cube" size={20} color="#6b7280" />
          <Text style={styles.detailText}>
            {subscription.plan.product_limit 
              ? `Up to ${subscription.plan.product_limit} products online` 
              : 'Unlimited products online'}
          </Text>
        </View>
      </View>
      
      {storeStatus && (
        <View style={styles.storeStatusSection}>
          <View style={styles.statusDivider} />
          <Text style={styles.storeStatusTitle}>Store Status</Text>
          
          <View style={[
            styles.storeStatusBanner,
            storeStatus.subscription.can_sell ? styles.storeOnline : styles.storeOffline
          ]}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(storeStatus.subscription.status)}
            </Text>
            <View style={styles.statusDetails}>
              <Text style={styles.statusMessage}>
                {storeStatus.subscription.message}
              </Text>
              <Text style={styles.orderStatus}>
                {storeStatus.subscription.can_sell 
                  ? '✅ Accepting Orders' 
                  : '❌ Orders Disabled'}
              </Text>
            </View>
            
            {storeStatus.subscription.status === 'OFFLINE' && 
             storeStatus.subscription.days_until_archive && 
             storeStatus.subscription.days_until_archive > 0 && (
              <View style={styles.archiveWarning}>
                <Text style={styles.archiveText}>
                  Archive in {storeStatus.subscription.days_until_archive} days
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={loadStoreStatus} 
            disabled={statusLoading}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={14} color="#374151" />
            <Text style={styles.refreshButtonText}>
              {statusLoading ? 'Updating...' : 'Refresh Status'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isExpiringSoon && (
        <View style={styles.expiringWarning}>
          <Ionicons name="alert-circle" size={16} color="#dc2626" />
          <Text style={styles.expiringWarningText}>
            Your plan expires soon. Renew to continue selling online.
          </Text>
        </View>
      )}
    </View>
  );
};

// ✅ MAIN SUBSCRIPTION SCREEN
const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<number | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: 'Subscription',
      headerRight: () => (
        <TouchableOpacity style={styles.headerRefreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#3b82f6" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadStoreId = useCallback(async () => {
    try {
      const response = await apiClient.get('/user/store/profile/');
      setStoreId(response.data.store_profile?.id || null);
      console.log('✅ Store ID loaded:', response.data.store_profile?.id);
    } catch (err) {
      console.error('❌ Failed to load store ID:', err);
    }
  }, []);

  const loadSubscriptionData = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      setSubscriptionError('');
      const response = await SubscriptionService.getCurrentSubscription();
      console.log('✅ Subscription data loaded');
      setCurrentSubscription(response.data);
    } catch (error: any) {
      console.log('⚠️ No active subscription found');
      setCurrentSubscription(null);
      const apiError = error as ApiError;
      if (apiError.response?.status === 401) {
        setSubscriptionError('Session expired. Please log in again.');
      } else if (apiError.response?.status !== 404) {
        setSubscriptionError('Failed to load subscription data');
      }
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const loadPlansData = useCallback(async () => {
    try {
      console.log('🔍 Fetching subscription plans...');
      const response = await SubscriptionService.getPlans();
      const plansData = response.data.results || response.data || [];
      const sortedPlans = plansData.sort((a: Plan, b: Plan) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return priceA - priceB;
      });
      setPlans(sortedPlans);
      console.log('📋 Processed plans:', sortedPlans.length);
    } catch (error) {
      console.error('❌ Failed to load plans:', error);
      setError('Failed to load subscription plans. Please refresh.');
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    await Promise.all([loadPlansData(), loadSubscriptionData(), loadStoreId()]);
    setIsLoading(false);
  }, [loadPlansData, loadSubscriptionData, loadStoreId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const handleChoosePlan = async (planId: number, planName: string) => {
    const plan = plans.find(p => p.id === planId);
    const basePrice = parseFloat(plan?.price || '0');
    const yearlyPrice = parseFloat(plan?.yearly_price || '') || (basePrice * 12 * 0.90);
    const displayPrice = billingCycle === 'yearly' ? yearlyPrice : basePrice;
    
    Alert.alert(
      'Choose Plan',
      `${planName}\n₹${Math.round(displayPrice).toLocaleString('en-IN')}/${billingCycle === 'yearly' ? 'year' : 'month'}\n\nDo you want to subscribe to this plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => processPlanSelection(planId, planName) }
      ]
    );
  };

  const processPlanSelection = async (planId: number, planName: string) => {
    setIsProcessing(planId);
    try {
      console.log('🔄 Creating order for plan:', planId, 'billing cycle:', billingCycle);
      const orderResponse = await SubscriptionService.createOrder({
        plan_id: planId,
        billing_cycle: billingCycle
      });
      console.log('✅ Order created:', orderResponse.data);
      
      const orderId = orderResponse.data.order_id;
      const amount = orderResponse.data.amount;
      
      // ✅ Open Razorpay directly
      openPaymentFlow(orderId, planName, amount, planId);
      
    } catch (error: any) {
      console.error('❌ Subscription error:', error.response?.data || error);
      const apiError = error as ApiError;
      if (apiError.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
      } else {
        const errorMessage = apiError.response?.data?.error ||
                           apiError.response?.data?.message ||
                           'Failed to process subscription. Please try again.';
        Alert.alert('Error', errorMessage);
      }
      setIsProcessing(null);
    }
  };

  // ✅ NEW: Direct Razorpay Payment
  const openPaymentFlow = async (orderId: string, planName: string, amount: number, planId: number) => {
    try {
      // Get user details for prefill
      const userResponse = await apiClient.get('/user/profile/');
      const userEmail = userResponse.data.email || 'seller@keralasellers.com';
      const userName = userResponse.data.name || 'Kerala Seller';
      const userPhone = userResponse.data.phone || '';

      const options = {
        description: `${planName} Subscription`,
        image: 'https://keralasellers.com/logo.png',
        currency: 'INR',
        key: RAZORPAY_KEY_ID, // ⚠️ Make sure this is set
        amount: amount,
        order_id: orderId,
        name: 'Kerala Sellers',
        prefill: {
          email: userEmail,
          contact: userPhone,
          name: userName,
        },
        theme: { color: '#3b82f6' },
      };

      console.log('🔐 Opening Razorpay with options:', options);

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          console.log('✅ Payment successful:', data);
          
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;

          try {
            const verifyResponse = await apiClient.post('/api/subscriptions/verify-payment/', {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              plan_id: planId,
              billing_cycle: billingCycle,
            });

            console.log('✅ Payment verified:', verifyResponse.data);

            await loadSubscriptionData();
            setIsProcessing(null);

            Alert.alert(
              'Payment Successful! 🎉',
              `Your ${planName} subscription is now active! You can now sell products online and access all premium features.`,
              [{ text: 'Great!', onPress: () => navigation.navigate('Dashboard') }]
            );

          } catch (verifyError: any) {
            console.error('❌ Payment verification failed:', verifyError);
            
            Alert.alert(
              'Verification Error',
              'Payment was successful, but verification failed. Please contact support with payment ID: ' + razorpay_payment_id,
              [{ text: 'OK', onPress: () => setIsProcessing(null) }]
            );
          }
        })
        .catch((error: any) => {
          console.error('❌ Razorpay error:', error);
          
          setIsProcessing(null);

          if (error.code === 2 || error.description === 'payment cancelled by user') {
            Alert.alert(
              'Payment Cancelled',
              'You cancelled the payment. Please try again when ready.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Payment Failed',
              error.description || 'Payment failed. Please try again.',
              [{ text: 'OK' }]
            );
          }
        });

    } catch (error) {
      console.error('❌ Payment flow error:', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Choose Your Plan</Text>
          <Text style={styles.welcomeSubtitle}>
            Unlock premium features and grow your online business
          </Text>
        </View>

        {error ? (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={16} color="#991b1b" />
            <Text style={styles.errorAlertText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Ionicons name="close" size={16} color="#991b1b" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, billingCycle === 'monthly' && styles.activeToggle]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.activeToggleText]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, billingCycle === 'yearly' && styles.activeToggle]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.activeToggleText]}>
              Yearly
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>Save 15%</Text>
            </View>
          </TouchableOpacity>
        </View>

        <CurrentPlanCard 
          subscription={currentSubscription}
          isLoading={subscriptionLoading}
          error={subscriptionError}
          onRefresh={loadSubscriptionData}
          storeId={storeId}
        />

        <View style={styles.plansContainer}>
          {plans.map((plan, index) => {
            const basePrice = parseFloat(plan.price) || 0;
            const yearlyPrice = parseFloat(plan.yearly_price || '') || (basePrice * 12 * 0.85);
            const displayPrice = billingCycle === 'yearly' ? yearlyPrice : basePrice;
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id && currentSubscription?.is_active === true;
            const isPopular = plan.name.toLowerCase().includes('pro') || 
                             plan.name.toLowerCase().includes('professional') ||
                             index === Math.floor(plans.length / 2);
            
            return (
              <View key={plan.id} style={[
                styles.card,
                isCurrentPlan && styles.currentPlanHighlight,
                isPopular && styles.popularCard
              ]}>
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="star" size={12} color="white" />
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      ₹{Math.round(displayPrice).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.duration}>
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </Text>
                  </View>
                  
                  {billingCycle === 'yearly' && (
                    <View style={styles.savings}>
                      <Text style={styles.savingsText}>
                        Billed as ₹{Math.round(yearlyPrice).toLocaleString('en-IN')} annually
                      </Text>
                      <Text style={styles.savingsAmount}>
                        Save ₹{Math.round((basePrice * 12) - yearlyPrice).toLocaleString('en-IN')} per year
                      </Text>
                    </View>
                  )}

                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}
                </View>
                
                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>
                      {plan.product_limit 
                        ? `${plan.product_limit} Online Products` 
                        : 'Unlimited Online Products'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>Unlimited Products for Stock Management</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>Professional Storefront</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>WhatsApp Integration</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>24/7 Customer Support</Text>
                  </View>
                  {isPopular && (
                    <>
                      <View style={styles.featureItem}>
                        <Ionicons name="flash" size={16} color="#f59e0b" />
                        <Text style={styles.featureText}>Priority Support</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Ionicons name="trending-up" size={16} color="#f59e0b" />
                        <Text style={styles.featureText}>Advanced Analytics</Text>
                      </View>
                    </>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.planButton,
                    isCurrentPlan && styles.currentPlanButton,
                    isProcessing === plan.id && styles.processingButton,
                    isPopular && !isCurrentPlan && styles.popularButton
                  ]}
                  onPress={() => handleChoosePlan(plan.id, plan.name)}
                  disabled={isProcessing === plan.id || isCurrentPlan}
                  activeOpacity={0.7}
                >
                  {isProcessing === plan.id ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.buttonText}>Processing...</Text>
                    </View>
                  ) : isCurrentPlan ? (
                    <View style={styles.buttonContent}>
                      <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
                      <Text style={[styles.buttonText, { color: '#6b7280' }]}>Current Plan</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="card" size={16} color={isPopular ? "white" : "#3b82f6"} />
                      <Text style={[styles.buttonText, { color: isPopular ? "white" : "#3b82f6" }]}>
                        Choose Plan
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Choose Kerala Sellers?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="storefront" size={20} color="#3b82f6" />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Professional Online Store</Text>
                <Text style={styles.benefitDesc}>Beautiful, mobile-optimized storefront</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>WhatsApp Integration</Text>
                <Text style={styles.benefitDesc}>Direct customer communication</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Secure & Reliable</Text>
                <Text style={styles.benefitDesc}>99.9% uptime guarantee</Text>
              </View>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="headset" size={20} color="#f59e0b" />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Local Support</Text>
                <Text style={styles.benefitDesc}>Kerala-based customer service</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ✅ COMPLETE STYLES (Same as before)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerRefreshButton: { padding: 8, marginRight: 8 },
  content: { flex: 1 },
  welcomeSection: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 24, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 14, color: '#6b7280' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: '#6b7280' },
  errorAlert: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fef2f2', paddingHorizontal: 20, paddingVertical: 16, marginHorizontal: 20, marginTop: 20, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444' },
  errorAlertText: { flex: 1, color: '#991b1b', fontSize: 14 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 6, borderRadius: 12, marginHorizontal: 20, marginTop: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  activeToggle: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  activeToggleText: { color: '#3b82f6', fontWeight: '600' },
  savingsBadge: { backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  savingsBadgeText: { color: 'white', fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 24, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  loadingCard: { alignItems: 'center', gap: 16 },
  errorCard: { backgroundColor: '#fef2f2', borderColor: '#ef4444', alignItems: 'center', gap: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#991b1b' },
  errorText: { color: '#991b1b', textAlign: 'center' },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  noPlanCard: { backgroundColor: '#fefce8', borderColor: '#f59e0b', alignItems: 'center', gap: 16 },
  noPlanTitle: { fontSize: 20, fontWeight: 'bold', color: '#92400e' },
  noPlanText: { color: '#92400e', textAlign: 'center', lineHeight: 20 },
  currentPlanCard: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  expiringCard: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  currentPlanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  currentPlanLeft: { flex: 1 },
  currentPlanTitle: { fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 4 },
  currentPlanName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  planIcon: { width: 40, height: 40, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  currentPlanDetails: { gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { fontSize: 14, color: '#374151' },
  expiringText: { color: '#dc2626', fontWeight: '600' },
  expiringWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 12, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 8 },
  expiringWarningText: { flex: 1, fontSize: 14, color: '#92400e' },
  storeStatusSection: { marginTop: 24, paddingTop: 24 },
  storeStatusInfo: { marginTop: 24, paddingTop: 24 },
  statusDivider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 16 },
  storeStatusTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  storeStatusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, marginBottom: 12 },
  storeOnline: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  storeOffline: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
  statusIcon: { fontSize: 20, marginRight: 12 },
  statusDetails: { flex: 1 },
  statusMessage: { fontSize: 14, fontWeight: '600', color: '#166534', marginBottom: 4 },
  orderStatus: { fontSize: 12, fontWeight: '500', color: '#166534', opacity: 0.8 },
  archiveWarning: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  archiveText: { fontSize: 12, fontWeight: '600', color: '#991b1b' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, alignSelf: 'flex-start' },
  refreshButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  plansContainer: { paddingBottom: 20 },
  currentPlanHighlight: { borderColor: '#3b82f6', borderWidth: 2, transform: [{ scale: 1.02 }] },
  popularCard: { borderColor: '#3b82f6', borderWidth: 2, transform: [{ scale: 1.02 }], position: 'relative' },
  popularBadge: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: '#3b82f6', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, zIndex: 1 },
  popularBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  planHeader: { alignItems: 'center', marginBottom: 24 },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#1f2937' },
  duration: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  savings: { alignItems: 'center', gap: 4, marginBottom: 8 },
  savingsText: { fontSize: 14, color: '#6b7280' },
  savingsAmount: { fontSize: 14, color: '#10b981', fontWeight: '600' },
  planDescription: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  featuresContainer: { marginBottom: 24, gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 14, color: '#374151' },
  planButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: 'white' },
  popularButton: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  currentPlanButton: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
  processingButton: { backgroundColor: '#f9fafb', borderColor: '#d1d5db' },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  benefitsSection: { backgroundColor: 'white', marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e5e7eb' },
  benefitsTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  benefitsList: { gap: 16 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitContent: { flex: 1 },
  benefitTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2 },
  benefitDesc: { fontSize: 12, color: '#6b7280' },
});

export default SubscriptionScreen;
