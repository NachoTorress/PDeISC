import { useState } from 'react';
import { View } from 'react-native';
import { useRecords } from '../contexts/RecordsContext';
import { useTheme } from '../contexts/ThemeContext';
import { errorMessage } from '../utils/format';
import { RecordForm } from './RecordForm';
import { Feedback } from './Feedback';
import { Type } from './Typography';
import type { RecordPayload } from '../types';

export function RecordComposer({ payload, title }: { payload: RecordPayload; title: string }) {
  const { create, busy, loading, loadError } = useRecords();
  const { colors } = useTheme();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function save(name: string, notes: string) {
    if (saving || saved) return;
    setSaving(true);
    try {
      await create({ title: name, notes, payload });
      setSaved(true);
      setError('');
    } catch (cause) {
      setError(
        errorMessage(
          cause,
          'No se pudo guardar. Verificá el espacio disponible y volvé a intentar.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  if (saved)
    return (
      <Feedback
        success
        message="Registro guardado. Podés verlo, editarlo o eliminarlo en Mis registros."
      />
    );
  return (
    <View style={{ paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.line, gap: 16 }}>
      <Type size={22} weight="semibold">
        Guardá este resultado
      </Type>
      <Feedback message={error || loadError} />
      <RecordForm
        initialTitle={title}
        busy={saving || busy || loading || !!loadError}
        onSave={save}
      />
    </View>
  );
}
