export interface Units {
  mi: string;
  lb: string;
}

export interface Formatter {
  number: (value: number) => string;
  duration: (seconds: number) => string;
  miles: (mi: number) => string;
  pounds: (lb: number) => string;
  clock: (value: string | Date) => string;
  dateTime: (value: string | Date) => string;
}

const toDate = (value: string | Date) =>
  typeof value === "string" ? new Date(value) : value;

export function createFormatter(locale: string, units: Units): Formatter {
  const number = new Intl.NumberFormat(locale);
  const clock = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  const dateTime = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    number: (value) => number.format(value),
    duration: (seconds) => formatDuration(seconds),
    miles: (mi) => `${number.format(Math.round(mi))} ${units.mi}`,
    pounds: (lb) => `${number.format(Math.round(lb))} ${units.lb}`,
    clock: (value) => clock.format(toDate(value)),
    dateTime: (value) => dateTime.format(toDate(value)),
  };
}

export function formatDuration(seconds: number): string {
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const shortPlace = (label: string) => label.split(",")[0].trim();
