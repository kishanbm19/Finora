import pytest
from fastapi import status


def test_create_and_list_accounts(client, auth_headers):
    # Create account
    payload = {
        "name": "Main Checking",
        "account_type": "bank",
        "balance": 1500.50,
        "currency": "usd",
    }
    create_res = client.post("/api/v1/accounts", json=payload, headers=auth_headers)
    assert create_res.status_code == status.HTTP_201_CREATED
    data = create_res.json()
    assert data["name"] == "Main Checking"
    assert data["account_type"] == "bank"
    assert data["balance"] == 1500.50
    assert data["currency"] == "USD"
    account_id = data["id"]

    # List accounts
    list_res = client.get("/api/v1/accounts", headers=auth_headers)
    assert list_res.status_code == status.HTTP_200_OK
    accounts = list_res.json()
    assert len(accounts) == 1
    assert accounts[0]["id"] == account_id


def test_get_and_update_account(client, auth_headers):
    create_res = client.post(
        "/api/v1/accounts",
        json={"name": "Savings Acct", "account_type": "savings", "balance": 2000.0, "currency": "INR"},
        headers=auth_headers,
    )
    account_id = create_res.json()["id"]

    # Get single account
    get_res = client.get(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.json()["name"] == "Savings Acct"

    # Update account
    update_res = client.put(
        f"/api/v1/accounts/{account_id}",
        json={"name": "Emergency Fund", "balance": 2500.0},
        headers=auth_headers,
    )
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["name"] == "Emergency Fund"
    assert update_res.json()["balance"] == 2500.0


def test_delete_account_and_unlink_transactions(client, auth_headers):
    # Create account
    create_res = client.post(
        "/api/v1/accounts",
        json={"name": "Petty Cash", "account_type": "cash", "balance": 100.0},
        headers=auth_headers,
    )
    account_id = create_res.json()["id"]

    # Create linked transaction
    tx_res = client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "category": "sales",
            "amount": 50.0,
            "account_id": account_id,
        },
        headers=auth_headers,
    )
    assert tx_res.status_code == status.HTTP_201_CREATED
    tx_id = tx_res.json()["id"]

    # Delete account
    del_res = client.delete(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    # Account should no longer exist
    get_acc = client.get(f"/api/v1/accounts/{account_id}", headers=auth_headers)
    assert get_acc.status_code == status.HTTP_404_NOT_FOUND

    # Transaction should still exist with account_id = None
    get_tx = client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers)
    assert get_tx.status_code == status.HTTP_200_OK
    assert get_tx.json()["account_id"] is None
