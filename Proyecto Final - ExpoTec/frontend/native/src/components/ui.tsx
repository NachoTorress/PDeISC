/**
 * Punto de entrada de los componentes de interfaz reutilizables.
 *
 * Cada componente vive en su propio módulo dentro de `components/base/`;
 * este archivo solo los reexporta para que las pantallas los importen desde
 * un único lugar (`import { Button, Field } from "../components/ui"`).
 *
 * Todos usan los temas claro y oscuro y respetan áreas táctiles mínimas de
 * 44-48 px. Las confirmaciones se muestran dentro de la pantalla
 * (`InlineConfirm`), nunca con alert/confirm.
 */
export { ActionRow } from "./base/ActionRow";
export { Button, RefreshButton } from "./base/Button";
export { Field } from "./base/Field";
export { Card, Section, Heading, PageHeading } from "./base/Layout";
export { Chip, Choice, CheckRow } from "./base/Options";
export { InlineConfirm } from "./base/InlineConfirm";
export { Screen } from "./base/Screen";
