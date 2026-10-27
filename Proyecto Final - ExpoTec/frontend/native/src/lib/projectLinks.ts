/** Validación de los enlaces opcionales de GitHub y página web de un proyecto. */
export type ProjectLinkKind = "github" | "website";

/** Recibe un enlace opcional del formulario y devuelve el error para UI y modelo. */
export function projectLinkError(
  value: unknown,
  kind: ProjectLinkKind,
): string {
  const label =
    kind === "github" ? "El enlace de GitHub" : "El enlace de la página";
  if (value === undefined) return "";
  if (typeof value !== "string") return `${label} debe ser un texto.`;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > 2048)
    return `${label} no puede superar los 2048 caracteres.`;
  if (/[\s\p{Cc}]/u.test(trimmed))
    return `${label} no puede contener espacios ni caracteres de control.`;
  let url: URL;
  try {
    if (!/^https?:\/\//i.test(trimmed)) throw new Error();
    url = new URL(trimmed);
  } catch {
    return `${label} debe ser una URL completa que comience con http:// o https://.`;
  }
  if (url.username || url.password)
    return `${label} no puede incluir usuario ni contraseña.`;
  if (
    kind === "github" &&
    (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase()) ||
      !/^\/[^/]+\/[^/]+(?:\/|$)/u.test(url.pathname))
  ) {
    return "Usá un enlace de github.com con el usuario y el repositorio, por ejemplo https://github.com/usuario/proyecto.";
  }
  return "";
}

/** Devuelve la URL validada para mostrarla; datos antiguos o inválidos no generan enlaces. */
export function safeProjectLink(value: unknown, kind: ProjectLinkKind): string {
  return typeof value === "string" && !projectLinkError(value, kind)
    ? value.trim()
    : "";
}
