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
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconInvoice,
  IconTransactions,
  IconWallet,
  IconBank,
} from "../components/common/Icons";

const emptyForm = { name: "", email: "", phone: "", company: "", address: "" };

export default function Customers() {
  const { data: customers, loading, refetch } = useFetch(() => listCustomers(), []);
  const { data: accounts } = useFetch(() => listAccounts(), []);

  const [searchTerm, setSearchTerm] = useState("");

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
      console.error("Failed to refresh customer records:", err);
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
    if (!window.confirm("Delete this customer and related records?")) return;
    await deleteCustomer(id);
    refetch();
  };

  const handleCreateTxForCustomer = async (e) => {
    e.preventDefault();
    setTxSaving(true);
    setTxError("");
    try {
      let resolvedAccountId = txForm.account_id;
      if (resolvedAccountId === "unassigned" || !resolvedAccountId) {
        resolvedAccountId = null;
      }

      const payload = {
        ...txForm,
        amount: Number(txForm.amount),
        account_id: resolvedAccountId,
        customer_id: ledgerCustomer.id,
      };
      if (!payload.transaction_date) delete payload.transaction_date;

      await createTransaction(payload);
      setAddTxOpen(false);
      refreshLedger(ledgerCustomer.id);
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

  const filteredCustomers = (customers || []).filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(term) ||
      (c.company || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {(row.name || "C")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{row.name}</div>
            {row.company && (
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{row.company}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <div style={{ fontSize: 13 }}>
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
      align: "right",
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(row.total_invoiced || 0)}</span>
      ),
    },
    {
      key: "total_paid",
      header: "Paid to Date",
      align: "right",
      render: (row) => (
        <span style={{ color: "var(--color-success-text)", fontWeight: 700 }}>
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
            <span className="badge-dot" />
            {formatCurrency(row.outstanding_balance)} Due
          </span>
        ) : (
          <span className="badge badge-success">
            <span className="badge-dot" />
            Settled
          </span>
        ),
    },
    {
      key: "activity",
      header: "Ledger",
      render: (row) => (
        <span className="badge badge-muted">
          {row.invoice_count || 0} inv • {row.transaction_count || 0} tx
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
            onClick={() => openLedger(row)}
            icon={<IconInvoice size={14} />}
          >
            Ledger
          </Button>
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
      align: "right",
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
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
            <span className="badge-dot" />
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
          <span className="badge-dot" />
          {row.type}
        </span>
      ),
    },
    {
      key: "flow",
      header: "Route",
      render: (row) => {
        const isExpense = row.type === "expense";
        const isCash =
          row.account_type === "cash" ||
          (row.account_name && row.account_name.toLowerCase() === "cash");
        const accountName = row.account_name || (isCash ? "Cash" : "Account");

        if (!row.account_name && !row.account_id) {
          return <span className="account-tag unassigned-tag">Unassigned Route</span>;
        }

        if (isCash) {
          return (
            <span className={`account-tag ${isExpense ? "cash-tag" : "cash-income-tag"}`}>
              <IconWallet size={12} />
              <span>{isExpense ? "Paid via" : "Deposited to"}</span>
              <strong>{accountName}</strong>
            </span>
          );
        }

        return (
          <span className={`account-tag ${isExpense ? "bank-tag" : "bank-income-tag"}`}>
            <IconBank size={12} />
            <span>{isExpense ? "Deducted from" : "Deposited to"}</span>
            <strong>{accountName}</strong>
          </span>
        );
      },
    },
    { key: "category", header: "Category" },
    { key: "description", header: "Description", render: (row) => row.description || "—" },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span
          style={{
            fontWeight: 700,
            color: row.type === "income" ? "var(--color-success-text)" : "var(--color-danger-text)",
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
          <p>Client directory, customer billing ledgers, and transaction histories.</p>
        </div>
        <Button onClick={openCreateModal} icon={<IconPlus size={16} />}>
          Add Customer
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="summary-card tone-primary" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Total Customers</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>{(customers || []).length}</div>
          <div className="sub-hint">Active client relationships</div>
        </div>

        <div className="summary-card tone-default" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Total Invoiced</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>{formatCurrency(totalInvoiced)}</div>
          <div className="sub-hint">Gross billed amount</div>
        </div>

        <div className="summary-card tone-success" style={{ padding: 16 }}>
          <div className="summary-card-header">
            <span className="label">Collected (Paid)</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>
            {formatCurrency(totalPaid)}
          </div>
          <div className="sub-hint">Verified realized receipts</div>
        </div>

        <div
          className={`summary-card ${totalOutstanding > 0 ? "tone-danger" : "tone-success"}`}
          style={{ padding: 16 }}
        >
          <div className="summary-card-header">
            <span className="label">Outstanding Due</span>
          </div>
          <div className="value" style={{ fontSize: 24 }}>
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="sub-hint">
            {totalOutstanding > 0 ? "Pending collection" : "Zero pending balance"}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="filter-group" style={{ flex: 1, maxWidth: 360 }}>
          <input
            className="input"
            type="text"
            placeholder="Search by customer name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          Showing {filteredCustomers.length} of {customers?.length || 0} customers
        </span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <Loader label="Loading customers…" />
        ) : (
          <Table
            columns={columns}
            data={filteredCustomers}
            emptyMessage={searchTerm ? "No customers match your search." : "No customers registered yet."}
          />
        )}
      </div>

      {/* Edit / Create Customer Modal */}
      <Modal
        title={editingId ? "Edit Customer" : "Add New Customer"}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update Customer" : "Save Customer"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Sarah Jenkins" required />
          <Input label="Company / Entity" name="company" value={form.company} onChange={handleChange} placeholder="e.g., Apex Design Ltd" />
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="sarah@apexdesign.com"
          />
          <Input label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          <Input label="Billing Address" name="address" value={form.address} onChange={handleChange} placeholder="123 Commerce St, Suite 400" />
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
                icon={<IconPlus size={15} />}
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
                Record Payment / Transaction
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
              <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                {ledgerCustomer.name}
                {ledgerCustomer.company && (
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-muted)" }}>
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
              <div className="kpi-val" style={{ color: "var(--color-success-text)" }}>
                {formatCurrency(ledgerCustomer.total_paid || 0)}
              </div>
            </div>
            <div className="customer-kpi-card">
              <div className="kpi-label">Outstanding Due</div>
              <div
                className="kpi-val"
                style={{
                  color:
                    ledgerCustomer.outstanding_balance > 0 ? "var(--color-danger-text)" : "inherit",
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
              <IconInvoice size={15} /> Invoices ({ledgerInvoices.length})
            </button>
            <button
              className={`tab-btn ${ledgerTab === "transactions" ? "active" : ""}`}
              onClick={() => setLedgerTab("transactions")}
            >
              <IconTransactions size={15} /> Transaction Logs ({ledgerTransactions.length})
            </button>
          </div>

          {/* Tab Content */}
          {loadingLedger ? (
            <Loader label="Loading customer ledger…" />
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
                {txSaving ? "Recording…" : "Save Entry"}
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
                  <optgroup label="Bank &amp; Financial Accounts">
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
              label="Amount ($)"
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
