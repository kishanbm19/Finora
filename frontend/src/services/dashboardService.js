import api from "./api";

export async function fetchDashboardSummary() {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

export async function fetchDashboardTrends(months = 10) {
  const { data } = await api.get("/dashboard/trends", { params: { months } });
  return data;
}

export async function fetchAnalyticsSummary() {
  const { data } = await api.get("/analytics/summary");
  return data;
}

export async function fetchForecast(metric = "income", periodsAhead = 3) {
  const { data } = await api.get("/analytics/forecast", {
    params: { metric, periods_ahead: periodsAhead },
  });
  return data;
}

export async function fetchAnomalies() {
  const { data } = await api.get("/analytics/anomalies");
  return data;
}

export async function fetchInsights() {
  const { data } = await api.get("/analytics/insights");
  return data;
}

export async function fetchProfitAndLoss(start, end) {
  const { data } = await api.get("/reports/profit-and-loss", { params: { start, end } });
  return data;
}
