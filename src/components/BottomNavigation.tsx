import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, List, User, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useOffline } from '../contexts/OfflineContext';

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { queueStats } = useOffline();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Report',
      showBadge: false
    },
    {
      path: '/reports',
      icon: List,
      label: 'My Reports',
      showBadge: false
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile',
      showBadge: false
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 touch-target ${
                active
                  ? 'text-primary-800 bg-primary-50'
                  : 'text-neutral-600 hover:text-primary-800 hover:bg-neutral-50'
              }`}
            >
              <div className="relative">
                <Icon size={24} />
                {item.showBadge && queueStats.total > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {queueStats.total}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </button>
          );
        })}
        
        {/* Queue Status Indicator */}
        {queueStats.total > 0 && (
          <button
            onClick={() => navigate('/queue')}
            className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 touch-target text-accent-600 hover:text-accent-700 hover:bg-accent-50"
          >
            <div className="relative">
              {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
              <span className="absolute -top-1 -right-1 bg-accent-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {queueStats.total}
              </span>
            </div>
            <span className="text-xs font-medium mt-1">Queue</span>
          </button>
        )}
      </div>
      
      {/* Network Status Bar */}
      {!isOnline && (
        <div className="absolute -top-8 left-0 right-0 bg-red-100 text-red-800 text-center py-1 text-sm font-medium">
          Offline - Reports will be queued
        </div>
      )}
    </nav>
  );
};

export default BottomNavigation;

