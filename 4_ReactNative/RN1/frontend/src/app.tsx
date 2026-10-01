import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, useColorScheme, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { AuthPage } from './pages/AuthPage';
import { WelcomePage } from './pages/WelcomePage';
import { api, apiBase } from './services/api';
import { palette, stylesFor } from './styles/theme';
import type { Route, Session } from './types';

const redirectUrl = 'accesoexpo://auth';

function AppContent() {
  const systemMode = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(systemMode === 'dark' ? 'dark' : 'light');
  const [route, setRoute] = useState<Route>('login');
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthError, setOauthError] = useState(() => Platform.OS === 'web' ? new URLSearchParams(window.location.search).get('error') || '' : '');
  const [showTop, setShowTop] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { user, loading, signIn, signOut } = useSession();
  const c = palette(mode);
  const s = stylesFor(c);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get('ticket');
    const error = params.get('error');
    if (!ticket && !error) return;
    window.history.replaceState({}, '', window.location.pathname);
    if (error) return;
    if (ticket) api.redeem(ticket).then(signIn).catch((problem) => setOauthError(problem instanceof Error ? problem.message : 'No se pudo ingresar.'));
  }, [signIn]);

  async function acceptSession(session: Session) {
    await signIn(session);
    setRoute('welcome');
  }

  async function oauthLogin(provider: 'google' | 'discord' | 'github') {
    setOauthError('');
    if (!apiBase) { setOauthError('Configurá EXPO_PUBLIC_API_URL.'); return; }
    const web = Platform.OS === 'web';
    const startUrl = `${apiBase}/auth/oauth/${provider}/start${web ? '?target=web' : ''}`;
    setOauthBusy(true);
    if (web) {
      window.location.assign(startUrl);
      return;
    }
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        startUrl,
        redirectUrl
      );
      if (result.type !== 'success') return;
      const url = new URL(result.url);
      const error = url.searchParams.get('error');
      if (error) throw new Error(error);
      const ticket = url.searchParams.get('ticket');
      if (!ticket) throw new Error('No se recibió la autorización.');
      await acceptSession(await api.redeem(ticket));
    } catch (error) {
      setOauthError(error instanceof Error ? error.message : 'No se pudo ingresar.');
    } finally { setOauthBusy(false); }
  }

  return <SafeAreaView style={s.screen}>
  <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.background} />
  <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={scrollRef} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"
      onScroll={(event) => setShowTop(event.nativeEvent.contentOffset.y > 400)} scrollEventThrottle={150}>
      <View style={s.content}>
        <View style={s.top}>
          <Text style={s.brand}>acceso<Text style={s.brandDot}>.</Text></Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Activar modo ${mode === 'light' ? 'oscuro' : 'claro'}`}
            onPress={() => setMode(mode === 'light' ? 'dark' : 'light')} style={s.themeButton}>
            <FontAwesome5 name={mode === 'light' ? 'moon' : 'sun'} solid size={18} color={c.text} />
          </Pressable>
        </View>
        {loading ? <ActivityIndicator color={c.accent} /> : user ?
          <WelcomePage user={user} onLogout={signOut} palette={c} /> : <>
            {oauthError ? <Text accessibilityRole="alert" style={s.banner}>{oauthError}</Text> : null}
            <AuthPage route={route === 'welcome' ? 'login' : route} go={setRoute} onSession={acceptSession} onOAuth={oauthLogin} oauthBusy={oauthBusy} palette={c} />
          </>}
        <Text style={s.footer}>Acceso seguro · Tu sesión permanece en este equipo</Text>
      </View>
    </ScrollView>
    {showTop ? <Pressable accessibilityRole="button" onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      style={{ position: 'absolute', right: 22, bottom: 22, backgroundColor: c.accent, borderRadius: 24, paddingHorizontal: 17, paddingVertical: 12 }}>
      <Text style={{ color: c.accentText, fontWeight: '800' }}>Volver arriba</Text>
    </Pressable> : null}
  </KeyboardAvoidingView>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><SessionProvider><AppContent /></SessionProvider></SafeAreaProvider>; }
