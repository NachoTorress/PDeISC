import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { memberKey, teamErrors } from "../lib/team";
import { Button, Field, InlineConfirm, Section } from "./ui";
import { Icon } from "./Icon";

type Props = {
  members: string[];
  onChange: (members: string[]) => void;
  creator: string;
  currentStudent: string;
  submitAttempt: boolean;
};

/** Edita nombres del equipo y confirma cada baja sin quitar al creador ni al alumno activo. */
export default function ProjectTeamEditor({
  members,
  onChange,
  creator,
  currentStudent,
  submitAttempt,
}: Props) {
  const { colors } = useTheme();
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const [removing, setRemoving] = useState<number>();
  const errors = teamErrors(members);
  const protectedIndices = new Set(
    [creator, currentStudent].map((name) =>
      members.findIndex((member) => memberKey(member) === memberKey(name)),
    ),
  );
  const remove = (index: number) => {
    onChange(members.filter((_, memberIndex) => memberIndex !== index));
    setTouched(
      Object.fromEntries(
        Object.entries(touched)
          .filter(([key]) => Number(key) !== index)
          .map(([key, value]) => [
            Number(key) > index ? Number(key) - 1 : Number(key),
            value,
          ]),
      ),
    );
    setRemoving(undefined);
  };
  return (
    <Section title="Integrantes del equipo">
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <Icon name="users" color={colors.muted} size={20} />
        <Text
          style={{ color: colors.muted, fontSize: 14, lineHeight: 21, flex: 1 }}
        >
          Cada integrante debe tener su nombre y apellido. El equipo aparece en
          la muestra pública.
        </Text>
      </View>
      {members.map((member, index) => {
        const protectedMember = protectedIndices.has(index);
        return (
          <View key={index} style={{ gap: 8 }}>
            <Field
              label={`Integrante ${index + 1}`}
              value={member}
              maxLength={100}
              editable={!protectedMember}
              onChangeText={(value) => {
                onChange(
                  members.map((item, itemIndex) =>
                    itemIndex === index ? value : item,
                  ),
                );
                setTouched((current) => ({ ...current, [index]: true }));
              }}
              error={touched[index] || submitAttempt ? errors[index] : ""}
              hint={
                protectedMember
                  ? "Permanece en el equipo para conservar el acceso a la propuesta."
                  : "Solo letras, espacios y apóstrofes."
              }
            />
            {!protectedMember &&
              (removing === index ? (
                <InlineConfirm
                  text={`¿Querés quitar a ${member.trim() || "este integrante"} del equipo?`}
                  confirmLabel="Sí, quitar integrante"
                  onConfirm={() => remove(index)}
                  onCancel={() => setRemoving(undefined)}
                />
              ) : (
                <Button
                  title="Quitar integrante"
                  icon="trash"
                  variant="quiet"
                  style={{ alignSelf: "flex-start" }}
                  onPress={() => setRemoving(index)}
                />
              ))}
          </View>
        );
      })}
      <Button
        title="Agregar integrante"
        icon="plus"
        variant="secondary"
        style={{ alignSelf: "flex-start" }}
        onPress={() => {
          setRemoving(undefined);
          setTouched((current) => ({ ...current, [members.length]: true }));
          onChange([...members, ""]);
        }}
      />
    </Section>
  );
}
