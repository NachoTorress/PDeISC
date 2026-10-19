import type { Credentials } from "./authTypes";

export function validateCredentials(input: Credentials, register: boolean) {
  const fields: Record<string, string> = {};
  const email = input.email.trim();
  if (
    email.length > 254 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
      email,
    )
  )
    fields.email = "Ingresá un correo válido de hasta 254 caracteres.";
  if (
    input.password.length < (register ? 12 : 1) ||
    input.password.length > 128
  )
    fields.password = register
      ? "Usá entre 12 y 128 caracteres."
      : "Ingresá tu contraseña.";
  if (register)
    for (const key of ["firstName", "lastName"] as const) {
      const name = (input[key] ?? "").trim().normalize("NFC");
      if (
        !/^[\p{L}\p{M}]+(?:[ '’][\p{L}\p{M}]+)*$/u.test(name) ||
        name.length > 80
      )
        fields[key] = "Usá letras, espacios o apóstrofes; hasta 80 caracteres.";
    }
  return fields;
}
