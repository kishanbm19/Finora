import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from "../services/transactionService";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import { TRANSACTION_TYPES } from "../lib/constants";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";

const emptyForm = { type: "income", category: "general", amount: "", description: "", transaction_date: "" };

export default function Transactions() {
  const { data: transactions, loading, refetch } = useFetch(() => listTransactions(), []);
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
      if (!payload.transaction_date) delete payload.transaction_date;
      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
    refetch();
  };

  const columns = [
    { key: "transaction_date", header: "Date", render: (row) => formatDate(row.transaction_date) },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <span className={`badge ${row.type === "income" ? "badge-success" : "badge-danger"}`}>{row.type}</span>
      ),
    },
    { key: "category", header: "Category" },
    { key: "description", header: "Description", render: (row) => row.description || "—" },
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
        <h1>Transactions</h1>
        <Button onClick={openCreateModal}>+ Add Transaction</Button>
      </div>

      <div className="card">
        {loading ? <Loader /> : <Table columns={columns} data={transactions} emptyMessage="No transactions yet." />}
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
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <select className="input" name="type" value={form.type} onChange={handleChange}>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Input label="Category" name="category" value={form.category} onChange={handleChange} required />
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
