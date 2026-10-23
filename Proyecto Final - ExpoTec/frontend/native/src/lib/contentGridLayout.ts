export function contentGridLayout({
  width,
  itemCount,
  minItemWidth,
  maxColumns,
  maxItemWidth,
  gap,
}: {
  width: number;
  itemCount: number;
  minItemWidth: number;
  maxColumns: number;
  maxItemWidth?: number;
  gap: number;
}) {
  const columns = Math.max(
    1,
    Math.min(
      maxColumns,
      itemCount,
      Math.floor((width + gap) / (minItemWidth + gap)),
    ),
  );
  return {
    columns,
    maxRowWidth:
      maxItemWidth === undefined
        ? undefined
        : maxItemWidth * columns + gap * (columns - 1),
  };
}
