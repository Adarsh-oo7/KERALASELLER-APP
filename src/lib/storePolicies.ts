export const PLATFORM_NAME = 'Kerala Sellers';
export const PLATFORM_URL = 'https://www.keralasellers.in';

export const PLATFORM_DISCLAIMER =
  `${PLATFORM_NAME} (${PLATFORM_URL}) provides software tools so independent sellers can run their own shops. Kerala Sellers is not the seller, manufacturer, or delivery partner for a shop. If a buyer has a problem with an order, the complaint is against that seller. Kerala Sellers may ask the seller for clarification, suspend the shop, or remove the seller. Kerala Sellers is not responsible for the seller's products, prices, stock, packing, shipping, GST, refunds, or buyer–seller disputes.`;

export type PolicyKey =
  | 'terms_and_conditions'
  | 'privacy_policy'
  | 'cancellation_refund_policy'
  | 'shipping_delivery_policy';

export type ShopPolicies = Record<PolicyKey, string>;

export const POLICY_FIELDS: { key: PolicyKey; title: string; hint: string }[] = [
  {
    key: 'terms_and_conditions',
    title: 'Terms and conditions',
    hint: 'Who is the seller, how orders work, and that Kerala Sellers is only the software.',
  },
  {
    key: 'privacy_policy',
    title: 'Privacy policy',
    hint: 'What this shop collects, and that Kerala Sellers runs the platform.',
  },
  {
    key: 'cancellation_refund_policy',
    title: 'Cancellation and refund',
    hint: 'Refunds are the seller’s job. Kerala Sellers can only review a complaint.',
  },
  {
    key: 'shipping_delivery_policy',
    title: 'Shipping and delivery',
    hint: 'This seller packs and sends orders. Charges follow Delivery settings.',
  },
];

function shopName(store?: { name?: string | null } | null) {
  return String(store?.name || 'this shop').trim() || 'this shop';
}

export function defaultTerms(name = 'this shop') {
  return `Terms and conditions — ${name}

These terms apply to purchases from ${name} on ${PLATFORM_NAME}.

1. Independent seller
${name} owns and operates this shop. ${PLATFORM_NAME} only provides the website and app as a SaaS tool. We are not a party to the sale.

2. Products and prices
The seller is responsible for product details, quality, stock, photos, and prices shown in this shop.

3. Orders and payment
An order is an agreement between the buyer and this seller. Payment is collected for this seller.

4. If something goes wrong
Contact this seller first using the shop WhatsApp or your order details. You may also report the shop to ${PLATFORM_NAME}. We may ask the seller to explain, or we may suspend or remove the shop. ${PLATFORM_NAME} does not take over the order, replace the product, or pay compensation on behalf of the seller.

5. Changes
The seller may update these terms. The version shown when you place the order applies to that order.

${PLATFORM_DISCLAIMER}
`;
}

export function defaultPrivacy(name = 'this shop') {
  return `Privacy policy — ${name}

1. Who we are
${name} uses ${PLATFORM_NAME} software to run this shop.

2. Data this shop uses
This shop may collect your name, phone, address, and order details so the seller can deliver products and support you.

3. Platform data
${PLATFORM_NAME} stores account and order data needed to run the software. See the ${PLATFORM_NAME} privacy policy on ${PLATFORM_URL} for platform-level data.

4. Sharing
Order details are shared with this seller so they can fulfil the order. ${PLATFORM_NAME} does not sell your data.

5. Questions
Privacy questions about an order should go to this seller. Platform questions can be sent to ${PLATFORM_NAME}. ${PLATFORM_NAME} is not responsible for how an independent seller uses information after they receive an order.

${PLATFORM_DISCLAIMER}
`;
}

export function defaultRefund(name = 'this shop') {
  return `Cancellation and refund — ${name}

1. Seller is responsible
Refunds, replacements, and cancellations for this shop are decided and processed by ${name}, not by ${PLATFORM_NAME}.

2. How to request
Contact this seller with your order number. The seller should confirm whether a cancel, replace, or refund applies.

3. Platform role
If the seller does not respond, or there is fraud or a serious complaint, report it to ${PLATFORM_NAME}. We may ask the seller for clarification or remove the shop. We do not automatically refund from ${PLATFORM_NAME} funds.

4. Payment
Refund timing depends on the seller and the payment method (for example Razorpay or cash on delivery).

${PLATFORM_DISCLAIMER}
`;
}

export function defaultShipping(name = 'this shop') {
  return `Shipping and delivery — ${name}

1. Seller arranges delivery
${name} is responsible for packing and sending orders. ${PLATFORM_NAME} does not deliver products.

2. Charges
Delivery charge, free-delivery rules, and extra COD charges follow this shop's Delivery settings. Several products in one order use the combined packed weight.

3. Time
Any delivery time shown in the shop is an estimate from this seller.

4. Problems
Delayed, damaged, or missing parcels should be raised with this seller. You may report the shop to ${PLATFORM_NAME}. We may ask for clarification or remove the shop. We are not the courier and are not liable for delivery failure.

${PLATFORM_DISCLAIMER}
`;
}

const DEFAULT_BUILDERS: Record<PolicyKey, (name?: string) => string> = {
  terms_and_conditions: defaultTerms,
  privacy_policy: defaultPrivacy,
  cancellation_refund_policy: defaultRefund,
  shipping_delivery_policy: defaultShipping,
};

export function defaultPolicy(key: PolicyKey, name = 'this shop') {
  return DEFAULT_BUILDERS[key](name).trim();
}

export function policiesFromStore(
  store?: ({ name?: string | null } & Partial<Record<PolicyKey, string | null>>) | null,
): ShopPolicies {
  const name = shopName(store);
  return {
    terms_and_conditions: String(store?.terms_and_conditions || '').trim() || defaultTerms(name),
    privacy_policy: String(store?.privacy_policy || '').trim() || defaultPrivacy(name),
    cancellation_refund_policy: String(store?.cancellation_refund_policy || '').trim() || defaultRefund(name),
    shipping_delivery_policy: String(store?.shipping_delivery_policy || '').trim() || defaultShipping(name),
  };
}
