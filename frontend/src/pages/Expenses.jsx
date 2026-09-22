import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "../services/expenseService";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import { EXPENSE_CATEGORIES } from "../lib/constants";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";
import { IconPlus, IconEdit, IconTrash, IconArrowDownRight } from "../components/common/Icons";

const emptyForm = { category: "general", vendor: "", amount: "", description: "", expense_date: "" };

export default function Expenses() {
  const { data: expenses, loading, refetch } = useFetch(() => listExpenses(), []);
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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

  const openEditModal = (expense) => {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      vendor: expense.vendor || "",
      amount: expense.amount,
      description: expense.description || "",
      expense_date: expense.expense_date || "",
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
      const payload = { ...form, amount: Number(form.amount) };
      if (!payload.expense_date) delete payload.expense_date;
      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense record?")) return;
    await deleteExpense(id);
    refetch();
  };

  const totalExpenseAmount = (expenses || []).reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const uniqueVendors = new Set((expenses || []).map((e) => e.vendor).filter(Boolean)).size;

  const filteredExpenses = (expenses || []).filter((exp) => {
    if (filterCategory && exp.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const vendor = (exp.vendor || "").toLowerCase();
      const desc = (exp.description || "").toLowerCase();
      return vendor.includes(term) || desc.includes(term);
    }
    return true;
  });

  const columns = [
    {
      key: "expense_date",
      header: "Date",
      render: (row) => (
        <span style={{ color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 500 }}>
          {formatDate(row.expense_date)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span
          style={{
            background: "#f1f5f9",
            padding: "3px 9px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "capitalize",
          }}
        >
          {row.category}
        </span>
      ),
    },
    {
      key: "vendor",
      header: "Vendor / Payee",
      render: (row) => <strong>{row.vendor || "—"}</strong>,
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span style={{ fontWeight: 700, color: "var(--color-danger-text)", fontSize: 14 }}>
          -{formatCurrency(row.amount)}
        </span>
      ),
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
          <h1>Expenses</h1>
          <p>Record, categorize, and control corporate overhead and operational expenses.</p>
        </div>
        <Button onClick={openCreateModal} icon={<IconPlus size={16} />}>
          Add Expense
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="summary-card tone-danger" style={{ padding: 18 }}>
          <div className="summary-card-header">
            <span className="label">Total Recorded Expenses</span>
            <IconArrowDownRight size={18} color="var(--color-danger-text)" />
          </div>
          <div className="value" style={{ fontSize: 24 }}>-{formatCurrency(totalExpenseAmount)}</div>
          <div className="sub-hint">{expenses?.length || 0} total expense transactions</div>
        </div>

        <div className="summary-card tone-default" style={{ padding: 18 }}>
          <div className="summary-card-header">
            <span className="label">Active Vendors</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>{uniqueVendors}</div>
          <div className="sub-hint">Distinct suppliers &amp; service providers</div>
        </div>

        <div className="summary-card tone-primary" style={{ padding: 18 }}>
          <div className="summary-card-header">
            <span className="label">Categories Tracked</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>{EXPENSE_CATEGORIES.length}</div>
          <div className="sub-hint">Operational categorization</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: 1, maxWidth: 360 }}>
          <input
            className="input"
            type="text"
            placeholder="Search vendor or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Category:</span>
          <select
            className="input"
            style={{ width: "auto", minWidth: 180 }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <Loader label="Loading expense records…" />
        ) : (
          <Table
            columns={columns}
            data={filteredExpenses}
            emptyMessage={searchTerm || filterCategory ? "No expenses match the filter." : "No expenses recorded yet."}
          />
        )}
      </div>

      <Modal
        title={editingId ? "Edit Expense" : "Record Expense"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Expense" : "Save Expense"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select className="input" name="category" value={form.category} onChange={handleChange}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Input label="Vendor / Payee" name="vendor" value={form.vendor} onChange={handleChange} placeholder="e.g., AWS, Slack, Office Depot" />
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
          <Input label="Description / Purpose" name="description" value={form.description} onChange={handleChange} placeholder="Monthly subscription or supply receipt" />
          <Input label="Expense Date" name="expense_date" type="date" value={form.expense_date} onChange={handleChange} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
