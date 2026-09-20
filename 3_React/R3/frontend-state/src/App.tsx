import { useState } from 'react';
import { Layout } from './components/Layout';
import type { StateScreen } from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { StateSystemPage } from './pages/state/StateSystemPage';

export function App() {
  const [screen, setScreen] = useState<StateScreen>('login');

  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout currentScreen={screen} onNavigateScreen={setScreen}>
          <StateSystemPage screen={screen} setScreen={setScreen} />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}
