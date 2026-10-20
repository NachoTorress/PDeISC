import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useRecords } from '../contexts/RecordsContext';
import { Button, IconButton } from './Button';
import { Icon } from './Icon';
import { Type } from './Typography';
import { Feedback } from './Feedback';

type Props = {
  children: ReactNode;
  section: 'tools' | 'records';
  toolOpen: boolean;
  navigate: (section: 'tools' | 'records') => void;
  back: () => void;
  pageKey: string;
};

export function AppShell({ children, section, toolOpen, navigate, back, pageKey }: Props) {
  const { colors, mode, toggleTheme, themeError } = useTheme();
  const { records, loadError, loading, retry } = useRecords();
  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  const scroller = useRef<ScrollView>(null);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [pageKey]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (toolOpen || section === 'records') {
        back();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [toolOpen, section, back]);

  const brand = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          height: 38,
          width: 38,
          backgroundColor: colors.accent,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="accelerometer" color={colors.onAccent} size={25} strokeWidth={2.1} />
      </View>
      <Type size={28} weight="semibold" style={{ letterSpacing: -1 }}>
        pulso
        <Type size={29} weight="bold" style={{ color: colors.accent }}>
          .
        </Type>
      </Type>
    </View>
  );
  function nav(id: 'tools' | 'records', mobile: boolean) {
    const selected = section === id;
    return (
      <Pressable
        key={id}
        accessibilityRole="button"
        accessibilityLabel={id === 'tools' ? 'Herramientas' : 'Mis registros'}
        accessibilityState={Platform.OS === 'web' ? undefined : { selected }}
        {...(Platform.OS === 'web' ? { 'aria-current': selected ? 'page' : undefined } : {})}
        onPress={() => navigate(id)}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
          flex: mobile ? 1 : undefined,
          minHeight: mobile ? 62 : 52,
          paddingHorizontal: 16,
          borderRadius: 12,
          flexDirection: mobile ? 'column' : 'row',
          justifyContent: mobile ? 'center' : 'flex-start',
          alignItems: 'center',
          gap: mobile ? 4 : 12,
          backgroundColor:
            !mobile && selected
              ? colors.raised
              : hovered || pressed
                ? colors.raised
                : 'transparent',
        })}
      >
        <Icon
          name={id === 'tools' ? 'grid' : 'history'}
          size={mobile ? 22 : 20}
          color={selected ? colors.accent : colors.muted}
        />
        <Type
          size={mobile ? 11 : 14}
          weight={selected ? 'semibold' : 'regular'}
          style={{ color: selected ? colors.accent : colors.muted }}
        >
          {id === 'tools' ? 'Herramientas' : 'Mis registros'}
        </Type>
        {!mobile && id === 'records' && records.length > 0 && (
          <Type size={12} style={{ marginLeft: 'auto', color: colors.muted }}>
            {records.length}
          </Type>
        )}
      </Pressable>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, minHeight: 0, flexDirection: 'row' }}>
          {desktop && (
            <View
              style={{
                width: 235,
                padding: 24,
                backgroundColor: colors.surface,
                borderRightWidth: 1,
                borderRightColor: colors.line,
              }}
            >
              {brand}
              <View
                style={{ gap: 8, marginTop: 54 }}
                role="navigation"
                accessibilityLabel="Principal"
              >
                {nav('tools', false)}
                {nav('records', false)}
              </View>
              <View style={{ marginTop: 'auto', paddingTop: 30, gap: 10 }}>
                <Icon name="lock" size={21} color={colors.muted} />
                <Type size={13} weight="medium">
                  Tu espacio de pruebas.
                </Type>
                <Type size={12} tone="muted">
                  Todo se guarda acá,{`\n`}en tu dispositivo.
                </Type>
                <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 10 }} />
                <Type size={11} tone="muted">
                  PULSO / LABORATORIO NATIVO
                </Type>
              </View>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <View
              style={{
                minHeight: desktop ? 92 : 76,
                paddingHorizontal: desktop ? 40 : 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              {desktop ? (
                <Type size={14} tone="muted">
                  Laboratorio del dispositivo{' '}
                  <Type size={14} tone="muted">
                    {' '}
                    /{' '}
                  </Type>
                  <Type size={14} weight="medium">
                    {section === 'tools' ? 'Herramientas' : 'Mis registros'}
                  </Type>
                </Type>
              ) : (
                brand
              )}
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {desktop && (
                  <View
                    style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginRight: 10 }}
                  >
                    <Icon name="phone" color={colors.muted} size={15} />
                    <Type size={12} tone="muted">
                      Tu dispositivo, conectado a vos.
                    </Type>
                  </View>
                )}
                <IconButton
                  label={mode === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
                  icon={mode === 'light' ? 'moon' : 'sun'}
                  onPress={() => {
                    void toggleTheme();
                  }}
                />
              </View>
            </View>
            <ScrollView
              ref={scroller}
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ padding: desktop ? 40 : 20, paddingBottom: 96, gap: 20 }}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={100}
              onScroll={({ nativeEvent }) => setShowTop(nativeEvent.contentOffset.y > 520)}
            >
              <Feedback message={themeError} />
              {!!loadError && (
                <View style={{ gap: 12 }}>
                  <Feedback message={loadError} />
                  <Button
                    label="Reintentar carga"
                    busy={loading}
                    icon="rotate"
                    variant="secondary"
                    onPress={() => {
                      void retry();
                    }}
                  />
                </View>
              )}
              {children}
            </ScrollView>
            {showTop && (
              <View
                pointerEvents="box-none"
                style={{
                  position: 'absolute',
                  right: desktop ? 40 : 20,
                  bottom: desktop ? 24 : 86,
                }}
              >
                <Button
                  label="Volver arriba"
                  icon="arrowUp"
                  variant="secondary"
                  onPress={() => scroller.current?.scrollTo({ y: 0, animated: false })}
                  style={{ borderWidth: 1, borderColor: colors.line }}
                />
              </View>
            )}
            {!desktop && (
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 25,
                  paddingTop: 5,
                  backgroundColor: colors.surface,
                  borderTopWidth: 1,
                  borderTopColor: colors.line,
                }}
                role="navigation"
                accessibilityLabel="Principal"
              >
                {nav('tools', true)}
                {nav('records', true)}
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
