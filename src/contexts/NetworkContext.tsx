import React, { createContext, useContext, useEffect, useState } from 'react';
import { NetworkStatus } from '../types';

interface NetworkContextType {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  isSlowConnection: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
    };

    const checkConnectionSpeed = async () => {
      if (navigator.onLine) {
        try {
          const start = performance.now();
          await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
          const end = performance.now();
          const duration = end - start;
          
          // Consider connection slow if it takes more than 2 seconds
          setNetworkStatus(prev => ({ 
            ...prev, 
            isSlowConnection: duration > 2000 
          }));
        } catch (error) {
          setNetworkStatus(prev => ({ 
            ...prev, 
            isSlowConnection: true 
          }));
        }
      }
    };

    // Initial check
    checkConnectionSpeed();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed periodically
    const interval = setInterval(checkConnectionSpeed, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const value: NetworkContextType = {
    networkStatus,
    isOnline: networkStatus.isOnline,
    isSlowConnection: networkStatus.isSlowConnection
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

