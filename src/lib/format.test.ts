import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { apiError, asList, fieldErrorsFromApi, loginFailureMessage } from './format.ts';

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

  it('does not show Axios status text when the server returned a blank or HTML page', () => {
    assert.equal(
      apiError(new Error('Request failed with status code 404'), 'Check your internet and try again.'),
      'Check your internet and try again.',
    );
  });
});

describe('loginFailureMessage', () => {
  it('explains lockout, closed accounts, missing shops, and wrong passwords', () => {
    assert.match(loginFailureMessage({ response: { status: 429 } }, 'Fallback'), /15 minutes/);
    assert.match(loginFailureMessage({ response: { status: 403 } }, 'Fallback'), /closed/);
    assert.match(loginFailureMessage({ response: { status: 404 } }, 'Fallback'), /Register your shop/);
    assert.match(loginFailureMessage({ response: { status: 401 } }, 'Fallback'), /Wrong phone/);
  });

  it('maps Django field errors onto the same form fields', () => {
    assert.equal(
      fieldErrorsFromApi({ response: { data: { phone: ['This phone is already registered.'], password: ['This password is too common.'] } } }).phone,
      'This phone is already registered.',
    );
  });
});

describe('asList', () => {
  it('reads expenses from a wrapped payload', () => {
    assert.deepEqual(asList({ expenses: [{ id: 1, title: 'Rent' }] }).map((row) => row.id), [1]);
  });
});
