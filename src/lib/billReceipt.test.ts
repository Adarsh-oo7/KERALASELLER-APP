import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { escapeHtml, localBillHtml } from './billReceipt.ts';

describe('localBillHtml', () => {
  it('includes shop details and the bill total', () => {
    const html = localBillHtml(
      {
        name: 'POS Shop',
        business_address: 'MG Road, Kochi',
        phone: '9876500101',
        gst_number: '32AAAAA0000A1Z5',
      },
      {
        billId: 'LB12',
        customerName: 'Anu',
        paymentMethod: 'CASH',
        total: 40,
        lines: [{ name: 'Soap', quantity: 2, amount: 40 }],
      },
    );
    assert.match(html, /POS Shop/);
    assert.match(html, /MG Road, Kochi/);
    assert.match(html, /9876500101/);
    assert.match(html, /32AAAAA0000A1Z5/);
    assert.match(html, /LB12/);
    assert.match(html, /Soap/);
    assert.match(html, /40\.00/);
  });

  it('escapes HTML in shop names', () => {
    assert.equal(escapeHtml('<Shop>'), '&lt;Shop&gt;');
    const html = localBillHtml({ name: '<Shop>' }, {
      billId: '1',
      total: 1,
      lines: [{ name: 'Tea & biscuits', quantity: 1, amount: 1 }],
    });
    assert.equal(html.includes('<Shop>'), false);
    assert.match(html, /Tea &amp; biscuits/);
  });
});
