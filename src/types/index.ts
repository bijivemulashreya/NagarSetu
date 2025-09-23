export interface Report {
  id: string;
  userId?: string;
  description: string;
  images: string[];
  location: {
    name?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  department: Department;
  aiSuggestion?: {
    department: Department;
    confidence: number;
  };
  status: ReportStatus;
  timestamps: {
    deviceReportTime: string;
    serverUploadTime?: string;
    authorityReplyTime?: string;
    resolutionTime?: string;
  };
  authorityResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export type Department = 'Roads' | 'Waste' | 'Electricity' | 'Water' | 'Other';

export type ReportStatus = 
  | 'QUEUED' 
  | 'UPLOADING' 
  | 'SYNCED' 
  | 'FAILED' 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'REJECTED';

export interface QueuedReport {
  id: string;
  report: Omit<Report, 'id' | 'timestamps' | 'createdAt' | 'updatedAt'>;
  status: 'QUEUED' | 'UPLOADING' | 'FAILED';
  retryCount: number;
  lastRetryAt?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email?: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
}

export interface LocationData {
  name?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ImageData {
  file: File;
  compressedDataUrl: string;
  size: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  status: ReportStatus;
  message: string;
  authorityResponse?: string;
}
