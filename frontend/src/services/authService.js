import api from "./api";
import { setTokens, clearTokens } from "../lib/auth";

export async function register({ fullName, email, password, businessName }) {
  const { data } = await api.post("/auth/register", {
    full_name: fullName,
    email,
    password,
    business_name: businessName || null,
  });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  setTokens(data);
  return data.user;
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export function logout() {
  clearTokens();
}
