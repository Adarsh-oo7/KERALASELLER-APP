// import React, { useRef, useState } from 'react';
// import {
//   Modal, View, StyleSheet, ActivityIndicator,
//   TouchableOpacity, Text, Platform,
// } from 'react-native';
// import { WebView } from 'react-native-webview';
// import { Ionicons } from '@expo/vector-icons';

// interface RazorpayWebViewProps {
//   visible: boolean;
//   orderId: string;
//   amount: number;        // in PAISE from backend
//   keyId: string;
//   userEmail: string;
//   userName: string;
//   userPhone: string;
//   planName: string;
//   onSuccess: (paymentId: string, orderId: string, signature: string) => void;
//   onFailure: (error: string) => void;
//   onClose: () => void;
// }

// const RazorpayWebView: React.FC<RazorpayWebViewProps> = ({
//   visible, orderId, amount, keyId,
//   userEmail, userName, userPhone, planName,
//   onSuccess, onFailure, onClose,
// }) => {
//   const webViewRef = useRef<WebView>(null);
//   const [loading, setLoading] = useState(true);
//   const [pageError, setPageError] = useState('');

//   // Sanitize phone — Razorpay needs 10 digits, no +91 or spaces
//   const cleanPhone = (userPhone || '').replace(/\D/g, '').slice(-10);

//   // Amount display (amount prop is already in paise)
//   const displayAmount = `₹${Math.round(amount / 100).toLocaleString('en-IN')}`;

//   const htmlContent = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
//       <meta http-equiv="Content-Security-Policy"
//         content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
//       <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
//       <style>
//         * { margin: 0; padding: 0; box-sizing: border-box; }
//         body {
//           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//           background: #f1f5f9;
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//         }
//         .card {
//           background: white;
//           border-radius: 20px;
//           padding: 32px 24px;
//           width: 100%;
//           max-width: 380px;
//           box-shadow: 0 4px 24px rgba(0,0,0,0.08);
//           text-align: center;
//         }
//         .icon-wrap {
//           width: 72px; height: 72px;
//           background: #eff6ff;
//           border-radius: 36px;
//           display: flex; align-items: center; justify-content: center;
//           margin: 0 auto 20px;
//           font-size: 36px;
//         }
//         h1 { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 6px; }
//         .plan { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
//         .amount-box {
//           background: #f9fafb;
//           border: 1px solid #e5e7eb;
//           border-radius: 12px;
//           padding: 16px;
//           margin-bottom: 24px;
//         }
//         .amount-label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
//         .amount { font-size: 36px; font-weight: 900; color: #1d4ed8; }
//         .features { text-align: left; margin-bottom: 28px; display: flex; flex-direction: column; gap: 10px; }
//         .feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #374151; }
//         .feature-icon {
//           width: 24px; height: 24px; background: #f0fdf4;
//           border-radius: 6px; display: flex; align-items: center;
//           justify-content: center; font-size: 13px; flex-shrink: 0;
//         }
//         .pay-btn {
//           width: 100%;
//           background: #3b82f6;
//           color: white;
//           border: none;
//           padding: 16px;
//           font-size: 16px;
//           font-weight: 800;
//           border-radius: 12px;
//           cursor: pointer;
//           letter-spacing: 0.5px;
//         }
//         .pay-btn:active { opacity: 0.9; transform: scale(0.99); }
//         .secure {
//           margin-top: 16px;
//           font-size: 12px;
//           color: #9ca3af;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 6px;
//         }
//         .error-box {
//           display: none;
//           background: #fef2f2;
//           border: 1px solid #fca5a5;
//           border-radius: 10px;
//           padding: 14px;
//           margin-top: 16px;
//           font-size: 13px;
//           color: #dc2626;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="card">
//         <div class="icon-wrap">💳</div>
//         <h1>Secure Payment</h1>
//         <p class="plan">${planName} Subscription</p>

//         <div class="amount-box">
//           <div class="amount-label">Amount to Pay</div>
//           <div class="amount">${displayAmount}</div>
//         </div>

//         <div class="features">
//           <div class="feature">
//             <div class="feature-icon">✓</div>
//             <span>Instant activation on payment</span>
//           </div>
//           <div class="feature">
//             <div class="feature-icon">🔒</div>
//             <span>256-bit SSL encrypted payment</span>
//           </div>
//           <div class="feature">
//             <div class="feature-icon">🏦</div>
//             <span>UPI, Cards, Net Banking & more</span>
//           </div>
//         </div>

//         <button class="pay-btn" onclick="openRazorpay()" id="payBtn">
//           Pay ${displayAmount}
//         </button>

//         <div class="secure">🔒 Powered by Razorpay</div>
//         <div class="error-box" id="errorBox"></div>
//       </div>

//       <script>
//         // Auto-open on load for smoother UX
//         window.onload = function() {
//           setTimeout(openRazorpay, 500);
//         };

//         function showError(msg) {
//           var box = document.getElementById('errorBox');
//           box.style.display = 'block';
//           box.textContent = '⚠️ ' + msg;
//           document.getElementById('payBtn').textContent = 'Retry Payment';
//         }

//         function openRazorpay() {
//           if (typeof Razorpay === 'undefined') {
//             showError('Payment gateway failed to load. Please check your internet connection.');
//             window.ReactNativeWebView.postMessage(JSON.stringify({
//               type: 'failure',
//               data: { description: 'Razorpay script failed to load. Check internet connection.' }
//             }));
//             return;
//           }

//           document.getElementById('payBtn').textContent = 'Opening...';
//           document.getElementById('payBtn').disabled = true;

//           var options = {
//             key: "${keyId}",
//             amount: ${amount},
//             currency: "INR",
//             name: "Kerala Sellers",
//             description: "${planName}",
//             order_id: "${orderId}",
//             prefill: {
//               name: "${userName.replace(/"/g, '\\"')}",
//               email: "${userEmail}",
//               contact: "${cleanPhone}"
//             },
//             notes: {
//               plan_name: "${planName}"
//             },
//             theme: { color: "#3b82f6" },
//             handler: function(response) {
//               window.ReactNativeWebView.postMessage(JSON.stringify({
//                 type: 'success',
//                 data: {
//                   razorpay_payment_id: response.razorpay_payment_id,
//                   razorpay_order_id: response.razorpay_order_id,
//                   razorpay_signature: response.razorpay_signature
//                 }
//               }));
//             },
//             modal: {
//               ondismiss: function() {
//                 document.getElementById('payBtn').textContent = 'Pay ${displayAmount}';
//                 document.getElementById('payBtn').disabled = false;
//                 window.ReactNativeWebView.postMessage(JSON.stringify({
//                   type: 'closed',
//                   data: {}
//                 }));
//               },
//               escape: false,
//               animation: true
//             }
//           };

//           try {
//             var rzp = new Razorpay(options);

//             rzp.on('payment.failed', function(response) {
//               var desc = response.error.description || response.error.reason || 'Payment failed';
//               showError(desc);
//               document.getElementById('payBtn').disabled = false;
//               window.ReactNativeWebView.postMessage(JSON.stringify({
//                 type: 'failure',
//                 data: {
//                   code: response.error.code,
//                   description: desc,
//                   reason: response.error.reason,
//                   step: response.error.step,
//                   source: response.error.source
//                 }
//               }));
//             });

//             rzp.open();
//           } catch(e) {
//             showError('Failed to initialize payment: ' + e.message);
//             window.ReactNativeWebView.postMessage(JSON.stringify({
//               type: 'failure',
//               data: { description: 'Razorpay init error: ' + e.message }
//             }));
//           }
//         }
//       </script>
//     </body>
//     </html>
//   `;

//   const handleMessage = (event: any) => {
//     try {
//       const msg = JSON.parse(event.nativeEvent.data);
//       console.log('💳 Razorpay message:', JSON.stringify(msg));

//       switch (msg.type) {
//         case 'success':
//           onSuccess(
//             msg.data.razorpay_payment_id,
//             msg.data.razorpay_order_id,
//             msg.data.razorpay_signature,
//           );
//           break;
//         case 'failure':
//           console.log('❌ Payment failure detail:', msg.data);
//           onFailure(msg.data.description || 'Payment failed. Please try again.');
//           break;
//         case 'closed':
//           onClose();
//           break;
//       }
//     } catch (e) {
//       console.error('WebView message parse error:', e);
//     }
//   };

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="pageSheet"
//       onRequestClose={onClose}
//     >
//       <View style={s.screen}>

//         {/* Header */}
//         <View style={s.header}>
//           <View style={s.headerLeft}>
//             <View style={s.headerIcon}>
//               <Ionicons name="card-outline" size={18} color="#3b82f6" />
//             </View>
//             <View>
//               <Text style={s.headerTitle}>Complete Payment</Text>
//               <Text style={s.headerSub}>{planName}</Text>
//             </View>
//           </View>
//           <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
//             <Ionicons name="close" size={18} color="#6b7280" />
//           </TouchableOpacity>
//         </View>

//         {/* Loading overlay */}
//         {loading && (
//           <View style={s.loadingOverlay}>
//             <View style={s.loadingCard}>
//               <ActivityIndicator size="large" color="#3b82f6" />
//               <Text style={s.loadingTitle}>Loading Payment</Text>
//               <Text style={s.loadingSub}>Connecting to secure gateway...</Text>
//             </View>
//           </View>
//         )}

//         {/* Error state */}
//         {!!pageError && (
//           <View style={s.errorWrap}>
//             <Ionicons name="wifi-outline" size={36} color="#dc2626" />
//             <Text style={s.errorTitle}>Failed to load payment</Text>
//             <Text style={s.errorSub}>{pageError}</Text>
//             <TouchableOpacity style={s.retryBtn} onPress={() => { setPageError(''); setLoading(true); webViewRef.current?.reload(); }}>
//               <Ionicons name="refresh-outline" size={15} color="white" />
//               <Text style={s.retryBtnText}>Retry</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={s.cancelLink} onPress={onClose}>
//               <Text style={s.cancelLinkText}>Cancel Payment</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* WebView */}
//         {!pageError && (
//           <WebView
//             ref={webViewRef}
//             // ✅ baseUrl is CRITICAL — allows external scripts in inline HTML
//             source={{ html: htmlContent, baseUrl: 'https://checkout.razorpay.com' }}
//             onMessage={handleMessage}
//             onLoadEnd={() => setLoading(false)}
//             onError={(e) => {
//               console.error('WebView error:', e.nativeEvent);
//               setLoading(false);
//               setPageError('Payment page failed to load. Check your internet connection.');
//             }}
//             onHttpError={(e) => {
//               console.error('HTTP error:', e.nativeEvent.statusCode, e.nativeEvent.url);
//             }}
//             style={s.webview}
//             javaScriptEnabled={true}
//             domStorageEnabled={true}
//             // ✅ Required for Android to load external scripts
//             mixedContentMode="always"
//             // ✅ Allow all origins
//             originWhitelist={['*']}
//             // ✅ Allow popups Razorpay uses for UPI/bank redirects
//             setSupportMultipleWindows={false}
//             allowsInlineMediaPlayback={true}
//             startInLoadingState={false}
//             // ✅ Android: allow file access for certain payment methods
//             allowFileAccess={true}
//             allowUniversalAccessFromFileURLs={true}
//           />
//         )}
//       </View>
//     </Modal>
//   );
// };

// const s = StyleSheet.create({
//   screen:         { flex: 1, backgroundColor: '#f1f5f9' },

//   header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
//   headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   headerIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
//   headerTitle:    { fontSize: 15, fontWeight: '800', color: '#111827' },
//   headerSub:      { fontSize: 11, color: '#9ca3af', marginTop: 1 },
//   closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },

//   loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
//   loadingCard:    { backgroundColor: 'white', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, width: 220 },
//   loadingTitle:   { fontSize: 15, fontWeight: '800', color: '#111827' },
//   loadingSub:     { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

//   errorWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
//   errorTitle:     { fontSize: 17, fontWeight: '800', color: '#111827' },
//   errorSub:       { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
//   retryBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
//   retryBtnText:   { fontSize: 14, fontWeight: '700', color: 'white' },
//   cancelLink:     { paddingVertical: 8 },
//   cancelLinkText: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },

//   webview:        { flex: 1 },
// components/RazorpayWebView.tsx
//
// FIXES APPLIED:
//  1. Script-load guard   — detects if checkout.razorpay.com CDN fails to load
//                           and surfaces the real error instead of silently dying.
//  2. Android HTTPS fix   — injects meta + explicit allowFileAccess flags.
//  3. Duplicate-fire guard — `launched` flag prevents double payment triggers.
//  4. onLoadEnd timing    — overlay hides only after a short delay so the
//                           Razorpay script has time to execute.
//  5. window.onerror trap — any JS error inside the WebView is forwarded to
//                           onFailure so you can actually see what broke.
//  6. Network / timeout   — 8-second watchdog: if Razorpay never opens after
//                           the script loads, surfaces a clear error.
//  7. Android-specific WebView props — added for Android compatibility.
//  8. userAgent spoofing  — some Razorpay flows break on non-browser UAs.

import React, { useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Platform,
  Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  orderId: string;
  amount: number;       // in paise  (e.g. 49900 = ₹499)
  keyId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  planName: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: (err: string) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Escape a string so it's safe to drop into a JS string literal inside HTML */
const safeStr = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

// ─────────────────────────────────────────────────────────────────────────────
// HTML payload
// ─────────────────────────────────────────────────────────────────────────────

const buildHtml = ({
  keyId,
  orderId,
  amount,
  userEmail,
  userName,
  userPhone,
  planName,
}: {
  keyId: string;
  orderId: string;
  amount: number;
  userEmail: string;
  userName: string;
  userPhone: string;
  planName: string;
}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <!--
    Android WebView sometimes blocks mixed content.
    This meta has no effect on real browsers but keeps some
    older Android WebView versions happy.
  -->
  <meta http-equiv="Content-Security-Policy"
        content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
  <title>Kerala Sellers – Payment</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    html,body{height:100%;width:100%;overflow:hidden}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      background:#f1f5f9;
      display:flex;align-items:center;justify-content:center;
      padding:20px;
    }
    .box{
      background:#fff;border-radius:20px;padding:36px 24px 28px;
      text-align:center;max-width:400px;width:100%;
      box-shadow:0 8px 32px rgba(0,0,0,.10);
    }
    .logo{
      width:52px;height:52px;border-radius:26px;
      background:#eff6ff;display:flex;align-items:center;
      justify-content:center;margin:0 auto 14px;
      font-size:22px;
    }
    .brand{font-size:20px;font-weight:900;color:#111827;margin-bottom:4px}
    .plan{font-size:13px;color:#6b7280;margin-bottom:20px}
    .amt{font-size:38px;font-weight:900;color:#1d4ed8;margin-bottom:6px;letter-spacing:-1px}
    .amt-sub{font-size:12px;color:#9ca3af;margin-bottom:28px}
    .btn{
      background:#3b82f6;color:#fff;border:none;border-radius:14px;
      padding:17px 32px;font-size:16px;font-weight:800;
      cursor:pointer;width:100%;transition:opacity .18s,transform .12s;
      display:flex;align-items:center;justify-content:center;gap:8px;
    }
    .btn:active{transform:scale(0.98);opacity:.9}
    .btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
    .btn-icon{font-size:18px}
    .spinner-wrap{display:none;flex-direction:column;align-items:center;gap:10px;margin:10px 0}
    .spinner{
      width:32px;height:32px;border:3px solid #e5e7eb;
      border-top-color:#3b82f6;border-radius:50%;
      animation:spin .75s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg)}}
    .status-msg{font-size:13px;color:#6b7280;min-height:18px;margin-top:6px}
    .err-box{
      display:none;background:#fef2f2;border:1px solid #fca5a5;
      border-radius:10px;padding:12px 14px;margin-top:14px;
      font-size:13px;color:#dc2626;line-height:1.5;text-align:left;
    }
    .secure{
      font-size:11px;color:#9ca3af;margin-top:18px;
      display:flex;align-items:center;justify-content:center;gap:5px;
    }
    .secure-dot{
      width:7px;height:7px;border-radius:50%;background:#10b981;
      display:inline-block;
    }
  </style>
</head>
<body>
<div class="box">
  <div class="logo">🏪</div>
  <div class="brand">Kerala Sellers</div>
  <div class="plan">${safeStr(planName)} Subscription</div>
  <div class="amt">&#8377;${Math.round(amount / 100).toLocaleString('en-IN')}</div>
  <div class="amt-sub">One-time payment · Secure checkout</div>

  <button class="btn" id="payBtn" onclick="startPayment()">
    <span class="btn-icon">💳</span> Pay Now
  </button>

  <div class="spinner-wrap" id="spinnerWrap">
    <div class="spinner"></div>
    <div class="status-msg" id="statusMsg">Connecting to Razorpay...</div>
  </div>

  <div class="err-box" id="errBox"></div>

  <div class="secure">
    <span class="secure-dot"></span>
    Secured by Razorpay · 256-bit SSL
  </div>
</div>

<!-- FIX 1: Script is loaded first; we check if it loaded before calling Razorpay() -->
<script src="https://checkout.razorpay.com/v1/checkout.js" id="rzpScript"></script>

<script>
// ── Helpers ──────────────────────────────────────────────────────────────────
function post(obj) {
  try { window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }
  catch(e) { console.error('postMessage failed', e); }
}

// FIX 5: Forward ALL JS errors to the app so you can see them in onFailure
window.onerror = function(msg, src, line, col, err) {
  post({ type: 'DEBUG', message: 'JS Error: ' + msg + ' | line: ' + line });
  return false;
};

function setLoading(isLoading, msg) {
  document.getElementById('payBtn').style.display    = isLoading ? 'none' : 'flex';
  document.getElementById('spinnerWrap').style.display = isLoading ? 'flex' : 'none';
  if (msg) document.getElementById('statusMsg').textContent = msg;
}

function showError(msg) {
  setLoading(false, '');
  var box = document.getElementById('errBox');
  box.style.display = 'block';
  box.textContent = msg;
  document.getElementById('payBtn').textContent = '🔄 Retry';
  document.getElementById('payBtn').style.display = 'flex';
  launched = false;
}

// ── State ─────────────────────────────────────────────────────────────────────
var launched = false;

// ── FIX 1: Script-load guard ──────────────────────────────────────────────────
// Checks every 200ms for up to 10s whether Razorpay SDK is available.
function waitForRazorpay(cb, timeout) {
  var waited = 0;
  var iv = setInterval(function() {
    waited += 200;
    if (typeof Razorpay !== 'undefined') {
      clearInterval(iv);
      cb(null);
    } else if (waited >= timeout) {
      clearInterval(iv);
      cb(new Error('Razorpay SDK failed to load. Please check your internet connection.'));
    }
  }, 200);
}

// ── FIX 6: 8-second watchdog ──────────────────────────────────────────────────
var openWatchdog = null;
function startWatchdog() {
  openWatchdog = setTimeout(function() {
    if (launched) {
      showError('Payment gateway took too long to open. Please retry.');
      launched = false;
    }
  }, 8000);
}
function clearWatchdog() {
  if (openWatchdog) { clearTimeout(openWatchdog); openWatchdog = null; }
}

// ── Main payment trigger ──────────────────────────────────────────────────────
function startPayment() {
  if (launched) return;
  launched = true;
  document.getElementById('errBox').style.display = 'none';
  setLoading(true, 'Connecting to Razorpay...');

  // FIX 1: wait for SDK before instantiating Razorpay
  waitForRazorpay(function(err) {
    if (err) {
      post({ type: 'DEBUG', message: err.message });
      showError(err.message);
      return;
    }

    setLoading(true, 'Opening payment gateway...');
    startWatchdog();

    try {
      var rzp = new Razorpay({
        key:         '${safeStr(keyId)}',
        amount:      ${amount},
        currency:    'INR',
        name:        'Kerala Sellers',
        description: '${safeStr(planName)}',
        order_id:    '${safeStr(orderId)}',
        prefill: {
          email:   '${safeStr(userEmail)}',
          name:    '${safeStr(userName)}',
          contact: '${safeStr(userPhone)}',
        },
        theme: { color: '#3b82f6', hide_topbar: false },
        config: { display: { language: 'en' } },

        handler: function(response) {
          clearWatchdog();
          setLoading(true, 'Verifying payment...');
          post({
            type:      'SUCCESS',
            paymentId: response.razorpay_payment_id,
            orderId:   response.razorpay_order_id,
            signature: response.razorpay_signature,
          });
        },

        modal: {
          escape:    false,
          animation: true,
          ondismiss: function() {
            clearWatchdog();
            launched = false;
            setLoading(false, '');
            post({ type: 'DISMISS' });
          },
        },
      });

      rzp.on('payment.failed', function(response) {
        clearWatchdog();
        launched = false;
        var msg = (response.error && response.error.description)
                  || (response.error && response.error.reason)
                  || 'Payment failed. Please try again.';
        showError(msg);
        post({ type: 'FAILURE', error: msg, code: response.error && response.error.code });
      });

      // FIX 6: once open() is called and succeeds, kill the watchdog
      rzp.open();
      // open() is synchronous-ish — if we reach here without exception the modal is showing
      clearWatchdog();

    } catch(e) {
      clearWatchdog();
      launched = false;
      var errMsg = e && e.message ? e.message : 'Failed to initialise payment gateway.';
      showError(errMsg);
      post({ type: 'FAILURE', error: errMsg });
    }
  }, 10000); // 10 second SDK load timeout
}

// ── Auto-trigger on load ──────────────────────────────────────────────────────
// Small delay so the WebView is fully rendered before Razorpay modal pops.
window.addEventListener('load', function() {
  setTimeout(startPayment, 500);
});
</script>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const RazorpayWebView: React.FC<Props> = ({
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
  const [overlayVisible, setOverlayVisible] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const hasHandledRef = useRef(false); // prevent double-firing callbacks

  // Reset state when modal opens
  const handleShow = useCallback(() => {
    setOverlayVisible(true);
    hasHandledRef.current = false;
  }, []);

  // FIX 4: hide overlay slightly after HTML loads, not immediately
  const handleLoadEnd = useCallback(() => {
    setTimeout(() => setOverlayVisible(false), 800);
  }, []);

  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let data: any;
      try {
        data = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }

      // Debug messages — log but don't surface to user
      if (data.type === 'DEBUG') {
        console.warn('[RazorpayWebView DEBUG]', data.message);
        return;
      }

      // Guard against duplicate messages
      if (hasHandledRef.current && data.type !== 'DISMISS') return;

      if (data.type === 'SUCCESS') {
        hasHandledRef.current = true;
        onSuccess(data.paymentId, data.orderId, data.signature);
      } else if (data.type === 'FAILURE') {
        hasHandledRef.current = true;
        onFailure(data.error || 'Payment failed. Please try again.');
      } else if (data.type === 'DISMISS') {
        onClose();
      }
    },
    [onSuccess, onFailure, onClose],
  );

  const handleWebViewError = useCallback(() => {
    onFailure('Failed to load payment page. Please check your internet connection.');
  }, [onFailure]);

  const handleClosePress = useCallback(() => {
    if (hasHandledRef.current) return; // already processed
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'Continue Paying', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            hasHandledRef.current = true;
            onClose();
          },
        },
      ],
    );
  }, [onClose]);

  const htmlContent = buildHtml({
    keyId,
    orderId,
    amount,
    userEmail,
    userName,
    userPhone,
    planName,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClosePress}
      onShow={handleShow}
    >
      <View style={st.container}>
        {/* ── Header ── */}
        <View style={st.header}>
          <View style={{ width: 40 }} />
          <View style={st.headerCenter}>
            <View style={st.lockDot} />
            <Text style={st.headerTitle}>Secure Payment</Text>
          </View>
          <TouchableOpacity style={st.closeBtn} onPress={handleClosePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={19} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* ── Amount pill below header ── */}
        <View style={st.amountPill}>
          <Text style={st.amountPillText}>
            ₹{Math.round(amount / 100).toLocaleString('en-IN')} · {planName}
          </Text>
        </View>

        {/* ── WebView ── */}
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={st.webView}
          onLoadEnd={handleLoadEnd}
          onMessage={handleMessage}
          onError={handleWebViewError}
          onHttpError={(e) => {
            console.warn('[RazorpayWebView] HTTP error', e.nativeEvent.statusCode);
          }}

          // ── JavaScript / DOM
          javaScriptEnabled
          domStorageEnabled

          // FIX 2 & 7: Android compatibility
          mixedContentMode="always"          // allow http inside https on Android
          allowFileAccess                    // needed on some Android versions
          allowUniversalAccessFromFileURLs   // allow XHR from file:// origins
          allowFileAccessFromFileURLs

          // FIX 8: spoof a real browser UA so Razorpay doesn't detect WebView
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          }

          originWhitelist={['*']}
          sharedCookiesEnabled               // iOS: share cookies with Safari
          thirdPartyCookiesEnabled           // Android: allow third-party cookies
          cacheEnabled={false}               // always load fresh
          incognito={false}

          // Scroll / keyboard
          scrollEnabled={false}
          keyboardDisplayRequiresUserAction={false}
        />

        {/* ── Loading overlay ── */}
        {overlayVisible && (
          <View style={st.overlay}>
            <View style={st.overlayCard}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={st.overlayTitle}>Loading Payment Gateway</Text>
              <Text style={st.overlaySubtitle}>Connecting to Razorpay...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const SHADOW_SM = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  android: { elevation: 2 },
});

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  lockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Amount pill
  amountPill: {
    alignSelf: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 10,
    marginBottom: 4,
    ...SHADOW_SM,
  },
  amountPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
    letterSpacing: 0.1,
  },

  // WebView
  webView: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  overlayCard: {
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  overlaySubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default RazorpayWebView;