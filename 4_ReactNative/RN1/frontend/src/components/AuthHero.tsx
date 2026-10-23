import React from 'react';
import { Text, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';

export function AuthHero({ palette, welcome = false }: { palette: Palette; welcome?: boolean }) {
  const s = stylesFor(palette);
  return <View style={s.hero}>
    <View style={s.heroMarkRow}>
      <FontAwesome5 name={welcome ? 'user-check' : 'door-open'} size={16} color={palette.heroMuted} />
      <Text style={s.heroMark}>{welcome ? 'Ya estás en casa' : 'Un lugar para tu cuenta'}</Text>
    </View>
    <View>
      <Text style={s.heroTitle}>{welcome ? 'Qué bueno\ntenerte ' : 'Tu cuenta.\nTu punto de\n'}<Text style={s.heroHighlight}>{welcome ? 'acá.' : 'partida.'}</Text></Text>
      <Text style={s.heroBody}>{welcome
        ? 'Tu cuenta está lista. Desde acá podés revisar tus datos y gestionar tu sesión.'
        : 'Entrá con tu correo o con una cuenta vinculada. Elegí la forma que va con vos.'}</Text>
      <View style={s.heroMethods}>
        <View style={s.heroMethodIcon}><FontAwesome5 name={welcome ? 'id-card' : 'key'} size={21} color={palette.heroText} /></View>
        <View>
          <Text style={s.heroMethodLabel}>{welcome ? 'Todo en tu cuenta' : 'Un acceso, varias opciones'}</Text>
          <Text style={s.heroMethodDetail}>{welcome ? 'Tus datos y tus cuentas vinculadas' : 'Correo · Google · Discord · GitHub'}</Text>
        </View>
      </View>
    </View>
    <View>
      <View style={s.heroRule} />
      <View style={s.heroFootRow}>
        <View style={s.heroFootIcon}><FontAwesome5 name="envelope-open-text" size={15} color={palette.highlightText} /></View>
        <Text style={s.heroFoot}>¿Te olvidaste la contraseña?{ '\n' }Recuperá el acceso desde tu correo.</Text>
      </View>
    </View>
  </View>;
}
