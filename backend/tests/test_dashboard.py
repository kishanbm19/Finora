def test_dashboard_summary_empty_state(client, auth_headers):
    response = client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_revenue"] == 0
    assert body["net_profit"] == 0


def test_dashboard_summary_reflects_transactions(client, auth_headers):
    client.post(
        "/api/v1/transactions",
        json={"type": "income", "category": "sales", "amount": 1000},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/transactions",
        json={"type": "expense", "category": "rent", "amount": 400},
        headers=auth_headers,
    )

    response = client.get("/api/v1/dashboard/summary", headers=auth_headers)
    body = response.json()
    assert body["total_revenue"] == 1000
    assert body["total_expenses"] == 400
    assert body["net_profit"] == 600


def test_dashboard_trends_returns_requested_months(client, auth_headers):
    response = client.get("/api/v1/dashboard/trends?months=4", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["revenue_trend"]) == 4
    assert len(body["expense_trend"]) == 4
