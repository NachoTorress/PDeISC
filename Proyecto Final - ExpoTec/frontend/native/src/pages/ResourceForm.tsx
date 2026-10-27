/**
 * Pantalla de la demostración (datos locales del dispositivo, sin servidor). Formulario de elemento del inventario.
 */
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Field, Section } from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import { newId, today } from "../lib/helpers";
import { resourceUsed } from "../lib/model";
import type { Resource } from "../lib/types";

/** Recibe el stock actual y guarda cambios validados sin alterar reservas ni préstamos abiertos. */
export default function ResourceForm({
  resource,
  onClose,
}: {
  resource?: Resource;
  onClose: () => void;
}) {
  const { state, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const [name, setName] = useState(resource?.name ?? "");
  const [total, setTotal] = useState(resource ? String(resource.total) : "1");
  const [error, setError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const assigned = resource ? resourceUsed(state, resource.id) : 0;
  const out = resource
    ? state.loans
        .filter((loan) => loan.resourceId === resource.id)
        .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0)
    : 0;
  const minimum = Math.max(assigned, out);
  const normalizedName = name.trim();
  const invalidName =
    normalizedName.length < 2
      ? "El nombre debe tener al menos 2 caracteres."
      : normalizedName.length > 80
        ? "El nombre puede tener hasta 80 caracteres."
        : state.resources.some(
              (item) =>
                item.id !== resource?.id &&
                item.name.trim().toLocaleLowerCase("es") ===
                  normalizedName.toLocaleLowerCase("es"),
            )
          ? "Ya existe un elemento con ese nombre."
          : "";
  const invalidTotal =
    !/^\d+$/.test(total) || !Number.isSafeInteger(Number(total))
      ? "Ingresá un número entero igual o mayor que cero."
      : Number(total) < minimum
        ? `El total no puede ser menor que ${minimum}: hay elementos asignados o sin devolver.`
        : "";

  /** Valida y guarda el elemento en la demo. */
  function submit() {
    setNameTouched(true);
    if (invalidName || invalidTotal) return;
    const result = mutate({
      type: "saveResource",
      resource: {
        id: resource?.id ?? newId(),
        name: normalizedName,
        total: Number(total),
        createdAt: resource?.createdAt ?? today(),
      },
    });
    if (result) {
      setError(result);
      return;
    }
    notify(
      resource ? "Elemento actualizado." : "Elemento agregado al inventario.",
    );
    onClose();
  }

  return (
    <View style={{ gap: 14 }}>
      <Section title={resource ? "Editar elemento" : "Agregar elemento"}>
        <Field
          label="Nombre del elemento"
          value={name}
          error={nameTouched ? invalidName : ""}
          onChangeText={(value) => {
            setName(value);
            setNameTouched(true);
            setError("");
          }}
        />
        <Field
          label="Cantidad total"
          value={total}
          keyboardType="number-pad"
          error={invalidTotal}
          hint={
            minimum > 0
              ? `Mínimo actual: ${minimum} unidades.`
              : "Ingresá cero si no hay unidades disponibles."
          }
          onChangeText={(value) => {
            setTotal(value);
            setError("");
          }}
        />
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
          >
            {error}
          </Text>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button
            title="Cancelar"
            icon="close"
            variant="secondary"
            onPress={onClose}
          />
          <Button
            title={resource ? "Guardar cambios" : "Agregar al inventario"}
            icon={resource ? "save" : "plus"}
            onPress={submit}
            disabled={!!invalidName || !!invalidTotal}
          />
        </View>
      </Section>
    </View>
  );
}
