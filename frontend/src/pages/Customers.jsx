import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { listCustomers, createCustomer, updateCustomer, deleteCustomer } from "../services/customerService";
import Table from "../components/common/Table";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Loader from "../components/common/Loader";

const emptyForm = { name: "", email: "", phone: "", company: "", address: "" };

export default function Customers() {
  const { data: customers, loading, refetch } = useFetch(() => listCustomers(), []);
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

  const columns = [
    { key: "name", header: "Name" },
    { key: "company", header: "Company", render: (row) => row.company || "—" },
    { key: "email", header: "Email", render: (row) => row.email || "—" },
    { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
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
        <h1>Customers</h1>
        <Button onClick={openCreateModal}>+ Add Customer</Button>
      </div>

      <div className="card">
        {loading ? <Loader /> : <Table columns={columns} data={customers} emptyMessage="No customers yet." />}
      </div>

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
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Company" name="company" value={form.company} onChange={handleChange} />
          <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
          {error && <p className="error-text">{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
