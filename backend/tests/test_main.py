from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_users():
    r = client.get("/users/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
