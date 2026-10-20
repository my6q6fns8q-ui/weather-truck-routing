import type { RiskLevel } from "./types";

export interface RiskLevelInfo {
  level: RiskLevel;
  key: string;
  color: string;
}

export const RISK_SCALE: readonly RiskLevelInfo[] = [
  { level: 0, key: "Low", color: "#34c759" },
  { level: 1, key: "Moderate", color: "#ffcc00" },
  { level: 2, key: "High", color: "#ff9500" },
  { level: 3, key: "Severe", color: "#ff3b30" },
  { level: 4, key: "No Travel", color: "#af52de" },
];

export const EXPOSED_LEVELS = RISK_SCALE.slice(2);

const FALLBACK_COLOR = "#888888";

export const riskColor = (level: number) =>
  RISK_SCALE[level]?.color ?? FALLBACK_COLOR;

export function riskRgb(level: number): string {
  const hex = riskColor(level).slice(1);
  const value = Number.parseInt(hex, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].join(",");
}

export const riskTextColor = (level: number) =>
  level === 1 ? "#072635" : "#ffffff";
