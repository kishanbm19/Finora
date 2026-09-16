import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { listInvoices, createInvoice, updateInvoice, deleteInvoice } from "../services/invoiceService";
import { listCustomers } from "../services/customerService";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import { INVOICE_STATUSES } from "../lib/constants";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";

const emptyForm = { customer_id: "", amount: "", status: "draft", due_date: "", notes: "" };

const STATUS_BADGE = {
  draft: "badge-muted",
  sent: "badge-warning",
  paid: "badge-success",
  overdue: "badge-danger",
  cancelled: "badge-muted",
};

export default function Invoices() {
  const { data: invoices, loading, refetch } = useFetch(() => listInvoices(), []);
  const { data: customers } = useFetch(() => listCustomers(), []);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const customerMap = Object.fromEntries((customers || []).map((c) => [c.id, c.name]));

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (invoice) => {
    setEditingId(invoice.id);
    setForm({
      customer_id: invoice.customer_id,
      amount: invoice.amount,
      status: invoice.status,
      due_date: invoice.due_date,
      notes: invoice.notes || "",
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
      if (editingId) {
        await updateInvoice(editingId, payload);
      } else {
        await createInvoice(payload);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    await deleteInvoice(id);
    refetch();
  };

  const columns = [
    { key: "invoice_number", header: "Invoice #" },
    { key: "customer_id", header: "Customer", render: (row) => customerMap[row.customer_id] || "—" },
    { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
    {
      key: "status",
      header: "Status",
      render: (row) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status}</span>,
    },
    { key: "due_date", header: "Due", render: (row) => formatDate(row.due_date) },
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
        <h1>Invoices</h1>
        <Button onClick={openCreateModal}>+ Add Invoice</Button>
      </div>

      <div className="card">
        {loading ? <Loader /> : <Table columns={columns} data={invoices} emptyMessage="No invoices yet." />}
      </div>

      <Modal
        title={editingId ? "Edit Invoice" : "Add Invoice"}
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
            <label>Customer</label>
            <select className="input" name="customer_id" value={form.customer_id} onChange={handleChange} required>
              <option value="" disabled>
                Select a customer
              </option>
              {(customers || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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
          <div className="form-group">
            <label>Status</label>
            <select className="input" name="status" value={form.status} onChange={handleChange}>
              {INVOICE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Input label="Due Date" name="due_date" type="date" value={form.due_date} onChange={handleChange} required />
          <Input label="Notes" name="notes" value={form.notes} onChange={handleChange} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
