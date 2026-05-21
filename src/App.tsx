import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Device from './pages/Device';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { useApp } from './context/AppContext';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useApp();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="history"  element={<History />} />
        <Route path="device"   element={<Device />} />
        <Route path="alerts"   element={<Alerts />} />
        <Route path="profile"  element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
