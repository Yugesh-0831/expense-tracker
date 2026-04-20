def test_signup(client):
    response = client.post(
        "/auth/signup", json={"email": "test@fenmo.com", "password": "securepassword"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@fenmo.com"
    assert "id" in data
    # Check that auth cookie is set
    assert "expense_tracker_auth" in response.cookies


def test_login(client):
    # Setup user
    client.post("/auth/signup", json={"email": "login@fenmo.com", "password": "securepassword"})
    
    # Login
    response = client.post(
        "/auth/login", json={"email": "login@fenmo.com", "password": "securepassword"}
    )
    assert response.status_code == 200
    assert "expense_tracker_auth" in response.cookies


def test_auth_me(client):
    client.post("/auth/signup", json={"email": "me@fenmo.com", "password": "securepassword"})
    # The TestClient automatically carries the cookie from the response!
    
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "me@fenmo.com"

def test_login_invalid_password(client):
    client.post("/auth/signup", json={"email": "wrong@fenmo.com", "password": "securepassword"})
    
    response = client.post(
        "/auth/login", json={"email": "wrong@fenmo.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
