import React, { useState, useRef } from 'react';
import { Camera, Image, MapPin, Send, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useOffline } from '../contexts/OfflineContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { locationService } from '../services/locationService';
import { reportService } from '../services/reportService';
import { offlineQueue } from '../services/offlineQueue';
import { compressImage, validateImageFile, getImageSizeText } from '../utils/imageCompression';
import { debugSetup, testSupabaseConnection } from '../utils/debugHelper';
import { testReportFlow, createTestReport } from '../utils/testReports';
import { ImageData, Department, LocationData } from '../types';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { refreshQueue } = useOffline();
  const { refreshReports } = useRealtime();
  
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageData[]>([]);
  const [location, setLocation] = useState<LocationData>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department>('Other');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const departments: Department[] = ['Roads', 'Waste', 'Electricity', 'Water', 'Other'];

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processImages(files);
  };

  const processImages = async (files: File[]) => {
    if (images.length + files.length > 3) {
      setError('Maximum 3 images allowed');
      return;
    }

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation) {
        setError(validation);
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        setImages(prev => [...prev, compressedImage]);
      } catch (error) {
        setError('Failed to process image');
        console.error('Image processing error:', error);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationCapture = async () => {
    setIsGettingLocation(true);
    setError(null);
    
    try {
      const locationData = await locationService.getCurrentLocation();
      setLocation(locationData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAISuggestion = undefined as unknown as never;

  const handleSubmit = async () => {
    console.log('🚀 Starting report submission...');
    
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    // Check if user is authenticated (either registered or anonymous)
    if (!user) {
      setError('Please sign in or continue as guest to submit reports');
      return;
    }

    console.log('✅ Validation passed');
    console.log('User:', user);
    console.log('Is online:', isOnline);
    console.log('Images count:', images.length);

    setIsSubmitting(true);
    setError(null);

    try {
      const reportData = {
        userId: user?.id,
        description: description.trim(),
        images: images.map(img => img.compressedDataUrl),
        location: {
          name: location.name,
          coordinates: location.coordinates
        },
        department: selectedDepartment,
        aiSuggestion: aiSuggestion ? {
          department: aiSuggestion.department,
          confidence: aiSuggestion.confidence
        } : undefined,
        status: 'PENDING' as const
      };

      console.log('📝 Report data prepared:', reportData);

      if (isOnline) {
        console.log('🌐 Submitting online...');
        
        // Submit directly to server
        // Upload images to Supabase Storage in parallel with timeout fallback
        const uploadWithTimeout = async (file: File, fallbackDataUrl: string, timeoutMs = 12000): Promise<string> => {
          try {
            const uploadPromise = reportService.uploadImage(file, `temp_${Date.now()}`);
            const timeoutPromise = new Promise<string>((resolve) => {
              const id = setTimeout(() => {
                clearTimeout(id);
                resolve(fallbackDataUrl);
              }, timeoutMs);
            });
            const result = await Promise.race([uploadPromise, timeoutPromise]);
            if (!result) return fallbackDataUrl;
            return result;
          } catch (e) {
            return fallbackDataUrl;
          }
        };

        const uploadedImages = await Promise.all(
          images.map((imageData) => uploadWithTimeout(imageData.file, imageData.compressedDataUrl))
        );

        // Submit report with uploaded image URLs
        const finalReportData = {
          ...reportData,
          images: uploadedImages
        };

        console.log('📤 Submitting report to backend...');
        await reportService.submitReport(finalReportData);
        console.log('✅ Report submitted successfully');
        
        await refreshReports();
        alert('Report submitted successfully!');
      } else {
        console.log('📱 Submitting offline (queuing)...');
        // Add to offline queue
        await offlineQueue.addToQueue(reportData);
        await refreshQueue();
        alert('Report queued for upload when online');
      }

      // Reset form
      setDescription('');
      setImages([]);
      setLocation({});
      setAiSuggestion(null);
      setSelectedDepartment('Other');
      console.log('🔄 Form reset');
    } catch (error) {
      console.error('❌ Submit error:', error);
      setError(`Failed to submit report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">NagarSetu</h1>
            <p className="text-neutral-600 mt-1">Report civic problems efficiently</p>
          </div>
          {!user && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.assign('/auth')}
                className="btn-outline text-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => window.location.assign('/auth')}
                className="btn-primary text-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Image Capture Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Photos</h2>
          
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="btn-outline flex items-center gap-2"
            >
              <Camera size={20} />
              Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline flex items-center gap-2"
            >
              <Image size={20} />
              Gallery
            </button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageCapture}
            className="hidden"
          />

          {/* Image Thumbnails */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.compressedDataUrl}
                    alt={`Report image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                  <div className="text-xs text-neutral-500 mt-1">
                    {getImageSizeText(image.size)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-neutral-500 mt-2">
            {images.length}/3 images • Max 1.5MB each
          </p>
        </div>

        {/* Description Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Description</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem in detail..."
            className="textarea-field h-32"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-neutral-500">
              {description.length}/1000 characters
            </span>
            {/* AI removed */}
          </div>
        </div>

        {/* Location Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Location</h2>
          
          <div className="space-y-3">
            <input
              type="text"
              value={location.name || ''}
              onChange={(e) => setLocation(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter area/locality name"
              className="input-field"
            />
            
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-neutral-300"></div>
              <span className="text-sm text-neutral-500 px-2">OR</span>
              <div className="flex-1 h-px bg-neutral-300"></div>
            </div>
            
            <button
              onClick={handleLocationCapture}
              disabled={isGettingLocation}
              className="btn-outline w-full flex items-center justify-center gap-2"
            >
              {isGettingLocation ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <MapPin size={20} />
              )}
              {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
            </button>

            {location.coordinates && (
              <div className="text-sm text-neutral-600 bg-neutral-100 p-3 rounded-lg">
                <strong>Coordinates:</strong> {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Department Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Department</h2>
          
          {/* AI removed */}

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value as Department)}
            className="input-field"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !description.trim() || images.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
          {isSubmitting ? 'Submitting...' : isOnline ? 'Submit Report' : 'Queue Report'}
        </button>

        {/* Network Status */}
        {!isOnline && (
          <div className="text-center text-sm text-neutral-600">
            You're offline. Reports will be queued for upload when you're back online.
          </div>
        )}

        {/* Debug Section */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
          
          {showDebug && (
            <div className="mt-4 space-y-2">
              <button
                onClick={debugSetup}
                className="btn-outline text-sm mr-2"
              >
                Check Setup
              </button>
              <button
                onClick={testSupabaseConnection}
                className="btn-outline text-sm mr-2"
              >
                Test Supabase
              </button>
              {/* Gemini removed */}
              <button
                onClick={() => user && testReportFlow(user.id)}
                className="btn-outline text-sm mr-2"
                disabled={!user}
              >
                Test Reports
              </button>
              <button
                onClick={() => user && createTestReport(user.id)}
                className="btn-outline text-sm"
                disabled={!user}
              >
                Create Test Report
              </button>
              
              <div className="mt-4 text-xs text-gray-600">
                <p><strong>User:</strong> {user ? `${user.id} (${user.isAnonymous ? 'Anonymous' : 'Registered'})` : 'Not logged in'}</p>
                <p><strong>Online:</strong> {isOnline ? 'Yes' : 'No'}</p>
                <p><strong>Images:</strong> {images.length}</p>
                <p><strong>Description:</strong> {description.length} characters</p>
                <p><strong>Location:</strong> {location.name || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

