const pad = (n: number) => String(n).padStart(2, "0");

export const formatDate = (date: string) => {
  const d = new Date(date.length > 10 ? date : `${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
};

export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const plural = (n: number, word: string) => `${word}${n === 1 ? "" : "s"}`;
const joinParts = (a: string, b: string | null) => (b ? `${a}, ${b}` : a);

export const timeAgo = (date: string, now: Date = new Date()): string => {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "";
  const seconds = Math.floor((now.getTime() - time) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${plural(minutes, "minute")} ago`;
  const hours = Math.floor(minutes / 60);
  const minRem = minutes % 60;
  if (hours < 24) {
    return (
      joinParts(`${hours} ${plural(hours, "hour")}`, minRem > 0 ? `${minRem} ${plural(minRem, "minute")}` : null) +
      " ago"
    );
  }
  const days = Math.floor(hours / 24);
  const hrRem = hours % 24;
  if (days < 30) {
    return (
      joinParts(`${days} ${plural(days, "day")}`, hrRem > 0 ? `${hrRem} ${plural(hrRem, "hour")}` : null) +
      " ago"
    );
  }
  const months = Math.floor(days / 30);
  const dayRem = days % 30;
  if (months < 12) {
    return (
      joinParts(`${months} ${plural(months, "month")}`, dayRem > 0 ? `${dayRem} ${plural(dayRem, "day")}` : null) +
      " ago"
    );
  }
  const years = Math.floor(days / 365);
  const monthRem = Math.floor((days % 365) / 30);
  return (
    joinParts(`${years} ${plural(years, "year")}`, monthRem > 0 ? `${monthRem} ${plural(monthRem, "month")}` : null) +
    " ago"
  );
};

export const initialsOf = (name?: string, fallback = "?") => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};