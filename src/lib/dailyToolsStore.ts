import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_DAILY_TOOL_IDS, normalizeDailyToolIds, type DailyToolId } from './dailyTools';

const STORAGE_KEY = 'home.dailyTools.ids';

export async function loadDailyToolIds(): Promise<DailyToolId[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_DAILY_TOOL_IDS];
    const parsed = JSON.parse(raw) as unknown;
    const ids = normalizeDailyToolIds(parsed);
    return ids.length ? ids : [...DEFAULT_DAILY_TOOL_IDS];
  } catch {
    return [...DEFAULT_DAILY_TOOL_IDS];
  }
}

export async function saveDailyToolIds(ids: DailyToolId[]): Promise<void> {
  const next = normalizeDailyToolIds(ids);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next.length ? next : DEFAULT_DAILY_TOOL_IDS));
}
