def _create_customer(client, auth_headers):
    resp = client.post(
        "/api/v1/customers",
        json={"name": "Acme Corp", "email": "billing@acme.com"},
        headers=auth_headers,
    )
    return resp.json()["id"]


def test_create_invoice_generates_invoice_number(client, auth_headers):
    customer_id = _create_customer(client, auth_headers)
    response = client.post(
        "/api/v1/invoices",
        json={"customer_id": customer_id, "amount": 1500, "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["invoice_number"].startswith("INV-")
    assert body["status"] == "draft"


def test_create_invoice_unknown_customer_fails(client, auth_headers):
    response = client.post(
        "/api/v1/invoices",
        json={"customer_id": "does-not-exist", "amount": 100, "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_update_invoice_status_to_paid(client, auth_headers):
    customer_id = _create_customer(client, auth_headers)
    create_resp = client.post(
        "/api/v1/invoices",
        json={"customer_id": customer_id, "amount": 300, "due_date": "2026-12-31"},
        headers=auth_headers,
    )
    invoice_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/invoices/{invoice_id}",
        json={"status": "paid"},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "paid"
