import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StatusBarStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { connectivityCopy } from '../lib/offlineWindow';
import { COLORS, SPACING } from '../theme';
import ConnectivityBanner from './ConnectivityBanner';

type Edge = 'top' | 'bottom';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  statusBarStyle?: StatusBarStyle;
  /** Pass `false` for a flat background. */
  gradient?: readonly [string, string, ...string[]] | false;
  backgroundColor?: string;
  /** Which edges get safe-area padding. Screens with their own coloured
   *  header usually handle `top` themselves and only need `bottom`. */
  edges?: readonly Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/**
 * Every screen's outer shell.
 *
 * Android is always edge-to-edge on Expo SDK 55, so content draws underneath
 * the status bar and the gesture navigation bar. Nothing here may rely on
 * fixed padding — insets come from the device.
 */
export default function Screen({
  children,
  scroll = false,
  keyboardAvoiding = false,
  statusBarStyle = 'dark-content',
  gradient = COLORS.gradientBackground,
  backgroundColor = COLORS.background,
  edges = ['top', 'bottom'],
  contentContainerStyle,
  style,
  refreshing = false,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { mode, remainingMs, pendingCount } = useConnectivity();
  const banner = isAuthenticated ? connectivityCopy(mode, remainingMs, pendingCount) : null;
  const bannerSpace = banner ? 108 : 0;

  const padding = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: (edges.includes('bottom') ? insets.bottom : 0) + bannerSpace,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  const inner = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <View style={[styles.flex, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} />
      {gradient ? (
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[styles.flex, padding]}>{inner}</View>
      <ConnectivityBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: SPACING.xl },
});
