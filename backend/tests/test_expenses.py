import pytest
import uuid

@pytest.fixture
def auth_client(client):
    client.post("/auth/signup", json={"email": "expenses@fenmo.com", "password": "securepassword"})
    return client

def test_create_expense(auth_client):
    payload = {
        "amount": "150.50",
        "category": "Food",
        "description": "Lunch at cafe",
        "date": "2026-04-20"
    }
    response = auth_client.post("/expenses", json=payload, headers={"Idempotency-Key": str(uuid.uuid4())})
    assert response.status_code == 201
    
    data = response.json()
    assert data["amount"] == "150.50"
    assert data["category"] == "Food"

def test_idempotent_expense_creation(auth_client):
    payload = {
        "amount": "500.00",
        "category": "Shopping",
        "description": "Test idempotency",
        "date": "2026-04-20"
    }
    key = str(uuid.uuid4())
    
    # First submission
    response1 = auth_client.post("/expenses", json=payload, headers={"Idempotency-Key": key})
    assert response1.status_code == 201
    data1 = response1.json()
    
    # Second submission (Double-click or network retry)
    response2 = auth_client.post("/expenses", json=payload, headers={"Idempotency-Key": key})
    # Should safely return 201 with EXACT same payload!
    assert response2.status_code == 201
    data2 = response2.json()
    
    assert data1["id"] == data2["id"] # Verifies no duplicate was created

def test_list_and_filter_expenses(auth_client):
    auth_client.post("/expenses", json={
        "amount": "100", "category": "Transport", "description": "Bus", "date": "2026-04-19"
    }, headers={"Idempotency-Key": str(uuid.uuid4())})
    
    auth_client.post("/expenses", json={
        "amount": "200", "category": "Food", "description": "Dinner", "date": "2026-04-20"
    }, headers={"Idempotency-Key": str(uuid.uuid4())})

    # Test complete list
    response_all = auth_client.get("/expenses")
    assert response_all.status_code == 200
    assert response_all.json()["total_count"] >= 2
    
    # Test filtering by category
    response_food = auth_client.get("/expenses?category=Food")
    assert response_food.status_code == 200
    expenses = response_food.json()["expenses"]
    assert all(e["category"] == "Food" for e in expenses)

def test_expense_sorting(auth_client):
    response = auth_client.get("/expenses?sort=date_desc")
    assert response.status_code == 200
    expenses = response.json()["expenses"]
    
    # Verify strict descending sort
    for i in range(len(expenses) - 1):
        assert expenses[i]["date"] >= expenses[i+1]["date"]

def test_create_expense_future_date(auth_client):
    payload = {
        "amount": "100.00",
        "category": "Food",
        "description": "Future lunch",
        "date": "2099-01-01"
    }
    response = auth_client.post("/expenses", json=payload, headers={"Idempotency-Key": str(uuid.uuid4())})
    assert response.status_code == 422 # Pydantic validation error
    assert "Date cannot be in the future" in str(response.json()["detail"])
