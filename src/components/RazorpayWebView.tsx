import React, { useRef, useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface RazorpayWebViewProps {
  visible: boolean;
  orderId: string;
  amount: number;
  keyId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  planName: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: (error: string) => void;
  onClose: () => void;
}

const RazorpayWebView: React.FC<RazorpayWebViewProps> = ({
  visible,
  orderId,
  amount,
  keyId,
  userEmail,
  userName,
  userPhone,
  planName,
  onSuccess,
  onFailure,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }
            .container {
                text-align: center;
                padding: 40px 30px;
                background: white;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 400px;
                width: 100%;
            }
            .logo {
                font-size: 64px;
                margin-bottom: 20px;
                animation: bounce 2s infinite;
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            h1 {
                color: #1f2937;
                font-size: 28px;
                margin-bottom: 8px;
                font-weight: 700;
            }
            .subtitle {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 24px;
            }
            .amount {
                font-size: 48px;
                font-weight: 800;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 20px 0;
            }
            .description {
                color: #374151;
                font-size: 18px;
                margin-bottom: 32px;
                font-weight: 600;
            }
            .pay-button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 18px 48px;
                font-size: 18px;
                font-weight: 700;
                border-radius: 50px;
                cursor: pointer;
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                width: 100%;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .pay-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
            }
            .pay-button:active {
                transform: translateY(0);
            }
            .secure {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af;
                font-size: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .features {
                margin: 24px 0;
                padding: 20px;
                background: #f9fafb;
                border-radius: 12px;
            }
            .feature {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 8px 0;
                color: #374151;
                font-size: 14px;
            }
            .check {
                color: #10b981;
                font-size: 18px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">💳</div>
            <h1>Secure Payment</h1>
            <div class="subtitle">Complete your subscription</div>
            <div class="amount">₹${(amount / 100).toFixed(2)}</div>
            <div class="description">${planName}</div>
            
            <div class="features">
                <div class="feature">
                    <span class="check">✓</span>
                    <span>100% Secure Payment</span>
                </div>
                <div class="feature">
                    <span class="check">✓</span>
                    <span>Instant Activation</span>
                </div>
                <div class="feature">
                    <span class="check">✓</span>
                    <span>Multiple Payment Options</span>
                </div>
            </div>
            
            <button class="pay-button" onclick="openRazorpay()">
                Pay Now
            </button>
            
            <div class="secure">
                🔒 Powered by Razorpay
            </div>
        </div>

        <script>
            function openRazorpay() {
                var options = {
                    key: "${keyId}",
                    amount: ${amount},
                    currency: "INR",
                    name: "Kerala Sellers",
                    description: "${planName}",
                    order_id: "${orderId}",
                    prefill: {
                        name: "${userName}",
                        email: "${userEmail}",
                        contact: "${userPhone}"
                    },
                    theme: {
                        color: "#667eea",
                        backdrop_color: "rgba(0,0,0,0.5)"
                    },
                    handler: function(response) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'success',
                            data: {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        }));
                    },
                    modal: {
                        ondismiss: function() {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'closed',
                                data: {}
                            }));
                        }
                    }
                };

                var razorpay = new Razorpay(options);
                
                razorpay.on('payment.failed', function(response) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'failure',
                        data: {
                            code: response.error.code,
                            description: response.error.description,
                            reason: response.error.reason
                        }
                    }));
                });

                razorpay.open();
            }
        </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      console.log('📩 WebView message:', message);
      
      switch (message.type) {
        case 'success':
          onSuccess(
            message.data.razorpay_payment_id,
            message.data.razorpay_order_id,
            message.data.razorpay_signature
          );
          break;
          
        case 'failure':
          onFailure(message.data.description || 'Payment failed');
          break;
          
        case 'closed':
          onClose();
          break;
      }
    } catch (error) {
      console.error('❌ Error parsing WebView message:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color="#ef4444" />
          </TouchableOpacity>
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading secure payment...</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  webview: {
    flex: 1,
  },
});

export default RazorpayWebView;
