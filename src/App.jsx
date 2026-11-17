import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Handovers from './pages/Handovers.jsx';
import HandoverForm from './pages/HandoverForm.jsx';
import HandoverDetail from './pages/HandoverDetail.jsx';
import Team from './pages/Team.jsx';
import Notifications from './pages/Notifications.jsx';
import Account from './pages/Account.jsx';

export default function App() {
  const { user, loading, isHead } = useAuth();
  if (loading) return <div className="center-screen"><div className="spinner" /></div>;
  if (!user) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/handovers" element={<Handovers />} />
        <Route path="/handovers/new" element={<HandoverForm />} />
        <Route path="/handovers/:id/edit" element={<HandoverForm />} />
        <Route path="/handovers/:id" element={<HandoverDetail />} />
        {isHead && <Route path="/team" element={<Team />} />}
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
