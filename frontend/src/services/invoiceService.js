import api from "./api";

export async function listInvoices(params = {}) {
  const { data } = await api.get("/invoices", { params });
  return data;
}

export async function createInvoice(payload) {
  const { data } = await api.post("/invoices", payload);
  return data;
}

export async function updateInvoice(id, payload) {
  const { data } = await api.put(`/invoices/${id}`, payload);
  return data;
}

export async function deleteInvoice(id) {
  await api.delete(`/invoices/${id}`);
}
