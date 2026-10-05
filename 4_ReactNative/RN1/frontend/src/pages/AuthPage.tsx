import React, { useState } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { AuthHero } from '../components/AuthHero';
import { Field } from '../components/Field';
import { ProviderLogo, providerLabel } from '../components/ProviderLogo';
import { SecurityQuestions } from '../components/SecurityQuestions';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { api } from '../services/api';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';
import type { Answer, Purpose, Route, Session } from '../types';
import { answersValid, codeError, emailError, nameError, passwordError } from '../utils/validation';

const blankAnswers = (): Answer[] => [{ questionId: 1, answer: '' }, { questionId: 2, answer: '' }];

export function AuthPage({ route, go, onSession, onOAuth, oauthBusy, palette }: {
  route: Exclude<Route, 'welcome'>;
  go: (route: Route) => void;
  onSession: (session: Session) => Promise<void>;
  onOAuth: (provider: 'google' | 'discord' | 'github') => void;
  oauthBusy: boolean;
  palette: Palette;
}) {
  const s = stylesFor(palette);
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const desktopLogin = Platform.OS === 'web' && wide && route === 'login';
  const action = useAsyncAction();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [answers, setAnswers] = useState<Answer[]>(blankAnswers);
  const [notice, setNotice] = useState('');

  const clearSecrets = () => { setPassword(''); setConfirm(''); setCode(''); setAnswers(blankAnswers()); };
  const navigate = (next: Route) => { action.setError(''); setNotice(''); clearSecrets(); go(next); };
  const loginValid = (!emailError(email) || email.trim().toLowerCase() === 'nacho') && password.length > 0;
  const passwordFormValid = !emailError(email) && !passwordError(password) && password === confirm && answersValid(answers);
  const title = {
    login: 'Iniciá sesión', register: 'Creá tu cuenta', verify: 'Verificá tu correo',
    activate: 'Activá tu contraseña', reset: 'Recuperá el acceso'
  }[route];
  const intro = {
    login: 'Ingresá con tu correo o elegí una cuenta vinculada.',
    register: 'Unos pocos datos y ya estás adentro.',
    verify: 'Escribí el código que llegó a tu correo.',
    activate: 'Confirmá tu correo para sumar el ingreso con contraseña.',
    reset: 'Usá el código de tu correo y tus respuestas de seguridad.'
  }[route];

  async function submit() {
    if (route === 'login') {
      if (!loginValid) return;
      const result = await action.run(() => api.login(email.trim(), password));
      if (result) await onSession(result);
    } else if (route === 'register') {
      if (!passwordFormValid || nameError(name)) return;
      const result = await action.run(() => api.register(email.trim(), name.trim(), password, answers));
      if (result) { clearSecrets(); setNotice(result.message); go('verify'); }
    } else if (route === 'verify') {
      if (emailError(email) || codeError(code)) return;
      const result = await action.run(() => api.verify(email.trim(), code));
      if (result) await onSession(result);
    } else if (route === 'activate') {
      if (!passwordFormValid || codeError(code)) return;
      const result = await action.run(() => api.activate(email.trim(), code, password, answers));
      if (result) await onSession(result);
    } else {
      if (!passwordFormValid || codeError(code)) return;
      const result = await action.run(() => api.reset(email.trim(), code, password, answers));
      if (result) { clearSecrets(); setNotice(result.message); go('login'); }
    }
  }

  async function sendCode(purpose: Purpose, next?: Route) {
    if (emailError(email)) { action.setError('Ingresá primero un correo válido.'); return; }
    const result = await action.run(() => api.requestCode(email.trim(), purpose));
    if (result) { setCode(''); setNotice(result.message); if (next) go(next); }
  }

  const emailField = <Field label={route === 'login' ? 'Correo electrónico o usuario' : 'Correo electrónico'} value={email} onChange={setEmail}
    validate={route === 'login' ? (value) => value.trim().toLowerCase() === 'nacho' ? '' : emailError(value) : emailError}
    keyboard={route === 'login' ? 'default' : 'email-address'} autoComplete={route === 'login' ? 'username' : 'email'} palette={palette} />;
  const passwordField = route !== 'verify' ? <Field label={route === 'login' ? 'Contraseña' : 'Nueva contraseña'} value={password} onChange={setPassword}
    validate={route === 'login' ? (value) => value ? '' : 'Ingresá tu contraseña.' : passwordError} secret
    autoComplete={route === 'login' ? 'current-password' : 'new-password'} palette={palette} /> : null;
  const submitButton = <ActionButton title={{ login: 'Ingresar', register: 'Crear cuenta', verify: 'Verificar e ingresar', activate: 'Activar e ingresar', reset: 'Guardar contraseña' }[route]}
    onPress={submit} busy={action.busy} palette={palette}
    disabled={route === 'login' ? !loginValid : route === 'verify' ? Boolean(emailError(email) || codeError(code)) :
      route === 'register' ? Boolean(!passwordFormValid || nameError(name)) : Boolean(!passwordFormValid || codeError(code))} />;
  const accountRow = <View style={[s.accountRow, !wide ? { flexDirection: 'column', alignItems: 'flex-start' } : undefined]}>
    <Text style={s.accountPrompt}>¿Todavía no tenés cuenta?</Text>
    <TextButton title="Crear una cuenta" onPress={() => navigate('register')} palette={palette} />
  </View>;
  const providers = <>
    <Text style={[s.dividerLabel, desktopLogin ? s.desktopLoginMethodLabel : undefined]}>O ingresá con una cuenta vinculada</Text>
    <View style={s.providerRow}>{(['google', 'discord', 'github'] as const).map((provider) =>
      <Pressable key={provider} accessibilityRole="button" accessibilityLabel={`Ingresar con ${providerLabel[provider]}`}
        accessibilityState={{ disabled: oauthBusy }} disabled={oauthBusy} onPress={() => onOAuth(provider)}
        style={({ pressed }) => [s.providerButton, oauthBusy ? { opacity: 0.55 } : undefined, pressed ? { opacity: 0.75 } : undefined]}>
        <ProviderLogo provider={provider} palette={palette} size={22} />
        <Text style={s.providerText}>{providerLabel[provider]}</Text>
      </Pressable>)}</View>
  </>;
  const help = <>
    <Text style={s.helpTitle}>¿Necesitás ayuda para entrar?</Text>
    <View style={s.helpLinks}>
      <TextButton title="Recuperar contraseña" onPress={() => navigate('reset')} palette={palette} />
      <TextButton title="Activar contraseña" onPress={() => navigate('activate')} palette={palette} />
      <TextButton title="Verificar cuenta" onPress={() => navigate('verify')} palette={palette} />
    </View>
  </>;

  if (desktopLogin) return <View style={s.desktopLoginLayout}>
    <View key={route} style={[s.panel, s.desktopLoginPanel]}>
      <Text style={[s.heading, s.loginHeading]}>{title}</Text>
      <Text style={s.desktopLoginIntro}>{intro}</Text>
      {action.error ? <Text accessibilityRole="alert" style={s.banner}>{action.error}</Text> : null}
      {notice ? <Text style={s.success}>{notice}</Text> : null}
      <View style={s.desktopLoginColumns}>
        <View style={s.desktopLoginPrimary}>
          {emailField}
          {passwordField}
          {submitButton}
          {accountRow}
        </View>
        <View style={s.desktopLoginSecondary}>
          {providers}
          <View style={s.desktopLoginDivider} />
          {help}
        </View>
      </View>
    </View>
  </View>;

  return <View style={[s.authLayout, wide ? { flexDirection: 'row', gap: 20, alignItems: 'stretch' } : { maxWidth: 600 }]}>
    {wide ? <View style={{ flex: 0.9 }}><AuthHero palette={palette} /></View> : null}
    <View key={route} style={[s.panel, wide ? { flex: 1.1 } : { padding: width < 390 ? 22 : 28 }]}>
      <Text style={[s.heading, route === 'login' ? s.loginHeading : undefined]}>{title}</Text>
      <Text style={s.intro}>{intro}</Text>
      {action.error ? <Text accessibilityRole="alert" style={s.banner}>{action.error}</Text> : null}
      {notice ? <Text style={s.success}>{notice}</Text> : null}
      {emailField}
      {route === 'register' ? <Field label="Nombre y apellido" value={name} onChange={setName} validate={nameError} autoCapitalize="words" autoComplete="name" palette={palette} /> : null}
      {route === 'verify' || route === 'activate' || route === 'reset' ?
        <Field label="Código de seis dígitos" value={code} onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} validate={codeError} keyboard="number-pad" autoComplete="sms-otp" palette={palette} /> : null}
      {passwordField}
      {route === 'register' || route === 'activate' || route === 'reset' ? <>
        <Field label="Repetí la contraseña" value={confirm} onChange={setConfirm} secret revealLabel="confirmación de contraseña" autoComplete="new-password" palette={palette}
          validate={(value) => value === password ? '' : 'Las contraseñas no coinciden.'} />
        <SecurityQuestions answers={answers} onChange={setAnswers} palette={palette} />
      </> : null}
      {submitButton}
      {route === 'login' ? <>
        {accountRow}
        <View style={s.divider} />
        {providers}
      </> : null}
      {route === 'verify' ? <TextButton title="Enviar otro código" onPress={() => sendCode('verify_email')} palette={palette} /> : null}
      {route === 'activate' ? <TextButton title="Enviar código" onPress={() => sendCode('activate_local')} palette={palette} /> : null}
      {route === 'reset' ? <TextButton title="Enviar código" onPress={() => sendCode('reset_password')} palette={palette} /> : null}
      {route === 'login' ? <>
        <View style={s.divider} />
        {help}
      </> : <TextButton title="Volver al ingreso" onPress={() => navigate('login')} palette={palette} />}
    </View>
  </View>;
}

function TextButton({ title, onPress, palette }: { title: string; onPress: () => void; palette: Palette }) {
  const s = stylesFor(palette);
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.textButton, pressed ? { opacity: 0.65 } : undefined]}>
    <Text style={s.textButtonText}>{title}</Text>
  </Pressable>;
}
