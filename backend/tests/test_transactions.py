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


def test_transaction_linked_to_account_updates_balance(client, auth_headers):
    # 1. Create a bank account with 1000 balance
    acc_res = client.post(
        "/api/v1/accounts",
        json={"name": "Checking Account", "account_type": "bank", "balance": 1000.0},
        headers=auth_headers,
    )
    assert acc_res.status_code == 201
    account_id = acc_res.json()["id"]

    # 2. Add an expense of $150 deducted from this account
    exp_res = client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "category": "groceries",
            "amount": 150.0,
            "account_id": account_id,
            "description": "Weekly grocery trip",
        },
        headers=auth_headers,
    )
    assert exp_res.status_code == 201
    exp_data = exp_res.json()
    assert exp_data["account_id"] == account_id
    assert exp_data["account_name"] == "Checking Account"
    assert exp_data["account_type"] == "bank"

    # Verify balance was deducted: 1000 - 150 = 850
    acc_check = client.get(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert acc_check.json()["balance"] == 850.0

    # 3. Add an income of $300 deposited into this account
    inc_res = client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "category": "freelance",
            "amount": 300.0,
            "account_id": account_id,
            "description": "Design gig",
        },
        headers=auth_headers,
    )
    assert inc_res.status_code == 201
    assert inc_res.json()["account_name"] == "Checking Account"

    # Verify balance increased: 850 + 300 = 1150
    acc_check2 = client.get(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert acc_check2.json()["balance"] == 1150.0


def test_transaction_cash_option_auto_creates_cash_account(client, auth_headers):
    # Create transaction with account_id="cash"
    res = client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "category": "food",
            "amount": 25.0,
            "account_id": "cash",
            "description": "Coffee and snack",
        },
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["account_name"] == "Cash"
    assert data["account_type"] == "cash"
    cash_account_id = data["account_id"]

    # Verify Cash account exists in user's accounts list with balance -25.0
    acc_check = client.get(f"/api/v1/accounts/{cash_account_id}", headers=auth_headers)
    assert acc_check.status_code == 200
    assert acc_check.json()["name"] == "Cash"
    assert acc_check.json()["balance"] == -25.0

    # Creating a second transaction with account_id="cash" should reuse the same Cash account
    res2 = client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "category": "cash gift",
            "amount": 100.0,
            "account_id": "cash",
        },
        headers=auth_headers,
    )
    assert res2.status_code == 201
    assert res2.json()["account_id"] == cash_account_id

    # Cash balance should now be -25 + 100 = 75
    acc_check2 = client.get(f"/api/v1/accounts/{cash_account_id}", headers=auth_headers)
    assert acc_check2.json()["balance"] == 75.0


def test_list_transactions_filter_by_account(client, auth_headers):
    acc1 = client.post("/api/v1/accounts", json={"name": "Bank A", "balance": 500.0}, headers=auth_headers).json()["id"]
    acc2 = client.post("/api/v1/accounts", json={"name": "Bank B", "balance": 500.0}, headers=auth_headers).json()["id"]

    client.post("/api/v1/transactions", json={"type": "income", "amount": 100, "account_id": acc1}, headers=auth_headers)
    client.post("/api/v1/transactions", json={"type": "income", "amount": 200, "account_id": acc2}, headers=auth_headers)
    client.post("/api/v1/transactions", json={"type": "expense", "amount": 50, "account_id": "cash"}, headers=auth_headers)

    # Filter by acc1
    list1 = client.get(f"/api/v1/transactions?account_id={acc1}", headers=auth_headers).json()
    assert len(list1) == 1
    assert list1[0]["amount"] == 100

    # Filter by cash
    list_cash = client.get("/api/v1/transactions?account_id=cash", headers=auth_headers).json()
    assert len(list_cash) >= 1
    assert any(tx["account_type"] == "cash" for tx in list_cash)
