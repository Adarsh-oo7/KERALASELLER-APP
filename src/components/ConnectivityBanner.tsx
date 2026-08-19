import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { connectivityCopy } from '../lib/offlineWindow';
import Notice from './Notice';
import { SPACING } from '../theme';

export default function ConnectivityBanner() {
  const { isAuthenticated } = useAuth();
  const { mode, remainingMs, pendingCount } = useConnectivity();

  if (!isAuthenticated) return null;
  const copy = connectivityCopy(mode, remainingMs, pendingCount);
  if (!copy) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Notice title={copy.title} message={copy.message} tone={copy.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
  },
});
