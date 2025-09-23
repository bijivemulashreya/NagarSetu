import React, { createContext, useContext, useEffect, useState } from 'react';
import { offlineQueue } from '../services/offlineQueue';
import { reportService } from '../services/reportService';
import { QueuedReport } from '../types';

interface OfflineContextType {
  queuedReports: QueuedReport[];
  queueStats: {
    total: number;
    queued: number;
    uploading: number;
    failed: number;
  };
  isLoading: boolean;
  refreshQueue: () => Promise<void>;
  syncQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: React.ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [queuedReports, setQueuedReports] = useState<QueuedReport[]>([]);
  const [queueStats, setQueueStats] = useState({
    total: 0,
    queued: 0,
    uploading: 0,
    failed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshQueue = async () => {
    try {
      const reports = await offlineQueue.getQueuedReports();
      const stats = await offlineQueue.getQueueStats();
      
      setQueuedReports(reports);
      setQueueStats(stats);
    } catch (error) {
      console.error('Error refreshing queue:', error);
    }
  };

  const syncQueue = async () => {
    try {
      await reportService.syncQueuedReports();
      await refreshQueue();
    } catch (error) {
      console.error('Error syncing queue:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await offlineQueue.init();
        await refreshQueue();
      } catch (error) {
        console.error('Error initializing offline queue:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      syncQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const value: OfflineContextType = {
    queuedReports,
    queueStats,
    isLoading,
    refreshQueue,
    syncQueue
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

