import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { fetchStoreProfile, type LocalBill, type LocalBillItem } from '../api/seller';
import { API_BASE_URL } from '../config/api';
import { localBillHtml, type ReceiptBill, type ReceiptLine, type ReceiptShop } from './billReceipt';
import { httpStatus } from './format';
import { isMissingRoute } from './userApiUtils';

export type BillSnapshot = {
  id?: number;
  queued?: boolean;
  billId: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  createdAt?: string | null;
  total: number;
  lines: ReceiptLine[];
};

function shopFromProfile(profile: {
  name?: string | null;
  shop_name?: string | null;
  business_address?: string | null;
  whatsapp_number?: string | null;
  seller_phone?: string | null;
  phone?: string | null;
  gst_number?: string | null;
}): ReceiptShop {
  return {
    name: profile.name || profile.shop_name || 'Shop',
    business_address: profile.business_address || '',
    phone: profile.whatsapp_number || profile.seller_phone || profile.phone || '',
    gst_number: profile.gst_number || '',
  };
}

export function snapshotFromBill(
  bill: LocalBill,
  fallbackLines?: ReceiptLine[],
  extras?: { customerName?: string; customerPhone?: string; paymentMethod?: string; total?: number },
): BillSnapshot {
  const items: LocalBillItem[] = bill.items || [];
  const lines = items.length
    ? items.map((item) => ({
      name: item.name || 'Item',
      quantity: item.quantity,
      amount: Number(item.price) * item.quantity,
    }))
    : (fallbackLines || []);
  return {
    id: bill.id,
    queued: bill.queued,
    billId: bill.bill_id || bill.bill_number || `Bill ${bill.id || ''}`,
    customerName: extras?.customerName ?? bill.customer_name,
    customerPhone: extras?.customerPhone ?? bill.customer_phone,
    paymentMethod: extras?.paymentMethod ?? bill.payment_method,
    createdAt: bill.created_at,
    total: Number(extras?.total ?? bill.total_amount ?? 0),
    lines,
  };
}

async function loadShop(): Promise<ReceiptShop> {
  const [profile, stored] = await Promise.all([
    fetchStoreProfile().catch(() => ({})),
    AsyncStorage.getItem('sellerData').catch(() => null),
  ]);
  let seller: { shop_name?: string; phone?: string; name?: string } = {};
  try {
    seller = stored ? JSON.parse(stored) as typeof seller : {};
  } catch {
    seller = {};
  }
  return shopFromProfile({
    ...seller,
    ...profile,
    name: profile.name || seller.shop_name,
    phone: profile.whatsapp_number || profile.seller_phone || seller.phone,
  });
}

async function receiptHtml(snapshot: BillSnapshot): Promise<string> {
  const shop = await loadShop();
  const bill: ReceiptBill = {
    billId: snapshot.billId || 'Bill',
    createdAt: snapshot.createdAt,
    customerName: snapshot.customerName,
    customerPhone: snapshot.customerPhone,
    paymentMethod: snapshot.paymentMethod,
    total: snapshot.total,
    lines: snapshot.lines,
  };
  return localBillHtml(shop, bill);
}

function isCancelled(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  const blob = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();
  return blob.includes('cancel') || blob.includes('dismiss') || blob.includes('did not complete');
}

async function sharePdfFile(uri: string, billId: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('This phone cannot share a PDF. Use a printer from a till computer, or open the bill on the web dashboard.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Save ${billId}`,
    UTI: 'com.adobe.pdf',
  });
}

export async function printBill(snapshot: BillSnapshot): Promise<void> {
  const html = await receiptHtml(snapshot);
  try {
    await Print.printAsync({ html });
    return;
  } catch (error) {
    if (isCancelled(error)) return;
  }
  const file = await Print.printToFileAsync({ html });
  await sharePdfFile(file.uri, snapshot.billId);
}

function pdfUrls(id: number): string[] {
  const query = '?size=A4';
  return [
    `${API_BASE_URL}/user/orders/local-bills/${id}/pdf/${query}`,
    `${API_BASE_URL}/api/orders/local-bills/${id}/pdf/${query}`,
  ];
}

async function downloadServerPdf(id: number, billId: string): Promise<string | null> {
  const token = await AsyncStorage.getItem('accessToken');
  const filename = `${String(billId || `bill-${id}`).replace(/[^\w.-]+/g, '_')}.pdf`;
  const dest = `${FileSystem.cacheDirectory || ''}${filename}`;
  let lastStatus = 0;
  for (const url of pdfUrls(id)) {
    const result = await FileSystem.downloadAsync(url, dest, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    lastStatus = Number(result.status || 0);
    if (result.status === 200) {
      const head = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.UTF8,
        length: 5,
      }).catch(() => '');
      if (head.startsWith('%PDF')) return result.uri;
    }
    if (result.status && result.status !== 404) {
      const error = new Error('Could not download the bill PDF.');
      (error as { response?: { status: number } }).response = { status: result.status };
      throw error;
    }
  }
  if (lastStatus === 404) return null;
  return null;
}

export async function saveBillPdf(snapshot: BillSnapshot): Promise<void> {
  let uri: string | null = null;
  if (snapshot.id && !snapshot.queued) {
    try {
      uri = await downloadServerPdf(snapshot.id, snapshot.billId);
    } catch (error) {
      if (!isMissingRoute(error) && httpStatus(error) && httpStatus(error) !== 404) {
        // Keep going with a local PDF so the bill can still be saved.
      }
    }
  }
  if (!uri) {
    const html = await receiptHtml(snapshot);
    const file = await Print.printToFileAsync({ html });
    uri = file.uri;
  }
  await sharePdfFile(uri, snapshot.billId);
}
