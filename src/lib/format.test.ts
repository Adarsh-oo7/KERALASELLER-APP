import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { apiError, asList } from './format.ts';

describe('apiError', () => {
  it('does not show the raw Axios Network Error string', () => {
    assert.equal(
      apiError({ message: 'Network Error', code: 'ERR_NETWORK' }, 'Could not load expenses. Check the connection and try again.'),
      'Could not load expenses. Check the connection and try again.',
    );
  });

  it('keeps a server error message when the API responded', () => {
    assert.equal(
      apiError({ response: { status: 403, data: { error: 'This feature is not on the current plan.' } } }, 'Fallback'),
      'This feature is not on the current plan.',
    );
  });
});

describe('asList', () => {
  it('reads expenses from a wrapped payload', () => {
    assert.deepEqual(asList({ expenses: [{ id: 1, title: 'Rent' }] }).map((row) => row.id), [1]);
  });
});
