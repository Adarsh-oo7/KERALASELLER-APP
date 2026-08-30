import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRINTER_PREF_KEY = 'ks.printer.pref';

export type PrinterMethod = 'system' | 'thermal';
export type PaperSize = '58mm' | '80mm' | 'A4';

export type PrinterPref = {
  method: PrinterMethod;
  paperSize: PaperSize;
  bluetoothName?: string;
  bluetoothAddress?: string;
};

export const DEFAULT_PRINTER_PREF: PrinterPref = {
  method: 'system',
  paperSize: '80mm',
};

export function normalizePaperSize(value: unknown): PaperSize {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('58')) return '58mm';
  if (raw.includes('a4') || raw.includes('a-4')) return 'A4';
  return '80mm';
}

export function normalizePrinterPref(value: unknown): PrinterPref {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    method: record.method === 'thermal' ? 'thermal' : 'system',
    paperSize: normalizePaperSize(record.paperSize),
    bluetoothName: typeof record.bluetoothName === 'string' ? record.bluetoothName : undefined,
    bluetoothAddress: typeof record.bluetoothAddress === 'string' ? record.bluetoothAddress : undefined,
  };
}

export async function loadPrinterPref(): Promise<PrinterPref> {
  try {
    const raw = await AsyncStorage.getItem(PRINTER_PREF_KEY);
    return normalizePrinterPref(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_PRINTER_PREF;
  }
}

export async function savePrinterPref(pref: PrinterPref): Promise<PrinterPref> {
  const next = normalizePrinterPref(pref);
  await AsyncStorage.setItem(PRINTER_PREF_KEY, JSON.stringify(next));
  return next;
}
