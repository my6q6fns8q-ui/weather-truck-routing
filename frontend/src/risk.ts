import type { RiskLevel } from "./types";

export const RISK_LEVELS: { level: RiskLevel; label: string; color: string }[] = [
  { level: 0, label: "Low", color: "#34c759" },
  { level: 1, label: "Moderate", color: "#ffcc00" },
  { level: 2, label: "High", color: "#ff9500" },
  { level: 3, label: "Severe", color: "#ff3b30" },
  { level: 4, label: "No Travel", color: "#af52de" },
];

export const riskColor = (level: number) => RISK_LEVELS[level]?.color ?? "#888";
export const riskLabel = (level: number) => RISK_LEVELS[level]?.label ?? "Unknown";

export const riskTextColor = (level: number) => (level === 1 ? "#072635" : "#ffffff");
