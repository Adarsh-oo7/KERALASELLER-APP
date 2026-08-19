import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { firebaseAuthMessage, indianE164 } from './phoneAuthUtils.ts';

describe('indianE164', () => {
  it('formats a 10-digit Indian mobile as +91', () => {
    assert.equal(indianE164('9876543210'), '+919876543210');
  });

  it('strips spaces and a leading 91 country code', () => {
    assert.equal(indianE164('+91 98765 43210'), '+919876543210');
  });
});

describe('firebaseAuthMessage', () => {
  it('maps invalid OTP codes', () => {
    assert.match(
      firebaseAuthMessage({ code: 'auth/invalid-verification-code' }, 'fallback'),
      /incorrect/i,
    );
  });
});
