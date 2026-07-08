from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class StudentBase(BaseModel):
    cedula: str
    nombre: str
    carrera: str
    facultad: str
    universidad: str
    horas: int
    correo: str
    telefono: str
    estado: str = "pendiente"
    turno: str = "matutino"
    fecha_inicio: Optional[date] = None
    fecha_salida: Optional[date] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdateStatus(BaseModel):
    estado: str

class StudentCalculateDate(BaseModel):
    fecha_inicio: date
    horas: int
    turno: str

class StudentResponse(StudentBase):
    id: int
    fecha_subida: datetime
    ruta_archivo_pdf: str

    class Config:
        from_attributes = True

class ExtractResponse(BaseModel):
    cedula: Optional[str]
    nombre: Optional[str]
    carrera: Optional[str]
    facultad: Optional[str]
    universidad: Optional[str]
    horas: Optional[int]
    correo: Optional[str]
    telefono: Optional[str]

class TemplateData(BaseModel):
    content: str
