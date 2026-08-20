import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_DAILY_TOOL_IDS,
  moveDailyTool,
  normalizeDailyToolIds,
  visibleDailyTools,
} from './dailyTools.ts';

describe('dailyTools', () => {
  it('drops unknown ids and keeps the chosen order', () => {
    assert.deepEqual(
      normalizeDailyToolIds(['new_bill', 'nope', 'payments', 'new_bill']),
      ['new_bill', 'payments'],
    );
  });

  it('falls back to the default home set when nothing is selected', () => {
    const tools = visibleDailyTools([], () => true);
    assert.deepEqual(tools.map((tool) => tool.id), DEFAULT_DAILY_TOOL_IDS);
  });

  it('hides tools the staff member cannot use', () => {
    const tools = visibleDailyTools(['new_bill', 'staff', 'payments'], (permission) => permission !== 'staff.view');
    assert.deepEqual(tools.map((tool) => tool.id), ['new_bill', 'payments']);
  });

  it('reorders a selected tool', () => {
    assert.deepEqual(moveDailyTool(['new_bill', 'payments', 'settings'], 'payments', -1), ['payments', 'new_bill', 'settings']);
  });
});
