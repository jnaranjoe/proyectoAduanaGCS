import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add parent directory to path to import main and others
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import get_db, Base
import models

# Set up test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Setup
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown
    Base.metadata.drop_all(bind=engine)

def test_calculate_date_endpoint():
    response = client.post("/students/calculate-end-date", json={
        "fecha_inicio": "2026-07-06",
        "horas": 30,
        "turno": "matutino"
    })
    assert response.status_code == 200
    assert response.json()["fecha_salida"] == "2026-07-10"

def test_create_student_duplicate_conflict():
    student_data = {
        "cedula": "0999999999",
        "nombre": "Test Student",
        "carrera": "Software",
        "facultad": "Ingenieria",
        "universidad": "Universidad A",
        "horas": 200,
        "correo": "test@test.com",
        "telefono": "0999999999",
        "estado": "aprobado",
        "turno": "matutino"
    }
    
    # First creation should succeed
    res1 = client.post("/students", json=student_data)
    assert res1.status_code == 200
    
    # Second creation should return 409
    res2 = client.post("/students", json=student_data)
    assert res2.status_code == 409
    assert res2.json()["detail"]["message"] == "Estudiante ya registrado"

def test_resolve_duplicate():
    # Create initial student
    student_data = {
        "cedula": "0888888888",
        "nombre": "Initial Name",
        "carrera": "Software",
        "facultad": "Ing",
        "universidad": "Uni",
        "horas": 100,
        "correo": "init@test.com",
        "telefono": "0888888888"
    }
    res = client.post("/students", json=student_data)
    student_id = res.json()["id"]
    
    # Resolve with new data
    new_data = student_data.copy()
    new_data["nombre"] = "Updated Name"
    new_data["horas"] = 200
    
    resolve_res = client.put(f"/students/{student_id}/resolve-duplicate", json=new_data)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["nombre"] == "Updated Name"
    assert resolve_res.json()["horas"] == 200
    
def test_update_status():
    student_data = {
        "cedula": "0777777777",
        "nombre": "Status Student",
        "carrera": "Redes",
        "facultad": "Ing",
        "universidad": "Uni",
        "horas": 100,
        "correo": "status@test.com",
        "telefono": "077"
    }
    res = client.post("/students", json=student_data)
    student_id = res.json()["id"]
    
    status_res = client.put(f"/students/{student_id}/status", json={"estado": "en prácticas"})
    assert status_res.status_code == 200
    assert status_res.json()["estado"] == "en prácticas"
