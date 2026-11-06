/** Preparación de la muestra, separada del visor para el público. */
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Choice,
  Heading,
  PageHeading,
  RefreshButton,
  Screen,
} from "./ui";
import { useTheme } from "../contexts/ThemeContext";
import type { PresentationProject } from "../lib/sharedPresentation";

export function PresentationSetup({
  projects,
  loading = false,
  error,
  seconds,
  muted,
  onSeconds,
  onMute,
  onStart,
  onBack,
  onRefresh,
}: {
  projects: PresentationProject[];
  loading?: boolean;
  error?: string;
  seconds: string;
  muted: boolean;
  onSeconds: (value: string) => void;
  onMute: () => void;
  onStart: () => void;
  onBack: () => void;
  onRefresh?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Screen>
      <PageHeading
        icon="tv"
        title="Presentación para TV"
        subtitle="Prepará la muestra y abrila a pantalla completa para el público."
      />
      <Card style={{ gap: 18 }}>
        <Heading
          title={
            loading && !projects.length
              ? "Cargando la muestra…"
              : `${projects.length} ${projects.length === 1 ? "proyecto listo" : "proyectos listos"} para presentar`
          }
          subtitle="Al iniciar se ocultan los menús y la muestra empieza automáticamente. Las imágenes avanzan por tiempo y los videos al terminar."
        />
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ color: colors.error, lineHeight: 22 }}
          >
            {error}
          </Text>
        )}
        {!loading && !error && !projects.length && (
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            Todavía no hay proyectos confirmados. Aparecerán acá cuando se
            confirme su participación.
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <Button
            title="Iniciar presentación"
            icon="play"
            disabled={!projects.length || !!error}
            onPress={onStart}
          />
          {onRefresh && (
            <RefreshButton
              label="Actualizar muestra"
              loading={loading}
              disabled={loading}
              onPress={onRefresh}
            />
          )}
        </View>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          Durante la muestra, mové el mouse o tocá la pantalla para ver los
          controles. En una computadora: flechas para cambiar, espacio para
          pausar y Esc para salir.
        </Text>
      </Card>
      <Card style={{ gap: 16 }}>
        <Heading title="Opciones de reproducción" />
        <Choice
          label="Tiempo de cada imagen"
          value={seconds}
          options={["8", "15", "30"].map((value) => ({
            value,
            label: `${value} segundos`,
          }))}
          onChange={onSeconds}
        />
        <Choice
          label="Sonido de los videos"
          value={muted ? "off" : "on"}
          options={[
            { value: "off", label: "Sin sonido" },
            { value: "on", label: "Con sonido" },
          ]}
          onChange={(value) => {
            if ((value === "off") !== muted) onMute();
          }}
        />
      </Card>
      {!!projects.length && (
        <Card>
          <Heading title="En esta muestra" />
          {projects.map((project, index) => (
            <View
              key={project.id}
              style={{
                flexDirection: "row",
                gap: 12,
                paddingVertical: 10,
                borderTopWidth: index ? 1 : 0,
                borderColor: colors.outline,
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: "700",
                  minWidth: 26,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {project.name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 14 }}>
                  {project.course} · {project.spaceName}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}
      <Button
        title="Volver a proyectos"
        variant="quiet"
        icon="arrowLeft"
        onPress={onBack}
      />
    </Screen>
  );
}
