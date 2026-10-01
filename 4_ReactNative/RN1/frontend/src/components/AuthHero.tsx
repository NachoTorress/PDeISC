import React from 'react';
import { Text, View } from 'react-native';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';

export function AuthHero({ palette, welcome = false }: { palette: Palette; welcome?: boolean }) {
  const s = stylesFor(palette);
  return <View style={s.hero}>
    <Text style={s.heroMark}>ACCESO</Text>
    <View>
      <Text style={s.heroTitle}>{welcome ? 'Qué bueno tenerte acá.' : 'Entrá como prefieras.'}</Text>
      <Text style={s.heroBody}>{welcome
        ? 'Tu cuenta está lista. Desde acá podés revisar tus datos y gestionar tu sesión.'
        : 'Usá tu correo o una cuenta vinculada. Si necesitás volver a entrar, también podés recuperar el acceso.'}</Text>
    </View>
    <View>
      <View style={s.heroRule} />
      <Text style={s.heroFoot}>Tu cuenta, tus formas de ingresar.</Text>
    </View>
  </View>;
}
