import { useState } from 'react';
import { View } from 'react-native';
import { useRecords } from '../contexts/RecordsContext';
import { useTheme } from '../contexts/ThemeContext';
import { toolById } from '../constants/tools';
import { formatDate, formatTime, errorMessage } from '../utils/format';
import { Button } from './Button';
import { Type } from './Typography';
import { Icon } from './Icon';
import { Feedback } from './Feedback';
import { RecordForm } from './RecordForm';
import { RecordPayloadView } from './RecordPayloadView';
import type { DeviceRecord } from '../types';

export function RecordCard({
  record,
  onCleanupWarning,
}: {
  record: DeviceRecord;
  onCleanupWarning: () => void;
}) {
  const { colors } = useTheme();
  const { update, remove, busy } = useRecords();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const tool = toolById(record.payload.kind);

  async function save(title: string, notes: string) {
    setWorking(true);
    try {
      await update(record.id, title, notes);
      setEditing(false);
      setError('');
      setMessage('Los cambios se guardaron.');
    } catch (cause) {
      setError(errorMessage(cause, 'No pudimos guardar los cambios. Reintentá.'));
    } finally {
      setWorking(false);
    }
  }
  async function destroy() {
    setWorking(true);
    try {
      const clean = await remove(record.id);
      if (!clean) onCleanupWarning();
    } catch {
      setError('No se pudo eliminar el registro. Tus datos se conservaron.');
      setWorking(false);
    }
  }
  return (
    <View
      // Su altura depende del contenido; flex: 1 rompe la medición dentro del ScrollView.
      style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 22, gap: 18 }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexShrink: 1 }}>
          <Icon name={record.payload.kind} color={colors.accent} size={18} />
          <Type size={13} weight="medium">
            {tool.title}
          </Type>
        </View>
        <Type size={12} tone="muted">
          {formatDate(record.createdAt)} · {formatTime(record.createdAt)}
        </Type>
      </View>
      <Type size={22} weight="semibold">
        {record.title}
      </Type>
      <RecordPayloadView payload={record.payload} />
      {!!record.notes && !editing && (
        <Type size={14} tone="muted">
          {record.notes}
        </Type>
      )}
      {record.updatedAt !== record.createdAt && (
        <Type size={12} tone="muted">
          Editado el {formatDate(record.updatedAt)} a las {formatTime(record.updatedAt)}
        </Type>
      )}
      <Feedback message={error} />
      {!editing && <Feedback message={message} success />}
      {editing ? (
        <RecordForm
          initialTitle={record.title}
          initialNotes={record.notes}
          onSave={save}
          onCancel={() => {
            setEditing(false);
            setError('');
          }}
          busy={working || busy}
          saveLabel="Guardar cambios"
        />
      ) : confirming ? (
        <View style={{ padding: 18, backgroundColor: colors.errorBg, borderRadius: 12, gap: 12 }}>
          <Type weight="semibold" style={{ color: colors.error }}>
            ¿Estás seguro de que querés eliminar este registro?
          </Type>
          <Type size={13} style={{ color: colors.error }}>
            Esta acción es permanente.
            {record.payload.kind === 'camera'
              ? ' También se elimina la foto guardada en Pulso.'
              : ''}
          </Type>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button
              label="Sí, eliminar"
              icon="trash"
              variant="danger"
              busy={working}
              disabled={busy && !working}
              onPress={() => {
                void destroy();
              }}
            />
            <Button
              label="Conservar registro"
              variant="ghost"
              disabled={working}
              onPress={() => {
                setConfirming(false);
                setError('');
              }}
            />
          </View>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            paddingTop: 14,
          }}
        >
          <Button
            label="Editar"
            icon="edit"
            variant="secondary"
            compact
            disabled={busy}
            onPress={() => {
              setEditing(true);
              setMessage('');
            }}
          />
          <Button
            label="Eliminar"
            icon="trash"
            variant="ghost"
            compact
            disabled={busy}
            onPress={() => {
              setConfirming(true);
              setMessage('');
            }}
          />
        </View>
      )}
    </View>
  );
}
