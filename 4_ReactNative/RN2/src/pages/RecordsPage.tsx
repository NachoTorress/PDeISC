import { useState } from 'react';
import { ActivityIndicator, Pressable, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useRecords } from '../contexts/RecordsContext';
import { TOOLS } from '../constants/tools';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Type } from '../components/Typography';
import { Field } from '../components/Field';
import { Feedback } from '../components/Feedback';
import { RecordCard } from '../components/RecordCard';
import type { ToolId } from '../types';

export function RecordsPage({ openTools }: { openTools: () => void }) {
  const { colors } = useTheme();
  const { records, loading, loadError } = useRecords();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ToolId | 'all'>('all');
  const [warning, setWarning] = useState(false);
  const { width } = useWindowDimensions();
  const columns = width >= 1200;
  const result = records.filter(
    (record) =>
      (filter === 'all' || record.payload.kind === filter) &&
      `${record.title} ${record.notes}`
        .toLocaleLowerCase('es')
        .includes(query.trim().toLocaleLowerCase('es')),
  );
  return (
    <View style={{ gap: 26 }}>
      <View style={{ gap: 8 }}>
        <Type
          accessibilityRole="header"
          size={38}
          weight="semibold"
          style={{ letterSpacing: -0.8 }}
        >
          Mis registros
        </Type>
        <Type tone="muted">
          Cada prueba, en un solo lugar. Consultá, editá o eliminá lo que guardaste.
        </Type>
      </View>
      {warning && (
        <Feedback message="El registro se eliminó, pero no se pudo borrar su archivo de imagen. Revisá el espacio y los permisos de almacenamiento del dispositivo." />
      )}
      {loading ? (
        <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando registros" />
      ) : !records.length && !loadError ? (
        <View style={{ paddingVertical: 55, alignItems: 'center', gap: 18 }}>
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.green,
            }}
          >
            <Icon name="history" size={40} color={colors.accent} />
          </View>
          <Type size={25} weight="semibold" style={{ textAlign: 'center' }}>
            Tu primera prueba empieza acá.
          </Type>
          <Type tone="muted" style={{ textAlign: 'center', maxWidth: 400 }}>
            Tomá una foto, encontrá tu ubicación o explorá un sensor. Después, guardá el resultado.
          </Type>
          <Button label="Explorar herramientas" icon="arrowRight" onPress={openTools} />
        </View>
      ) : !loadError ? (
        <>
          <Field
            label="Buscar por título o notas"
            value={query}
            onChangeText={setQuery}
            hint="La búsqueda se actualiza mientras escribís."
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[{ id: 'all', title: 'Todos' }, ...TOOLS].map((tool) => (
              <Pressable
                key={tool.id}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar: ${tool.title}`}
                accessibilityState={{ selected: filter === tool.id }}
                onPress={() => setFilter(tool.id as ToolId | 'all')}
                style={({ pressed }) => ({
                  paddingHorizontal: 15,
                  minHeight: 44,
                  justifyContent: 'center',
                  borderRadius: 22,
                  backgroundColor: filter === tool.id ? colors.accent : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Type
                  size={13}
                  weight="medium"
                  style={{ color: filter === tool.id ? colors.onAccent : colors.muted }}
                >
                  {tool.title}
                </Type>
              </Pressable>
            ))}
          </View>
          <Type accessibilityLiveRegion="polite" size={13} tone="muted">
            {result.length} {result.length === 1 ? 'registro' : 'registros'} · más recientes primero
          </Type>
          {!result.length && (
            <View style={{ gap: 16, paddingVertical: 26 }}>
              <Type size={20} weight="medium">
                No encontramos coincidencias.
              </Type>
              <Button
                label="Limpiar búsqueda y filtros"
                variant="secondary"
                icon="close"
                onPress={() => {
                  setQuery('');
                  setFilter('all');
                }}
              />
            </View>
          )}
          <View
            style={{
              flexDirection: columns ? 'row' : 'column',
              flexWrap: columns ? 'wrap' : 'nowrap',
              alignItems: columns ? 'flex-start' : 'stretch',
              alignContent: 'flex-start',
              gap: 18,
            }}
          >
            {result.map((record) => (
              <View
                key={record.id}
                style={{ width: columns ? '48.8%' : '100%', flexGrow: columns ? 1 : 0 }}
              >
                <RecordCard record={record} onCleanupWarning={() => setWarning(true)} />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}
