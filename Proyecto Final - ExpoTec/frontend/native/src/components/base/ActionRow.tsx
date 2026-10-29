/**
 * Fila de acciones: los botones equivalentes comparten ancho y se apilan
 * cuando falta espacio. Usa un contexto para que cada `Button` sepa si está
 * dentro de una fila y qué ancho le corresponde.
 */
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useState,
} from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { styles } from "./styles";

/** Indica a los botones si están dentro de una fila de acciones. */
export const ActionRowContext = createContext<boolean | number>(false);

/** Cuenta las acciones visibles de una fila. */
function actionCount(children: ReactNode): number {
  return Children.toArray(children).reduce<number>(
    (total, child) =>
      total +
      (isValidElement<{ children?: ReactNode }>(child) &&
      child.type === Fragment
        ? actionCount(child.props.children)
        : 1),
    0,
  );
}

/** Acciones equivalentes comparten ancho y se apilan cuando falta espacio. */
export function ActionRow({
  children,
  footer = false,
  compact = false,
}: {
  children: ReactNode;
  footer?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const columns = Math.max(
    1,
    Math.min(actionCount(children), Math.floor((width + 8) / 108)),
  );
  const compactWidth = width
    ? Math.floor(Math.min(144, (width - (columns - 1) * 8) / columns))
    : 144;
  return (
    <ActionRowContext.Provider value={compact ? compactWidth : true}>
      <View
        testID={compact ? "compact-actions" : undefined}
        onLayout={
          compact
            ? (event) => setWidth(event.nativeEvent.layout.width)
            : undefined
        }
        style={[
          styles.wrap,
          { alignItems: "stretch" },
          footer && {
            marginTop: "auto",
            paddingTop: compact ? 8 : 12,
            borderTopWidth: 1,
            borderColor: colors.outline,
          },
        ]}
      >
        {children}
      </View>
    </ActionRowContext.Provider>
  );
}
