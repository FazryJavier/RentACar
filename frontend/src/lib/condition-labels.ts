import type { BadgeTone } from "@/components/ui";

export type ConditionAreaValue =
  "front" | "rear" | "left" | "right" | "roof" | "interior" | "wheel";
export type ConditionSeverityValue = "minor" | "moderate" | "major";

/** Indonesian names of condition areas (shared by the admin editor and the public detail page). */
export const AREA_LABEL: Record<ConditionAreaValue, string> = {
  front: "Depan",
  rear: "Belakang",
  left: "Kiri",
  right: "Kanan",
  roof: "Atap",
  interior: "Interior",
  wheel: "Roda",
};

export const SEVERITY: Record<ConditionSeverityValue, { label: string; tone: BadgeTone }> = {
  minor: { label: "Ringan", tone: "success" },
  moderate: { label: "Sedang", tone: "warning" },
  major: { label: "Berat", tone: "danger" },
};
