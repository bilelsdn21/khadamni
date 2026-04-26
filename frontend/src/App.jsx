import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Map from './pages/Map';
import Profile from './pages/Profile';
import ChatPage from './pages/ChatPage';
import TrackingPage from './pages/TrackingPage';
import Requests from './pages/Requests';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingChat from './components/FloatingChat';
import ModeratorDashboard from './pages/ModeratorDashboard';
import NotificationsPage from './pages/NotificationsPage';
import SupportPage from './pages/SupportPage';
import useAuth from './hooks/useAuth';

function ModeratorRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || user?.role !== 'moderator') return <Navigate to="/" replace />;
  return children;
}

// Blocks moderators from client/provider-only pages
function NonModeratorRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'moderator') return <Navigate to="/moderator" replace />;
  return children;
}

function SuspensionGuard() {
  const { user, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!user?.suspended) return;
    const until = user.suspended_until ? new Date(user.suspended_until) : null;
    if (!until) { setTimeLeft('Permanent suspension'); return; }

    const update = () => {
      const diff = until - Date.now();
      if (diff <= 0) { setTimeLeft(''); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user?.suspended) return null;
  const until = user.suspended_until ? new Date(user.suspended_until) : null;
  if (until && until <= Date.now() && timeLeft === '') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">Account Suspended</h1>
          <p className="text-white/50 text-sm mt-1">Your access to Khadamni has been restricted</p>
        </div>

        {/* Reason */}
        {user.suspended_reason && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-[16px] p-4 text-left">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Reason</p>
            <p className="text-white/80 text-sm">{user.suspended_reason}</p>
          </div>
        )}

        {/* Countdown */}
        <div className="bg-[#1E293B] border border-white/10 rounded-[16px] p-5">
          {until ? (
            <>
              <p className="text-white/40 text-xs mb-1">Time remaining</p>
              <p className="text-3xl font-mono font-bold text-red-400">{timeLeft || 'Expired'}</p>
              <p className="text-white/30 text-xs mt-2">
                Suspended until {until.toLocaleString()}
              </p>
            </>
          ) : (
            <p className="text-red-400 font-semibold">Permanently suspended</p>
          )}
        </div>

        <p className="text-white/30 text-xs">
          If you believe this is a mistake, contact support.
        </p>

        <button
          onClick={logout}
          className="w-full py-3 rounded-[14px] border border-white/10 text-white/60 hover:bg-white/5 text-sm font-medium transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}


function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <SuspensionGuard />
        <Routes>
          {/* Home page */}
          <Route path="/" element={<Home />} />
          <Route path="/map" element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          } />

          {/* Moderator can view their own profile or public provider profiles */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/provider/:id" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/chat/:requestId" element={
            <NonModeratorRoute>
              <ChatPage />
            </NonModeratorRoute>
          } />

          <Route path="/tracking/:requestId" element={
            <NonModeratorRoute>
              <TrackingPage />
            </NonModeratorRoute>
          } />

          <Route path="/requests" element={
            <NonModeratorRoute>
              <Requests />
            </NonModeratorRoute>
          } />

          <Route path="/moderator" element={
            <ModeratorRoute>
              <ModeratorDashboard />
            </ModeratorRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />

          <Route path="/support" element={
            <ProtectedRoute>
              <SupportPage />
            </ProtectedRoute>
          } />

          {/* Auth pages */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FloatingChat />
      </BrowserRouter>
    </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
