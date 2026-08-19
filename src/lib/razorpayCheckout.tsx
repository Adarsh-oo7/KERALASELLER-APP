import React, { useRef, useState } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../theme';

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
};

export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type Props = {
  visible: boolean;
  options: RazorpayCheckoutOptions | null;
  onSuccess: (payload: RazorpaySuccess) => void;
  onCancel: (message?: string) => void;
};

function isWebUrl(url: string): boolean {
  return /^(https?:|about:|data:|blob:|file:)/i.test(url);
}

function openExternalUrl(url: string): void {
  if (!url || isWebUrl(url)) return;
  Linking.openURL(url).catch(() => undefined);
}

function checkoutHtml(options: RazorpayCheckoutOptions): string {
  const payload = JSON.stringify({
    key: options.key,
    amount: options.amount,
    currency: options.currency,
    order_id: options.order_id,
    name: options.name,
    description: options.description,
    theme: { color: '#1A4845' },
    prefill: options.prefill || {},
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body style="background:#FDFFF0;margin:0;font-family:sans-serif;">
    <p style="padding:24px;color:#1A4845;text-align:center;">Opening secure checkout…</p>
    <script>
      function send(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
      function isWeb(url) {
        return !url || /^(https?:|about:|data:|blob:)/i.test(url);
      }
      var nativeOpen = window.open;
      window.open = function (url) {
        if (!isWeb(String(url || ''))) {
          send({ type: 'open', url: String(url) });
          return null;
        }
        return nativeOpen.apply(window, arguments);
      };
      var options = ${payload};
      options.handler = function (response) {
        send({ type: 'success', ...response });
      };
      options.modal = {
        ondismiss: function () { send({ type: 'dismiss' }); }
      };
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        send({
          type: 'failed',
          message: (response && response.error && response.error.description) || 'Payment failed'
        });
      });
      rzp.open();
    </script>
  </body>
</html>`;
}

export default function RazorpayCheckoutModal({ visible, options, onSuccess, onCancel }: Props) {
  const webRef = useRef<WebView>(null);
  const [pageKey, setPageKey] = useState(0);

  const recoverFromAppLink = (url?: string) => {
    if (url) openExternalUrl(url);
    setPageKey((value) => value + 1);
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        message?: string;
        url?: string;
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      };
      if (data.type === 'open' && data.url) {
        openExternalUrl(data.url);
        return;
      }
      if (data.type === 'success' && data.razorpay_payment_id && data.razorpay_order_id && data.razorpay_signature) {
        onSuccess({
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature,
        });
        return;
      }
      if (data.type === 'failed') {
        onCancel(data.message || 'Payment failed');
        return;
      }
      if (data.type === 'dismiss') {
        onCancel();
      }
    } catch {
      onCancel('Checkout failed');
    }
  };

  const onNav = (request: WebViewNavigation) => {
    const url = request.url || '';
    if (!url || isWebUrl(url)) return true;
    openExternalUrl(url);
    return false;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => onCancel()}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.bar}>
          <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.body}>
            Pay with Razorpay
          </Text>
          <TouchableOpacity
            onPress={() => onCancel()}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Cancel payment"
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        {options ? (
          <WebView
            key={`${options.order_id}-${pageKey}`}
            ref={webRef}
            source={{ html: checkoutHtml(options), baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={onMessage}
            onShouldStartLoadWithRequest={onNav}
            onOpenWindow={(event) => {
              const url = event.nativeEvent.targetUrl || '';
              if (!isWebUrl(url)) {
                openExternalUrl(url);
                return;
              }
              webRef.current?.injectJavaScript(
                `window.location.href = ${JSON.stringify(url)}; true;`,
              );
            }}
            onError={(event) => {
              const { code, description, url } = event.nativeEvent;
              if (code === -10 || String(description).includes('ERR_UNKNOWN_URL_SCHEME')) {
                recoverFromAppLink(url);
              }
            }}
            javaScriptEnabled
            javaScriptCanOpenWindowsAutomatically
            domStorageEnabled
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            setSupportMultipleWindows
            originWhitelist={['https://*', 'http://*', 'about:*']}
            mixedContentMode="always"
            startInLoadingState
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  bar: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  title: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  close: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  closeText: { ...TYPOGRAPHY.callout, color: COLORS.primary },
});
