/**
 * Pantalla del sistema compartido (datos de la API). Propuesta de proyecto en
 * cuatro pasos: proyecto, equipo, puesto y revisión.
 *
 * El estado, la validación y las llamadas a la API están en el hook
 * `useSharedProposal`; esta pantalla solo arma la vista de cada paso.
 * Conserva el borrador al volver a un paso anterior y avisa si otra persona
 * modificó el proyecto o tomó el puesto mientras se completaba.
 */
import { ActivityIndicator, Text, View } from "react-native";
import {
  ActionRow,
  Button,
  Card,
  Heading,
  InlineConfirm,
  Screen,
} from "../components/ui";
import SharedPeoplePicker from "../components/SharedPeoplePicker";
import ProjectSubjectsPicker from "../components/ProjectSubjectsPicker";
import SharedProjectDetails from "../components/SharedProjectDetails";
import ProposalStepNavigation from "../components/ProposalStepNavigation";
import ProposalReview from "../components/ProposalReview";
import { ProposalErrorCard } from "../components/proposal/ProposalErrorCard";
import { ProposalStepErrors } from "../components/proposal/ProposalStepErrors";
import { ProposalPlaceStep } from "../components/proposal/ProposalPlaceStep";
import { useTheme } from "../contexts/ThemeContext";
import { useSharedProposal } from "../hooks/useSharedProposal";
import { proposalSteps } from "../lib/proposalSteps";

/** Formulario guiado de alta o edición de una propuesta. */
export default function SharedProposalPage({
  projectId,
  onSaved,
  onBack,
  onAccount,
}: {
  projectId?: string;
  onSaved: (id: string) => void;
  onBack: () => void;
  onAccount: () => void;
}) {
  const { colors } = useTheme();
  const form = useSharedProposal(projectId, onSaved);
  const { draft, user, step, busy, saving } = form;
  const paragraph = { color: colors.muted, fontSize: 14, lineHeight: 21 };
  if (form.loading || !form.ready)
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
        <Text style={paragraph}>Preparando la propuesta…</Text>
      </Screen>
    );
  if (!form.canSubmit)
    return (
      <Screen>
        <Heading
          title="Presentar un proyecto"
          subtitle="Ingresá con una cuenta de alumno para continuar."
        />
        {!user && <Button title="Ingresar" onPress={onAccount} />}
        <Button title="Volver" variant="quiet" onPress={onBack} />
      </Screen>
    );

  return (
    <Screen scrollRef={form.scroll}>
      <View
        style={{ width: "100%", maxWidth: 860, alignSelf: "center", gap: 16 }}
      >
        <Heading
          title={projectId ? "Editar propuesta" : "Presentar un proyecto"}
          subtitle="Completá cada paso. Al final vas a revisar todo antes de enviarlo."
        />
        {!!form.feedback && (
          <Card>
            <Heading title="Correcciones solicitadas" />
            <Text style={{ color: colors.text, lineHeight: 22 }}>
              {form.feedback}
            </Text>
          </Card>
        )}
        {!!form.error && (
          <ProposalErrorCard
            error={form.error}
            hasDraft={!!draft}
            conflict={form.conflict}
            editing={!!projectId}
            onRetry={form.retryLoad}
            onReviewPlace={() => {
              form.setStep(2);
              form.top();
            }}
            onReload={() => {
              form.setDirty(false);
              form.retryLoad();
            }}
          />
        )}
        {draft && user && form.draftReady && (
          <>
            <ProposalStepNavigation
              step={step}
              complete={[...form.complete, form.complete.every(Boolean)]}
              disabled={busy}
              onSelect={form.goToStep}
            />
            <View accessibilityLiveRegion="polite" style={{ gap: 3 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Paso {step + 1} de 4
              </Text>
              <Heading title={proposalSteps[step].subtitle} />
            </View>
            {(form.submitted || form.attempted.includes(step)) &&
              form.currentIssues.length > 0 && (
                <ProposalStepErrors issues={form.currentIssues} />
              )}
            <View pointerEvents={saving ? "none" : "auto"} style={{ gap: 16 }}>
              <View
                testID="proposal-step-project"
                style={{ display: step === 0 ? "flex" : "none" }}
              >
                <SharedProjectDetails
                  draft={draft}
                  saving={saving}
                  errorFor={form.fieldError}
                  onChange={form.change}
                  onUploadChange={form.setUploading}
                />
              </View>
              <View
                testID="proposal-step-team"
                style={{ display: step === 1 ? "flex" : "none", gap: 16 }}
              >
                <SharedPeoplePicker
                  role="student"
                  people={draft.members}
                  protectedIds={[draft.creatorId, user.id]}
                  excludedIds={draft.teachers.map((person) => person.id)}
                  disabled={busy}
                  error={form.fieldError("memberIds")}
                  onChange={(people) => form.change("members", people)}
                  onPendingChange={(value) =>
                    form.pendingChange("students", value)
                  }
                />
                <SharedPeoplePicker
                  role="teacher"
                  people={draft.teachers}
                  excludedIds={draft.members.map((person) => person.id)}
                  disabled={busy}
                  error={form.fieldError("teacherIds")}
                  onChange={(people) => form.change("teachers", people)}
                  onPendingChange={(value) =>
                    form.pendingChange("teachers", value)
                  }
                />
                <ProjectSubjectsPicker
                  value={draft.subjects}
                  onChange={(subjects) => form.change("subjects", subjects)}
                  disabled={busy}
                  error={form.fieldError("subjects")}
                  onPendingChange={(value) =>
                    form.pendingChange("subjects", value)
                  }
                />
              </View>
              <ProposalPlaceStep
                visible={step === 2}
                draft={draft}
                projectId={projectId}
                spaces={form.spaces}
                spaceId={form.spaceId}
                space={form.space}
                spaceLoading={form.spaceLoading}
                busy={busy}
                resourcesOpen={form.resourcesOpen}
                onToggleResources={() =>
                  form.setResourcesOpen(!form.resourcesOpen)
                }
                fieldError={form.fieldError}
                onSpace={(id) => {
                  form.setSpaceId(id);
                  form.change("boothId", "");
                }}
                change={form.change}
                refreshPlaces={form.refreshPlaces}
              />
              <View
                testID="proposal-step-review"
                style={{ display: step === 3 ? "flex" : "none" }}
              >
                <ProposalReview
                  draft={draft}
                  spaceName={form.space?.name ?? "Espacio pendiente"}
                  boothName={`Puesto ${form.space?.booths.find((booth) => booth.id === draft.boothId)?.furnitureId ?? "pendiente"}`}
                  active={step === 3}
                  onEdit={form.goToStep}
                />
              </View>
            </View>
            <ActionRow>
              {step > 0 && (
                <Button
                  title="Anterior"
                  icon="arrowLeft"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => form.goToStep(step - 1)}
                />
              )}
              {step < 3 ? (
                <Button
                  title={step === 2 ? "Revisar propuesta" : "Continuar"}
                  endIcon="arrowRight"
                  disabled={busy || (step === 2 && form.spaceLoading)}
                  onPress={() => form.goToStep(step + 1)}
                />
              ) : (
                <Button
                  title={
                    saving
                      ? "Enviando propuesta…"
                      : projectId
                        ? "Guardar y reenviar"
                        : "Enviar propuesta"
                  }
                  icon="save"
                  disabled={busy || form.spaceLoading}
                  onPress={() => void form.submit()}
                />
              )}
            </ActionRow>
            {form.uploading && (
              <Text accessibilityLiveRegion="polite" style={paragraph}>
                Esperá a que termine la foto o cancelá su carga para continuar.
              </Text>
            )}
          </>
        )}
        <Button
          title="Volver sin enviar"
          variant="quiet"
          disabled={busy}
          onPress={onBack}
        />
        {form.leaveAction && (
          <InlineConfirm
            text="¿Descartar el borrador de esta propuesta y salir?"
            confirmLabel="Descartar y salir"
            onCancel={() => form.setLeaveAction(null)}
            onConfirm={form.leave}
          />
        )}
      </View>
    </Screen>
  );
}
