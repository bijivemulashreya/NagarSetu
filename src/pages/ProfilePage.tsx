import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Bell, Globe, HelpCircle, LogOut, UserCheck, BarChart3 } from 'lucide-react';
import { reportService } from '../services/reportService';

const ProfilePage: React.FC = () => {
  const { user, signOut, signInAnonymously } = useAuth();
  const { reports } = useRealtime();
  const navigate = useNavigate();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Calculate statistics from reports
  useEffect(() => {
    if (!user) {
      setStats({ total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 });
      setIsLoadingStats(false);
      return;
    }

    const calculateStats = async () => {
      try {
        setIsLoadingStats(true);
        const userStats = await reportService.getUserReportStats(user.id);
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to calculating from local reports
        const localStats = {
          total: reports.length,
          pending: reports.filter(r => r.status === 'PENDING').length,
          inProgress: reports.filter(r => r.status === 'IN_PROGRESS').length,
          resolved: reports.filter(r => r.status === 'RESOLVED').length,
          rejected: reports.filter(r => r.status === 'REJECTED').length
        };
        setStats(localStats);
      } finally {
        setIsLoadingStats(false);
      }
    };

    calculateStats();
  }, [user, reports]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      await signInAnonymously();
    } catch (error) {
      console.error('Anonymous sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
        <p className="text-neutral-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="p-4 space-y-6">
        {/* User Info */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900">
                {user?.isAnonymous ? 'Anonymous User' : user?.email || 'Guest User'}
              </h2>
              <p className="text-sm text-neutral-600">
                {user?.isAnonymous ? 'Using app without account' : 'Registered user'}
              </p>
            </div>
            {user?.isAnonymous && (
              <button
                onClick={() => navigate('/auth')}
                className="btn-outline text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Your Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-800">
                {isLoadingStats ? '...' : stats.total}
              </div>
              <div className="text-sm text-neutral-600">Total Reports</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary-600">
                {isLoadingStats ? '...' : stats.resolved}
              </div>
              <div className="text-sm text-neutral-600">Resolved</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-accent-600">
                {isLoadingStats ? '...' : stats.pending}
              </div>
              <div className="text-sm text-neutral-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {isLoadingStats ? '...' : stats.rejected}
              </div>
              <div className="text-sm text-neutral-600">Rejected</div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Settings size={20} />
            Settings
          </h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-neutral-500" />
                <span className="text-neutral-900">Notifications</span>
              </div>
              <span className="text-sm text-neutral-500">Enabled</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-neutral-500" />
                <span className="text-neutral-900">Language</span>
              </div>
              <span className="text-sm text-neutral-500">English</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle size={20} className="text-neutral-500" />
                <span className="text-neutral-900">Help & Support</span>
              </div>
              <span className="text-sm text-neutral-500">›</span>
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Account</h2>
          <div className="space-y-3">
            {user?.isAnonymous ? (
              <button
                onClick={handleContinueAsGuest}
                className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors text-left"
              >
                <UserCheck size={20} className="text-neutral-500" />
                <span className="text-neutral-900">Continue as Guest</span>
              </button>
            ) : (
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-left text-red-600"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-neutral-500 space-y-1">
          <p>NagarSetu v1.0.0</p>
          <p>Built for civic engagement</p>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Sign Out</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to sign out? You'll need to sign in again to access your reports.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;


