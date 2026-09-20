/**
 * Root Application Component.
 * Integrates theme providers, authentication context, data context, and global layout.
 */
import { Layout } from './components/layout/Layout';
import { GlobalStyles } from './styles/GlobalStyles';
import { ThemeProvider } from '@emotion/react';
import { theme } from './styles/theme';
import { PortfolioThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { PortfolioPage } from './pages/PortfolioPage';

function App() {
  return (
    <PortfolioThemeProvider>
      <AuthProvider>
        <DataProvider>
          <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Layout>
              <PortfolioPage />
            </Layout>
          </ThemeProvider>
        </DataProvider>
      </AuthProvider>
    </PortfolioThemeProvider>
  );
}

export default App;
