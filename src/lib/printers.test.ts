import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { normalizePaperSize, normalizePrinterPref } from './printers.ts';

describe('printers', () => {
  it('normalises till paper sizes', () => {
    assert.equal(normalizePaperSize('58mm'), '58mm');
    assert.equal(normalizePaperSize('A4'), 'A4');
    assert.equal(normalizePaperSize('thermal'), '80mm');
  });

  it('defaults to the phone printer dialog on 80mm paper', () => {
    const pref = normalizePrinterPref(null);
    assert.equal(pref.method, 'system');
    assert.equal(pref.paperSize, '80mm');
  });
});
