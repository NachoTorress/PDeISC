/** Grilla responsiva de tarjetas: calcula las columnas según el ancho medido. */
import { Children, useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import { contentGridLayout } from "../lib/contentGridLayout";
import { layout } from "../theme/tokens";

/** Usa el ancho real del contenido, incluyendo el espacio que ocupa la navegación. */
export default function ContentGrid({
  children,
  minItemWidth = 320,
  maxColumns = 3,
  maxItemWidth,
  testID = "content-grid",
}: {
  children: ReactNode;
  minItemWidth?: number;
  maxColumns?: number;
  maxItemWidth?: number;
  testID?: string;
}) {
  const [width, setWidth] = useState(0);
  const items = Children.toArray(children),
    gap = layout.gap;
  const { columns, maxRowWidth } = contentGridLayout({
    width,
    itemCount: items.length,
    minItemWidth,
    maxColumns,
    maxItemWidth,
    gap,
  });
  const rows = Array.from(
    { length: Math.ceil(items.length / columns) },
    (_, index) => items.slice(index * columns, (index + 1) * columns),
  );
  const cellStyle = {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: "column" as const,
  };
  return (
    <View
      testID={testID}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap, alignItems: "stretch" }}
    >
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          testID="content-grid-row"
          style={{
            flexDirection: "row",
            alignItems: "stretch",
            gap,
            maxWidth: maxRowWidth,
          }}
        >
          {/* Las filas no envuelven: un redondeo de píxeles no puede perder una columna. */}
          {row.map((item) => (
            <View
              key={
                typeof item === "object" && "key" in item
                  ? item.key
                  : String(item)
              }
              testID="content-grid-cell"
              style={cellStyle}
            >
              {item}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, index) => (
            <View key={`empty-${index}`} style={cellStyle} accessible={false} />
          ))}
        </View>
      ))}
    </View>
  );
}
