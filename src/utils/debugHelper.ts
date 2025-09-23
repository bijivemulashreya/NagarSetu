// Debug helper to check environment and setup
export const debugSetup = () => {
  console.log('🔍 Debugging NagarSetu Setup...');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  // Gemini AI removed
  
  // Check if we're in browser
  console.log('Browser Environment:');
  console.log('- Window object:', typeof window !== 'undefined' ? '✅ Available' : '❌ Missing');
  console.log('- Navigator online:', navigator.onLine ? '✅ Online' : '❌ Offline');
  
  // Check IndexedDB support
  console.log('IndexedDB Support:');
  console.log('- IndexedDB available:', 'indexedDB' in window ? '✅ Available' : '❌ Missing');
  
  // Check camera support
  console.log('Camera Support:');
  console.log('- MediaDevices available:', navigator.mediaDevices ? '✅ Available' : '❌ Missing');
  console.log('- Camera support:', navigator.mediaDevices?.getUserMedia ? '✅ Available' : '❌ Missing');
  
  // Check geolocation support
  console.log('Geolocation Support:');
  console.log('- Geolocation available:', 'geolocation' in navigator ? '✅ Available' : '❌ Missing');
  
  console.log('🔍 Debug complete!');
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { supabase } = await import('../services/supabase');
    const { data, error } = await supabase.auth.getSession();
    
    console.log('🔗 Supabase Connection Test:');
    console.log('- Connection:', error ? '❌ Failed' : '✅ Success');
    if (error) {
      console.error('Error details:', error);
    }
    console.log('- Current session:', data.session ? '✅ Active' : '❌ No session');
    
    return !error;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
    return false;
  }
};

// Test Gemini API
// Gemini AI removed




