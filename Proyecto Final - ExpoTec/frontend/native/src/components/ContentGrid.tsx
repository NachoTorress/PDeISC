import { Children, useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import { layout } from "../theme/tokens";

/** Usa el ancho real del contenido, incluyendo el espacio que ocupa la navegación. */
export default function ContentGrid({
  children,
  minItemWidth = 320,
  maxColumns = 3,
  maxItemWidth,
}: {
  children: ReactNode;
  minItemWidth?: number;
  maxColumns?: number;
  maxItemWidth?: number;
}) {
  const [width, setWidth] = useState(0);
  const items = Children.toArray(children),
    gap = layout.gap;
  const columns = Math.max(
    1,
    Math.min(
      maxColumns,
      Math.floor((width + gap) / (minItemWidth + gap)),
    ),
  );
  const itemWidth =
    width > 0
      ? Math.min(
          maxItemWidth ?? Infinity,
          (width - gap * (columns - 1)) / columns,
        )
      : "100%";
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "stretch",
        gap,
      }}
    >
      {items.map((item) => (
        <View
          key={
            typeof item === "object" && "key" in item ? item.key : String(item)
          }
          style={{ width: itemWidth, minWidth: 0, flexDirection: "column" }}
        >
          {item}
        </View>
      ))}
    </View>
  );
}
