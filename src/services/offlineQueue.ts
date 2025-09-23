import { v4 as uuidv4 } from 'uuid';
import { QueuedReport, Report, Department } from '../types';

const DB_NAME = 'NagarSetuOffline';
const DB_VERSION = 1;
const STORE_NAME = 'queuedReports';

class OfflineQueueService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async addToQueue(report: Omit<Report, 'id' | 'timestamps' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) await this.init();

    const queuedReport: QueuedReport = {
      id: uuidv4(),
      report,
      status: 'QUEUED',
      retryCount: 0,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queuedReport);

      request.onsuccess = () => resolve(queuedReport.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getQueuedReports(): Promise<QueuedReport[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueueStatus(id: string, status: QueuedReport['status']): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const queuedReport = getRequest.result;
        if (queuedReport) {
          queuedReport.status = status;
          if (status === 'FAILED') {
            queuedReport.retryCount += 1;
            queuedReport.lastRetryAt = new Date().toISOString();
          }
          
          const putRequest = store.put(queuedReport);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Queued report not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueuedReport(id: string, updates: Partial<QueuedReport['report']>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const queuedReport = getRequest.result;
        if (queuedReport) {
          queuedReport.report = { ...queuedReport.report, ...updates };
          
          const putRequest = store.put(queuedReport);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Queued report not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getQueueStats(): Promise<{ total: number; queued: number; uploading: number; failed: number }> {
    const reports = await this.getQueuedReports();
    return {
      total: reports.length,
      queued: reports.filter(r => r.status === 'QUEUED').length,
      uploading: reports.filter(r => r.status === 'UPLOADING').length,
      failed: reports.filter(r => r.status === 'FAILED').length
    };
  }
}

export const offlineQueue = new OfflineQueueService();

