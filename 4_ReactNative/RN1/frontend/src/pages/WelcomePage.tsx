import React, { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ActionButton } from '../components/ActionButton';
import { AuthHero } from '../components/AuthHero';
import { ProviderLogo, providerLabel } from '../components/ProviderLogo';
import type { Palette } from '../styles/theme';
import { metrics, stylesFor } from '../styles/theme';
import type { User } from '../types';

export function WelcomePage({ user, onLogout, palette }: { user: User; onLogout: () => Promise<void>; palette: Palette }) {
  const s = stylesFor(palette);
  const { width } = useWindowDimensions();
  const wide = width >= metrics.breakpoint;
  const [confirmLogout, setConfirmLogout] = useState(false);
  const date = new Date(user.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const initials = user.displayName.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('').toLocaleUpperCase('es-AR') || 'U';
  return <View style={[s.authLayout, wide ? s.authLayoutWide : undefined]}>
    {wide ? <View style={s.heroColumn}><AuthHero palette={palette} welcome /></View> : null}
    <View style={[s.panel, wide ? s.panelColumn : { padding: width < 390 ? 22 : 28 }]}>
      <View style={s.statusBadge}>
        <FontAwesome5 name="check-circle" solid size={14} color={palette.accent} />
        <Text style={s.statusText}>Acceso confirmado</Text>
      </View>
      <View style={s.welcomeHeader}>
        <View style={s.welcomeAvatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={s.welcomeAvatarText}>{initials}</Text>
        </View>
        <View style={s.welcomeIdentity}>
          <Text accessibilityRole="header" style={s.heading}>¡Hola, {user.displayName}!</Text>
          <Text style={s.sectionCaption}>Estos son los datos de tu cuenta.</Text>
        </View>
      </View>
      <View style={s.detailList}>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Correo electrónico</Text>
          <Text style={s.detailValue}>{user.email}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Tipo de cuenta</Text>
          <Text style={s.detailValue}>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Fecha de creación</Text>
          <Text style={s.detailValue}>{date}</Text>
        </View>
      </View>
      <View style={s.sectionHeader}>
        <View style={s.sectionIcon}><FontAwesome5 name="link" size={15} color={palette.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={s.sectionTitle}>Cuentas vinculadas</Text>
          <Text style={s.sectionCaption}>Tus otras formas de ingresar.</Text>
        </View>
      </View>
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
      {confirmLogout ? <View style={s.logoutActions}>
        <Text style={s.smallTitle}>¿Estás seguro de que querés cerrar sesión?</Text>
        <ActionButton title="Sí, cerrar sesión" onPress={() => void onLogout()} palette={palette} />
        <ActionButton title="Cancelar" onPress={() => setConfirmLogout(false)} palette={palette} secondary />
      </View> : <ActionButton title="Cerrar sesión" onPress={() => setConfirmLogout(true)} palette={palette} secondary />}
    </View>
  </View>;
}
