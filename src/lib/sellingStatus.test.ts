import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mergeSellingStatus, publicShopUrl, storeProfileIsReady, type ProfileLike } from './sellingStatus.ts';

const filledProfile: ProfileLike = {
  name: 'Digital Product Solutions',
  description: 'We sell digital products',
  whatsapp_number: '9876543210',
  logo_url: 'https://res.cloudinary.com/demo/image/upload/logo.png',
};

describe('storeProfileIsReady', () => {
  it('is true when name, description, WhatsApp, and logo are present', () => {
    assert.equal(storeProfileIsReady(filledProfile), true);
  });

  it('reads logo and WhatsApp from live aliases', () => {
    assert.equal(
      storeProfileIsReady({
        name: 'Shop',
        description: 'Ready',
        whatsappnumber: '9876543210',
        cloudinary_logo: { url: 'https://res.cloudinary.com/demo/logo.png' },
      }),
      true,
    );
  });

  it('is false when the logo is missing', () => {
    assert.equal(storeProfileIsReady({ ...filledProfile, logo_url: '' }), false);
  });
});

describe('mergeSellingStatus', () => {
  it('marks store profile complete from the saved shop, even if live onboarding omits requirements', () => {
    const merged = mergeSellingStatus({
      status: { store_url: '/shop/digital-product-solutions/' },
      profile: filledProfile,
      subscription: { is_active: true },
      gateway: { is_ready_for_payment: true },
    });
    assert.equal(merged.requirements?.store_profile?.complete, true);
    assert.equal(merged.is_ready_to_sell, true);
  });

  it('rewrites live /store/ URLs to the public /shop/ path', () => {
    const merged = mergeSellingStatus({
      status: { store_url: 'https://keralasellers.in/store/digital-product-solutions' },
      profile: filledProfile,
      subscription: { is_active: true },
      gateway: { is_ready_for_payment: true },
    });
    assert.equal(merged.store_url, '/shop/digital-product-solutions/');
    assert.equal(
      publicShopUrl(merged.store_url),
      'https://keralasellers.in/shop/digital-product-solutions',
    );
  });

  it('keeps store profile incomplete when description is missing', () => {
    const merged = mergeSellingStatus({
      profile: { ...filledProfile, description: '' },
      subscription: { is_active: true },
      gateway: { is_ready: true },
    });
    assert.equal(merged.requirements?.store_profile?.complete, false);
    assert.equal(merged.is_ready_to_sell, false);
  });
});
