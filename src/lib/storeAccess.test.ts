import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { canUseTool, ownerToolsWhenStaffMeMissing } from './storeAccess.ts';

describe('storeAccess', () => {
  it('shows owner tools when staff/me is missing so live shops are not empty', () => {
    assert.equal(canUseTool(null, 'billing.access_pos', true), true);
    assert.equal(canUseTool(null, 'account.manage_subscription', true), true);
    assert.equal(canUseTool([], 'billing.access_pos', false), false);
  });

  it('respects staff permission lists when the API returns them', () => {
    assert.equal(canUseTool(['billing.access_pos'], 'billing.access_pos', false), true);
    assert.equal(canUseTool(['billing.access_pos'], 'account.manage_subscription', false), false);
  });

  it('treats an owner with an empty permission list as unknown, not locked out', () => {
    assert.equal(ownerToolsWhenStaffMeMissing(true, []), null);
    assert.deepEqual(ownerToolsWhenStaffMeMissing(false, []), []);
    assert.deepEqual(ownerToolsWhenStaffMeMissing(true, ['billing.access_pos']), ['billing.access_pos']);
  });
});
