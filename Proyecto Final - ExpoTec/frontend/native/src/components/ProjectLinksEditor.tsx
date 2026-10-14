import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { projectLinkError } from "../lib/projectLinks";
import { CheckRow, Field, InlineConfirm, Section } from "./ui";
import { Icon } from "./Icon";

export type ProjectLinksValue = {
  isSoftwareProject: boolean;
  githubUrl: string;
  websiteUrl: string;
};
type Props = ProjectLinksValue & {
  onChange: (value: Partial<ProjectLinksValue>) => void;
  submitAttempt: boolean;
};

/** Expone enlaces opcionales con validación inmediata y confirma antes de quitarlos. */
export default function ProjectLinksEditor({
  isSoftwareProject,
  githubUrl,
  websiteUrl,
  onChange,
  submitAttempt,
}: Props) {
  const { colors } = useTheme();
  const [removing, setRemoving] = useState(false);
  const [touched, setTouched] = useState({
    githubUrl: false,
    websiteUrl: false,
  });
  const disable = () => {
    onChange({ isSoftwareProject: false, githubUrl: "", websiteUrl: "" });
    setRemoving(false);
  };
  return (
    <Section title="Proyecto informático">
      <CheckRow
        label="Este proyecto tiene desarrollo informático"
        checked={isSoftwareProject}
        onChange={(value) => {
          if (!value && (githubUrl.trim() || websiteUrl.trim()))
            setRemoving(true);
          else if (!value) disable();
          else {
            onChange({ isSoftwareProject: true });
            setRemoving(false);
          }
        }}
      />
      {removing && (
        <InlineConfirm
          text="¿Querés desactivar la opción de proyecto informático? Se quitarán los dos enlaces de esta propuesta."
          confirmLabel="Quitar enlaces y desactivar"
          onConfirm={disable}
          onCancel={() => setRemoving(false)}
        />
      )}
      {isSoftwareProject && (
        <>
          <View
            style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
          >
            <Icon name="link" color={colors.muted} size={20} />
            <Text
              style={{
                color: colors.muted,
                fontSize: 14,
                lineHeight: 21,
                flex: 1,
              }}
            >
              Podés compartir el repositorio, la página del proyecto o ambos.
              Ninguno es obligatorio.
            </Text>
          </View>
          <Field
            label="Enlace al repositorio de GitHub (opcional)"
            value={githubUrl}
            maxLength={2048}
            keyboardType="url"
            onChangeText={(value) => {
              onChange({ githubUrl: value });
              setTouched((current) => ({ ...current, githubUrl: true }));
            }}
            error={
              touched.githubUrl || submitAttempt
                ? projectLinkError(githubUrl, "github")
                : ""
            }
            hint="Dirección completa de un repositorio en github.com."
          />
          <Field
            label="Enlace a la página del proyecto (opcional)"
            value={websiteUrl}
            maxLength={2048}
            keyboardType="url"
            onChangeText={(value) => {
              onChange({ websiteUrl: value });
              setTouched((current) => ({ ...current, websiteUrl: true }));
            }}
            error={
              touched.websiteUrl || submitAttempt
                ? projectLinkError(websiteUrl, "website")
                : ""
            }
            hint="Dirección completa http o https para visitar el proyecto."
          />
        </>
      )}
    </Section>
  );
}
