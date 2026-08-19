import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { FirebaseOptions } from 'firebase/app';
import type { ApplicationVerifier } from 'firebase/auth';

import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../theme';

type Props = {
  firebaseConfig: FirebaseOptions;
};

type State = {
  visible: boolean;
  loaded: boolean;
};

/**
 * ApplicationVerifier for Firebase JS phone auth inside Expo Go.
 * Completes reCAPTCHA in a WebView on the authorised Firebase auth domain.
 */
export default class FirebaseRecaptchaVerifierModal
  extends React.Component<Props, State>
  implements ApplicationVerifier
{
  state: State = { visible: false, loaded: false };

  private resolve?: (token: string) => void;
  private reject?: (error: Error) => void;

  get type(): string {
    return 'recaptcha';
  }

  /** Firebase Auth calls this; keep a no-op to match the web verifier. */
  _reset(): void {}

  verify(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.setState({ visible: true, loaded: false });
    });
  }

  private cancel = () => {
    this.reject?.(new Error('Security check cancelled. Please try again.'));
    this.resolve = undefined;
    this.reject = undefined;
    this.setState({ visible: false, loaded: false });
  };

  private onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        token?: string;
      };
      if (data.type === 'load') {
        this.setState({ loaded: true });
        return;
      }
      if (data.type === 'error') {
        this.reject?.(new Error('Failed to load the security check. Please try again.'));
        this.resolve = undefined;
        this.reject = undefined;
        this.setState({ visible: false, loaded: false });
        return;
      }
      if (data.type === 'verify' && data.token) {
        this.resolve?.(data.token);
        this.resolve = undefined;
        this.reject = undefined;
        this.setState({ visible: false, loaded: false });
      }
    } catch {
      this.reject?.(new Error('Security check failed. Please try again.'));
      this.resolve = undefined;
      this.reject = undefined;
      this.setState({ visible: false, loaded: false });
    }
  };

  render() {
    const { firebaseConfig } = this.props;
    const { visible, loaded } = this.state;
    const authDomain = firebaseConfig.authDomain;
    if (!authDomain) return null;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={this.cancel}
      >
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={this.cancel}
              style={styles.cancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel security check"
            >
              <Text style={styles.cancelLabel} maxFontSizeMultiplier={FONT_SCALE.body}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.heading}>
              Verify you are human
            </Text>
          </View>
          <WebView
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            onMessage={this.onMessage}
            source={{
              baseUrl: `https://${authDomain}`,
              html: recaptchaHtml(firebaseConfig),
            }}
          />
          {!loaded ? (
            <View style={styles.loader} pointerEvents="none">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText} maxFontSizeMultiplier={FONT_SCALE.body}>
                Loading security check…
              </Text>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    );
  }
}

function recaptchaHtml(config: FirebaseOptions): string {
  const safeConfig = JSON.stringify({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId,
  });

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <style>
      html, body { height: 100%; margin: 0; background: #FDFFF0; font-family: -apple-system, sans-serif; }
      #recaptcha-cont { padding: 24px 16px; display: flex; justify-content: center; }
    </style>
  </head>
  <body>
    <div id="recaptcha-cont"></div>
    <script>
      firebase.initializeApp(${safeConfig});
      function post(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
      function onVerify(token) { post({ type: 'verify', token: token }); }
      try {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-cont', {
          size: 'normal',
          callback: onVerify,
          'expired-callback': function () { post({ type: 'error' }); }
        });
        window.recaptchaVerifier.render().then(function () { post({ type: 'load' }); });
      } catch (e) {
        post({ type: 'error' });
      }
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: COLORS.background },
  header: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  cancel: {
    position: 'absolute',
    left: SPACING.sm,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  cancelLabel: { ...TYPOGRAPHY.callout, color: COLORS.primary, fontWeight: '600' },
  title: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  webview: { flex: 1, backgroundColor: COLORS.background },
  loader: {
    ...StyleSheet.absoluteFillObject,
    top: 56,
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  loaderText: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
});
