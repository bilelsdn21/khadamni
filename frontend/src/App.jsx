import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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


function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Home page */}
          <Route path="/" element={<Home />} />
          <Route path="/map" element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          } />
          
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
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />

          <Route path="/tracking/:requestId" element={
            <ProtectedRoute>
              <TrackingPage />
            </ProtectedRoute>
          } />

          <Route path="/requests" element={
            <ProtectedRoute>
              <Requests />
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
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
