import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  OFFLINE_GRACE_MS,
  applyBillToProducts,
  connectivityCopy,
  formatRemainingGrace,
  isNetworkError,
  remainingGraceMs,
  resolveConnectivityMode,
} from './offlineWindow.ts';

const DAY = 24 * 60 * 60 * 1000;

describe('resolveConnectivityMode', () => {
  it('is online whenever the device has a connection', () => {
    assert.equal(
      resolveConnectivityMode({ isConnected: true, lastOnlineAt: null }),
      'online',
    );
  });

  it('allows local billing for 3 days after the last online contact', () => {
    const now = Date.parse('2026-08-19T06:00:00.000Z');
    assert.equal(
      resolveConnectivityMode({
        isConnected: false,
        lastOnlineAt: now - 2 * DAY,
        now,
      }),
      'offline_grace',
    );
  });

  it('locks online features after 3 days offline', () => {
    const now = Date.parse('2026-08-19T06:00:00.000Z');
    assert.equal(
      resolveConnectivityMode({
        isConnected: false,
        lastOnlineAt: now - OFFLINE_GRACE_MS - 1,
        now,
      }),
      'offline_locked',
    );
  });

  it('locks billing if the shop has never synced', () => {
    assert.equal(
      resolveConnectivityMode({ isConnected: false, lastOnlineAt: null }),
      'offline_locked',
    );
  });
});

describe('remainingGraceMs', () => {
  it('counts down the leftover 3-day window', () => {
    const now = 10_000_000;
    assert.equal(remainingGraceMs(now - DAY, now), 2 * DAY);
    assert.equal(remainingGraceMs(null, now), 0);
  });
});

describe('formatRemainingGrace', () => {
  it('speaks in days then hours', () => {
    assert.equal(formatRemainingGrace(2 * DAY), '2 days');
    assert.equal(formatRemainingGrace(DAY), '1 day');
    assert.equal(formatRemainingGrace(90 * 60 * 1000), '2 hours');
  });
});

describe('applyBillToProducts', () => {
  it('reduces shop stock for a queued walk-in bill', () => {
    const result = applyBillToProducts(
      [{ id: 1, name: 'Rice', total_stock: 10, online_stock: 4 }],
      [{ id: 1, quantity: 3, price: 50 }],
    );
    assert.equal(result.error, undefined);
    assert.equal(result.products[0]?.total_stock, 7);
    assert.equal(result.products[0]?.online_stock, 1);
  });

  it('rejects a bill when cached stock is too low', () => {
    const result = applyBillToProducts(
      [{ id: 1, name: 'Rice', total_stock: 1, online_stock: 1 }],
      [{ id: 1, quantity: 2, price: 50 }],
    );
    assert.match(result.error || '', /Insufficient stock/);
    assert.equal(result.products[0]?.total_stock, 1);
  });
});

describe('isNetworkError', () => {
  it('treats timeouts and missing responses as offline', () => {
    assert.equal(isNetworkError({ message: 'Network Error' }), true);
    assert.equal(isNetworkError({ code: 'ERR_NETWORK' }), true);
    assert.equal(isNetworkError({ response: { status: 400 }, message: 'Network' }), false);
  });
});

describe('connectivityCopy', () => {
  it('explains local billing during the grace window', () => {
    const copy = connectivityCopy('offline_grace', DAY, 1);
    assert.equal(copy?.title, 'Offline · local billing on');
    assert.match(copy?.message || '', /1 day/);
  });
});
