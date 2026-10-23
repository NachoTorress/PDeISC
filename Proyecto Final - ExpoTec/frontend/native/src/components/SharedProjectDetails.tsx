import { useEffect, useState } from "react";
import { View } from "react-native";
import type { ProposalDraft } from "../lib/sharedProjects";
import PhotoUploadField from "./PhotoUploadField";
import { Button, Card, CheckRow, Field, Heading, InlineConfirm } from "./ui";

export default function SharedProjectDetails({
  draft,
  saving,
  errorFor,
  onChange,
  onUploadChange,
}: {
  draft: ProposalDraft;
  saving: boolean;
  errorFor: (field: string) => string | undefined;
  onChange: <K extends keyof ProposalDraft>(
    key: K,
    value: ProposalDraft[K],
  ) => void;
  onUploadChange: (busy: boolean) => void;
}) {
  const [extra, setExtra] = useState(
    Boolean(
      draft.videoUrl ||
        draft.isSoftwareProject ||
        draft.githubUrl ||
        draft.websiteUrl,
    ),
  );
  const [clearLinks, setClearLinks] = useState(false);
  const extraErrors = [
    "videoUrl",
    "githubUrl",
    "websiteUrl",
    "isSoftwareProject",
  ]
    .map(errorFor)
    .filter(Boolean)
    .join(" ");
  useEffect(() => {
    if (extraErrors) setExtra(true);
  }, [extraErrors]);
  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Heading
          title="Datos del proyecto"
          subtitle="Contá qué van a mostrar y sumá una foto que lo represente."
        />
        <Field
          label="Nombre del proyecto"
          placeholder="Por ejemplo, Huerta inteligente"
          value={draft.name}
          onChangeText={(value) => onChange("name", value)}
          maxLength={120}
          editable={!saving}
          error={errorFor("name")}
        />
        <Field
          label="Descripción del proyecto"
          value={draft.description}
          onChangeText={(value) => onChange("description", value)}
          multiline
          maxLength={5000}
          editable={!saving}
          error={errorFor("description")}
          hint={`Qué hace, cómo funciona y qué van a presentar. Mínimo 20 caracteres · ${draft.description.trim().length}/5000.`}
        />
        <Field
          label="Curso y especialidad"
          placeholder="Por ejemplo, 6° 1° · Informática"
          value={draft.course}
          onChangeText={(value) => onChange("course", value)}
          maxLength={100}
          editable={!saving}
          error={errorFor("course")}
        />
        <PhotoUploadField
          purpose="project"
          value={draft.imageUrl}
          onChange={(value) => onChange("imageUrl", value)}
          disabled={saving}
          onBusyChange={onUploadChange}
          error={errorFor("imageUrl")}
        />
      </Card>
      <Card>
        <Button
          title={
            extra
              ? "Ocultar video y enlaces"
              : "Agregar video o enlaces (opcional)"
          }
          variant="quiet"
          endIcon={extra ? "chevronUp" : "chevronDown"}
          disabled={saving}
          onPress={() => setExtra(!extra)}
        />
        <View style={{ display: extra ? "flex" : "none", gap: 12 }}>
          <Field
            label="Enlace al video (opcional)"
            value={draft.videoUrl}
            onChangeText={(value) => onChange("videoUrl", value)}
            keyboardType="url"
            maxLength={2048}
            editable={!saving}
            error={errorFor("videoUrl")}
            hint="Enlace HTTPS directo a un archivo MP4 o WebM."
          />
          <CheckRow
            label="Proyecto informático"
            checked={draft.isSoftwareProject}
            onChange={(value) => {
              if (!value && (draft.githubUrl || draft.websiteUrl))
                setClearLinks(true);
              else onChange("isSoftwareProject", value);
            }}
          />
          {clearLinks && (
            <InlineConfirm
              text="¿Desactivar proyecto informático y quitar sus enlaces de esta propuesta?"
              confirmLabel="Quitar enlaces"
              onCancel={() => setClearLinks(false)}
              onConfirm={() => {
                onChange("githubUrl", "");
                onChange("websiteUrl", "");
                onChange("isSoftwareProject", false);
                setClearLinks(false);
              }}
            />
          )}
          {draft.isSoftwareProject && (
            <>
              <Field
                label="Repositorio de GitHub (opcional)"
                placeholder="https://github.com/equipo/proyecto"
                value={draft.githubUrl}
                onChangeText={(value) => onChange("githubUrl", value)}
                keyboardType="url"
                maxLength={2048}
                editable={!saving}
                error={errorFor("githubUrl")}
              />
              <Field
                label="Página del proyecto (opcional)"
                value={draft.websiteUrl}
                onChangeText={(value) => onChange("websiteUrl", value)}
                keyboardType="url"
                maxLength={2048}
                editable={!saving}
                error={errorFor("websiteUrl")}
              />
            </>
          )}
        </View>
      </Card>
    </View>
  );
}
