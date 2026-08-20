export type ReceiptShop = {
  name?: string | null;
  business_address?: string | null;
  phone?: string | null;
  gst_number?: string | null;
};

export type ReceiptLine = {
  name: string;
  quantity: number;
  amount: number;
};

export type ReceiptBill = {
  billId: string;
  createdAt?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethod?: string | null;
  total: number;
  lines: ReceiptLine[];
};

export function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value: number): string {
  return Number(value || 0).toFixed(2);
}

export function localBillHtml(shop: ReceiptShop, bill: ReceiptBill): string {
  const shopName = escapeHtml(shop.name || 'Shop');
  const address = escapeHtml(shop.business_address || '');
  const phone = escapeHtml(shop.phone || '');
  const gst = escapeHtml(shop.gst_number || '');
  const billId = escapeHtml(bill.billId);
  const customer = escapeHtml(bill.customerName || 'Walk-in');
  const customerPhone = escapeHtml(bill.customerPhone || '');
  const paid = escapeHtml(bill.paymentMethod || 'CASH');
  const when = escapeHtml(bill.createdAt || new Date().toLocaleString('en-IN'));
  const rows = bill.lines.map((line) => (
    `<tr><td>${escapeHtml(line.name)}</td><td class="qty">${line.quantity}</td><td class="amt">${money(line.amount)}</td></tr>`
  )).join('');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bill ${billId} - ${shopName}</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 6px; text-align: center; }
    .muted { color: #4b5563; text-align: center; font-size: 12px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
    th, td { padding: 6px 0; }
    th { text-align: left; border-bottom: 1px solid #111; }
    td.qty, td.amt, th.amt { text-align: right; }
    .total td { font-weight: 700; border-top: 1px solid #111; }
    .footer { margin-top: 16px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${shopName}</h1>
  <p class="muted">
    ${address ? `${address}<br>` : ''}
    ${phone ? `Ph: ${phone}` : ''}
    ${gst ? `<br>GSTIN: ${gst}` : ''}
  </p>
  <p class="muted">
    Bill ${billId}<br>${when}<br>
    ${customer}${customerPhone ? ` · ${customerPhone}` : ''}
  </p>
  <table>
    <thead><tr><th>Item</th><th class="qty">Qty</th><th class="amt">Amt</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="total"><td colspan="2">Total</td><td class="amt">₹ ${money(bill.total)}</td></tr>
      <tr><td colspan="2">Paid (${paid})</td><td class="amt">₹ ${money(bill.total)}</td></tr>
    </tfoot>
  </table>
  <p class="footer">Thank you. Visit again.</p>
</body>
</html>`;
}
