import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionService";
import { listAccounts } from "../services/accountService";
import { listCustomers } from "../services/customerService";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import { TRANSACTION_TYPES } from "../lib/constants";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";

const emptyForm = {
  type: "expense",
  category: "general",
  amount: "",
  description: "",
  transaction_date: "",
  account_id: "cash",
  customer_id: "",
};

export default function Transactions() {
  const [filterAccountId, setFilterAccountId] = useState("");
  const { data: accounts, refetch: refetchAccounts } = useFetch(() => listAccounts(), []);
  const { data: customers } = useFetch(() => listCustomers(), []);
  const {
    data: transactions,
    loading,
    refetch: refetchTransactions,
  } = useFetch(
    () => listTransactions(filterAccountId ? { account_id: filterAccountId } : {}),
    [filterAccountId]
  );

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (tx) => {
    setEditingId(tx.id);
    setForm({
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      description: tx.description || "",
      transaction_date: tx.transaction_date || "",
      account_id: tx.account_id || (tx.account_type === "cash" ? "cash" : ""),
      customer_id: tx.customer_id || "",
    });
    setError("");
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let resolvedAccountId = form.account_id;
      if (resolvedAccountId === "unassigned" || !resolvedAccountId) {
        resolvedAccountId = null;
      }

      const payload = {
        ...form,
        amount: Number(form.amount),
        account_id: resolvedAccountId,
        customer_id: form.customer_id || null,
      };
      if (!payload.transaction_date) delete payload.transaction_date;

      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }
      setModalOpen(false);
      refetchTransactions();
      refetchAccounts();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
    refetchTransactions();
    refetchAccounts();
  };

  // Find currently selected account object for live preview
  const selectedAccountObj = (accounts || []).find((a) => a.id === form.account_id);
  const isCashSelected =
    form.account_id === "cash" ||
    (selectedAccountObj && selectedAccountObj.account_type === "cash");

  const getAccountDisplayName = () => {
    if (isCashSelected) return "Cash Wallet";
    if (selectedAccountObj) return selectedAccountObj.name;
    if (form.account_id === "unassigned") return "Unassigned (No Account)";
    return "Selected Account";
  };

  const columns = [
    { key: "transaction_date", header: "Date", render: (row) => formatDate(row.transaction_date) },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <span className={`badge ${row.type === "income" ? "badge-success" : "badge-danger"}`}>
          {row.type}
        </span>
      ),
    },
    {
      key: "account",
      header: "Account / Flow",
      render: (row) => {
        const isExpense = row.type === "expense";
        const isCash =
          row.account_type === "cash" ||
          (row.account_name && row.account_name.toLowerCase() === "cash");
        const accountName = row.account_name || (isCash ? "Cash" : null);

        if (!accountName && !row.account_id) {
          return <span className="account-tag unassigned-tag">⚪ Cash / Unassigned</span>;
        }

        if (isCash) {
          return (
            <span
              className={`account-tag ${isExpense ? "cash-tag" : "cash-income-tag"}`}
              title={isExpense ? "Deducted from Cash" : "Deposited to Cash"}
            >
              💵 {isExpense ? "Deducted from" : "Deposited to"} <strong>{accountName || "Cash"}</strong>
            </span>
          );
        }

        return (
          <span
            className={`account-tag ${isExpense ? "bank-tag" : "bank-income-tag"}`}
            title={isExpense ? `Deducted from ${accountName}` : `Deposited to ${accountName}`}
          >
            {isExpense ? "🔻 Deducted from" : "🟢 Deposited to"} <strong>{accountName}</strong>
          </span>
        );
      },
    },
    { key: "category", header: "Category" },
    {
      key: "description",
      header: "Description / Customer",
      render: (row) => (
        <div>
          <div>{row.description || "—"}</div>
          {row.customer_name && (
            <span
              className="account-tag"
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                borderColor: "#bfdbfe",
                fontSize: 11,
                marginTop: 3,
              }}
            >
              👤 {row.customer_name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span style={{ fontWeight: 600, color: row.type === "income" ? "var(--color-success)" : "var(--color-text)" }}>
          {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
            Track your financial entries, deductions, and deposits across accounts.
          </p>
        </div>
        <Button onClick={openCreateModal}>+ Add Transaction</Button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Filter by Account:</span>
          <select
            className="input"
            style={{ width: "auto", minWidth: 220 }}
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
          >
            <option value="">All Accounts & Cash</option>
            <option value="cash">💵 Cash Only</option>
            {accounts &&
              accounts
                .filter((a) => a.account_type !== "cash")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    🏦 {a.name} ({formatCurrency(a.balance, a.currency)})
                  </option>
                ))}
            <option value="unassigned">⚪ Unassigned / Other</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Loader />
        ) : (
          <Table columns={columns} data={transactions} emptyMessage="No transactions yet." />
        )}
      </div>

      <Modal
        title={editingId ? "Edit Transaction" : "Add Transaction"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save Transaction"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Transaction Type</label>
            <select className="input" name="type" value={form.type} onChange={handleChange}>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              {form.type === "expense" ? "Deduct From Account" : "Deposit To Account"}
            </label>
            <select
              className="input"
              name="account_id"
              value={form.account_id}
              onChange={handleChange}
              required
            >
              <optgroup label="Cash">
                <option value="cash">💵 Cash (Wallet / In-Hand)</option>
              </optgroup>
              {accounts && accounts.length > 0 && (
                <optgroup label="Bank & Financial Accounts">
                  {accounts
                    .filter((a) => a.account_type !== "cash")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        🏦 {a.name} ({a.account_type}) — Balance:{" "}
                        {formatCurrency(a.balance, a.currency)}
                      </option>
                    ))}
                  {accounts
                    .filter((a) => a.account_type === "cash")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        💵 {a.name} (Cash) — Balance:{" "}
                        {formatCurrency(a.balance, a.currency)}
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="Other">
                <option value="unassigned">⚪ Unassigned (Do not link to any account)</option>
              </optgroup>
            </select>
            <span className="helper-text">
              {form.type === "expense"
                ? "This amount will be deducted from the selected account."
                : "This amount will be added to the selected account balance."}
            </span>
          </div>

          {/* Live deduction / deposit visual preview */}
          {form.amount && !isNaN(form.amount) && Number(form.amount) > 0 && (
            <div
              className={`account-flow-preview ${
                form.type === "expense" ? "expense-flow" : "income-flow"
              }`}
            >
              <span className="flow-icon">{form.type === "expense" ? "🔻" : "🟢"}</span>
              <div>
                <div>
                  <strong>
                    {form.type === "expense" ? "Deducting " : "Depositing "}
                    {formatCurrency(Number(form.amount))}
                  </strong>{" "}
                  {form.type === "expense" ? "from" : "into"}{" "}
                  <strong>{getAccountDisplayName()}</strong>
                </div>
                {selectedAccountObj && (
                  <div className="flow-balance-hint">
                    Current: {formatCurrency(selectedAccountObj.balance, selectedAccountObj.currency)} ➔
                    Projected:{" "}
                    {formatCurrency(
                      form.type === "expense"
                        ? selectedAccountObj.balance - Number(form.amount)
                        : selectedAccountObj.balance + Number(form.amount),
                      selectedAccountObj.currency
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
          />

          <Input
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g., Supplies, Utilities, Client Payment"
            required
          />

          <div className="form-group">
            <label>Customer (Optional)</label>
            <select
              className="input"
              name="customer_id"
              value={form.customer_id || ""}
              onChange={handleChange}
            >
              <option value="">-- No Customer (General) --</option>
              {customers &&
                customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name} {c.company ? `(${c.company})` : ""}
                  </option>
                ))}
            </select>
            <span className="helper-text">
              Link this transaction to a specific customer's transaction logs.
            </span>
          </div>

          <Input
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional notes or payee"
          />

          <Input
            label="Date"
            name="transaction_date"
            type="date"
            value={form.transaction_date}
            onChange={handleChange}
          />

          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
