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

const emptyForm = { category: "general", vendor: "", amount: "", description: "", expense_date: "" };

export default function Expenses() {
  const { data: expenses, loading, refetch } = useFetch(() => listExpenses(), []);
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
    if (!window.confirm("Delete this expense?")) return;
    await deleteExpense(id);
    refetch();
  };

  const columns = [
    { key: "expense_date", header: "Date", render: (row) => formatDate(row.expense_date) },
    { key: "category", header: "Category" },
    { key: "vendor", header: "Vendor", render: (row) => row.vendor || "—" },
    { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
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
        <h1>Expenses</h1>
        <Button onClick={openCreateModal}>+ Add Expense</Button>
      </div>

      <div className="card">
        {loading ? <Loader /> : <Table columns={columns} data={expenses} emptyMessage="No expenses yet." />}
      </div>

      <Modal
        title={editingId ? "Edit Expense" : "Add Expense"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
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
          <Input label="Vendor" name="vendor" value={form.vendor} onChange={handleChange} />
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange}
            required
          />
          <Input label="Description" name="description" value={form.description} onChange={handleChange} />
          <Input label="Date" name="expense_date" type="date" value={form.expense_date} onChange={handleChange} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
