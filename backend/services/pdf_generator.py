from fpdf import FPDF
import io
import os

TEMPLATE_TEXT = """Estimado Director,

Por medio de la presente se notifica que el estudiante {nombre}, portador de la cédula de identidad {cedula}, perteneciente a la {facultad} de la carrera de {carrera} de la {universidad}, ha sido registrado para iniciar sus pasantías.

El estudiante deberá cumplir un total de {horas} horas en el turno {turno}. Su fecha de inicio está programada para el {fecha_inicio}, finalizando el {fecha_salida}.

Datos de contacto del estudiante:
Correo: {correo}
Teléfono: {telefono}

Estado actual: {estado}

Atentamente,
Reclutamiento y Selección
"""

def get_template_text() -> str:
    template_path = os.path.join(os.getenv("PDFS_DIR", "/app/pdfs"), "template.txt")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    return TEMPLATE_TEXT

def generate_student_pdf(student_data: dict) -> bytes:
    """Generates a PDF substituting the student's data in the template."""
    
    # Replace None values with empty string for formatting
    safe_data = {k: (v if v is not None else "") for k, v in student_data.items()}
    
    # Format dates to string if they are datetime objects
    for date_field in ["fecha_inicio", "fecha_salida"]:
        if hasattr(safe_data.get(date_field), "strftime"):
            safe_data[date_field] = safe_data[date_field].strftime("%Y-%m-%d")

    template_str = get_template_text()
    
    # We use basic string replacement instead of format() to avoid key errors if template has unexpected brackets
    text_content = template_str
    for key, val in safe_data.items():
        text_content = text_content.replace(f"{{{key}}}", str(val))
    
    pdf = FPDF()
    pdf.add_page()
    
    # Use a standard font. FPDF2 supports unicode with standard fonts or custom fonts.
    # We will just use Arial (Helvetica) for now.
    pdf.set_font("helvetica", size=12)
    
    pdf.multi_cell(0, 10, txt=text_content)
    
    # Return PDF as bytes
    return bytes(pdf.output())
    
