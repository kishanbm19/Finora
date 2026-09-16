export function formatCurrency(amount, currency = "USD") {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
