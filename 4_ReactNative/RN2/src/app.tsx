import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { RecordsProvider } from './contexts/RecordsContext';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { RecordsPage } from './pages/RecordsPage';
import { ToolPage } from './pages/ToolPage';
import type { ToolId } from './types';

function Navigator() {
  const { mode } = useTheme();
  const [section, setSection] = useState<'tools' | 'records'>('tools');
  const [tool, setTool] = useState<ToolId | null>(null);
  const back = useCallback(() => {
    setTool(null);
    setSection('tools');
  }, []);
  function navigate(next: 'tools' | 'records') {
    setTool(null);
    setSection(next);
  }
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppShell
        section={section}
        toolOpen={tool !== null}
        navigate={navigate}
        back={back}
        pageKey={`${section}-${tool}`}
      >
        {section === 'records' ? (
          <RecordsPage openTools={back} />
        ) : tool ? (
          <ToolPage key={tool} id={tool} back={back} />
        ) : (
          <HomePage openTool={setTool} openRecords={() => navigate('records')} />
        )}
      </AppShell>
    </>
  );
}

/** Raíz → fuentes locales → temas → registros → navegación sin dependencias adicionales. */
export default function App() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });
  if (!loaded && !error)
    return (
      <View style={{ flex: 1, backgroundColor: '#F4F5EF', justifyContent: 'center', gap: 14 }}>
        <ActivityIndicator color="#285C3D" />
        <Text style={{ color: '#19291F', textAlign: 'center' }}>Abriendo Pulso…</Text>
      </View>
    );
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <RecordsProvider>
            <Navigator />
          </RecordsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
