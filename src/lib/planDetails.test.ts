import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  catalogPlanFor,
  humanizeFeatureCode,
  namedFeaturesFor,
  normalizePlanFeatures,
  planDetailLines,
} from './planDetails.ts';

describe('planDetails', () => {
  it('keeps implemented feature names from the API and drops unimplemented ones', () => {
    assert.deepEqual(normalizePlanFeatures([
      { code: 'billing', name: 'Billing', is_implemented: true },
      { code: 'coming', name: 'Coming later', is_implemented: false },
      'Printed from API as a string',
    ]), [
      { code: 'billing', name: 'Billing', description: undefined, is_implemented: true },
      { code: 'Printed from API as a string', name: 'Printed from API as a string' },
    ]);
  });

  it('does not invent unlimited staff when the API omitted the field', () => {
    const lines = planDetailLines({ name: 'Starter', product_limit: 20 });
    assert.deepEqual(lines.map((row) => row.key), ['products']);
    assert.equal(lines[0].text, 'Up to 20 products');
  });

  it('treats null staff/location caps as unlimited after the API sends those fields', () => {
    const lines = planDetailLines({
      product_limit: null,
      max_staff: null,
      max_branches: 2,
      allows_custom_subdomain: true,
    });
    assert.deepEqual(lines.map((row) => row.text), [
      'Unlimited products',
      'Unlimited staff logins',
      '2 locations',
      'Custom URL: {slug}.keralasellers.in once active',
    ]);
  });

  it('prefers entitlement limits and maps feature codes to catalog names', () => {
    const catalog = [
      {
        id: 3,
        name: 'Starter',
        features: [{ code: 'pos_billing', name: 'POS Billing' }],
      },
    ];
    const current = {
      plan_name: 'Starter',
      plan: { id: 3, name: 'Starter' },
      entitlements: {
        features: ['pos_billing', 'loyalty_program'],
        limits: { max_products: 52, max_staff: 3 },
        official_url: 'https://shop.keralasellers.in',
      },
    };
    const plan = catalogPlanFor(current, catalog);
    assert.equal(plan?.name, 'Starter');
    assert.deepEqual(
      namedFeaturesFor(plan, current.entitlements.features).map((row) => row.name),
      ['POS Billing', 'Loyalty Program'],
    );
    assert.deepEqual(planDetailLines(plan, {
      limits: current.entitlements.limits,
      officialUrl: current.entitlements.official_url,
    }).map((row) => row.text), [
      'Up to 52 products',
      '3 staff logins',
      'https://shop.keralasellers.in',
    ]);
  });

  it('humanizes leftover entitlement codes without using plan names or prices', () => {
    assert.equal(humanizeFeatureCode('gst_invoice'), 'Gst Invoice');
  });
});
