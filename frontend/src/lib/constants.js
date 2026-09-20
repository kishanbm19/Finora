export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/api/v1";

export const ACCESS_TOKEN_KEY = "finora_access_token";
export const REFRESH_TOKEN_KEY = "finora_refresh_token";

export const TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

export const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "credit_card", label: "Credit Card" },
  { value: "savings", label: "Savings" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORIES = [
  "general",
  "rent",
  "utilities",
  "salaries",
  "marketing",
  "software",
  "travel",
  "supplies",
  "other",
];
