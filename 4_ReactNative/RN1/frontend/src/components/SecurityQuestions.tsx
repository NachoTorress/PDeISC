import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Answer } from '../types';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';
import { Field } from './Field';

export const questions = [
  { id: 1, prompt: 'Nombre de tu primera mascota' },
  { id: 2, prompt: 'Ciudad donde naciste' },
  { id: 3, prompt: 'Nombre de tu escuela primaria' },
  { id: 4, prompt: 'Tu apodo de infancia' }
];

export function SecurityQuestions({ answers, onChange, palette }: {
  answers: Answer[]; onChange: (next: Answer[]) => void; palette: Palette;
}) {
  const s = stylesFor(palette);
  return <View>
    <Text style={s.smallTitle}>Dos preguntas de seguridad</Text>
    {answers.map((item, index) => <View key={index}>
      <Text style={s.label}>Pregunta {index + 1}</Text>
      <View style={s.chipRow}>{questions.map((question) => {
        const selected = item.questionId === question.id;
        const unavailable = answers.some((answer, position) => position !== index && answer.questionId === question.id);
        return <Pressable key={question.id} accessibilityRole="button" accessibilityState={{ selected, disabled: unavailable }}
          disabled={unavailable} onPress={() => onChange(answers.map((answer, position) => position === index ? { ...answer, questionId: question.id } : answer))}
          style={[s.chip, selected ? s.chipSelected : undefined, unavailable ? { opacity: 0.4 } : undefined]}>
          <Text style={s.chipText}>{question.prompt}</Text>
        </Pressable>;
      })}</View>
      <Field label={`Respuesta ${index + 1}`} value={item.answer} palette={palette}
        onChange={(value) => onChange(answers.map((answer, position) => position === index ? { ...answer, answer: value } : answer))}
        validate={(value) => value.trim().length < 2 ? 'Ingresá al menos dos caracteres.' : ''} />
    </View>)}
    <Text style={s.detail}>Las respuestas se guardan protegidas. Recordalas para recuperar tu contraseña.</Text>
  </View>;
}
