import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  encodeCode39,
  findProductByCode,
  generateShopBarcode,
  sanitizeBarcode,
  storedBarcode,
} from './barcode.ts';

describe('barcode', () => {
  it('encodes Code 39 with start and stop markers', () => {
    const modules = encodeCode39('KS12');
    assert.ok(modules.length > 20);
    assert.equal(modules[0].kind, 'bar');
    assert.ok(modules.every((item) => item.width === 1 || item.width === 3));
  });

  it('strips characters Code 39 cannot print', () => {
    assert.equal(sanitizeBarcode('ks-12_ab'), 'KS-12AB');
  });

  it('makes a unique shop barcode that is Code 39 safe', () => {
    const taken = new Set(['KSAAAAAAAA']);
    const code = generateShopBarcode(taken);
    assert.match(code, /^[0-9A-Z. $/+%*-]+$/);
    assert.notEqual(code, 'KSAAAAAAAA');
    assert.ok(encodeCode39(code).length > 0);
  });

  it('matches a scanned code to a product or variant', () => {
    const products = [
      { id: 1, barcode: '111', sku: 'AAA', variants: [{ id: 9, barcode: '222', sku: 'BBB' }] },
      { id: 2, barcode: '333', sku: null, variants: [] },
    ];
    assert.equal(findProductByCode(products, '111')?.product.id, 1);
    assert.equal(findProductByCode(products, '222')?.variantId, 9);
    assert.equal(findProductByCode(products, 'missing'), null);
  });

  it('keeps a scanned packet barcode as typed, including EAN digits', () => {
    assert.equal(storedBarcode(' 8901030865365 '), '8901030865365');
    assert.equal(sanitizeBarcode('8901030865365'), '8901030865365');
  });
});
