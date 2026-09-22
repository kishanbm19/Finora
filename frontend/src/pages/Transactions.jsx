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
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconArrowUpRight,
  IconArrowDownRight,
  IconWallet,
  IconBank,
} from "../components/common/Icons";

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
  const [filterType, setFilterType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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

  // Metrics calculation
  const totalInflow = (transactions || [])
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalOutflow = (transactions || [])
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const netMovement = totalInflow - totalOutflow;

  // Filter transactions
  const filteredTransactions = (transactions || []).filter((tx) => {
    if (filterType && tx.type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const desc = (tx.description || "").toLowerCase();
      const cat = (tx.category || "").toLowerCase();
      const cust = (tx.customer_name || "").toLowerCase();
      return desc.includes(term) || cat.includes(term) || cust.includes(term);
    }
    return true;
  });

  const columns = [
    {
      key: "transaction_date",
      header: "Date",
      render: (row) => (
        <span style={{ color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 500 }}>
          {formatDate(row.transaction_date)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <span className={`badge ${row.type === "income" ? "badge-success" : "badge-danger"}`}>
          <span className="badge-dot" />
          {row.type === "income" ? "Income" : "Expense"}
        </span>
      ),
    },
    {
      key: "account",
      header: "Account / Route",
      render: (row) => {
        const isExpense = row.type === "expense";
        const isCash =
          row.account_type === "cash" ||
          (row.account_name && row.account_name.toLowerCase() === "cash");
        const accountName = row.account_name || (isCash ? "Cash" : null);

        if (!accountName && !row.account_id) {
          return <span className="account-tag unassigned-tag">Unassigned Route</span>;
        }

        if (isCash) {
          return (
            <span
              className={`account-tag ${isExpense ? "cash-tag" : "cash-income-tag"}`}
              title={isExpense ? "Deducted from Cash" : "Deposited to Cash"}
            >
              <IconWallet size={13} />
              <span>{isExpense ? "Paid via" : "Deposited to"}</span>
              <strong>{accountName || "Cash"}</strong>
            </span>
          );
        }

        return (
          <span
            className={`account-tag ${isExpense ? "bank-tag" : "bank-income-tag"}`}
            title={isExpense ? `Deducted from ${accountName}` : `Deposited to ${accountName}`}
          >
            <IconBank size={13} />
            <span>{isExpense ? "Deducted from" : "Deposited to"}</span>
            <strong>{accountName}</strong>
          </span>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span
          style={{
            background: "#f1f5f9",
            padding: "3px 8px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            textTransform: "capitalize",
          }}
        >
          {row.category}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description & Entity",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.description || "—"}</div>
          {row.customer_name && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #dbeafe",
                borderRadius: 4,
                padding: "1px 6px",
                fontSize: 11,
                marginTop: 3,
                fontWeight: 600,
              }}
            >
              👤 {row.customer_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => {
        const isIncome = row.type === "income";
        return (
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: isIncome ? "var(--color-success-text)" : "var(--color-danger-text)",
            }}
          >
            {isIncome ? "+" : "-"}{formatCurrency(row.amount)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openEditModal(row)}
            icon={<IconEdit size={14} />}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row.id)}
            icon={<IconTrash size={14} />}
          >
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
          <p>Complete ledger of inflows, outflows, and financial entries across accounts.</p>
        </div>
        <Button onClick={openCreateModal} icon={<IconPlus size={16} />}>
          New Transaction
        </Button>
      </div>

      {/* Movement Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="summary-card tone-success" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Total Inflow</span>
            <IconArrowUpRight size={18} color="var(--color-success-text)" />
          </div>
          <div className="value" style={{ fontSize: 22 }}>+{formatCurrency(totalInflow)}</div>
          <div className="sub-hint">Deposits, sales, client payments</div>
        </div>

        <div className="summary-card tone-danger" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Total Outflow</span>
            <IconArrowDownRight size={18} color="var(--color-danger-text)" />
          </div>
          <div className="value" style={{ fontSize: 22 }}>-{formatCurrency(totalOutflow)}</div>
          <div className="sub-hint">Direct expenses, purchases, payouts</div>
        </div>

        <div
          className={`summary-card ${netMovement >= 0 ? "tone-success" : "tone-danger"}`}
          style={{ padding: 16 }}
        >
          <div className="summary-card-header">
            <span className="label">Net Ledger Balance</span>
          </div>
          <div className="value" style={{ fontSize: 22 }}>
            {netMovement >= 0 ? "+" : ""}{formatCurrency(netMovement)}
          </div>
          <div className="sub-hint">
            {netMovement >= 0 ? "Positive cash margin" : "Negative net burn"}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: 1, maxWidth: 320 }}>
          <input
            className="input"
            type="text"
            placeholder="Search description, category, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="filter-group">
            <span className="filter-label">Account:</span>
            <select
              className="input"
              style={{ width: "auto", minWidth: 200 }}
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
            >
              <option value="">All Accounts &amp; Cash</option>
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

          <div className="filter-group">
            <span className="filter-label">Type:</span>
            <select
              className="input"
              style={{ width: "auto", minWidth: 140 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">🟢 Income</option>
              <option value="expense">🔻 Expense</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <Loader label="Loading transaction entries…" />
        ) : (
          <Table
            columns={columns}
            data={filteredTransactions}
            emptyMessage={
              searchTerm || filterAccountId || filterType
                ? "No transactions match your current filters."
                : "No transactions recorded yet."
            }
          />
        )}
      </div>

      <Modal
        title={editingId ? "Edit Transaction" : "Record New Transaction"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Entry" : "Save Transaction"}
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
                    <strong>
                      {formatCurrency(
                        form.type === "expense"
                          ? selectedAccountObj.balance - Number(form.amount)
                          : selectedAccountObj.balance + Number(form.amount),
                        selectedAccountObj.currency
                      )}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <Input
            label="Amount ($)"
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
            placeholder="Notes or payee details"
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
