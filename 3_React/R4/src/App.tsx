import { Layout } from './components/layout/Layout';
import { GlobalStyles } from './styles/GlobalStyles';
import { ThemeProvider } from '@emotion/react';
import { theme } from './styles/theme';
import { PortfolioThemeProvider } from './contexts/ThemeContext';
import { PortfolioPage } from './pages/PortfolioPage';

function App() {
  return (
    <PortfolioThemeProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <Layout>
          <PortfolioPage />
        </Layout>
      </ThemeProvider>
    </PortfolioThemeProvider>
  );
}

export default App;
