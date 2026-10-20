import { Pressable, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useRecords } from '../contexts/RecordsContext';
import { TOOLS } from '../constants/tools';
import { Type } from '../components/Typography';
import { Icon } from '../components/Icon';
import { Button } from '../components/Button';
import type { ToolId } from '../types';

export function HomePage({
  openTool,
  openRecords,
}: {
  openTool: (id: ToolId) => void;
  openRecords: () => void;
}) {
  const { colors } = useTheme();
  const { records } = useRecords();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  return (
    <View style={{ gap: 34 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <View style={{ flex: 1, minWidth: 240, gap: 12 }}>
          <Type
            accessibilityRole="header"
            size={wide ? 46 : 36}
            weight="semibold"
            style={{ lineHeight: wide ? 51 : 41, letterSpacing: -1.1 }}
          >
            Descubrí todo lo que{wide ? '\n' : ' '}tu dispositivo puede hacer.
          </Type>
          <Type tone="muted" size={16} style={{ maxWidth: 650 }}>
            Un pequeño laboratorio para explorar, probar y guardar.{wide ? '\n' : ' '}Elegí una
            herramienta y empezá.
          </Type>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingBottom: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} />
          <Type size={13} tone="muted">
            Hecho para explorar
          </Type>
        </View>
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir Cámara"
          onPress={() => openTool('camera')}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
            flex: wide ? 1.65 : undefined,
            minHeight: 278,
            backgroundColor: colors.hero,
            borderRadius: 16,
            padding: wide ? 30 : 24,
            opacity: pressed ? 0.85 : hovered ? 0.95 : 1,
            overflow: 'hidden',
          })}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Icon name="camera" color={colors.lime} size={28} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Type size={12} style={{ color: colors.heroMuted }}>
                FRONTAL / TRASERA
              </Type>
              <Icon name="arrowRight" color={colors.heroMuted} size={16} />
            </View>
          </View>
          <View
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 25 }}
          >
            <View style={{ flex: 1, gap: 7 }}>
              <Type
                size={36}
                weight="medium"
                style={{ color: colors.heroText, letterSpacing: -0.7 }}
              >
                Cambiá{wide ? '\n' : ' '}el enfoque.
              </Type>
              <Type size={14} style={{ color: colors.heroMuted, maxWidth: 240 }}>
                Capturá lo que tenés enfrente.{wide ? '\n' : ' '}Conservá lo que te inspira.
              </Type>
            </View>
            <View
              accessible={false}
              style={{
                width: wide ? 130 : 92,
                height: wide ? 130 : 92,
                borderWidth: 1,
                borderColor: '#789173',
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '-8deg' }],
              }}
            >
              <View
                style={{
                  width: wide ? 94 : 66,
                  height: wide ? 94 : 66,
                  borderRadius: 70,
                  borderWidth: 1,
                  borderColor: '#789173',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: wide ? 58 : 40,
                    height: wide ? 58 : 40,
                    borderRadius: 40,
                    backgroundColor: colors.lime,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="focus" color={colors.hero} size={wide ? 30 : 23} />
                </View>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 22 }}>
            <Type size={14} weight="semibold" style={{ color: colors.lime }}>
              Abrir cámara
            </Type>
            <Icon name="arrowRight" size={17} color={colors.lime} />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir Lector de códigos"
          onPress={() => openTool('scanner')}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
            flex: wide ? 1 : undefined,
            minHeight: 245,
            padding: wide ? 28 : 24,
            gap: 18,
            borderRadius: 16,
            backgroundColor: colors.blue,
            opacity: pressed ? 0.75 : hovered ? 0.9 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Icon name="scanner" size={34} color={colors.text} />
            <Icon name="arrowRight" size={22} color={colors.text} />
          </View>
          <View style={{ flex: 1, justifyContent: 'flex-end', gap: 8 }}>
            <Type size={27} weight="medium">
              Menos escribir.{wide ? '\n' : ' '}Más escanear.
            </Type>
            <Type tone="muted" size={14}>
              Leé códigos QR y de barras con una sola mirada.
            </Type>
          </View>
          <Type size={14} weight="semibold">
            Abrir lector
          </Type>
        </Pressable>
      </View>

      <View style={{ gap: 18 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Type accessibilityRole="header" size={23} weight="semibold">
            Conectá con tu dispositivo
          </Type>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {TOOLS.slice(2).map((tool) => (
            <View key={tool.id} style={{ width: wide ? '48.8%' : '100%', flexGrow: 1 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${tool.title}`}
                onPress={() => openTool(tool.id)}
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  padding: 20,
                  minHeight: 100,
                  backgroundColor: hovered || pressed ? colors.raised : colors.surface,
                  borderRadius: 14,
                })}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors[tool.color as 'orange' | 'violet' | 'teal' | 'rose'],
                  }}
                >
                  <Icon name={tool.id} size={26} color={colors.text} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Type size={18} weight="medium">
                    {tool.title}
                  </Type>
                  <Type size={13} tone="muted">
                    {tool.description}
                  </Type>
                </View>
                <Icon name="chevronRight" size={18} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.line,
          paddingTop: 26,
          flexDirection: wide ? 'row' : 'column',
          gap: 24,
          alignItems: wide ? 'center' : 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', flex: 1 }}>
          <Icon name="history" size={28} color={colors.accent} />
          <View style={{ flex: 1, gap: 3 }}>
            <Type weight="medium">Tus descubrimientos tienen su lugar.</Type>
            <Type size={14} tone="muted">
              {records.length
                ? `${records.length} ${records.length === 1 ? 'registro guardado' : 'registros guardados'} en este dispositivo.`
                : 'Guardá una prueba y encontrala en Mis registros.'}
            </Type>
          </View>
        </View>
        <Button
          label="Ver mis registros"
          icon="arrowRight"
          variant="secondary"
          onPress={openRecords}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingBottom: 12 }}>
        <Icon name="shield" size={17} color={colors.muted} />
        <Type size={12} tone="muted" style={{ flex: 1 }}>
          Tus pruebas se quedan en tu dispositivo. Pedimos permisos solo cuando los necesitás. La
          disponibilidad depende del hardware.
        </Type>
      </View>
    </View>
  );
}
