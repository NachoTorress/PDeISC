/** Indicador y navegación de los cuatro pasos de la propuesta. */
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { proposalSteps } from "../lib/proposalSteps";
import { Icon } from "./Icon";

export default function ProposalStepNavigation({
  step,
  complete,
  disabled,
  onSelect,
}: {
  step: number;
  complete: boolean[];
  disabled: boolean;
  onSelect: (index: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID="proposal-steps"
      accessibilityLabel="Pasos de la propuesta"
      style={{ flexDirection: "row", gap: 6 }}
    >
      {proposalSteps.map((item, index) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          accessibilityLabel={`Paso ${index + 1}: ${item.title}`}
          accessibilityState={{ selected: index === step, disabled }}
          disabled={disabled}
          onPress={() => onSelect(index)}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            minHeight: 64,
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: 6,
            borderBottomWidth: 3,
            borderColor: index === step ? colors.primary : colors.outline,
            backgroundColor:
              index === step || pressed
                ? colors.selectedContainer
                : colors.surface,
            borderRadius: 8,
            opacity: disabled ? 0.6 : 1,
          })}
        >
          {complete[index] ? (
            <Icon name="check" size={17} color={colors.primary} />
          ) : (
            <Text
              style={{
                color:
                  index === step ? colors.onSelectedContainer : colors.muted,
                fontWeight: "700",
              }}
            >
              {index + 1}
            </Text>
          )}
          <Text
            style={{
              color: index === step ? colors.onSelectedContainer : colors.text,
              fontSize: 12,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
