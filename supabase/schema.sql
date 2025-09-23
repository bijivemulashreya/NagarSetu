-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  location_name TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  department TEXT NOT NULL CHECK (department IN ('Roads', 'Waste', 'Electricity', 'Water', 'Other')),
  ai_suggestion JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('QUEUED', 'UPLOADING', 'SYNCED', 'FAILED', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
  device_report_time TIMESTAMP WITH TIME ZONE NOT NULL,
  server_upload_time TIMESTAMP WITH TIME ZONE,
  authority_reply_time TIMESTAMP WITH TIME ZONE,
  resolution_time TIMESTAMP WITH TIME ZONE,
  authority_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_department ON reports(department);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_location ON reports USING GIST (ST_Point(location_lng, location_lat));

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for reports table
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view report images" ON storage.objects
  FOR SELECT USING (bucket_id = 'report-images');

CREATE POLICY "Authenticated users can upload report images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own report images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own report images" ON storage.objects
  FOR DELETE USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);






