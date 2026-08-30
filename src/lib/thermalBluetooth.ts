import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type BluetoothPrinter = {
  name: string;
  address: string;
};

type ClassicModule = {
  getBondedDevices?: () => Promise<Array<{ name?: string; address?: string }>>;
  connectToDevice?: (address: string) => Promise<unknown>;
  writeToDevice?: (address: string, data: string) => Promise<unknown>;
  disconnectFromDevice?: (address: string) => Promise<unknown>;
};

function classic(): ClassicModule | null {
  try {
    return require('react-native-bluetooth-classic') as ClassicModule;
  } catch {
    return null;
  }
}

export async function openBluetoothSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
    return;
  }
  await Linking.openSettings();
}

export async function listBondedPrinters(): Promise<BluetoothPrinter[]> {
  const native = classic();
  if (!native?.getBondedDevices) return [];
  const devices = await native.getBondedDevices();
  return (devices || [])
    .map((device) => ({
      name: String(device.name || 'Bluetooth printer').trim() || 'Bluetooth printer',
      address: String(device.address || '').trim(),
    }))
    .filter((device) => device.address);
}

export async function printEscposBytes(base64: string, address?: string): Promise<void> {
  const payload = base64.trim();
  if (!payload) throw new Error('No print data came back for this bill.');
  const native = classic();
  if (address && native?.connectToDevice && native.writeToDevice) {
    await native.connectToDevice(address);
    await native.writeToDevice(address, payload);
    await native.disconnectFromDevice?.(address).catch(() => undefined);
    return;
  }
  const dest = `${FileSystem.cacheDirectory || ''}kerala-sellers-bill.bin`;
  await FileSystem.writeAsStringAsync(dest, payload, { encoding: FileSystem.EncodingType.Base64 });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Pair a Bluetooth printer in phone settings, or print from the web till.');
  }
  await Sharing.shareAsync(dest, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Send to thermal printer',
  });
}
