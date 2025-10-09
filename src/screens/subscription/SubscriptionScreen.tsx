import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscriptionService from '../../services/SubscriptionService';
import { ApiError } from '../../types/api';

type SubscriptionScreenProps = {
  navigation: StackNavigationProp<any>;
};

// ✅ REAL interfaces matching your Django API
interface Plan {
  id: number;
  name: string;
  price: string; // From Django Decimal field
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

interface CurrentPlanCardProps {
  subscription: CurrentSubscription | null;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
}

// ✅ CURRENT PLAN CARD COMPONENT
const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ 
  subscription, 
  isLoading, 
  error, 
  onRefresh 
}) => {
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
      </View>
    );
  }

  // ✅ REAL calculations from your Django API
  const remainingDays = subscription.days_remaining;
  const isExpiringSoon = remainingDays <= 7;

  return (
    <View style={[
      styles.card,
      styles.currentPlanCard,
      isExpiringSoon && styles.expiringCard
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
          <Text style={[
            styles.detailText,
            isExpiringSoon && styles.expiringText
          ]}>
            {remainingDays > 0 
              ? `${remainingDays} days remaining` 
              : 'Expires today'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="cube" size={20} color="#6b7280" />
          <Text style={styles.detailText}>
            {subscription.plan.product_limit 
              ? `Up to ${subscription.plan.product_limit} products online` 
              : 'Unlimited products online'
            }
          </Text>
        </View>
      </View>
      
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

// ✅ MAIN SUBSCRIPTION SCREEN COMPONENT (No Custom Header)
const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  // ✅ STATE MANAGEMENT
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Configure header with refresh button using React Navigation
  useEffect(() => {
    navigation.setOptions({
      title: 'Subscription',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerRefreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color="#3b82f6" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // ✅ Load REAL subscription data from your Django API
  const loadSubscriptionData = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      setSubscriptionError('');
      
      const response = await SubscriptionService.getCurrentSubscription();
      console.log('✅ REAL subscription data:', JSON.stringify(response.data, null, 2));
      setCurrentSubscription(response.data);
      
    } catch (error: any) {
      console.log('⚠️ No active subscription found:', error.response?.data);
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

  // ✅ Load REAL plans data from your Django API
  const loadPlansData = useCallback(async () => {
    try {
      console.log('🔍 Fetching REAL subscription plans...');
      const response = await SubscriptionService.getPlans();
      console.log('✅ REAL plans response:', JSON.stringify(response.data, null, 2));
      
      // Your Django API returns plans directly or in results
      const plansData = response.data.results || response.data || [];
      
      // Sort plans by price (lowest first)
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

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    await Promise.all([
      loadPlansData(),
      loadSubscriptionData()
    ]);
    
    setIsLoading(false);
  }, [loadPlansData, loadSubscriptionData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  // ✅ Handle REAL plan selection with your Django API
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
        {
          text: 'Continue',
          onPress: () => processPlanSelection(planId, planName)
        }
      ]
    );
  };

  const processPlanSelection = async (planId: number, planName: string) => {
    setIsProcessing(planId);
    
    try {
      console.log('🔄 Creating REAL order for plan:', planId, 'billing cycle:', billingCycle);
      
      // ✅ Create order using your Django API
      const orderResponse = await SubscriptionService.createOrder({
        plan_id: planId,
        billing_cycle: billingCycle
      });

      console.log('✅ REAL order created:', JSON.stringify(orderResponse.data, null, 2));
      const orderData = orderResponse.data;
      
      // ✅ Your Django API returns these fields
      const orderId = orderData.order_id;
      const amount = orderData.amount; // Already in paise from Django
      const currency = orderData.currency || 'INR';
      
      // Show payment confirmation
      Alert.alert(
        'Payment Required 💳',
        `Plan: ${planName}\nAmount: ₹${Math.round(amount / 100).toLocaleString('en-IN')}\nOrder ID: ${orderId}\n\nProceed to secure payment?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(null) },
          {
            text: 'Pay Now',
            onPress: () => openPaymentFlow(orderId, planName, amount, planId)
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ REAL subscription error:', error.response?.data || error);
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

  const openPaymentFlow = async (orderId: string, planName: string, amount: number, planId: number) => {
    try {
      // Get user token for authentication
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again');
        setIsProcessing(null);
        return;
      }

      // ✅ Create proper payment URL with all required parameters
      const paymentUrl = `http://192.168.1.4:8000/payment/subscription/?order_id=${orderId}&plan_id=${planId}&billing_cycle=${billingCycle}&token=${encodeURIComponent(token)}`;
      
      console.log('🔗 Opening payment URL:', paymentUrl);
      
      Alert.alert(
        'Complete Payment 🔐',
        `You will be redirected to a secure Razorpay payment page.\n\nPlan: ${planName}\nAmount: ₹${Math.round(amount / 100).toLocaleString('en-IN')}\n\nAfter successful payment, return to the app to see your active subscription.`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsProcessing(null)
          },
          {
            text: 'Open Payment Page',
            onPress: async () => {
              try {
                const supported = await Linking.canOpenURL(paymentUrl);
                
                if (supported) {
                  await Linking.openURL(paymentUrl);
                  
                  // Set up payment result polling
                  setTimeout(() => {
                    pollPaymentResult(orderId, planId);
                  }, 5000);
                  
                } else {
                  throw new Error('Cannot open payment URL');
                }
              } catch (linkingError) {
                console.error('❌ Linking error:', linkingError);
                Alert.alert(
                  'Payment Information',
                  `Please copy this payment link and open it in your browser:\n\n${paymentUrl}\n\nOrder ID: ${orderId}\nPlan: ${planName}\nAmount: ₹${Math.round(amount / 100).toLocaleString('en-IN')}`,
                  [
                    { text: 'OK', onPress: () => setIsProcessing(null) }
                  ]
                );
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Payment flow error:', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
      setIsProcessing(null);
    }
  };

  const pollPaymentResult = async (orderId: string, planId: number, attempts = 0) => {
    if (attempts >= 12) { // Stop polling after 1 minute (5s * 12 = 60s)
      setIsProcessing(null);
      Alert.alert(
        'Payment Status Unknown',
        'We couldn\'t verify your payment automatically. Please check your subscription status or contact support if payment was made.',
        [
          {
            text: 'Check Status',
            onPress: () => {
              loadSubscriptionData();
              setIsProcessing(null);
            }
          }
        ]
      );
      return;
    }

    try {
      console.log(`🔍 Polling payment result (attempt ${attempts + 1})...`);
      
      // Check subscription status to see if payment was successful
      const response = await SubscriptionService.getCurrentSubscription();
      
      if (response.data && response.data.is_active && response.data.razorpay_order_id === orderId) {
        // Payment was successful!
        console.log('✅ Payment verification successful!');
        
        setCurrentSubscription(response.data);
        setIsProcessing(null);
        
        Alert.alert(
          'Payment Successful! 🎉',
          `Your ${response.data.plan.name} subscription is now active! You can now sell products online and access all premium features.`,
          [
            {
              text: 'Great!',
              onPress: () => {
                // Navigate to dashboard tab
                navigation.navigate('Dashboard');
              }
            }
          ]
        );
        
        return;
      }
      
      // Continue polling
      setTimeout(() => {
        pollPaymentResult(orderId, planId, attempts + 1);
      }, 5000);
      
    } catch (error) {
      console.log(`⚠️ Poll attempt ${attempts + 1} failed, continuing...`);
      
      // Continue polling even if individual attempts fail
      setTimeout(() => {
        pollPaymentResult(orderId, planId, attempts + 1);
      }, 5000);
    }
  };

  // ✅ LOADING STATE (No Custom Header)
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

  // ✅ MAIN RENDER (Uses Default Navigation Header)
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Choose Your Plan</Text>
          <Text style={styles.welcomeSubtitle}>
            Unlock premium features and grow your online business
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorAlert}>
            <Ionicons name="alert-circle" size={16} color="#991b1b" />
            <Text style={styles.errorAlertText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')}>
              <Ionicons name="close" size={16} color="#991b1b" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Billing Cycle Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[
              styles.toggleButton,
              billingCycle === 'monthly' && styles.activeToggle
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[
              styles.toggleText,
              billingCycle === 'monthly' && styles.activeToggleText
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.toggleButton,
              billingCycle === 'yearly' && styles.activeToggle
            ]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text style={[
              styles.toggleText,
              billingCycle === 'yearly' && styles.activeToggleText
            ]}>
              Yearly
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>Save 15%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Current Plan Card */}
        <CurrentPlanCard 
          subscription={currentSubscription}
          isLoading={subscriptionLoading}
          error={subscriptionError}
          onRefresh={loadSubscriptionData}
        />

        {/* Plans Grid - REAL DATA from Django */}
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => {
            // ✅ REAL price calculations from Django API
            const basePrice = parseFloat(plan.price) || 0;
            const yearlyPrice = parseFloat(plan.yearly_price || '') || (basePrice * 12 * 0.85);
            const displayPrice = billingCycle === 'yearly' ? yearlyPrice : basePrice;
            
            // ✅ REAL subscription comparison
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id && 
                                 currentSubscription?.is_active === true;
            
            // ✅ REAL popularity check
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
                
                {/* ✅ REAL features */}
                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>
                      {plan.product_limit 
                        ? `${plan.product_limit} Online Products` 
                        : 'Unlimited Online Products'
                      }
                    </Text>
                  </View>
                  
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>
                      Unlimited Products for Stock Management
                    </Text>
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
                      <Text style={[
                        styles.buttonText,
                        { color: isPopular ? "white" : "#3b82f6" }
                      ]}>
                        Choose Plan
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ✅ Benefits Section */}
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

// ✅ COMPLETE STYLES (Uses Default Navigation Header)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // ✅ Header button for React Navigation
  headerRefreshButton: {
    padding: 8,
    marginRight: 8,
  },
  
  content: {
    flex: 1,
  },
  
  // ✅ Welcome Section
  welcomeSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorAlertText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 6,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeToggle: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeToggleText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  savingsBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingCard: {
    alignItems: 'center',
    gap: 16,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    alignItems: 'center',
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#991b1b',
  },
  errorText: {
    color: '#991b1b',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noPlanCard: {
    backgroundColor: '#fefce8',
    borderColor: '#f59e0b',
    alignItems: 'center',
    gap: 16,
  },
  noPlanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400e',
  },
  noPlanText: {
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 20,
  },
  currentPlanCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  expiringCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  currentPlanLeft: {
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  planIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanDetails: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  expiringText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  expiringWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
  },
  expiringWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
  },
  plansContainer: {
    paddingBottom: 20,
  },
  currentPlanHighlight: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  popularCard: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  duration: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  savings: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  savingsAmount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'white',
  },
  popularButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  currentPlanButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  processingButton: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  // ✅ Benefits section styles
  benefitsSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default SubscriptionScreen;
