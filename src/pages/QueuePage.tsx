import React, { useState, useEffect } from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { useNetwork } from '../contexts/NetworkContext';
import { ArrowLeft, RefreshCw, Trash2, Edit3, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QueuedReport } from '../types';

const QueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { queuedReports, queueStats, refreshQueue, syncQueue } = useOffline();
  const { isOnline } = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    refreshQueue();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncQueue();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (report: QueuedReport) => {
    setEditingReport(report.id);
    setEditDescription(report.report.description);
  };

  const handleSaveEdit = async (reportId: string) => {
    try {
      // Update the report description
      // This would call the offline queue service to update the report
      console.log('Updating report:', reportId, editDescription);
      setEditingReport(null);
      setEditDescription('');
      await refreshQueue();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setEditDescription('');
  };

  const handleDelete = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this queued report?')) {
      try {
        // Delete from queue
        console.log('Deleting report:', reportId);
        await refreshQueue();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUEUED':
        return 'status-queued';
      case 'UPLOADING':
        return 'status-uploading';
      case 'FAILED':
        return 'status-failed';
      default:
        return 'status-queued';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'QUEUED':
        return 'Queued';
      case 'UPLOADING':
        return 'Uploading';
      case 'FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-neutral-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-neutral-900">Offline Queue</h1>
            <p className="text-sm text-neutral-600">
              {queueStats.total} report{queueStats.total !== 1 ? 's' : ''} in queue
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={!isOnline || isSyncing || queueStats.total === 0}
            className="btn-outline flex items-center gap-2"
          >
            {isSyncing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : isOnline ? (
              <Wifi size={16} />
            ) : (
              <WifiOff size={16} />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Network Status */}
        {!isOnline && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <AlertCircle size={20} />
            <span className="text-sm">You're offline. Reports will sync when you're back online.</span>
          </div>
        )}

        {/* Queue Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-neutral-800">{queueStats.queued}</div>
            <div className="text-sm text-neutral-600">Queued</div>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-accent-600">{queueStats.uploading}</div>
            <div className="text-sm text-neutral-600">Uploading</div>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
            <div className="text-sm text-neutral-600">Failed</div>
          </div>
        </div>

        {/* Queue Items */}
        {queuedReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Queue is empty</h3>
            <p className="text-neutral-600 mb-6">
              No reports are currently queued for upload.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Submit Report
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {queuedReports.map((queuedReport) => (
              <div key={queuedReport.id} className="card">
                <div className="flex gap-4">
                  {/* Image Thumbnail */}
                  <div className="w-20 h-20 bg-neutral-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {queuedReport.report.images.length > 0 ? (
                      <img
                        src={queuedReport.report.images[0]}
                        alt="Report"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <AlertCircle size={24} className="text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Report Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {editingReport === queuedReport.id ? (
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full p-2 border border-neutral-300 rounded text-sm"
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm text-neutral-900 line-clamp-2">
                            {queuedReport.report.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span className={`status-badge ${getStatusColor(queuedReport.status)}`}>
                          {getStatusText(queuedReport.status)}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {queuedReport.report.department}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-neutral-500">
                        Queued: {formatDate(queuedReport.createdAt)}
                      </div>

                      {/* Retry count for failed items */}
                      {queuedReport.status === 'FAILED' && queuedReport.retryCount > 0 && (
                        <div className="text-xs text-red-600">
                          Retry attempts: {queuedReport.retryCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {editingReport === queuedReport.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(queuedReport.id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(queuedReport)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(queuedReport.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sync Instructions */}
        {queueStats.total > 0 && !isOnline && (
          <div className="text-center text-sm text-neutral-600 bg-neutral-100 p-4 rounded-lg">
            <p className="mb-2">Connect to the internet to sync your queued reports.</p>
            <p>Reports will be automatically uploaded when you're back online.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueuePage;






