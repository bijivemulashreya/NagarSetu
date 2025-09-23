import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import BottomNavigation from './components/BottomNavigation';
import HomePage from './pages/HomePage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailsPage from './pages/ReportDetailsPage';
import ProfilePage from './pages/ProfilePage';
import QueuePage from './pages/QueuePage';
import AuthPage from './pages/AuthPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <OfflineProvider>
          <RealtimeProvider>
            <Router>
            <div className="min-h-screen bg-neutral-50">
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/*" element={
                  <div className="flex flex-col min-h-screen">
                    <main className="flex-1 pb-20">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/reports/:id" element={<ReportDetailsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/queue" element={<QueuePage />} />
                      </Routes>
                    </main>
                    <BottomNavigation />
                  </div>
                } />
              </Routes>
            </div>
            </Router>
          </RealtimeProvider>
        </OfflineProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}

export default App;

