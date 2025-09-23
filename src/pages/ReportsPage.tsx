import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Eye, ChevronRight, Filter, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useRealtime } from '../contexts/RealtimeContext';
import { Report, ReportStatus, Department } from '../types';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { reports, isLoading, error, refreshReports } = useRealtime();
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'ALL'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update filtered reports when reports or filters change
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    const next = reports.filter((r) => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesDept = departmentFilter === 'ALL' || r.department === departmentFilter;
      const matchesQuery =
        q.length === 0 ||
        r.description.toLowerCase().includes(q) ||
        (r.location.name ? r.location.name.toLowerCase().includes(q) : false);
      return matchesStatus && matchesDept && matchesQuery;
    });

    setFilteredReports(next);
  }, [reports, searchQuery, statusFilter, departmentFilter]);
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setIsRefreshing(true);
    try {
      await refreshReports();
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'QUEUED':
        return 'status-queued';
      case 'UPLOADING':
        return 'status-uploading';
      case 'SYNCED':
        return 'status-synced';
      case 'FAILED':
        return 'status-failed';
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

  const getStatusText = (status: ReportStatus) => {
    switch (status) {
      case 'QUEUED':
        return 'Queued';
      case 'UPLOADING':
        return 'Uploading';
      case 'SYNCED':
        return 'Synced';
      case 'FAILED':
        return 'Failed';
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Reports</h1>
            <p className="text-neutral-600 mt-1">Track your civic problem reports</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={`text-neutral-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'ALL')}
              className="input-field flex-1"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as Department | 'ALL')}
              className="input-field flex-1"
            >
              <option value="ALL">All Departments</option>
              <option value="Roads">Roads</option>
              <option value="Waste">Waste</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No reports found</h3>
            <p className="text-neutral-600 mb-6">
              {searchQuery || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Submit your first civic problem report'
              }
            </p>
            {!searchQuery && statusFilter === 'ALL' && departmentFilter === 'ALL' && (
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Submit Report
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => navigate(`/reports/${report.id}`)}
                className="card cursor-pointer hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex gap-4">
                  {/* Image Thumbnail */}
                  <div className="w-20 h-20 bg-neutral-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {report.images.length > 0 ? (
                      <img
                        src={report.images[0]}
                        alt="Report"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Clock size={24} className="text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Report Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-neutral-900 line-clamp-2">
                        {report.description}
                      </h3>
                      <ChevronRight size={20} className="text-neutral-400 flex-shrink-0 ml-2" />
                    </div>

                    <div className="space-y-2">
                      {/* Status and Department */}
                      <div className="flex items-center gap-2">
                        <span className={`status-badge ${getStatusColor(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                        <span className="text-sm text-neutral-600">
                          {report.department}
                        </span>
                      </div>

                      {/* Location */}
                      {report.location.name && (
                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                          <MapPin size={14} />
                          <span className="truncate">{report.location.name}</span>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-sm text-neutral-500">
                        <Clock size={14} />
                        <span>{formatDate(report.timestamps.deviceReportTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

