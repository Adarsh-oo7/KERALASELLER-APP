import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  addonBuyLabel,
  addonFitsPlan,
  addonIncludedInPlan,
  addonPurchaseCounts,
  collectAddonCatalog,
  partitionAddons,
} from './addonAccess.ts';

describe('addonAccess', () => {
  it('treats an empty compatible_plan_ids list as available on every plan', () => {
    assert.equal(addonFitsPlan({ id: 1, name: 'Extra 50' }, 3), true);
    assert.equal(addonFitsPlan({ id: 1, name: 'Pro only', compatible_plan_ids: [5] }, 3), false);
    assert.equal(addonFitsPlan({ id: 1, name: 'Pro only', compatible_plan_ids: [5] }, 5), true);
  });

  it('still lists plan-restricted extras when the current plan is unknown', () => {
    assert.equal(addonFitsPlan({ id: 1, name: 'Pro only', compatible_plan_ids: [5] }, null), true);
  });

  it('merges entitlements, public catalog, and already-purchased extras by id', () => {
    const catalog = collectAddonCatalog({
      entitlementsAddons: [],
      publicAddons: [
        { id: 1, name: 'GST invoice', price: '49.00', feature_codes: ['gst_invoice'] },
        { id: 2, name: 'Loyalty points', price: '49.00' },
      ],
      activeAddons: [{ id: 2, name: 'Loyalty points', price: '49.00' }, { id: 9, name: 'Bought extra', price: '99.00' }],
    });
    assert.deepEqual(catalog.map((row) => row.id), [1, 2, 9]);
    assert.equal(catalog.find((row) => row.id === 1)?.feature_codes?.[0], 'gst_invoice');
  });

  it('splits catalog into buyable, already-on-plan, purchased, and other-plan extras', () => {
    const addons = [
      { id: 1, name: 'GST', compatible_plan_ids: [], feature_codes: ['gst_invoice'] },
      { id: 2, name: 'Locations', compatible_plan_ids: [2, 5] },
      { id: 3, name: 'Owned extra', compatible_plan_ids: [] },
      { id: 4, name: 'Extra 50 products', compatible_plan_ids: [], extra_product_limit: 50 },
    ];
    const groups = partitionAddons(addons, {
      planId: 3,
      activeIds: [3],
      featureCodes: ['gst_invoice', 'pos_billing'],
    });
    assert.deepEqual(groups.compatible.map((row) => row.id), [4]);
    assert.deepEqual(groups.onPlan.map((row) => row.id), [1]);
    assert.deepEqual(groups.included.map((row) => row.id), [3]);
    assert.deepEqual(groups.otherPlans.map((row) => row.id), [2]);
  });

  it('does not treat a capacity bump as already included just because a related feature is on the plan', () => {
    assert.equal(
      addonIncludedInPlan(
        { id: 8, name: 'Extra location', extra_branch_limit: 1, feature_codes: ['multi_branch'] },
        ['multi_branch'],
      ),
      false,
    );
  });

  it('keeps capacity extras buyable so a shop can add more when it needs a higher cap', () => {
    const groups = partitionAddons(
      [{ id: 4, name: 'Extra 50 products', extra_product_limit: 50 }],
      { planId: 3, activeIds: [4, 4] },
    );
    assert.deepEqual(groups.compatible.map((row) => row.id), [4]);
    assert.deepEqual(groups.included.map((row) => row.id), []);
    assert.equal(addonBuyLabel({ id: 4, name: 'Extra 50 products', extra_product_limit: 50 }, 2), 'Add another');
    assert.equal(addonPurchaseCounts([{ id: 4 }, { id: 4 }, { id: 9 }]).get(4), 2);
  });
});
