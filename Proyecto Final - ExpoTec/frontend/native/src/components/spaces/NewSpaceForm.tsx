/**
 * Formulario para crear un espacio (solo administración). Valida el nombre
 * mientras se escribe y no permite crear hasta que sea válido.
 */
import { useState } from "react";
import { Button, Card, Field } from "../ui";

export function NewSpaceForm({
  busy,
  onCreate,
}: {
  busy: boolean;
  /** Recibe el nombre y la descripción ya recortados. */
  onCreate: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <Card>
      <Field
        label="Nombre del nuevo espacio"
        value={name}
        onChangeText={setName}
        maxLength={80}
        editable={!busy}
        error={
          name.length > 0 && name.trim().length < 2
            ? "Escribí al menos 2 caracteres."
            : undefined
        }
      />
      <Field
        label="Descripción del nuevo espacio"
        value={description}
        onChangeText={setDescription}
        maxLength={150}
        editable={!busy}
      />
      <Button
        title={busy ? "Creando…" : "Crear espacio"}
        disabled={busy || name.trim().length < 2}
        onPress={() => onCreate(name.trim(), description.trim())}
      />
    </Card>
  );
}
