import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string;
          user_id: string | null;
          description: string;
          images: string[];
          location_name: string | null;
          location_lat: number | null;
          location_lng: number | null;
          department: string;
          ai_suggestion: {
            department: string;
            confidence: number;
          } | null;
          status: string;
          device_report_time: string;
          server_upload_time: string | null;
          authority_reply_time: string | null;
          resolution_time: string | null;
          authority_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          description: string;
          images: string[];
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          department: string;
          ai_suggestion?: {
            department: string;
            confidence: number;
          } | null;
          status: string;
          device_report_time: string;
          server_upload_time?: string | null;
          authority_reply_time?: string | null;
          resolution_time?: string | null;
          authority_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          description?: string;
          images?: string[];
          location_name?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          department?: string;
          ai_suggestion?: {
            department: string;
            confidence: number;
          } | null;
          status?: string;
          device_report_time?: string;
          server_upload_time?: string | null;
          authority_reply_time?: string | null;
          resolution_time?: string | null;
          authority_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          is_anonymous: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          is_anonymous: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

