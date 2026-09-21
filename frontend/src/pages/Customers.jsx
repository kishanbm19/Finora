import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customerService";
import { listInvoices } from "../services/invoiceService";
import { listTransactions, createTransaction } from "../services/transactionService";
import { listAccounts } from "../services/accountService";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";

const emptyForm = { name: "", email: "", phone: "", company: "", address: "" };

export default function Customers() {
  const { data: customers, loading, refetch } = useFetch(() => listCustomers(), []);
  const { data: accounts } = useFetch(() => listAccounts(), []);

  // Customer Edit/Create Modal state
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Customer Ledger (Invoices & Transaction Logs) Modal state
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [ledgerTab, setLedgerTab] = useState("invoices"); // "invoices" | "transactions"
  const [ledgerInvoices, setLedgerInvoices] = useState([]);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Quick Add Transaction Modal for Customer
  const [isAddTxOpen, setAddTxOpen] = useState(false);
  const [txForm, setTxForm] = useState({
    type: "income",
    category: "Client Payment",
    amount: "",
    description: "",
    account_id: "cash",
    transaction_date: "",
  });
  const [txSaving, setTxSaving] = useState(false);
  const [txError, setTxError] = useState("");

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
    });
    setError("");
    setModalOpen(true);
  };

  const openLedger = async (customer) => {
    setLedgerCustomer(customer);
    setLedgerTab("invoices");
    setLoadingLedger(true);
    try {
      const [invs, txs] = await Promise.all([
        listInvoices({ customer_id: customer.id }),
        listTransactions({ customer_id: customer.id }),
      ]);
      setLedgerInvoices(invs || []);
      setLedgerTransactions(txs || []);
    } catch (err) {
      console.error("Failed to load customer records:", err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const refreshLedger = async (customerId) => {
    setLoadingLedger(true);
    try {
      const [invs, txs] = await Promise.all([
        listInvoices({ customer_id: customerId }),
        listTransactions({ customer_id: customerId }),
      ]);
      setLedgerInvoices(invs || []);
      setLedgerTransactions(txs || []);
      refetch();
    } catch (err) {
      console.error("Failed to refresh records:", err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateCustomer(editingId, form);
      } else {
        await createCustomer(form);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    await deleteCustomer(id);
    refetch();
  };

  const handleCreateTxForCustomer = async (e) => {
    e.preventDefault();
    setTxSaving(true);
    setTxError("");
    try {
      const payload = {
        ...txForm,
        amount: Number(txForm.amount),
        customer_id: ledgerCustomer.id,
        account_id: txForm.account_id === "unassigned" ? null : txForm.account_id,
      };
      if (!payload.transaction_date) delete payload.transaction_date;
      await createTransaction(payload);
      setAddTxOpen(false);
      await refreshLedger(ledgerCustomer.id);
    } catch (err) {
      setTxError(err.response?.data?.detail || "Failed to record transaction.");
    } finally {
      setTxSaving(false);
    }
  };

  // High-level aggregates
  const totalInvoiced = (customers || []).reduce((acc, c) => acc + (c.total_invoiced || 0), 0);
  const totalPaid = (customers || []).reduce((acc, c) => acc + (c.total_paid || 0), 0);
  const totalOutstanding = (customers || []).reduce(
    (acc, c) => acc + (c.outstanding_balance || 0),
    0
  );

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          {row.company && (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{row.company}</div>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <div>
          <div>{row.email || "—"}</div>
          {row.phone && (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{row.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: "total_invoiced",
      header: "Total Invoiced",
      render: (row) => formatCurrency(row.total_invoiced || 0),
    },
    {
      key: "total_paid",
      header: "Paid to Date",
      render: (row) => (
        <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
          {formatCurrency(row.total_paid || 0)}
        </span>
      ),
    },
    {
      key: "outstanding_balance",
      header: "Balance Due",
      render: (row) =>
        row.outstanding_balance > 0 ? (
          <span className="badge badge-danger">
            {formatCurrency(row.outstanding_balance)} Due
          </span>
        ) : (
          <span className="badge badge-success">All Clear</span>
        ),
    },
    {
      key: "activity",
      header: "Records",
      render: (row) => (
        <span className="badge badge-muted">
          {row.invoice_count || 0} inv • {row.transaction_count || 0} tx
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => openLedger(row)}>
            📋 Logs & Invoices
          </Button>
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

  // Invoices table inside the ledger modal
  const invoiceColumns = [
    {
      key: "invoice_number",
      header: "Invoice #",
      render: (row) => <strong>{row.invoice_number}</strong>,
    },
    {
      key: "issue_date",
      header: "Issue Date",
      render: (row) => formatDate(row.issue_date),
    },
    {
      key: "due_date",
      header: "Due Date",
      render: (row) => formatDate(row.due_date),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const statusColors = {
          paid: "badge-success",
          sent: "badge-warning",
          overdue: "badge-danger",
          draft: "badge-muted",
          cancelled: "badge-muted",
        };
        return (
          <span className={`badge ${statusColors[row.status] || "badge-muted"}`}>
            {row.status.toUpperCase()}
          </span>
        );
      },
    },
    {
      key: "notes",
      header: "Notes",
      render: (row) => row.notes || "—",
    },
  ];

  // Transactions table inside the ledger modal
  const transactionColumns = [
    {
      key: "transaction_date",
      header: "Date",
      render: (row) => formatDate(row.transaction_date),
    },
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
      key: "flow",
      header: "Account / Flow",
      render: (row) => {
        const isExpense = row.type === "expense";
        const isCash =
          row.account_type === "cash" ||
          (row.account_name && row.account_name.toLowerCase() === "cash");
        const accountName = row.account_name || (isCash ? "Cash" : "Account");

        if (!row.account_name && !row.account_id) {
          return <span className="account-tag unassigned-tag">⚪ Cash / Unassigned</span>;
        }

        if (isCash) {
          return (
            <span
              className={`account-tag ${isExpense ? "cash-tag" : "cash-income-tag"}`}
              title={isExpense ? "Deducted from Cash" : "Deposited to Cash"}
            >
              💵 {isExpense ? "Deducted from" : "Deposited to"} <strong>{accountName}</strong>
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
    { key: "description", header: "Description", render: (row) => row.description || "—" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span
          style={{
            fontWeight: 600,
            color: row.type === "income" ? "var(--color-success)" : "var(--color-text)",
          }}
        >
          {row.type === "income" ? "+" : "-"}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
            Client directory, billing ledgers, and customer transaction logs.
          </p>
        </div>
        <Button onClick={openCreateModal}>+ Add Customer</Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card summary-card">
          <div className="label">Total Customers</div>
          <div className="value">{(customers || []).length}</div>
        </div>
        <div className="card summary-card">
          <div className="label">Total Invoiced</div>
          <div className="value">{formatCurrency(totalInvoiced)}</div>
        </div>
        <div className="card summary-card">
          <div className="label">Collected (Paid)</div>
          <div className="value" style={{ color: "var(--color-success)" }}>
            {formatCurrency(totalPaid)}
          </div>
        </div>
        <div className="card summary-card">
          <div className="label">Outstanding Due</div>
          <div
            className="value"
            style={{ color: totalOutstanding > 0 ? "var(--color-danger)" : "inherit" }}
          >
            {formatCurrency(totalOutstanding)}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Loader />
        ) : (
          <Table columns={columns} data={customers} emptyMessage="No customers yet." />
        )}
      </div>

      {/* Edit / Create Customer Modal */}
      <Modal
        title={editingId ? "Edit Customer" : "Add Customer"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save Customer"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Company" name="company" value={form.company} onChange={handleChange} />
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>

      {/* Customer Financial Activity & Transaction Logs Modal */}
      {ledgerCustomer && (
        <Modal
          title={`Customer Ledger — ${ledgerCustomer.name}`}
          isOpen={!!ledgerCustomer}
          onClose={() => setLedgerCustomer(null)}
          width={840}
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <Button
                variant="primary"
                onClick={() => {
                  setTxForm({
                    type: "income",
                    category: "Client Payment",
                    amount: "",
                    description: `Payment from ${ledgerCustomer.name}`,
                    account_id: "cash",
                    transaction_date: "",
                  });
                  setTxError("");
                  setAddTxOpen(true);
                }}
              >
                + Record Payment / Transaction
              </Button>
              <Button variant="secondary" onClick={() => setLedgerCustomer(null)}>
                Close
              </Button>
            </div>
          }
        >
          {/* Customer Profile Banner */}
          <div className="customer-profile-bar">
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {ledgerCustomer.name}{" "}
                {ledgerCustomer.company && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)" }}>
                    • {ledgerCustomer.company}
                  </span>
                )}
              </div>
              <div className="customer-info-meta" style={{ marginTop: 6 }}>
                {ledgerCustomer.email && <span>📧 {ledgerCustomer.email}</span>}
                {ledgerCustomer.phone && <span>📞 {ledgerCustomer.phone}</span>}
                {ledgerCustomer.address && <span>📍 {ledgerCustomer.address}</span>}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="customer-kpi-grid">
            <div className="customer-kpi-card">
              <div className="kpi-label">Total Invoiced</div>
              <div className="kpi-val">{formatCurrency(ledgerCustomer.total_invoiced || 0)}</div>
            </div>
            <div className="customer-kpi-card">
              <div className="kpi-label">Paid to Date</div>
              <div className="kpi-val" style={{ color: "var(--color-success)" }}>
                {formatCurrency(ledgerCustomer.total_paid || 0)}
              </div>
            </div>
            <div className="customer-kpi-card">
              <div className="kpi-label">Outstanding Due</div>
              <div
                className="kpi-val"
                style={{
                  color:
                    ledgerCustomer.outstanding_balance > 0 ? "var(--color-danger)" : "inherit",
                }}
              >
                {formatCurrency(ledgerCustomer.outstanding_balance || 0)}
              </div>
            </div>
            <div className="customer-kpi-card">
              <div className="kpi-label">Activity Records</div>
              <div className="kpi-val">
                {ledgerInvoices.length} inv / {ledgerTransactions.length} tx
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="tabs-nav">
            <button
              className={`tab-btn ${ledgerTab === "invoices" ? "active" : ""}`}
              onClick={() => setLedgerTab("invoices")}
            >
              📋 Invoices ({ledgerInvoices.length})
            </button>
            <button
              className={`tab-btn ${ledgerTab === "transactions" ? "active" : ""}`}
              onClick={() => setLedgerTab("transactions")}
            >
              💳 Transaction Logs ({ledgerTransactions.length})
            </button>
          </div>

          {/* Tab Content */}
          {loadingLedger ? (
            <Loader />
          ) : ledgerTab === "invoices" ? (
            <div style={{ marginTop: 8 }}>
              <Table
                columns={invoiceColumns}
                data={ledgerInvoices}
                emptyMessage="No invoices generated for this customer yet."
              />
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              <Table
                columns={transactionColumns}
                data={ledgerTransactions}
                emptyMessage="No transaction logs recorded for this customer yet."
              />
            </div>
          )}
        </Modal>
      )}

      {/* Add Transaction directly for Customer Modal */}
      {isAddTxOpen && ledgerCustomer && (
        <Modal
          title={`Record Transaction for ${ledgerCustomer.name}`}
          isOpen={isAddTxOpen}
          onClose={() => setAddTxOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setAddTxOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTxForCustomer} disabled={txSaving}>
                {txSaving ? "Recording…" : "Record Transaction"}
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateTxForCustomer}>
            <div className="form-group">
              <label>Type</label>
              <select
                className="input"
                value={txForm.type}
                onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
              >
                <option value="income">Income (Received from Customer)</option>
                <option value="expense">Expense (Refund / Paid to Customer)</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                {txForm.type === "income" ? "Deposit Into Account" : "Deduct From Account"}
              </label>
              <select
                className="input"
                value={txForm.account_id}
                onChange={(e) => setTxForm({ ...txForm, account_id: e.target.value })}
                required
              >
                <optgroup label="Cash">
                  <option value="cash">💵 Cash (In Hand / Wallet)</option>
                </optgroup>
                {accounts && accounts.length > 0 && (
                  <optgroup label="Bank & Financial Accounts">
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_type === "cash" ? "💵" : "🏦"} {a.name} ({a.account_type}) —{" "}
                        {formatCurrency(a.balance, a.currency)}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Other">
                  <option value="unassigned">⚪ Unassigned</option>
                </optgroup>
              </select>
            </div>

            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              value={txForm.amount}
              onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
              placeholder="0.00"
              required
            />

            <Input
              label="Category"
              value={txForm.category}
              onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
              placeholder="e.g. Client Payment, Retainer, Refund"
              required
            />

            <Input
              label="Description / Reference"
              value={txForm.description}
              onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
              placeholder="e.g., Payment for project milestone"
            />

            <Input
              label="Date"
              type="date"
              value={txForm.transaction_date}
              onChange={(e) => setTxForm({ ...txForm, transaction_date: e.target.value })}
            />

            {txError && <p className="error-text">{txError}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
