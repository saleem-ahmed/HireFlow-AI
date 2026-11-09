def test_register_user(client):
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Test User",
        "email": "newuser@testcorp.com",
        "password": "SecurePassword123!",
        "organization_name": "Test Corp"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "newuser@testcorp.com"
    assert data["role"] == "Owner"

def test_login_success(client, test_org_a):
    res = client.post("/api/v1/auth/login", json={
        "email": test_org_a["user"].email,
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user_id"] == test_org_a["user"].id

def test_login_invalid_password(client, test_org_a):
    res = client.post("/api/v1/auth/login", json={
        "email": test_org_a["user"].email,
        "password": "WrongPassword!"
    })
    assert res.status_code == 401

