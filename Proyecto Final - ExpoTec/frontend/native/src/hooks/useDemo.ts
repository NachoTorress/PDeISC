import { useContext } from "react";
import { DemoContext } from "../contexts/DemoContext";
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo necesita DemoProvider.");
  return context;
}
