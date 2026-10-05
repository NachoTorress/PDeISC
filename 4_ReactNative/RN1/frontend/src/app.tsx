import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { AuthPage } from './pages/AuthPage';
import { WelcomePage } from './pages/WelcomePage';
import { api, apiBase } from './services/api';
import { palette, stylesFor } from './styles/theme';
import type { Route, Session } from './types';

function AppContent() {
  const systemMode = useColorScheme();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'light' | 'dark'>(systemMode === 'dark' ? 'dark' : 'light');
  const [route, setRoute] = useState<Route>('login');
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthError, setOauthError] = useState(() => Platform.OS === 'web' ? new URLSearchParams(window.location.search).get('error') || '' : '');
  const [oauthNotice, setOauthNotice] = useState('');
  const oauthAttempt = useRef(0);
  const [showTop, setShowTop] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { user, loading, signIn, signOut } = useSession();
  const c = palette(mode);
  const s = stylesFor(c);
  const desktopLogin = Platform.OS === 'web' && !user && route === 'login' && width >= 850;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [route, user]);

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
    const attempt = ++oauthAttempt.current;
    setOauthError('');
    setOauthNotice('');
    if (!apiBase) { setOauthError('Configurá EXPO_PUBLIC_API_URL.'); return; }
    const web = Platform.OS === 'web';
    const startUrl = `${apiBase}/auth/oauth/${provider}/start${web ? '?target=web' : ''}`;
    setOauthBusy(true);
    if (web) {
      window.location.assign(startUrl);
      return;
    }
    try {
      const { url, pollToken } = await api.oauthDeviceStart(provider);
      if (attempt !== oauthAttempt.current) return;
      setOauthNotice('Completá el acceso en el navegador y volvé a Expo Go.');
      await WebBrowser.openBrowserAsync(url);
      const deadline = Date.now() + 15 * 60 * 1000;
      while (attempt === oauthAttempt.current && Date.now() < deadline) {
        const result = await api.oauthDevicePoll(pollToken);
        if (attempt !== oauthAttempt.current) return;
        if (result.status === 'complete') {
          await acceptSession(result.session);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      if (attempt === oauthAttempt.current) throw new Error('El acceso venció. Volvé a intentarlo.');
    } catch (error) {
      if (attempt === oauthAttempt.current) setOauthError(error instanceof Error ? error.message : 'No se pudo ingresar.');
    } finally {
      if (attempt === oauthAttempt.current) {
        setOauthBusy(false);
        setOauthNotice('');
      }
    }
  }

  function cancelOauth() {
    oauthAttempt.current += 1;
    setOauthBusy(false);
    setOauthNotice('');
  }

  return <SafeAreaView style={s.screen}>
  <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.background} />
  <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={scrollRef} contentContainerStyle={[s.scroll, desktopLogin ? s.desktopLoginScroll : undefined]} keyboardShouldPersistTaps="handled"
      onScroll={(event) => setShowTop(event.nativeEvent.contentOffset.y > 400)} scrollEventThrottle={150}>
      <View style={s.content}>
        <View style={[s.top, desktopLogin ? s.desktopLoginTop : undefined]}>
          <Text style={s.brand}>acceso<Text style={s.brandDot}>.</Text></Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Activar modo ${mode === 'light' ? 'oscuro' : 'claro'}`}
            onPress={() => setMode(mode === 'light' ? 'dark' : 'light')} style={s.themeButton}>
            <FontAwesome5 name={mode === 'light' ? 'moon' : 'sun'} solid size={18} color={c.text} />
          </Pressable>
        </View>
        {loading ? <View style={[s.panel, s.loadingPanel]} accessibilityLiveRegion="polite">
          <ActivityIndicator color={c.accent} />
          <Text style={s.loadingText}>Comprobando tu sesión…</Text>
        </View> : user ?
          <WelcomePage user={user} onLogout={signOut} palette={c} /> : <>
            {oauthError ? <Text accessibilityRole="alert" style={s.banner}>{oauthError}</Text> : null}
            {oauthNotice ? <View style={s.panel}>
              <Text style={s.intro}>{oauthNotice}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cancelar acceso con proveedor" onPress={cancelOauth}>
                <Text style={{ color: c.accent, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
            </View> : null}
            <AuthPage route={route === 'welcome' ? 'login' : route} go={setRoute} onSession={acceptSession} onOAuth={oauthLogin} oauthBusy={oauthBusy} palette={c} />
          </>}
        <Text style={s.footer}>Acceso seguro · Tu sesión permanece en este equipo</Text>
      </View>
    </ScrollView>
    {showTop ? <Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio" onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
      style={{ position: 'absolute', right: 22, bottom: 22, backgroundColor: c.accent, borderRadius: 24, paddingHorizontal: 17, paddingVertical: 12 }}>
      <Text style={{ color: c.accentText, fontWeight: '800' }}>Volver arriba</Text>
    </Pressable> : null}
  </KeyboardAvoidingView>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><SessionProvider><AppContent /></SessionProvider></SafeAreaProvider>; }
