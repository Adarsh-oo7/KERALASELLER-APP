import React, { useRef, useState } from 'react';
import {
  Modal, View, StyleSheet, ActivityIndicator,
  TouchableOpacity, Text, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface RazorpayWebViewProps {
  visible: boolean;
  orderId: string;
  amount: number;        // in PAISE from backend
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
  visible, orderId, amount, keyId,
  userEmail, userName, userPhone, planName,
  onSuccess, onFailure, onClose,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // Sanitize phone — Razorpay needs 10 digits, no +91 or spaces
  const cleanPhone = (userPhone || '').replace(/\D/g, '').slice(-10);

  // Amount display (amount prop is already in paise)
  const displayAmount = `₹${Math.round(amount / 100).toLocaleString('en-IN')}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <meta http-equiv="Content-Security-Policy"
        content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f1f5f9;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 20px;
          padding: 32px 24px;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          text-align: center;
        }
        .icon-wrap {
          width: 72px; height: 72px;
          background: #eff6ff;
          border-radius: 36px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          font-size: 36px;
        }
        h1 { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 6px; }
        .plan { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
        .amount-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .amount-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .amount { font-size: 36px; font-weight: 900; color: #1d4ed8; }
        .features { text-align: left; margin-bottom: 28px; display: flex; flex-direction: column; gap: 10px; }
        .feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #374151; }
        .feature-icon {
          width: 24px; height: 24px; background: #f0fdf4;
          border-radius: 6px; display: flex; align-items: center;
          justify-content: center; font-size: 13px; flex-shrink: 0;
        }
        .pay-btn {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 16px;
          font-size: 16px;
          font-weight: 800;
          border-radius: 12px;
          cursor: pointer;
          letter-spacing: 0.5px;
        }
        .pay-btn:active { opacity: 0.9; transform: scale(0.99); }
        .secure {
          margin-top: 16px;
          font-size: 12px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .error-box {
          display: none;
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 10px;
          padding: 14px;
          margin-top: 16px;
          font-size: 13px;
          color: #dc2626;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-wrap">💳</div>
        <h1>Secure Payment</h1>
        <p class="plan">${planName} Subscription</p>

        <div class="amount-box">
          <div class="amount-label">Amount to Pay</div>
          <div class="amount">${displayAmount}</div>
        </div>

        <div class="features">
          <div class="feature">
            <div class="feature-icon">✓</div>
            <span>Instant activation on payment</span>
          </div>
          <div class="feature">
            <div class="feature-icon">🔒</div>
            <span>256-bit SSL encrypted payment</span>
          </div>
          <div class="feature">
            <div class="feature-icon">🏦</div>
            <span>UPI, Cards, Net Banking & more</span>
          </div>
        </div>

        <button class="pay-btn" onclick="openRazorpay()" id="payBtn">
          Pay ${displayAmount}
        </button>

        <div class="secure">🔒 Powered by Razorpay</div>
        <div class="error-box" id="errorBox"></div>
      </div>

      <script>
        // Auto-open on load for smoother UX
        window.onload = function() {
          setTimeout(openRazorpay, 500);
        };

        function showError(msg) {
          var box = document.getElementById('errorBox');
          box.style.display = 'block';
          box.textContent = '⚠️ ' + msg;
          document.getElementById('payBtn').textContent = 'Retry Payment';
        }

        function openRazorpay() {
          if (typeof Razorpay === 'undefined') {
            showError('Payment gateway failed to load. Please check your internet connection.');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'failure',
              data: { description: 'Razorpay script failed to load. Check internet connection.' }
            }));
            return;
          }

          document.getElementById('payBtn').textContent = 'Opening...';
          document.getElementById('payBtn').disabled = true;

          var options = {
            key: "${keyId}",
            amount: ${amount},
            currency: "INR",
            name: "Kerala Sellers",
            description: "${planName}",
            order_id: "${orderId}",
            prefill: {
              name: "${userName.replace(/"/g, '\\"')}",
              email: "${userEmail}",
              contact: "${cleanPhone}"
            },
            notes: {
              plan_name: "${planName}"
            },
            theme: { color: "#3b82f6" },
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
                document.getElementById('payBtn').textContent = 'Pay ${displayAmount}';
                document.getElementById('payBtn').disabled = false;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'closed',
                  data: {}
                }));
              },
              escape: false,
              animation: true
            }
          };

          try {
            var rzp = new Razorpay(options);

            rzp.on('payment.failed', function(response) {
              var desc = response.error.description || response.error.reason || 'Payment failed';
              showError(desc);
              document.getElementById('payBtn').disabled = false;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'failure',
                data: {
                  code: response.error.code,
                  description: desc,
                  reason: response.error.reason,
                  step: response.error.step,
                  source: response.error.source
                }
              }));
            });

            rzp.open();
          } catch(e) {
            showError('Failed to initialize payment: ' + e.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'failure',
              data: { description: 'Razorpay init error: ' + e.message }
            }));
          }
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      console.log('💳 Razorpay message:', JSON.stringify(msg));

      switch (msg.type) {
        case 'success':
          onSuccess(
            msg.data.razorpay_payment_id,
            msg.data.razorpay_order_id,
            msg.data.razorpay_signature,
          );
          break;
        case 'failure':
          console.log('❌ Payment failure detail:', msg.data);
          onFailure(msg.data.description || 'Payment failed. Please try again.');
          break;
        case 'closed':
          onClose();
          break;
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.screen}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerIcon}>
              <Ionicons name="card-outline" size={18} color="#3b82f6" />
            </View>
            <View>
              <Text style={s.headerTitle}>Complete Payment</Text>
              <Text style={s.headerSub}>{planName}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Loading overlay */}
        {loading && (
          <View style={s.loadingOverlay}>
            <View style={s.loadingCard}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={s.loadingTitle}>Loading Payment</Text>
              <Text style={s.loadingSub}>Connecting to secure gateway...</Text>
            </View>
          </View>
        )}

        {/* Error state */}
        {!!pageError && (
          <View style={s.errorWrap}>
            <Ionicons name="wifi-outline" size={36} color="#dc2626" />
            <Text style={s.errorTitle}>Failed to load payment</Text>
            <Text style={s.errorSub}>{pageError}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => { setPageError(''); setLoading(true); webViewRef.current?.reload(); }}>
              <Ionicons name="refresh-outline" size={15} color="white" />
              <Text style={s.retryBtnText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelLink} onPress={onClose}>
              <Text style={s.cancelLinkText}>Cancel Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WebView */}
        {!pageError && (
          <WebView
            ref={webViewRef}
            // ✅ baseUrl is CRITICAL — allows external scripts in inline HTML
            source={{ html: htmlContent, baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => {
              console.error('WebView error:', e.nativeEvent);
              setLoading(false);
              setPageError('Payment page failed to load. Check your internet connection.');
            }}
            onHttpError={(e) => {
              console.error('HTTP error:', e.nativeEvent.statusCode, e.nativeEvent.url);
            }}
            style={s.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            // ✅ Required for Android to load external scripts
            mixedContentMode="always"
            // ✅ Allow all origins
            originWhitelist={['*']}
            // ✅ Allow popups Razorpay uses for UPI/bank redirects
            setSupportMultipleWindows={false}
            allowsInlineMediaPlayback={true}
            startInLoadingState={false}
            // ✅ Android: allow file access for certain payment methods
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
          />
        )}
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: '#f1f5f9' },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 15, fontWeight: '800', color: '#111827' },
  headerSub:      { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loadingCard:    { backgroundColor: 'white', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, width: 220 },
  loadingTitle:   { fontSize: 15, fontWeight: '800', color: '#111827' },
  loadingSub:     { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  errorWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorTitle:     { fontSize: 17, fontWeight: '800', color: '#111827' },
  errorSub:       { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  retryBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText:   { fontSize: 14, fontWeight: '700', color: 'white' },
  cancelLink:     { paddingVertical: 8 },
  cancelLinkText: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },

  webview:        { flex: 1 },
});

export default RazorpayWebView;
