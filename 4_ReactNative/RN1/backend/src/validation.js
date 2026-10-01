import { z } from 'zod';

export const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const name = z.string().trim().min(2).max(100).regex(/^[\p{L}]+(?:[ '\u2019][\p{L}]+)*$/u, 'Usá solo letras, espacios y apóstrofes');
const password = z.string().min(8, 'La contraseña necesita 8 caracteres').max(128)
  .regex(/[A-Za-z]/, 'Incluí una letra').regex(/\d/, 'Incluí un número');
const answer = z.string().trim().min(2).max(100);
export const answers = z.array(z.object({ questionId: z.number().int().min(1).max(4), answer })).length(2)
  .refine((items) => items[0].questionId !== items[1].questionId, 'Elegí dos preguntas diferentes');
export const registerSchema = z.object({ email, displayName: name, password, answers });
export const loginSchema = z.object({ identifier: z.string().trim().min(2).max(254), password: z.string().min(1) });
export const codeSchema = z.object({ email, code: z.string().regex(/^\d{6}$/, 'Ingresá los seis dígitos') });
export const credentialSchema = codeSchema.extend({ password, answers });
export const resetSchema = codeSchema.extend({ password, answers });

export function parse(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw Object.assign(new Error(result.error.issues[0].message), { status: 422 });
  }
  return result.data;
}
