import React, { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { AuthHero } from '../components/AuthHero';
import { ProviderLogo, providerLabel } from '../components/ProviderLogo';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';
import type { User } from '../types';

// Los datos llegan por props desde App luego de iniciar sesión o restaurarla.
export function WelcomePage({ user, onLogout, palette }: { user: User; onLogout: () => Promise<void>; palette: Palette }) {
  const s = stylesFor(palette);
  const { width } = useWindowDimensions();
  const wide = width >= 850;
  const [confirmLogout, setConfirmLogout] = useState(false);
  const date = new Date(user.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  return <View style={[s.authLayout, wide ? { flexDirection: 'row', gap: 20 } : { maxWidth: 600 }]}>
    {wide ? <View style={{ flex: 0.9 }}><AuthHero palette={palette} welcome /></View> : null}
    <View style={[s.panel, wide ? { flex: 1.1 } : { padding: width < 390 ? 22 : 28 }]}>
      <Text style={s.heading}>¡Bienvenido, {user.displayName}!</Text>
      <Text style={s.intro}>Tu acceso fue confirmado.</Text>
      <Text style={s.smallTitle}>Tu cuenta</Text>
      <Text style={s.detail}>Correo: <Text style={s.detailStrong}>{user.email}</Text></Text>
      <Text style={s.detail}>Rol: <Text style={s.detailStrong}>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</Text></Text>
      <Text style={s.detail}>Creada: <Text style={s.detailStrong}>{date}</Text></Text>
      <View style={s.divider} />
      <Text style={s.smallTitle}>Redes vinculadas</Text>
      <View style={s.linkedProviderRow}>
        {(['google', 'discord', 'github'] as const).map((provider) => {
          const linked = user.linkedProviders?.includes(provider) ?? false;
          const label = providerLabel[provider];
          return <View key={provider} style={[s.linkedProvider, linked ? s.linkedProviderActive : undefined]}
            accessibilityLabel={`${label}: ${linked ? 'vinculada' : 'sin vincular'}`}>
            <ProviderLogo provider={provider} palette={palette} size={19} />
            <Text style={s.linkedProviderName}>{label}</Text>
            <Text style={[s.linkedProviderState, linked ? { color: palette.accent } : undefined]}>{linked ? 'Vinculada' : 'Sin vincular'}</Text>
          </View>;
        })}
      </View>
      <View style={s.divider} />
      {confirmLogout ? <View>
        <Text style={s.smallTitle}>¿Estás seguro de que querés cerrar sesión?</Text>
        <ActionButton title="Sí, cerrar sesión" onPress={() => void onLogout()} palette={palette} />
        <ActionButton title="Cancelar" onPress={() => setConfirmLogout(false)} palette={palette} secondary />
      </View> : <ActionButton title="Cerrar sesión" onPress={() => setConfirmLogout(true)} palette={palette} secondary />}
    </View>
  </View>;
}
