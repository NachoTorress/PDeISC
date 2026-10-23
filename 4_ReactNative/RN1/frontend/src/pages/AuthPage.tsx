import React, { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ActionButton } from '../components/ActionButton';
import { AuthHero } from '../components/AuthHero';
import { Field } from '../components/Field';
import { ProviderLogo, providerLabel } from '../components/ProviderLogo';
import { SecurityQuestions } from '../components/SecurityQuestions';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { api } from '../services/api';
import type { Palette } from '../styles/theme';
import { metrics, stylesFor } from '../styles/theme';
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
  const wide = width >= metrics.breakpoint;
  const mobilePadding = width < 390 ? 22 : 28;
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
  const loginValid = !emailError(email) && password.length > 0;
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
    if (action.busy) return;
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

  const emailField = <Field label="Correo electrónico" value={email} onChange={setEmail} placeholder="vos@ejemplo.com" icon="envelope"
    validate={emailError} keyboard="email-address" autoComplete="email" palette={palette} />;
  const passwordField = route !== 'verify' ? <Field label={route === 'login' ? 'Contraseña' : 'Nueva contraseña'} value={password} onChange={setPassword}
    validate={route === 'login' ? (value) => value ? '' : 'Ingresá tu contraseña.' : passwordError} secret
    placeholder={route === 'login' ? 'Tu contraseña' : '8 caracteres, letras y números'} icon="lock"
    labelAction={route === 'login' ? { title: 'Recuperar contraseña', onPress: () => navigate('reset') } : undefined}
    onSubmit={route === 'login' ? () => void submit() : undefined}
    autoComplete={route === 'login' ? 'current-password' : 'new-password'} palette={palette} /> : null;
  const submitButton = <ActionButton title={{ login: 'Ingresar', register: 'Crear cuenta', verify: 'Verificar e ingresar', activate: 'Activar e ingresar', reset: 'Guardar contraseña' }[route]}
    onPress={submit} busy={action.busy} palette={palette} icon={route === 'login' ? 'sign-in-alt' : route === 'register' ? 'user-plus' : 'check'}
    disabled={route === 'login' ? !loginValid : route === 'verify' ? Boolean(emailError(email) || codeError(code)) :
      route === 'register' ? Boolean(!passwordFormValid || nameError(name)) : Boolean(!passwordFormValid || codeError(code))} />;
  const accountRow = <View style={s.accountRow}>
    <Text style={s.accountPrompt}>¿Todavía no tenés cuenta?</Text>
    <TextButton title="Crear una cuenta" onPress={() => navigate('register')} palette={palette} />
  </View>;
  const providers = <>
    <View style={s.dividerRow}>
      <View style={s.dividerLine} />
      <Text style={s.dividerLabel}>o continuá con</Text>
      <View style={s.dividerLine} />
    </View>
    <View style={s.providerRow}>{(['google', 'discord', 'github'] as const).map((provider) =>
      <Pressable key={provider} accessibilityRole="button" accessibilityLabel={`Ingresar con ${providerLabel[provider]}`}
        accessibilityState={{ disabled: oauthBusy }} disabled={oauthBusy} onPress={() => onOAuth(provider)}
        style={({ pressed }) => [s.providerButton, provider === 'google' ? s.providerGoogle : provider === 'discord' ? s.providerDiscord : s.providerGithub,
          oauthBusy ? { opacity: 0.55 } : undefined, pressed ? s.controlPressed : undefined]}>
        <ProviderLogo provider={provider} palette={palette} size={17} />
        <Text style={s.providerText}>{providerLabel[provider]}</Text>
      </Pressable>)}</View>
  </>;
  const help = <>
    <Text style={s.helpTitle}>Otras opciones de acceso</Text>
    <View style={s.helpLinks}>
      <Pressable accessibilityRole="button" onPress={() => navigate('activate')}
        style={({ pressed }) => [s.helpButton, pressed ? s.controlPressed : undefined]}>
        <FontAwesome5 name="key" size={13} color={palette.secondaryText} />
        <Text style={s.helpButtonText}>Activar contraseña</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigate('verify')}
        style={({ pressed }) => [s.helpButton, pressed ? s.controlPressed : undefined]}>
        <FontAwesome5 name="envelope-open" size={13} color={palette.secondaryText} />
        <Text style={s.helpButtonText}>Verificar cuenta</Text>
      </Pressable>
    </View>
  </>;

  return <View style={[s.authLayout, wide ? s.authLayoutWide : undefined]}>
    {wide ? <View style={s.heroColumn}><AuthHero palette={palette} /></View> : null}
    <View key={route} style={[s.panel, wide ? s.panelColumn : { padding: mobilePadding }]}>
      <View style={!wide ? [s.mobilePanelHeader, { marginHorizontal: -mobilePadding, marginTop: -mobilePadding, padding: mobilePadding }] : undefined}>
        <Text style={[s.panelEyebrow, !wide ? { color: palette.highlight } : undefined]}>{{ login: 'Qué bueno verte de nuevo', register: 'Empezá por acá', verify: 'Un paso más', activate: 'Una nueva forma de entrar', reset: 'Volvamos a tu cuenta' }[route]}</Text>
        <Text accessibilityRole="header" style={[s.heading, !wide ? { color: palette.heroText } : undefined]}>{title}</Text>
        <Text style={[s.intro, !wide ? { color: palette.heroMuted, marginBottom: 0 } : undefined]}>{intro}</Text>
      </View>
      {action.error ? <Text accessibilityRole="alert" style={s.banner}>{action.error}</Text> : null}
      {notice ? <Text style={s.success}>{notice}</Text> : null}
      {emailField}
      {route === 'register' ? <Field label="Nombre y apellido" value={name} onChange={setName} validate={nameError} placeholder="Cómo te llamás" icon="user" autoCapitalize="words" autoComplete="name" palette={palette} /> : null}
      {route === 'verify' || route === 'activate' || route === 'reset' ?
        <Field label="Código de seis dígitos" value={code} placeholder="000000" icon="envelope-open-text" onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} validate={codeError} keyboard="number-pad" autoComplete="sms-otp" palette={palette} /> : null}
      {passwordField}
      {route === 'register' || route === 'activate' || route === 'reset' ? <>
        <Field label="Repetí la contraseña" value={confirm} onChange={setConfirm} placeholder="Escribila una vez más" icon="lock" secret revealLabel="confirmación de contraseña" autoComplete="new-password" palette={palette}
          validate={(value) => value === password ? '' : 'Las contraseñas no coinciden.'} />
        <SecurityQuestions answers={answers} onChange={setAnswers} palette={palette} />
      </> : null}
      {submitButton}
      {route === 'login' ? <>
        {providers}
        {accountRow}
      </> : null}
      {route === 'verify' ? <TextButton title="Enviar otro código" onPress={() => sendCode('verify_email')} palette={palette} /> : null}
      {route === 'activate' ? <TextButton title="Enviar código" onPress={() => sendCode('activate_local')} palette={palette} /> : null}
      {route === 'reset' ? <TextButton title="Enviar código" onPress={() => sendCode('reset_password')} palette={palette} /> : null}
      {route === 'login' ? <>
        <View style={s.divider} />
        {help}
      </> : <Pressable accessibilityRole="button" onPress={() => navigate('login')} style={[s.textButton, s.backButton]}>
        <FontAwesome5 name="arrow-left" size={12} color={palette.accent} />
        <Text style={s.textButtonText}>Volver al ingreso</Text>
      </Pressable>}
    </View>
  </View>;
}

function TextButton({ title, onPress, palette }: { title: string; onPress: () => void; palette: Palette }) {
  const s = stylesFor(palette);
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.textButton, pressed ? { opacity: 0.65 } : undefined]}>
    <Text style={s.textButtonText}>{title}</Text>
  </Pressable>;
}
