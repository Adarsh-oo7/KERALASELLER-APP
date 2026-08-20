import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { descriptionIsEmpty, plainTextFromHtml, sanitizeDescriptionHtml, toEditorHtml } from './htmlDescription.ts';

describe('htmlDescription', () => {
  it('keeps basic formatting and drops scripts', () => {
    const html = sanitizeDescriptionHtml(
      '<p onclick="alert(1)"><strong>Cotton shorts</strong><script>bad()</script></p><p>Soft fabric</p>',
    );
    assert.equal(html.includes('<strong>Cotton shorts</strong>'), true);
    assert.equal(html.includes('script'), false);
    assert.equal(html.includes('onclick'), false);
    assert.equal(plainTextFromHtml(html), 'Cotton shorts Soft fabric');
  });

  it('treats a blank editor as empty', () => {
    assert.equal(descriptionIsEmpty('<p><br></p>'), true);
    assert.equal(descriptionIsEmpty('<p>Nice everyday shorts for home and travel.</p>'), false);
  });

  it('wraps plain product copy so existing descriptions still edit', () => {
    const html = toEditorHtml('Cotton shorts\nSoft fabric');
    assert.equal(html.includes('<p>Cotton shorts</p>'), true);
    assert.equal(plainTextFromHtml(html), 'Cotton shorts Soft fabric');
  });
});
