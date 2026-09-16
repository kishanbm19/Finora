import api from "./api";

export async function listCustomers(params = {}) {
  const { data } = await api.get("/customers", { params });
  return data;
}

export async function createCustomer(payload) {
  const { data } = await api.post("/customers", payload);
  return data;
}

export async function updateCustomer(id, payload) {
  const { data } = await api.put(`/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id) {
  await api.delete(`/customers/${id}`);
}
