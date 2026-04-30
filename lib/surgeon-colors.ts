export const SURGEON_COLORS = [
  { id: "blue",   label: "Blue",   bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  { id: "green",  label: "Green",  bg: "#dcfce7", border: "#86efac", text: "#166534" },
  { id: "purple", label: "Purple", bg: "#f3e8ff", border: "#c4b5fd", text: "#6b21a8" },
  { id: "amber",  label: "Amber",  bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  { id: "pink",   label: "Pink",   bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
  { id: "teal",   label: "Teal",   bg: "#ccfbf1", border: "#5eead4", text: "#134e4a" },
  { id: "rose",   label: "Rose",   bg: "#ffe4e6", border: "#fda4af", text: "#9f1239" },
  { id: "indigo", label: "Indigo", bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
] as const;

export type SurgeonColorId = (typeof SURGEON_COLORS)[number]["id"];

export function getSurgeonColor(colorId: string | null | undefined) {
  if (!colorId) return null;
  return SURGEON_COLORS.find((c) => c.id === colorId) ?? null;
}

export function surgeonCardStyle(colorId: string | null | undefined): React.CSSProperties {
  const color = getSurgeonColor(colorId);
  if (!color) return {};
  return {
    backgroundColor: color.bg,
    borderColor: color.border,
  };
}
