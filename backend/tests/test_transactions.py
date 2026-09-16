def test_create_transaction_requires_auth(client):
    response = client.post("/api/v1/transactions", json={"type": "income", "amount": 100})
    assert response.status_code == 401


def test_create_and_list_transactions(client, auth_headers):
    response = client.post(
        "/api/v1/transactions",
        json={"type": "income", "category": "sales", "amount": 500, "description": "Invoice payment"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["amount"] == 500
    assert body["type"] == "income"

    list_response = client.get("/api/v1/transactions", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_update_transaction(client, auth_headers):
    create_resp = client.post(
        "/api/v1/transactions",
        json={"type": "expense", "category": "rent", "amount": 200},
        headers=auth_headers,
    )
    tx_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/transactions/{tx_id}",
        json={"amount": 250},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["amount"] == 250


def test_delete_transaction(client, auth_headers):
    create_resp = client.post(
        "/api/v1/transactions",
        json={"type": "expense", "category": "utilities", "amount": 80},
        headers=auth_headers,
    )
    tx_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert delete_resp.status_code == 204

    get_resp = client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert get_resp.status_code == 404
