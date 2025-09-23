import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, User, MessageSquare, Star, Share2, AlertCircle } from 'lucide-react';
import { useRealtime } from '../contexts/RealtimeContext';
import { reportService } from '../services/reportService';
import { Report, TimelineEntry } from '../types';

const ReportDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscribeToReport, unsubscribeFromReport } = useRealtime();
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Load report data
  useEffect(() => {
    if (!id) return;

    const loadReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const reportData = await reportService.getReportById(id);
        if (reportData) {
          setReport(reportData);
          generateTimeline(reportData);
        } else {
          setError('Report not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
        console.error('Error loading report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id]);

  // Subscribe to real-time updates for this report
  useEffect(() => {
    if (!id || !report) return;

    const subscription = subscribeToReport(id, (updatedReport) => {
      setReport(updatedReport);
      generateTimeline(updatedReport);
    });

    return () => {
      unsubscribeFromReport(subscription);
    };
  }, [id, report, subscribeToReport, unsubscribeFromReport]);

  const generateTimeline = (reportData: Report) => {
    const timelineEntries: TimelineEntry[] = [];

    // Device report time
    timelineEntries.push({
      id: '1',
      timestamp: reportData.timestamps.deviceReportTime,
      status: 'PENDING',
      message: 'Report submitted successfully'
    });

    // Server upload time
    if (reportData.timestamps.serverUploadTime) {
      timelineEntries.push({
        id: '2',
        timestamp: reportData.timestamps.serverUploadTime,
        status: 'PENDING',
        message: 'Report received by system'
      });
    }

    // Authority reply time
    if (reportData.timestamps.authorityReplyTime) {
      timelineEntries.push({
        id: '3',
        timestamp: reportData.timestamps.authorityReplyTime,
        status: reportData.status,
        message: `Assigned to ${reportData.department} Department`,
        authorityResponse: reportData.authorityResponse
      });
    }

    // Resolution time
    if (reportData.timestamps.resolutionTime) {
      timelineEntries.push({
        id: '4',
        timestamp: reportData.timestamps.resolutionTime,
        status: 'RESOLVED',
        message: 'Issue has been resolved'
      });
    }

    setTimeline(timelineEntries);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'IN_PROGRESS':
        return 'status-uploading';
      case 'RESOLVED':
        return 'status-resolved';
      case 'REJECTED':
        return 'status-failed';
      default:
        return 'status-queued';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'RESOLVED':
        return 'Resolved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Civic Problem Report',
          text: report?.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Error loading report</h2>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/reports')}
            className="btn-primary"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Report not found</h2>
          <p className="text-neutral-600 mb-4">The report you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/reports')}
            className="btn-primary"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-neutral-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-neutral-900">Report Details</h1>
            <p className="text-sm text-neutral-600">#{report.id.slice(-8)}</p>
          </div>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Share2 size={20} className="text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status and Department */}
        <div className="flex items-center gap-3">
          <span className={`status-badge ${getStatusColor(report.status)}`}>
            {getStatusText(report.status)}
          </span>
          <span className="text-sm text-neutral-600">
            {report.department} Department
          </span>
          {report.aiSuggestion && (
            <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
              AI Suggested ({report.aiSuggestion.confidence}%)
            </span>
          )}
        </div>

        {/* Images */}
        {report.images.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Photos</h2>
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={report.images[currentImageIndex]}
                  alt={`Report image ${currentImageIndex + 1}`}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {report.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {report.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {report.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {report.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                        index === currentImageIndex ? 'ring-2 ring-primary-500' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Description</h2>
          <p className="text-neutral-700 leading-relaxed">{report.description}</p>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Location</h2>
          <div className="space-y-2">
            {report.location.name && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-neutral-500" />
                <span className="text-neutral-700">{report.location.name}</span>
              </div>
            )}
            {report.location.coordinates && (
              <div className="text-sm text-neutral-600 bg-neutral-100 p-3 rounded-lg">
                <strong>Coordinates:</strong> {report.location.coordinates.latitude.toFixed(6)}, {report.location.coordinates.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Timeline</h2>
          <div className="space-y-4">
            {timeline.map((entry, index) => (
              <div key={entry.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    index === timeline.length - 1 ? 'bg-primary-500' : 'bg-neutral-300'
                  }`} />
                  {index < timeline.length - 1 && (
                    <div className="w-px h-8 bg-neutral-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`status-badge ${getStatusColor(entry.status)}`}>
                      {getStatusText(entry.status)}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-neutral-700 text-sm">{entry.message}</p>
                  {entry.authorityResponse && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <User size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-1">Authority Response</p>
                          <p className="text-sm text-blue-700">{entry.authorityResponse}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <Share2 size={20} />
            Share Report
          </button>
          {report.status === 'RESOLVED' && (
            <button className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Star size={20} />
              Rate Service
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsPage;
