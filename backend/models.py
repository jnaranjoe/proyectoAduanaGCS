from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class StudentDocument(Base):
    __tablename__ = "student_documents"

    id = Column(Integer, primary_key=True, index=True)
    cedula = Column(String, index=True, unique=True)
    nombre = Column(String, index=True)
    carrera = Column(String)
    facultad = Column(String)
    universidad = Column(String)
    horas = Column(Integer)
    correo = Column(String)
    telefono = Column(String)
    estado = Column(String, default="pendiente") # pendiente, aprobado, en prácticas, pospuesto, rechazado, reevaluado
    turno = Column(String) # matutino, vespertino
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_salida = Column(DateTime, nullable=True)
    fecha_subida = Column(DateTime, default=datetime.utcnow)
    ruta_archivo_pdf = Column(String)
