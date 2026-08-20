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

  it('does not show a lone curly brace when the API body is a JSON string', () => {
    assert.equal(
      apiError({ response: { status: 400, data: '{"error":"Stock changed."}' } }, 'Try Save PDF instead.'),
      'Stock changed.',
    );
  });

  it('joins Django field errors so the seller sees what to fix', () => {
    assert.equal(
      apiError(
        { response: { status: 400, data: { name: ['This field is required.'], price: ['Enter a valid number.'] } } },
        'Could not save',
      ),
      'name: This field is required. price: Enter a valid number.',
    );
  });

  it('uses the fallback instead of dumping HTML or an empty object', () => {
    assert.equal(
      apiError({ response: { status: 500, data: '<html>{broken</html>' } }, 'Try Save PDF instead.'),
      'Try Save PDF instead.',
    );
    assert.equal(
      apiError(new Error('{'), 'Try Save PDF instead.'),
      'Try Save PDF instead.',
    );
  });
});

describe('asList', () => {
  it('reads expenses from a wrapped payload', () => {
    assert.deepEqual(asList({ expenses: [{ id: 1, title: 'Rent' }] }).map((row) => row.id), [1]);
  });
});
