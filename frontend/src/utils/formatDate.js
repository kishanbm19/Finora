export function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function toInputDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
}
