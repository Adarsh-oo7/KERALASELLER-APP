export type ProfileLike = {
  name?: string | null;
  description?: string | null;
  whatsapp_number?: string | null;
  whatsappnumber?: string | null;
  logo_url?: string | null;
  cloudinary_logo?: { url?: string } | null;
  store_slug?: string | null;
  seller_phone?: string | null;
};

const SHOP_ORIGIN = 'https://keralasellers.in';

export function canonicalShopPath(storeUrl?: string | null, storeSlug?: string | null): string | null {
  const slug = String(storeSlug || '').trim().replace(/^\/+|\/+$/g, '');
  if (slug && !slug.includes('/')) {
    return `/shop/${slug}/`;
  }
  if (!storeUrl) return null;
  try {
    const path = storeUrl.startsWith('http') ? new URL(storeUrl).pathname : storeUrl;
    const match = path.match(/\/(?:shop|store)\/([^/?#]+)/i);
    const fromUrl = match?.[1] ? decodeURIComponent(match[1]).replace(/\/+$/, '') : '';
    return fromUrl ? `/shop/${fromUrl}/` : null;
  } catch {
    return null;
  }
}

export function publicShopUrl(
  storeUrl?: string | null,
  storeSlug?: string | null,
): string | null {
  const path = canonicalShopPath(storeUrl, storeSlug);
  if (!path) return null;
  return `${SHOP_ORIGIN}${path.replace(/\/$/, '')}`;
}

export type SubscriptionLike = {
  is_active?: boolean;
};

export type SellingStatus = {
  is_ready_to_sell?: boolean;
  shop_link_live?: boolean;
  store_url?: string | null;
  missing_steps?: string[];
  missing_step_messages?: string[];
  can_add_products?: boolean;
  store_setup_completed?: boolean;
  has_active_subscription?: boolean;
  subscription_active?: boolean;
  razorpay_connected?: boolean;
  seller_phone?: string | null;
  requirements?: {
    store_profile?: {
      complete?: boolean;
      profile_complete?: boolean;
      logo_uploaded?: boolean;
    };
    payment_gateway?: { complete?: boolean };
    subscription?: { complete?: boolean };
    is_live?: boolean;
  };
};

export function storeLogoUrl(profile?: ProfileLike | null): string {
  if (!profile) return '';
  return String(profile.logo_url || profile.cloudinary_logo?.url || '').trim();
}

export function storeWhatsapp(profile?: ProfileLike | null): string {
  if (!profile) return '';
  return String(profile.whatsapp_number || profile.whatsappnumber || '').trim();
}

export function storeProfileIsReady(profile?: ProfileLike | null): boolean {
  if (!profile) return false;
  const name = String(profile.name || '').trim();
  const description = String(profile.description || '').trim();
  return Boolean(name && description && storeWhatsapp(profile) && storeLogoUrl(profile));
}

export function mergeSellingStatus(opts: {
  status?: SellingStatus | null;
  profile?: ProfileLike | null;
  subscription?: SubscriptionLike | null;
  gateway?: Record<string, unknown> | null;
}): SellingStatus {
  const status = opts.status ?? {};
  const profileComplete = Boolean(
    status.requirements?.store_profile?.complete || storeProfileIsReady(opts.profile),
  );
  const paymentComplete = Boolean(
    status.requirements?.payment_gateway?.complete
    || opts.gateway?.is_ready
    || opts.gateway?.is_ready_for_payment
    || status.razorpay_connected,
  );
  const subscriptionComplete = Boolean(
    status.requirements?.subscription?.complete
    || opts.subscription?.is_active
    || status.has_active_subscription
    || status.subscription_active,
  );
  const ready = Boolean(
    status.is_ready_to_sell
    || status.requirements?.is_live
    || status.shop_link_live
    || (profileComplete && paymentComplete && subscriptionComplete),
  );
  const storeUrl = canonicalShopPath(status.store_url, opts.profile?.store_slug) ?? status.store_url;
  return {
    ...status,
    store_url: storeUrl,
    seller_phone: opts.profile?.seller_phone || storeWhatsapp(opts.profile) || status.seller_phone,
    is_ready_to_sell: ready,
    can_add_products: Boolean(status.can_add_products || ready),
    shop_link_live: Boolean(status.shop_link_live || ready),
    requirements: {
      store_profile: {
        complete: profileComplete,
        profile_complete: profileComplete,
        logo_uploaded: Boolean(status.requirements?.store_profile?.logo_uploaded || storeLogoUrl(opts.profile)),
      },
      payment_gateway: { complete: paymentComplete },
      subscription: { complete: subscriptionComplete },
      is_live: ready,
    },
  };
}
