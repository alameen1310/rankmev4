import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined,
    saveData: undefined,
  }));

  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection;
    
    setStatus({
      isOnline: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    });
  }, []);

  useEffect(() => {
    updateNetworkStatus();

    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);

  const isSlowConnection = status.effectiveType === 'slow-2g' || status.effectiveType === '2g';
  const isGoodConnection = status.effectiveType === '4g' || (status.downlink && status.downlink >= 5);

  return {
    ...status,
    isSlowConnection,
    isGoodConnection,
  };
}
