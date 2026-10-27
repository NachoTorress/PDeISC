/** Paso 4 de la propuesta: resumen de todos los datos antes de enviar. */
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import type { ProposalDraft } from "../lib/sharedProjects";
import { Button, Card, Heading } from "./ui";
import GalleryImage from "./GalleryImage";

export default function ProposalReview({
  draft,
  spaceName,
  boothName,
  active,
  onEdit,
}: {
  draft: ProposalDraft;
  spaceName: string;
  boothName: string;
  active: boolean;
  onEdit: (step: number) => void;
}) {
  const { colors } = useTheme();
  const text = { color: colors.text, fontSize: 14, lineHeight: 21 };
  return (
    <View testID="proposal-review" style={{ gap: 16 }}>
      <Card>
        <Heading
          title={draft.name || "Nombre pendiente"}
          subtitle={draft.course}
        />
        {active && draft.imageUrl && (
          <GalleryImage
            uri={draft.imageUrl}
            caption={`Foto de ${draft.name}`}
            height={160}
            bounded
          />
        )}
        <Text style={text}>{draft.description}</Text>
        {draft.videoUrl ? (
          <Text style={text}>Video: {draft.videoUrl}</Text>
        ) : null}
        {draft.isSoftwareProject && (
          <Text style={text}>
            Proyecto informático
            {draft.githubUrl ? ` · GitHub: ${draft.githubUrl}` : ""}
            {draft.websiteUrl ? ` · Página: ${draft.websiteUrl}` : ""}
          </Text>
        )}
        <Button
          title="Editar datos del proyecto"
          icon="edit"
          variant="quiet"
          onPress={() => onEdit(0)}
        />
      </Card>
      <Card>
        <Heading title="Equipo y materias" />
        <Text style={{ ...text, fontWeight: "600" }}>
          Alumnos ({draft.members.length})
        </Text>
        {draft.members.map((person) => (
          <Text key={person.id} style={text}>
            {person.firstName} {person.lastName}
          </Text>
        ))}
        <Text style={{ ...text, fontWeight: "600" }}>
          Profesores responsables ({draft.teachers.length})
        </Text>
        {draft.teachers.map((person) => (
          <Text key={person.id} style={text}>
            {person.firstName} {person.lastName}
          </Text>
        ))}
        <Text style={{ ...text, fontWeight: "600" }}>Materias</Text>
        <Text style={text}>{draft.subjects.join(" · ")}</Text>
        <Button
          title="Editar equipo y materias"
          icon="edit"
          variant="quiet"
          onPress={() => onEdit(1)}
        />
      </Card>
      <Card>
        <Heading title="Puesto y elementos" />
        <Text style={text}>
          {spaceName} · {boothName}
        </Text>
        {draft.resources.length ? (
          draft.resources.map((item) => (
            <Text key={item.resourceId} style={text}>
              {item.name} · {item.quantity} unidades
            </Text>
          ))
        ) : (
          <Text style={text}>Sin elementos solicitados.</Text>
        )}
        <Button
          title="Editar puesto y elementos"
          icon="edit"
          variant="quiet"
          onPress={() => onEdit(2)}
        />
      </Card>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
        Al enviar, los profesores responsables podrán revisar la propuesta. El
        puesto y los elementos se reservan cuando un profesor la confirma.
      </Text>
    </View>
  );
}
