import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { TabBar } from "./components/layout/TabBar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WeightPage from "./pages/WeightPage";
import ActivityPage from "./pages/ActivityPage";
import TeamPage from "./pages/TeamPage";
import ChartsPage from "./pages/ChartsPage";
import ProfilePage from "./pages/ProfilePage";
import { Scale } from "lucide-react";
import "./index.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Scale size={48} className="animate-pulse" style={{ color: "var(--primary)" }} />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="page-content">{children}</main>
      <TabBar />
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Scale size={48} className="animate-pulse" style={{ color: "var(--primary)" }} />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/weight" element={<ProtectedRoute><AppLayout><WeightPage /></AppLayout></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><AppLayout><ActivityPage /></AppLayout></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><AppLayout><TeamPage /></AppLayout></ProtectedRoute>} />
      <Route path="/charts" element={<ProtectedRoute><AppLayout><ChartsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
