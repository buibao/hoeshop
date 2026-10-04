import { vietnamToday } from "./schemas";
export function displayDate(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? iso.split("-").reverse().join("/")
    : iso;
}
export function parseDisplayDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`,
    date = new Date(iso + "T00:00:00Z");
  return Number.isFinite(date.valueOf()) &&
    date.toISOString().slice(0, 10) === iso
    ? iso
    : null;
}
export function calendarDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
export function calendarIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dateError(value: string, allowPast = false) {
  const iso = parseDisplayDate(value);
  return !iso
    ? "Nhập ngày theo dạng dd/mm/yyyy."
    : !allowPast && iso < vietnamToday()
      ? "Ngày mong muốn đã ở quá khứ."
      : "";
}
