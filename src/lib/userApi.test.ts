import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { isMissingRoute } from './userApiUtils.ts';

describe('isMissingRoute', () => {
  it('retries only when the URL itself is missing', () => {
    assert.equal(isMissingRoute({ response: { status: 404, data: 'Not Found' } }), true);
  });

  it('does not retry a 404 JSON application error from login', () => {
    assert.equal(
      isMissingRoute({
        response: { status: 404, data: { error: 'No seller account found with this phone number' } },
      }),
      false,
    );
  });
});
