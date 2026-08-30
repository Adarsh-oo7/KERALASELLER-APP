import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Chip, Header, Notice, Screen } from '../../components';
import { fetchStoreProfile, patchStoreProfile } from '../../api/seller';
import { apiError } from '../../lib/format';
import { loadPrinterPref, savePrinterPref, type PaperSize, type PrinterPref } from '../../lib/printers';
import { listBondedPrinters, openBluetoothSettings } from '../../lib/thermalBluetooth';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import type { MainStackScreenProps } from '../../navigation/types';

export default function PrintersScreen(_props: MainStackScreenProps<'Printers'>) {
  const [pref, setPref] = useState<PrinterPref>({ method: 'system', paperSize: '80mm' });
  const [devices, setDevices] = useState<Array<{ name: string; address: string }>>([]);
  const [loading, setLoading] = useState(false);

  const persist = async (next: PrinterPref) => {
    const saved = await savePrinterPref(next);
    setPref(saved);
    await patchStoreProfile({ print_paper_size: saved.paperSize }).catch(() => undefined);
  };

  const load = useCallback(async () => {
    const stored = await loadPrinterPref();
    const profile = await fetchStoreProfile().catch(() => ({} as { print_paper_size?: string }));
    const next = {
      ...stored,
      paperSize: (profile.print_paper_size as PaperSize) || stored.paperSize,
    };
    setPref(next);
    try {
      setDevices(await listBondedPrinters());
    } catch {
      setDevices([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const chooseDevice = (device: { name: string; address: string }) => {
    void persist({
      ...pref,
      method: 'thermal',
      bluetoothName: device.name,
      bluetoothAddress: device.address,
    });
    Alert.alert('Printer connected', `${device.name} will be used for thermal bills.`);
  };

  const scan = async () => {
    setLoading(true);
    try {
      const found = await listBondedPrinters();
      setDevices(found);
      if (!found.length) {
        Alert.alert(
          'No paired printers yet',
          'Open Bluetooth settings, pair the thermal printer, then tap Find printers again. You can also use the phone printer dialog for Wi‑Fi, USB, and many Bluetooth printers.',
        );
      }
    } catch (err) {
      Alert.alert('Could not list printers', apiError(err, 'Pair the printer in Bluetooth settings, then try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Printers"
        subtitle="Connect a thermal, Wi‑Fi, USB, or phone printer for bills"
        onBack={() => _props.navigation.goBack()}
      />
      <View style={styles.content}>
        <Notice
          tone="info"
          title="Easy connect"
          message="Pair Bluetooth printers in phone settings. Wi‑Fi and USB printers use the phone print dialog. Thermal 58/80mm bills use the same shop receipt as the website."
        />
        <Card>
          <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>How to print bills</Text>
          <View style={styles.row}>
            <Chip
              label="Phone printer dialog"
              selected={pref.method === 'system'}
              onPress={() => { void persist({ ...pref, method: 'system' }); }}
            />
            <Chip
              label="Thermal 58/80mm"
              selected={pref.method === 'thermal'}
              onPress={() => { void persist({ ...pref, method: 'thermal' }); }}
            />
          </View>
          <Text style={styles.hint}>
            {pref.method === 'thermal'
              ? 'Bills are sent as ESC/POS. Pick a paired Bluetooth printer, or share the print file to your printer app.'
              : 'Opens the Android/iOS printer list: Bluetooth print services, Wi‑Fi, USB, and Save as PDF.'}
          </Text>
        </Card>
        <Card>
          <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Paper size</Text>
          <View style={styles.row}>
            {(['58mm', '80mm', 'A4'] as PaperSize[]).map((size) => (
              <Chip
                key={size}
                label={size}
                selected={pref.paperSize === size}
                onPress={() => { void persist({ ...pref, paperSize: size }); }}
              />
            ))}
          </View>
        </Card>
        <Card>
          <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Bluetooth thermal</Text>
          <Text style={styles.hint}>
            {pref.bluetoothName
              ? `Connected: ${pref.bluetoothName}`
              : 'No Bluetooth printer saved yet.'}
          </Text>
          <View style={styles.actions}>
            <Button label="Bluetooth settings" variant="secondary" onPress={() => { void openBluetoothSettings(); }} />
            <Button label="Find printers" onPress={() => { void scan(); }} loading={loading} />
          </View>
          {devices.map((device) => (
            <Button
              key={device.address}
              label={device.name}
              variant={pref.bluetoothAddress === device.address ? 'primary' : 'secondary'}
              onPress={() => chooseDevice(device)}
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: SPACING.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actions: { gap: SPACING.sm, marginTop: SPACING.md },
});
