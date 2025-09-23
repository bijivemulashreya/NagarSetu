// Test utility to help debug report issues
import { reportService } from '../services/reportService';
import { supabase } from '../services/supabase';

export const testReportFlow = async (userId: string) => {
  console.log('🧪 Testing report flow for user:', userId);
  
  try {
    // Test 1: Check if user exists in database
    console.log('1️⃣ Checking if user exists in database...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ User not found in database:', userError);
      return false;
    }
    console.log('✅ User found:', userData);

    // Test 2: Check if user has any reports
    console.log('2️⃣ Checking user reports...');
    const reports = await reportService.getUserReports(userId);
    console.log('✅ User reports:', reports.length);

    // Test 3: Check database directly
    console.log('3️⃣ Checking database directly...');
    const { data: dbReports, error: dbError } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (dbError) {
      console.error('❌ Database query error:', dbError);
      return false;
    }
    
    console.log('✅ Database reports:', dbReports?.length || 0);
    console.log('📊 Database data:', dbReports);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

export const createTestReport = async (userId: string) => {
  console.log('🧪 Creating test report for user:', userId);
  
  try {
    const testReport = {
      userId,
      description: 'Test report for debugging',
      images: ['https://via.placeholder.com/300x200'],
      location: {
        name: 'Test Location',
        coordinates: { latitude: 12.9716, longitude: 77.5946 }
      },
      department: 'Other' as const,
      status: 'PENDING' as const
    };

    const report = await reportService.submitReport(testReport);
    console.log('✅ Test report created:', report);
    return report;
  } catch (error) {
    console.error('❌ Failed to create test report:', error);
    throw error;
  }
};
