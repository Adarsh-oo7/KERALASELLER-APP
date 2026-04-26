// src/context/PaymentContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../config/api';

interface GatewayInfo {
  connected: boolean;
  verified: boolean;
  status: string;
  account_id?: string;
}

interface GatewayStatus {
  razorpay: GatewayInfo;
  cashfree: GatewayInfo;
  primary_gateway: string | null;
  is_ready: boolean;
}

const DEFAULT: GatewayStatus = {
  razorpay: { connected: false, verified: false, status: 'pending' },
  cashfree:  { connected: false, verified: false, status: 'pending' },
  primary_gateway: null,
  is_ready: false,
};

interface PaymentContextType {
  gatewayStatus: GatewayStatus;
  refreshGatewayStatus: () => Promise<void>;
  isRazorpayConnected: boolean;
}

const PaymentContext = createContext<PaymentContextType>({
  gatewayStatus:        DEFAULT,
  refreshGatewayStatus: async () => {},
  isRazorpayConnected:  false,
});

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>(DEFAULT);

  const refreshGatewayStatus = useCallback(async () => {
    try {
      const res = await api.getGatewayStatus();
      setGatewayStatus(res ?? DEFAULT);
    } catch {
      // keep existing state on error
    }
  }, []);

  useEffect(() => { refreshGatewayStatus(); }, [refreshGatewayStatus]);

  return (
    <PaymentContext.Provider value={{
      gatewayStatus,
      refreshGatewayStatus,
      isRazorpayConnected: gatewayStatus.razorpay.connected,
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => useContext(PaymentContext);