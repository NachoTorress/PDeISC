import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import { useForeground } from '../../hooks/useForeground';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Type } from '../../components/Typography';
import { Feedback } from '../../components/Feedback';
import { RecordComposer } from '../../components/RecordComposer';
import type { RecordPayload } from '../../types';

const errors: Record<string, string> = {
  user_cancel: 'Cancelaste la verificación. Podés intentarlo otra vez.',
  app_cancel: 'Se canceló la verificación. Volvé a intentar.',
  system_cancel: 'El sistema interrumpió la verificación. Volvé a intentar.',
  lockout:
    'La biometría está bloqueada por varios intentos. Desbloqueá el teléfono y probá más tarde.',
  not_enrolled: 'Configurá una huella o reconocimiento facial en los ajustes del dispositivo.',
  not_available: 'Este dispositivo no dispone de biometría compatible.',
  authentication_failed: 'No se pudo verificar tu identidad. Volvé a intentar.',
  timeout: 'Se agotó el tiempo de verificación. Volvé a intentar.',
  user_fallback: 'La prueba requiere huella o reconocimiento facial. Volvé a intentar.',
};

export function BiometricsTool() {
  const { colors } = useTheme();
  const foreground = useForeground();
  const [checking, setChecking] = useState(true);
  const [hardware, setHardware] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [methods, setMethods] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecordPayload | null>(null);
  const [version, setVersion] = useState(0);
  const mounted = useRef(true);
  const authLock = useRef(false);

  const check = useCallback(async () => {
    if (Platform.OS === 'web') {
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const [available, configured, types] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      if (!mounted.current) return;
      setHardware(available);
      setEnrolled(configured);
      setMethods(
        types
          .map((type) =>
            type === LocalAuthentication.AuthenticationType.FINGERPRINT
              ? 'Huella digital'
              : type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
                ? 'Reconocimiento facial'
                : 'Iris',
          )
          .join(' · '),
      );
    } catch {
      if (mounted.current)
        setError('No se pudo comprobar la biometría. Reintentá la comprobación.');
    } finally {
      if (mounted.current) setChecking(false);
    }
  }, []);
  useEffect(() => {
    if (foreground && !authLock.current) void check();
  }, [foreground, check]);
  useEffect(
    () => () => {
      mounted.current = false;
      if (Platform.OS === 'android' && authLock.current)
        void LocalAuthentication.cancelAuthenticate().catch(() => undefined);
    },
    [],
  );

  async function authenticate() {
    if (authLock.current) return;
    authLock.current = true;
    setBusy(true);
    setError('');
    try {
      const answer = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verificar identidad en Pulso',
        promptSubtitle: 'Prueba de biometría del dispositivo',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
        fallbackLabel: '',
      });
      if (!mounted.current) return;
      if (answer.success)
        setResult({
          kind: 'biometrics',
          method: 'Biometría verificada por el sistema',
          verifiedAt: new Date().toISOString(),
        });
      else
        setError(errors[answer.error] || 'No se pudo completar la verificación. Volvé a intentar.');
    } catch {
      if (mounted.current)
        setError(
          'El sistema no pudo abrir la biometría. Probá en la APK con una huella o un rostro configurado.',
        );
    } finally {
      authLock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  if (checking)
    return <ActivityIndicator color={colors.accent} accessibilityLabel="Comprobando biometría" />;
  if (Platform.OS === 'web')
    return (
      <View style={{ gap: 18 }}>
        <Icon name="phone" size={48} color={colors.accent} />
        <Type size={24} weight="semibold">
          Esta prueba vive en tu teléfono
        </Type>
        <Type tone="muted">
          La biometría nativa está disponible en la aplicación para Android o iOS. Instalá la APK
          para probar una huella o el reconocimiento facial del sistema.
        </Type>
      </View>
    );
  return (
    <View style={{ gap: 24 }}>
      <View
        style={{
          backgroundColor: colors.raised,
          borderRadius: 16,
          padding: 28,
          gap: 18,
          alignItems: 'flex-start',
        }}
      >
        <Icon name={result ? 'shield' : 'biometrics'} color={colors.accent} size={64} />
        <Type size={26} weight="semibold">
          {result
            ? 'Identidad verificada'
            : !hardware
              ? 'Biometría no disponible'
              : !enrolled
                ? 'Falta configurar tu biometría'
                : 'Tu dispositivo te reconoce'}
        </Type>
        <Type tone="muted">
          {result
            ? 'El sistema confirmó tu identidad. Podés guardar el resultado de esta prueba.'
            : !hardware
              ? 'Necesitás un teléfono con lector de huellas o reconocimiento facial compatible.'
              : !enrolled
                ? 'Registrá una huella o un rostro en los ajustes de seguridad y volvé a comprobar.'
                : methods}
        </Type>
        <Type size={13} tone="muted">
          Solo se guarda el resultado y la hora. Las huellas y los datos faciales permanecen
          protegidos por el sistema.
        </Type>
      </View>
      <Feedback message={error} />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {hardware && enrolled && !result && (
          <Button
            label="Verificar mi identidad"
            icon="biometrics"
            busy={busy}
            onPress={() => {
              void authenticate();
            }}
          />
        )}
        {result && (
          <Button
            label="Nueva prueba"
            icon="rotate"
            variant="secondary"
            onPress={() => {
              setResult(null);
              setVersion((previous) => previous + 1);
            }}
          />
        )}
        {!result && (
          <Button
            label="Volver a comprobar"
            icon="rotate"
            variant="secondary"
            disabled={busy}
            onPress={() => {
              setError('');
              void check();
            }}
          />
        )}
        {hardware && !enrolled && (
          <Button
            label="Abrir ajustes"
            icon="settings"
            onPress={() => {
              void Linking.openSettings().catch(() =>
                setError('Abrí los ajustes de seguridad del teléfono para registrar tu biometría.'),
              );
            }}
          />
        )}
      </View>
      {result && <RecordComposer key={version} payload={result} title="Verificación biométrica" />}
    </View>
  );
}
