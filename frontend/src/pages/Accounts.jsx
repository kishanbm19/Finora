import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { listAccounts, createAccount, updateAccount, deleteAccount } from "../services/accountService";
import { formatCurrency } from "../utils/formatCurrency";
import { ACCOUNT_TYPES } from "../lib/constants";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";

const emptyForm = { name: "", account_type: "bank", balance: "", currency: "USD" };

export default function Accounts() {
  const { data: accounts, loading, refetch } = useFetch(() => listAccounts(), []);
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

  const openEditModal = (account) => {
    setEditingId(account.id);
    setForm({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance,
      currency: account.currency,
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
      const payload = { ...form, balance: Number(form.balance || 0) };
      if (editingId) {
        await updateAccount(editingId, payload);
      } else {
        await createAccount(payload);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    await deleteAccount(id);
    refetch();
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "account_type", header: "Type" },
    { key: "balance", header: "Balance", render: (row) => formatCurrency(row.balance, row.currency) },
    { key: "currency", header: "Currency" },
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

  const totalBalance = (accounts || []).reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Accounts</h1>
        <Button onClick={openCreateModal}>+ Add Account</Button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="summary-card">
          <div className="label">Total Balance Across Accounts</div>
          <div className="value">{formatCurrency(totalBalance)}</div>
        </div>
      </div>

      <div className="card">
        {loading ? <Loader /> : <Table columns={columns} data={accounts} emptyMessage="No accounts yet." />}
      </div>

      <Modal
        title={editingId ? "Edit Account" : "Add Account"}
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
          <Input label="Account Name" name="name" value={form.name} onChange={handleChange} required />
          <div className="form-group">
            <label>Type</label>
            <select className="input" name="account_type" value={form.account_type} onChange={handleChange}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Opening Balance"
            name="balance"
            type="number"
            step="0.01"
            value={form.balance}
            onChange={handleChange}
          />
          <Input label="Currency" name="currency" value={form.currency} onChange={handleChange} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
