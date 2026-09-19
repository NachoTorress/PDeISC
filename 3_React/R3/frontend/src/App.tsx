import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { HomePage } from './pages/HomePage';
import { RouterDashboardPage } from './pages/router/RouterDashboardPage';
import { RouterLoginPage } from './pages/router/RouterLoginPage';
import { RouterRegisterPage } from './pages/router/RouterRegisterPage';
import { StateSystemPage } from './pages/state/StateSystemPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/router" element={<Navigate to="/router/login" replace />} />
              <Route path="/router/login" element={<RouterLoginPage />} />
              <Route path="/router/register" element={<RouterRegisterPage />} />
              <Route
                path="/router/users"
                element={
                  <ProtectedRoute>
                    <RouterDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/state" element={<StateSystemPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

