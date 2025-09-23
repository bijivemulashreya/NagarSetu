# NagarSetu Backend Integration Setup Guide

## 🚀 Complete Backend Integration

Your NagarSetu PWA is now fully connected to the Supabase backend with real-time updates! Here's what has been implemented:

### ✅ **Backend Integration Features**

1. **Real-time Data Sync**
   - Live updates when reports are created, updated, or status changes
   - Automatic refresh of reports list when new data arrives
   - Real-time timeline updates in report details

2. **Complete CRUD Operations**
   - Create reports with image upload to Supabase Storage
   - Read user reports with filtering and search
   - Update report status and authority responses
   - Delete queued reports (offline functionality)

3. **Image Management**
   - Automatic upload to Supabase Storage
   - CDN delivery for fast image loading
   - Fallback to base64 if upload fails

4. **Offline-First Architecture**
   - Queue reports when offline
   - Automatic sync when connection restored
   - Manual sync trigger with retry logic

5. **Real-time Statistics**
   - Live user statistics in profile
   - Automatic updates when reports change status

## 🔧 **Setup Instructions**

### 1. **Environment Variables**
Create a `.env` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# Google Gemini API Configuration
VITE_GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: Map Service
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
VITE_MAPBOX_ACCESS_TOKEN="your_mapbox_access_token_here"
```

### 2. **Supabase Database Setup**

1. **Create a new Supabase project** at https://supabase.com
2. **Run the SQL schema** from `supabase/schema.sql` in your Supabase SQL editor
3. **Enable Row Level Security (RLS)** - the schema includes RLS policies
4. **Set up Storage bucket** for images:
   - Go to Storage in your Supabase dashboard
   - Create a bucket named `report-images`
   - Set it to public
   - The schema includes storage policies

### 3. **Get API Keys**

#### **Supabase Keys:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

#### **Gemini API Key:**
1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key
5. Copy the key

### 4. **Start the Application**

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔄 **Real-time Features**

### **Live Updates**
- Reports automatically appear in "My Reports" when submitted
- Status changes update in real-time across all screens
- Timeline entries appear instantly when authorities respond

### **Offline Support**
- Reports are queued locally when offline
- Automatic sync when connection is restored
- Visual indicators show queue status

### **Image Handling**
- Images are uploaded to Supabase Storage
- Automatic compression to 1.5MB maximum
- CDN delivery for fast loading

## 📊 **Data Flow**

1. **Report Submission:**
   - Images uploaded to Supabase Storage
   - Report data saved to database
   - Real-time subscription notifies all connected clients

2. **Status Updates:**
   - Authority updates report status
   - Real-time subscription pushes update to user
   - UI automatically refreshes with new data

3. **Offline Sync:**
   - Reports stored in IndexedDB when offline
   - Background sync uploads when online
   - Failed uploads retry automatically

## 🛠 **Testing the Integration**

### **Test Report Submission:**
1. Open the app and sign in
2. Submit a report with images
3. Check "My Reports" - should appear immediately
4. Check Supabase dashboard - data should be in database

### **Test Real-time Updates:**
1. Open report details in one browser tab
2. Update report status in Supabase dashboard
3. Watch the UI update automatically

### **Test Offline Functionality:**
1. Submit a report while offline
2. Check queue management screen
3. Go back online and watch automatic sync

## 🔍 **Monitoring**

### **Supabase Dashboard:**
- Monitor database tables in real-time
- Check storage bucket for uploaded images
- View authentication logs

### **Browser DevTools:**
- Check Network tab for API calls
- Monitor IndexedDB for offline queue
- Watch console for real-time subscription logs

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Failed to submit report"**
   - Check Supabase URL and API key
   - Verify RLS policies are enabled
   - Check browser console for errors

2. **Images not uploading**
   - Verify storage bucket exists and is public
   - Check storage policies in Supabase
   - Ensure images are under 1.5MB

3. **Real-time updates not working**
   - Check Supabase subscription status
   - Verify RLS policies allow user access
   - Check browser console for subscription errors

4. **Offline queue not syncing**
   - Check network connectivity
   - Verify IndexedDB is working
   - Check console for sync errors

## 📈 **Performance Optimizations**

- **Image compression** reduces upload time
- **CDN delivery** for fast image loading
- **Real-time subscriptions** only for active users
- **IndexedDB caching** for offline functionality
- **Lazy loading** for large report lists

## 🔐 **Security Features**

- **Row Level Security** protects user data
- **JWT authentication** with automatic refresh
- **Input validation** on client and server
- **Image upload restrictions** (size, type)
- **Anonymous reporting** option

Your NagarSetu PWA is now a fully functional, real-time civic problem reporting system! 🎉





