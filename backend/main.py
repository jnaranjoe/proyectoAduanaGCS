import os
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from services.ocr_service import extract_text_from_pdf, parse_student_data
from services.date_service import calculate_end_date
from services.pdf_generator import generate_student_pdf

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Validador Inteligente de Documentos de Pasantías")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PDFS_DIR = os.getenv("PDFS_DIR", "/app/pdfs")
os.makedirs(PDFS_DIR, exist_ok=True)


@app.post("/upload", response_model=schemas.ExtractResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un PDF")
        
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        text = extract_text_from_pdf(temp_path)
        data = parse_student_data(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    return data

@app.post("/students/calculate-end-date")
def calculate_date(req: schemas.StudentCalculateDate):
    end_date = calculate_end_date(req.fecha_inicio, req.horas, req.turno)
    return {"fecha_salida": end_date}

@app.post("/students", response_model=schemas.StudentResponse)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db)
):
    # Check duplicate
    db_student = db.query(models.StudentDocument).filter(models.StudentDocument.cedula == student.cedula).first()
    if db_student:
        raise HTTPException(status_code=409, detail={"message": "Estudiante ya registrado", "id": db_student.id})
        
    db_student = models.StudentDocument(**student.model_dump())
    db_student.ruta_archivo_pdf = os.path.join(PDFS_DIR, f"{student.cedula}.pdf") # Requires uploading actual file again or moving it, we should ideally handle file saving here or in a separate step.
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.post("/students/{student_id}/upload-pdf")
async def upload_student_final_pdf(student_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_student = db.query(models.StudentDocument).filter(models.StudentDocument.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    file_path = os.path.join(PDFS_DIR, f"{db_student.cedula}.pdf")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_student.ruta_archivo_pdf = file_path
    db.commit()
    
    return {"status": "ok"}

@app.get("/students", response_model=List[schemas.StudentResponse])
def get_students(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.StudentDocument)
    if search:
        query = query.filter(
            (models.StudentDocument.nombre.ilike(f"%{search}%")) |
            (models.StudentDocument.cedula.ilike(f"%{search}%"))
        )
    return query.all()

@app.put("/students/{student_id}/status", response_model=schemas.StudentResponse)
def update_student_status(student_id: int, status_update: schemas.StudentUpdateStatus, db: Session = Depends(get_db)):
    db_student = db.query(models.StudentDocument).filter(models.StudentDocument.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    db_student.estado = status_update.estado
    db.commit()
    db.refresh(db_student)
    return db_student

@app.put("/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(student_id: int, student_data: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(models.StudentDocument).filter(models.StudentDocument.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    
    # Update all fields
    for key, value in student_data.model_dump().items():
        setattr(db_student, key, value)
        
    db.commit()
    db.refresh(db_student)
    return db_student

@app.put("/students/{student_id}/resolve-duplicate", response_model=schemas.StudentResponse)
def resolve_duplicate(student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(models.StudentDocument).filter(models.StudentDocument.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    for key, value in student.model_dump().items():
        setattr(db_student, key, value)
        
    db.commit()
    db.refresh(db_student)
    return db_student

@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(models.StudentDocument).filter(models.StudentDocument.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    db.delete(db_student)
    db.commit()
    return {"status": "ok"}


@app.get("/generate-pdf/{student_id}")
def generate_pdf(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(models.StudentDocument).filter(models.StudentDocument.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
    pdf_bytes = generate_student_pdf({
        "nombre": db_student.nombre,
        "cedula": db_student.cedula,
        "facultad": db_student.facultad,
        "carrera": db_student.carrera,
        "universidad": db_student.universidad,
        "horas": db_student.horas,
        "turno": db_student.turno,
        "fecha_inicio": db_student.fecha_inicio,
        "fecha_salida": db_student.fecha_salida,
        "correo": db_student.correo,
        "telefono": db_student.telefono,
        "estado": db_student.estado
    })
    
    return Response(content=pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f"attachment; filename=Certificado_{db_student.cedula}.pdf"
    })

@app.get("/template")
def get_template():
    from services.pdf_generator import get_template_text
    return {"content": get_template_text()}

@app.post("/template")
def update_template(data: schemas.TemplateData):
    template_path = os.path.join(PDFS_DIR, "template.txt")
    with open(template_path, "w", encoding="utf-8") as f:
        f.write(data.content)
    return {"status": "ok"}

