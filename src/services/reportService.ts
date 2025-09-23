import { supabase } from './supabase';
import { Report, ReportStatus, Department, QueuedReport } from '../types';
import { offlineQueue } from './offlineQueue';

export class ReportService {
  private static instance: ReportService;

  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  // Submit a new report
  async submitReport(reportData: Omit<Report, 'id' | 'timestamps' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    try {
      console.log('📤 Submitting report to database:', reportData);
      
      const insertData = {
        user_id: reportData.userId,
        description: reportData.description,
        images: reportData.images,
        location_name: reportData.location.name,
        location_lat: reportData.location.coordinates?.latitude,
        location_lng: reportData.location.coordinates?.longitude,
        department: reportData.department,
        ai_suggestion: reportData.aiSuggestion,
        status: 'PENDING',
        device_report_time: new Date().toISOString(),
        server_upload_time: new Date().toISOString()
      };

      console.log('📝 Insert data:', insertData);

      const { data, error } = await supabase
        .from('reports')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database insert error:', error);
        throw error;
      }

      console.log('✅ Report submitted successfully:', data);
      return this.mapDatabaseReportToReport(data);
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  // Get all reports for a user
  async getUserReports(userId: string): Promise<Report[]> {
    try {
      console.log('🔍 Fetching reports for user:', userId);
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching reports:', error);
        throw error;
      }

      console.log('✅ Found reports:', data?.length || 0);
      console.log('📊 Reports data:', data);

      return data.map(report => this.mapDatabaseReportToReport(report));
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  }

  // Get a specific report by ID
  async getReportById(reportId: string): Promise<Report | null> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapDatabaseReportToReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  // Update report status
  async updateReportStatus(reportId: string, status: ReportStatus, authorityResponse?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'IN_PROGRESS' && !authorityResponse) {
        updateData.authority_reply_time = new Date().toISOString();
      }

      if (authorityResponse) {
        updateData.authority_response = authorityResponse;
        updateData.authority_reply_time = new Date().toISOString();
      }

      if (status === 'RESOLVED') {
        updateData.resolution_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  // Sync queued reports when online
  async syncQueuedReports(): Promise<void> {
    try {
      const queuedReports = await offlineQueue.getQueuedReports();
      const reportsToSync = queuedReports.filter(r => r.status === 'QUEUED' || r.status === 'FAILED');

      for (const queuedReport of reportsToSync) {
        try {
          await offlineQueue.updateQueueStatus(queuedReport.id, 'UPLOADING');
          
          const report = await this.submitReport(queuedReport.report);
          
          // Remove from queue after successful sync
          await offlineQueue.removeFromQueue(queuedReport.id);
          
          console.log(`Successfully synced report ${queuedReport.id}`);
        } catch (error) {
          console.error(`Failed to sync report ${queuedReport.id}:`, error);
          await offlineQueue.updateQueueStatus(queuedReport.id, 'FAILED');
        }
      }
    } catch (error) {
      console.error('Error syncing queued reports:', error);
      throw error;
    }
  }

  // Subscribe to real-time updates for user reports
  subscribeToUserReports(userId: string, callback: (report: Report) => void) {
    const subscription = supabase
      .channel('user_reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            const report = this.mapDatabaseReportToReport(payload.new as any);
            callback(report);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  // Subscribe to real-time updates for a specific report
  subscribeToReport(reportId: string, callback: (report: Report) => void) {
    const subscription = supabase
      .channel('report_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `id=eq.${reportId}`
        },
        (payload) => {
          if (payload.new) {
            const report = this.mapDatabaseReportToReport(payload.new as any);
            callback(report);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  // Map database report to our Report type
  private mapDatabaseReportToReport(dbReport: any): Report {
    return {
      id: dbReport.id,
      userId: dbReport.user_id,
      description: dbReport.description,
      images: dbReport.images || [],
      location: {
        name: dbReport.location_name,
        coordinates: dbReport.location_lat && dbReport.location_lng ? {
          latitude: dbReport.location_lat,
          longitude: dbReport.location_lng
        } : undefined
      },
      department: dbReport.department as Department,
      aiSuggestion: dbReport.ai_suggestion ? {
        department: dbReport.ai_suggestion.department as Department,
        confidence: dbReport.ai_suggestion.confidence
      } : undefined,
      status: dbReport.status as ReportStatus,
      timestamps: {
        deviceReportTime: dbReport.device_report_time,
        serverUploadTime: dbReport.server_upload_time,
        authorityReplyTime: dbReport.authority_reply_time,
        resolutionTime: dbReport.resolution_time
      },
      authorityResponse: dbReport.authority_response,
      createdAt: dbReport.created_at,
      updatedAt: dbReport.updated_at
    };
  }

  // Upload image to Supabase Storage
  async uploadImage(file: File, reportId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reportId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('report-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('report-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Get report statistics for a user
  async getUserReportStats(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'PENDING').length,
        inProgress: data.filter(r => r.status === 'IN_PROGRESS').length,
        resolved: data.filter(r => r.status === 'RESOLVED').length,
        rejected: data.filter(r => r.status === 'REJECTED').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching report stats:', error);
      throw error;
    }
  }
}

export const reportService = ReportService.getInstance();
