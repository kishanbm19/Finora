export function formatCurrency(amount, currency = "INR") {
  const value = Number(amount) || 0;
  const curr = (currency || "INR").trim().toUpperCase();
  try {
    const locale = curr === "INR" ? "en-IN" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${curr} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
