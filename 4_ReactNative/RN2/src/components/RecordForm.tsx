import { useState } from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { Field } from './Field';
import { validateNotes, validateTitle } from '../utils/validation';

type Props = {
  initialTitle: string;
  initialNotes?: string;
  onSave: (title: string, notes: string) => Promise<void>;
  onCancel?: () => void;
  busy: boolean;
  saveLabel?: string;
};

/** Mismo formulario y reglas para altas y edición; errores visibles en cada cambio. */
export function RecordForm({
  initialTitle,
  initialNotes = '',
  onSave,
  onCancel,
  busy,
  saveLabel = 'Guardar registro',
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);
  const titleError = validateTitle(title);
  const notesError = validateNotes(notes);
  return (
    <View style={{ gap: 16 }}>
      <Field
        label="Título del registro"
        value={title}
        onChangeText={setTitle}
        error={titleError}
        hint={`${title.length}/60 caracteres`}
        editable={!busy}
      />
      <Field
        label="Notas (opcional)"
        value={notes}
        onChangeText={setNotes}
        error={notesError}
        hint={`${notes.length}/400 caracteres`}
        multiline
        editable={!busy}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Button
          label={saveLabel}
          icon="check"
          busy={busy}
          disabled={!!titleError || !!notesError}
          onPress={() => {
            void onSave(title, notes);
          }}
        />
        {onCancel && (
          <Button label="Cancelar edición" variant="ghost" disabled={busy} onPress={onCancel} />
        )}
      </View>
    </View>
  );
}
