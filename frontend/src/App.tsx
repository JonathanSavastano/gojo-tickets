import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import TicketDetailPage from './pages/TicketDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import CreateOrgPage from './pages/CreateOrgPage';
import JoinOrgPage from './pages/JoinOrgPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OrgRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.org_id) return <Navigate to="/org/create" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading...</p>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/org/create"
        element={
          <ProtectedRoute>
            <CreateOrgPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/org/join"
        element={
          <ProtectedRoute>
            <JoinOrgPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <OrgRoute>
            <DashboardPage />
          </OrgRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <OrgRoute>
            <ProjectPage />
          </OrgRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <OrgRoute>
            <TicketDetailPage />
          </OrgRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <OrgRoute>
            <AdminUsersPage />
          </OrgRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="main-content">
          <AppRoutes />
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
