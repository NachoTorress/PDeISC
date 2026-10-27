/** Lista de integrantes o profesores agregados, con opción de quitar y confirmación. */
import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import type { ProjectParticipant } from "../lib/sharedProjects";
import type { ProjectPeopleRole } from "../lib/projectPeople";
import { Button, InlineConfirm } from "./ui";

export default function ProjectPeopleList({
  role,
  people,
  protectedIds,
  actorId,
  disabled,
  onRemove,
}: {
  role: ProjectPeopleRole;
  people: ProjectParticipant[];
  protectedIds: string[];
  actorId?: string;
  disabled: boolean;
  onRemove: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [remove, setRemove] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      {people.map((person) => {
        const name = `${person.firstName} ${person.lastName}`;
        const protectedPerson = protectedIds.includes(person.id);
        return (
          <View
            key={person.id}
            testID={`selected-person-${role}-${person.id}`}
            style={{
              gap: 8,
              borderWidth: 1,
              borderColor: colors.outline,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    lineHeight: 21,
                    fontWeight: "600",
                  }}
                >
                  {name}
                </Text>
                {protectedPerson && (
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      lineHeight: 18,
                    }}
                  >
                    {person.id === actorId
                      ? "Vos · incluido automáticamente"
                      : "Autor del proyecto · permanece en el equipo"}
                  </Text>
                )}
              </View>
              {!protectedPerson && remove !== person.id && (
                <Button
                  title=""
                  icon="close"
                  variant="quiet"
                  accessibilityLabel={`Quitar a ${name}`}
                  disabled={disabled}
                  style={{
                    width: 44,
                    minWidth: 0,
                    paddingHorizontal: 6,
                    gap: 0,
                  }}
                  onPress={() => setRemove(person.id)}
                />
              )}
            </View>
            {remove === person.id && !protectedPerson && (
              <View pointerEvents={disabled ? "none" : "auto"}>
                <InlineConfirm
                  text={`¿Quitar a ${name} de esta propuesta?`}
                  confirmLabel="Quitar participante"
                  onCancel={() => setRemove(null)}
                  onConfirm={() => {
                    if (disabled || protectedIds.includes(person.id)) return;
                    onRemove(person.id);
                    setRemove(null);
                  }}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
