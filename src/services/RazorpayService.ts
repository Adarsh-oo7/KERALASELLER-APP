// src/services/RazorpayService.ts
import RazorpayCheckout from 'react-native-razorpay';
import { api } from '../config/api';

interface PaymentOptions {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  keyId: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
}

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  
  /**
   * ✅ Get Razorpay Key ID from backend
   */
  private async getRazorpayKeyId(): Promise<string> {
    try {
      // Get from your backend configuration
      const config = await api.get('/api/payments/razorpay-config/', true, { useCache: true });
      return config.key_id;
    } catch (error) {
      console.error('❌ Failed to get Razorpay key:', error);
      // Fallback - you can hardcode test key for now
      return 'rzp_test_YOUR_TEST_KEY'; // Replace with your test key
    }
  }
  
  /**
   * ✅ Create subscription order on backend
   */
  async createSubscriptionOrder(planId: number) {
    try {
      console.log('💳 Creating subscription order for plan:', planId);
      
      const response = await api.post('/api/subscriptions/create-order/', {
        plan_id: planId,
      }, true);
      
      console.log('✅ Order created:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      throw error;
    }
  }
  
  /**
   * ✅ Open Razorpay payment UI (INSIDE APP)
   */
  async openPaymentGateway(options: PaymentOptions): Promise<PaymentResponse> {
    try {
      console.log('🚀 Opening Razorpay payment gateway...');
      console.log('📋 Payment options:', {
        amount: options.amount,
        currency: options.currency,
        order_id: options.orderId,
      });
      
      const razorpayOptions = {
        description: options.description,
        image: 'https://api.keralasellers.in/static/logo.png', // Your logo URL
        currency: options.currency,
        key: options.keyId,
        amount: options.amount, // Amount in paise (₹99 = 9900 paise)
        name: options.name,
        order_id: options.orderId,
        prefill: {
          email: options.prefill?.email || '',
          contact: options.prefill?.contact || '',
          name: options.prefill?.name || '',
        },
        theme: { 
          color: '#2E7D32', // Kerala Sellers green
          hide_topbar: false,
        },
        modal: {
          ondismiss: () => {
            console.log('⚠️ Payment modal closed');
          }
        }
      };
      
      console.log('🎨 Razorpay options configured');
      
      // ✅ Opens Razorpay payment UI INSIDE your app
      const data = await RazorpayCheckout.open(razorpayOptions);
      
      console.log('✅ Payment successful!');
      console.log('📋 Payment data:', {
        payment_id: data.razorpay_payment_id,
        order_id: data.razorpay_order_id,
      });
      
      return data as PaymentResponse;
      
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      
      // Handle specific error codes
      if (error.code === RazorpayCheckout.PAYMENT_CANCELLED) {
        console.log('⚠️ Payment cancelled by user');
        throw new Error('PAYMENT_CANCELLED');
      }
      
      if (error.code === RazorpayCheckout.NETWORK_ERROR) {
        console.log('⚠️ Network error during payment');
        throw new Error('NETWORK_ERROR');
      }
      
      throw error;
    }
  }
  
  /**
   * ✅ Verify payment on backend
   */
  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    try {
      console.log('🔐 Verifying payment...');
      console.log('📋 Verification data:', {
        payment_id: paymentId,
        order_id: orderId,
      });
      
      const response = await api.post('/api/subscriptions/verify-payment/', {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      }, true);
      
      console.log('✅ Payment verified successfully!');
      return response;
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      throw error;
    }
  }
  
  /**
   * ✅ Complete subscription purchase flow
   */
  async purchaseSubscription(planId: number, userDetails: { email: string; phone: string; name: string }) {
    try {
      console.log('🛒 Starting subscription purchase...');
      
      // Step 1: Create order on backend
      console.log('📝 Step 1: Creating order...');
      const order = await this.createSubscriptionOrder(planId);
      
      // Step 2: Get Razorpay Key ID
      console.log('🔑 Step 2: Getting Razorpay key...');
      const keyId = await this.getRazorpayKeyId();
      
      // Step 3: Open Razorpay payment UI
      console.log('💳 Step 3: Opening payment gateway...');
      const payment = await this.openPaymentGateway({
        orderId: order.order_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Kerala Sellers',
        description: `${order.plan_name} Plan - ${order.duration_days} days`,
        keyId: keyId,
        prefill: {
          email: userDetails.email,
          contact: userDetails.phone,
          name: userDetails.name,
        },
      });
      
      // Step 4: Verify payment on backend
      console.log('✅ Step 4: Verifying payment...');
      const verification = await this.verifyPayment(
        payment.razorpay_payment_id,
        payment.razorpay_order_id,
        payment.razorpay_signature
      );
      
      console.log('🎉 Subscription activated successfully!');
      return {
        success: true,
        subscription: verification,
        payment_id: payment.razorpay_payment_id,
      };
      
    } catch (error: any) {
      console.error('❌ Subscription purchase failed:', error);
      
      if (error.message === 'PAYMENT_CANCELLED') {
        throw new Error('Payment was cancelled');
      }
      
      if (error.message === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }
}

export default new RazorpayService();
