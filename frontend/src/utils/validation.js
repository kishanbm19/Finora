export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

export function isRequired(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

export function minLength(value, length) {
  return String(value || "").length >= length;
}
