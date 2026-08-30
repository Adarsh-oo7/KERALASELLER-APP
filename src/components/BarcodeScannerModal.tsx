import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../theme';
import Button from './Button';

type Props = {
  visible: boolean;
  title?: string;
  /** Keep the camera open so the next item can be scanned immediately. */
  continuous?: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
};

export default function BarcodeScannerModal({
  visible,
  title = 'Scan barcode',
  continuous = false,
  onClose,
  onScan,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const lastAt = useRef(0);

  useEffect(() => {
    if (visible) {
      setLocked(false);
      setLastCode('');
      lastAt.current = 0;
    }
  }, [visible]);

  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.heading}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close scanner">
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        {!permission?.granted ? (
          <View style={styles.fallback}>
            <Text style={styles.meta}>Camera access is needed to scan barcodes at the till.</Text>
            <Button label="Allow camera" onPress={() => requestPermission()} />
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'qr', 'itf14'],
            }}
            onBarcodeScanned={({ data }) => {
              const value = String(data || '').trim();
              if (!value || locked) return;
              const now = Date.now();
              if (now - lastAt.current < 1600) return;
              lastAt.current = now;
              setLastCode(value);
              if (!continuous) setLocked(true);
              onScan(value);
            }}
          />
        )}
        {lastCode ? <Text style={styles.last}>Last scan {lastCode}</Text> : null}
        <Text style={styles.hint}>
          {continuous
            ? 'Keep the camera open and scan the next packet. Close when the bill is ready to edit.'
            : 'Point the camera at the barcode. You can still type a code if the camera cannot read it.'}
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: { ...TYPOGRAPHY.title, color: '#fff', flex: 1 },
  close: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  closeText: { ...TYPOGRAPHY.bodyStrong, color: '#fff' },
  camera: { flex: 1 },
  fallback: { flex: 1, justifyContent: 'center', padding: SPACING.lg, gap: SPACING.md },
  meta: { ...TYPOGRAPHY.body, color: '#fff' },
  last: {
    ...TYPOGRAPHY.bodyStrong,
    color: '#fff',
    textAlign: 'center',
    paddingTop: SPACING.sm,
  },
  hint: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
    padding: SPACING.lg,
    textAlign: 'center',
  },
});
