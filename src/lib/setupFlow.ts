import AsyncStorage from '@react-native-async-storage/async-storage';

const OPEN_SETUP_ONCE = 'ks_open_setup_once';

export async function markOpenSetupAfterRegister(): Promise<void> {
  await AsyncStorage.setItem(OPEN_SETUP_ONCE, '1');
}

export async function consumeOpenSetupAfterRegister(): Promise<boolean> {
  const value = await AsyncStorage.getItem(OPEN_SETUP_ONCE);
  if (value !== '1') return false;
  await AsyncStorage.removeItem(OPEN_SETUP_ONCE);
  return true;
}

export function skipSetupToDashboard(navigation: {
  navigate: (screen: 'Tabs', params: { screen: 'Home' }) => void;
}): void {
  navigation.navigate('Tabs', { screen: 'Home' });
}
