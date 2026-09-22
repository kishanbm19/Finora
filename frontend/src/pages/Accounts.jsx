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
import { IconPlus, IconEdit, IconTrash, IconBank, IconWallet } from "../components/common/Icons";

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

  const totalBalance = (accounts || []).reduce((sum, a) => sum + (a.balance || 0), 0);
  const bankBalance = (accounts || [])
    .filter((a) => a.account_type !== "cash")
    .reduce((sum, a) => sum + (a.balance || 0), 0);
  const cashBalance = (accounts || [])
    .filter((a) => a.account_type === "cash")
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const columns = [
    {
      key: "name",
      header: "Account Name",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: row.account_type === "cash" ? "#ecfdf5" : "#eff6ff",
              color: row.account_type === "cash" ? "#047857" : "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {row.account_type === "cash" ? <IconWallet size={16} /> : <IconBank size={16} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{row.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", textTransform: "capitalize" }}>
              {row.account_type.replace("_", " ")}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "account_type",
      header: "Type",
      render: (row) => (
        <span
          className="badge"
          style={{
            background: row.account_type === "cash" ? "#f0fdf4" : "#f1f5f9",
            color: row.account_type === "cash" ? "#15803d" : "#475569",
            textTransform: "capitalize",
          }}
        >
          {row.account_type.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Current Balance",
      align: "right",
      render: (row) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: row.balance < 0 ? "var(--color-danger-text)" : "var(--color-text)",
          }}
        >
          {formatCurrency(row.balance, row.currency)}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--color-text-muted)", fontSize: 12 }}>
          {row.currency || "USD"}
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
          <h1>Accounts</h1>
          <p>Bank accounts, cash registers, cards, and liquid capital reservoirs.</p>
        </div>
        <Button onClick={openCreateModal} icon={<IconPlus size={16} />}>
          Add Account
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="summary-card tone-primary" style={{ padding: 18 }}>
          <div className="summary-card-header">
            <span className="label">Total Consolidated Liquidity</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>{formatCurrency(totalBalance)}</div>
          <div className="sub-hint">Sum of all accounts &amp; in-hand cash</div>
        </div>

        <div className="summary-card tone-default" style={{ padding: 18 }}>
          <div className="summary-card-header">
            <span className="label">Bank &amp; Financial Institutions</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>{formatCurrency(bankBalance)}</div>
          <div className="sub-hint">Checking, savings &amp; card accounts</div>
        </div>

        <div className="summary-card tone-success" style={{ padding: 18 }}>
          <div className="summary-card-header">
            <span className="label">In-Hand Cash Reserves</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>{formatCurrency(cashBalance)}</div>
          <div className="sub-hint">Physical drawers &amp; petty cash</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <Loader label="Loading accounts…" />
        ) : (
          <Table columns={columns} data={accounts} emptyMessage="No financial accounts registered yet." />
        )}
      </div>

      <Modal
        title={editingId ? "Edit Account" : "Add Financial Account"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Account" : "Create Account"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Account Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g., Silicon Valley Bank - Operating"
            required
          />
          <div className="form-group">
            <label>Account Type</label>
            <select className="input" name="account_type" value={form.account_type} onChange={handleChange}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Current / Opening Balance ($)"
            name="balance"
            type="number"
            step="0.01"
            value={form.balance}
            onChange={handleChange}
            placeholder="0.00"
          />
          <Input
            label="Currency Code"
            name="currency"
            value={form.currency}
            onChange={handleChange}
            placeholder="USD"
          />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
