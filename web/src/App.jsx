import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Alarms from './pages/Alarms';
import Zones from './pages/Zones';
import MapTracking from './pages/MapTracking';
import SensorCharts from './pages/SensorCharts';
import Profile from './pages/Profile';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={{ padding: '2rem' }}>Yükleniyor...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/devices" element={<PrivateRoute><Devices /></PrivateRoute>} />
          <Route path="/alarms" element={<PrivateRoute><Alarms /></PrivateRoute>} />
          <Route path="/map" element={<PrivateRoute adminOnly><MapTracking /></PrivateRoute>} />
          <Route path="/zones" element={<PrivateRoute adminOnly><Zones /></PrivateRoute>} />
          <Route path="/sensors/:deviceId" element={<PrivateRoute><SensorCharts /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
