import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  attributeNames,
  childrenOf,
  compactAttributes,
  hasChildren,
  pathTo,
  seedAttributes,
} from './categories.ts';

const tree = [
  { id: 1, name: 'Dress', parent: null, default_attributes: [{ name: 'Fit' }] },
  { id: 2, name: 'Male', parent: 1 },
  { id: 3, name: 'Female', parent: 1 },
  { id: 4, name: 'Bottom', parent: 2 },
  { id: 5, name: 'Top', parent: 2 },
  { id: 6, name: 'Shorts', parent: 4, default_attributes: [{ name: 'Size' }, { name: 'Color' }] },
];

describe('categories', () => {
  it('lists root folders and children of a parent', () => {
    assert.deepEqual(childrenOf(tree, null).map((cat) => cat.name), ['Dress']);
    assert.deepEqual(childrenOf(tree, 1).map((cat) => cat.name), ['Female', 'Male']);
    assert.deepEqual(childrenOf(tree, 2).map((cat) => cat.name), ['Bottom', 'Top']);
  });

  it('builds the path from a leaf like Dress → Male → Bottom → Shorts', () => {
    assert.deepEqual(pathTo(tree, 6).map((cat) => cat.name), ['Dress', 'Male', 'Bottom', 'Shorts']);
    assert.equal(hasChildren(tree, 1), true);
    assert.equal(hasChildren(tree, 6), false);
  });

  it('seeds category details without wiping values the seller already typed', () => {
    const seeded = seedAttributes({ Size: '32', unit: 'Piece' }, attributeNames(tree[5]));
    assert.equal(seeded.Size, '32');
    assert.equal(seeded.Color, '');
    assert.equal(seeded.unit, 'Piece');
  });

  it('keeps sell-by unit and filled details, drops blanks', () => {
    assert.deepEqual(compactAttributes({ Size: '32', Color: '  ', Length: '' }, 'Kg'), {
      unit: 'Kg',
      Size: '32',
    });
  });
});
