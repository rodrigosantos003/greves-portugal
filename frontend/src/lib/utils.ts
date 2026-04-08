export function formatDate(d: Date) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
