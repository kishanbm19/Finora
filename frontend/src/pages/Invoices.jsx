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
import { IconPlus, IconEdit, IconTrash } from "../components/common/Icons";

const emptyForm = { customer_id: "", amount: "", status: "draft", due_date: "", notes: "" };

const STATUS_CONFIG = {
  draft: { class: "badge-muted", label: "Draft" },
  sent: { class: "badge-warning", label: "Sent / Pending" },
  paid: { class: "badge-success", label: "Paid" },
  overdue: { class: "badge-danger", label: "Overdue" },
  cancelled: { class: "badge-muted", label: "Cancelled" },
};

export default function Invoices() {
  const { data: invoices, loading, refetch } = useFetch(() => listInvoices(), []);
  const { data: customers } = useFetch(() => listCustomers(), []);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filtered invoices
  const filteredInvoices = (invoices || []).filter((inv) => {
    if (filterStatus && inv.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const customerName = (customerMap[inv.customer_id] || "").toLowerCase();
      const invNum = (inv.invoice_number || "").toLowerCase();
      return customerName.includes(term) || invNum.includes(term);
    }
    return true;
  });

  // Calculate invoice metrics
  const totalInvoiced = (invoices || []).reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalPaid = (invoices || [])
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  const totalOutstanding = (invoices || [])
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((acc, inv) => acc + (inv.amount || 0), 0);

  const columns = [
    {
      key: "invoice_number",
      header: "Invoice #",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--color-text)", fontFamily: "monospace" }}>
          {row.invoice_number || `#INV-${row.id}`}
        </span>
      ),
    },
    {
      key: "customer_id",
      header: "Customer",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#e0e7ff",
              color: "#3730a3",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {(customerMap[row.customer_id] || "U")[0]}
          </div>
          <span style={{ fontWeight: 500 }}>{customerMap[row.customer_id] || "—"}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const conf = STATUS_CONFIG[row.status] || { class: "badge-muted", label: row.status };
        return (
          <span className={`badge ${conf.class}`}>
            <span className="badge-dot" />
            {conf.label}
          </span>
        );
      },
    },
    {
      key: "due_date",
      header: "Due Date",
      render: (row) => (
        <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
          {formatDate(row.due_date)}
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
          <h1>Invoices</h1>
          <p>Create, track receivables, and log client billings.</p>
        </div>
        <Button onClick={openCreateModal} icon={<IconPlus size={16} />}>
          New Invoice
        </Button>
      </div>

      {/* Invoice Quick Summary Bar */}
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="summary-card tone-primary" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Total Invoiced</span>
          </div>
          <div className="value" style={{ fontSize: 22 }}>{formatCurrency(totalInvoiced)}</div>
          <div className="sub-hint">{invoices?.length || 0} total invoices</div>
        </div>

        <div className="summary-card tone-success" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Collected (Paid)</span>
          </div>
          <div className="value" style={{ fontSize: 22 }}>{formatCurrency(totalPaid)}</div>
          <div className="sub-hint">Funds settled to accounts</div>
        </div>

        <div className="summary-card tone-danger" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Unpaid &amp; Overdue</span>
          </div>
          <div className="value" style={{ fontSize: 22 }}>{formatCurrency(totalOutstanding)}</div>
          <div className="sub-hint">Actionable receivables</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: 1, maxWidth: 360 }}>
          <input
            className="input"
            type="text"
            placeholder="Search by customer or invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Status:</span>
          <select
            className="input"
            style={{ width: "auto", minWidth: 160 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent / Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <Loader label="Loading invoices…" />
        ) : (
          <Table
            columns={columns}
            data={filteredInvoices}
            emptyMessage={searchTerm || filterStatus ? "No invoices match the filter." : "No invoices created yet."}
          />
        )}
      </div>

      <Modal
        title={editingId ? "Edit Invoice" : "Create New Invoice"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Invoice" : "Generate Invoice"}
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
                  {c.name} {c.company ? `(${c.company})` : ""}
                </option>
              ))}
            </select>
          </div>

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

          <div className="form-group">
            <label>Payment Status</label>
            <select className="input" name="status" value={form.status} onChange={handleChange}>
              {INVOICE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <Input label="Due Date" name="due_date" type="date" value={form.due_date} onChange={handleChange} required />
          <Input label="Notes / Terms (Optional)" name="notes" value={form.notes} onChange={handleChange} placeholder="Net 30, payment details..." />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
