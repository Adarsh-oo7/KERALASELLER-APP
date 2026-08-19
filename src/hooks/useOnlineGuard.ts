import { Alert } from 'react-native';

import { useConnectivity } from '../context/ConnectivityContext';

export function useOnlineGuard() {
  const { canLocalBill, canUseOnlineFeatures, mode } = useConnectivity();

  const requireOnline = (action = 'This action') => {
    if (canUseOnlineFeatures) return true;
    Alert.alert(
      'Internet required',
      mode === 'offline_locked'
        ? `${action} needs a connection. Offline billing lasted 3 days after your last online sync. Reconnect to restore billing, payments, and shop updates.`
        : `${action} needs a connection. Walk-in local billing still works until the 3-day offline window ends.`,
    );
    return false;
  };

  const requireLocalBilling = () => {
    if (canLocalBill) return true;
    Alert.alert(
      'Reconnect to bill',
      'Local billing works offline for 3 days after you last used the app online. Connect to the internet to continue.',
    );
    return false;
  };

  return { requireOnline, requireLocalBilling, canLocalBill, canUseOnlineFeatures, mode };
}
