import { Linking, Platform, View } from 'react-native';
import { useState } from 'react';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Type } from './Typography';
import { Feedback } from './Feedback';
import { useTheme } from '../contexts/ThemeContext';

/** Si el sistema ya no permite solicitar acceso, guía al usuario a los ajustes. */
export function PermissionGate({
  icon,
  title,
  description,
  canAskAgain,
  request,
  busy = false,
}: {
  icon: IconName;
  title: string;
  description: string;
  canAskAgain: boolean;
  request: () => Promise<unknown>;
  busy?: boolean;
}) {
  const { colors } = useTheme();
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);
  async function allow() {
    setRequesting(true);
    try {
      setError('');
      await request();
    } catch {
      setError('No pudimos solicitar el permiso. Revisá la configuración del dispositivo.');
    } finally {
      setRequesting(false);
    }
  }
  async function settings() {
    try {
      await Linking.openSettings();
    } catch {
      setError('Abrí los ajustes del dispositivo y habilitá el permiso para Pulso.');
    }
  }
  return (
    <View
      style={{
        padding: 28,
        gap: 18,
        alignItems: 'flex-start',
        backgroundColor: colors.raised,
        borderRadius: 16,
      }}
    >
      <Icon name={icon} color={colors.accent} size={40} />
      <Type size={24} weight="semibold">
        {title}
      </Type>
      <Type tone="muted" style={{ maxWidth: 620 }}>
        {description}
      </Type>
      {canAskAgain ? (
        <Button
          label="Permitir acceso"
          icon="shield"
          onPress={() => {
            void allow();
          }}
          busy={busy || requesting}
        />
      ) : (
        <>
          <Type tone="muted">
            El permiso está bloqueado.{' '}
            {Platform.OS === 'web'
              ? 'Habilitalo en la configuración de permisos del navegador y recargá la página.'
              : 'Habilitalo desde los ajustes del dispositivo y volvé a esta pantalla.'}
          </Type>
          {Platform.OS !== 'web' && (
            <Button
              label="Abrir ajustes"
              icon="settings"
              onPress={() => {
                void settings();
              }}
            />
          )}
        </>
      )}
      <Feedback message={error} />
    </View>
  );
}
