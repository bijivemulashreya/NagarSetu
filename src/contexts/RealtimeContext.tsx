import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { reportService } from '../services/reportService';
import { Report } from '../types';

interface RealtimeContextType {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  refreshReports: () => Promise<void>;
  subscribeToReport: (reportId: string, callback: (report: Report) => void) => RealtimeChannel;
  unsubscribeFromReport: (subscription: RealtimeChannel) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  const refreshReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userReports = await reportService.getUserReports(user.id);
      setReports(userReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const subscribeToReport = useCallback((reportId: string, callback: (report: Report) => void) => {
    return reportService.subscribeToReport(reportId, callback);
  }, []);

  const unsubscribeFromReport = useCallback((subscription: RealtimeChannel) => {
    subscription.unsubscribe();
  }, []);

  // Load reports on mount and when user changes
  useEffect(() => {
    console.log('🔄 RealtimeContext: User changed, refreshing reports...', user);
    refreshReports();
  }, [refreshReports, user]);

  // Subscribe to real-time updates for user reports
  useEffect(() => {
    if (!user) {
      if (subscription) {
        subscription.unsubscribe();
        setSubscription(null);
      }
      return;
    }

    const newSubscription = reportService.subscribeToUserReports(user.id, (updatedReport) => {
      setReports(prevReports => {
        const existingIndex = prevReports.findIndex(r => r.id === updatedReport.id);
        
        if (existingIndex >= 0) {
          // Update existing report
          const newReports = [...prevReports];
          newReports[existingIndex] = updatedReport;
          return newReports;
        } else {
          // Add new report
          return [updatedReport, ...prevReports];
        }
      });
    });

    setSubscription(newSubscription);

    return () => {
      newSubscription.unsubscribe();
    };
  }, [user]);

  const value: RealtimeContextType = {
    reports,
    isLoading,
    error,
    refreshReports,
    subscribeToReport,
    unsubscribeFromReport
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
