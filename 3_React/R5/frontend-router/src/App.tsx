import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { HomePage } from './pages/HomePage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { RouterDashboardPage } from './pages/router/RouterDashboardPage';
import { RouterLoginPage } from './pages/router/RouterLoginPage';
import { RouterRegisterPage } from './pages/router/RouterRegisterPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <RouterLoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RouterRegisterPage />
                  </PublicRoute>
                }
              />
              <Route path="/auth/callback" element={<OAuthCallbackPage />} />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <RouterDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
