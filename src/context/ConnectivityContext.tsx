import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import { postLocalBillToApi } from '../api/seller';
import { useAuth } from './AuthContext';
import {
  flushPendingLocalBills,
  getLastOnlineAt,
  getPendingLocalBills,
  onOfflineStoreChange,
} from '../lib/offlineStore';
import {
  remainingGraceMs,
  resolveConnectivityMode,
  type ConnectivityMode,
} from '../lib/offlineWindow';

type ConnectivityContextType = {
  isConnected: boolean;
  mode: ConnectivityMode;
  lastOnlineAt: number | null;
  pendingCount: number;
  remainingMs: number;
  canLocalBill: boolean;
  canUseOnlineFeatures: boolean;
  refresh: () => Promise<void>;
  syncPendingBills: () => Promise<void>;
};

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

function netInfoIsOnline(state: NetInfoState | null): boolean {
  if (!state) return true;
  return state.isConnected === true && state.isInternetReachable !== false;
}

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const flushing = useRef(false);

  const refresh = useCallback(async () => {
    const [last, pending, net] = await Promise.all([
      getLastOnlineAt(),
      getPendingLocalBills(),
      NetInfo.fetch().catch(() => null),
    ]);
    setLastOnlineAt(last);
    setPendingCount(pending.length);
    if (net) setIsConnected(netInfoIsOnline(net));
  }, []);

  const syncPendingBills = useCallback(async () => {
    if (!isAuthenticated || !isConnected || flushing.current) return;
    flushing.current = true;
    try {
      await flushPendingLocalBills(async (bill) => {
        await postLocalBillToApi({
          customer_name: bill.customer_name,
          customer_phone: bill.customer_phone,
          items: bill.items,
          seller_phone: bill.seller_phone,
        });
      });
      await refresh();
    } finally {
      flushing.current = false;
    }
  }, [isAuthenticated, isConnected, refresh]);

  useEffect(() => {
    void refresh();
    const unsubNet = NetInfo.addEventListener((state) => {
      setIsConnected(netInfoIsOnline(state));
    });
    const unsubStore = onOfflineStoreChange(() => {
      void refresh();
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncPendingBills();
    });
    return () => {
      unsubNet();
      unsubStore();
      appSub.remove();
    };
  }, [refresh, syncPendingBills]);

  useEffect(() => {
    if (isAuthenticated && isConnected) {
      void syncPendingBills();
    }
  }, [isAuthenticated, isConnected, syncPendingBills]);

  const mode = resolveConnectivityMode({ isConnected, lastOnlineAt });
  const remainingMs = remainingGraceMs(lastOnlineAt);

  const value = useMemo<ConnectivityContextType>(
    () => ({
      isConnected,
      mode,
      lastOnlineAt,
      pendingCount,
      remainingMs,
      canLocalBill: mode === 'online' || mode === 'offline_grace',
      canUseOnlineFeatures: mode === 'online',
      refresh,
      syncPendingBills,
    }),
    [isConnected, lastOnlineAt, mode, pendingCount, refresh, remainingMs, syncPendingBills],
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity(): ConnectivityContextType {
  const context = useContext(ConnectivityContext);
  if (!context) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
}
