/** Alta de un espacio en la demostración (solo perfil de organización). */
import { useState } from "react";
import { Button, Card, Field } from "../ui";

export function NewDemoSpaceForm({
  onCreate,
  onCancel,
}: {
  /** Recibe el nombre recortado. */
  onCreate: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <Card>
      <Field
        label="Nombre del nuevo espacio"
        value={name}
        onChangeText={setName}
        maxLength={80}
        error={
          name && name.trim().length < 2 ? "Escribí al menos 2 caracteres." : ""
        }
      />
      <Button
        title="Crear espacio"
        icon="check"
        disabled={name.trim().length < 2}
        onPress={() => onCreate(name.trim())}
      />
      <Button
        title="Cancelar"
        icon="close"
        variant="quiet"
        onPress={onCancel}
      />
    </Card>
  );
}
