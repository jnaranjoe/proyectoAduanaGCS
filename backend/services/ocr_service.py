import re
import fitz  # PyMuPDF
import pytesseract
from pdf2image import convert_from_path
import io
import os
import json
import httpx

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts text from PDF using PyMuPDF. Falls back to OCR if no text found."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
        
    # If PDF is an image (no selectable text), use OCR
    if not text.strip():
        images = convert_from_path(pdf_path)
        for img in images:
            text += pytesseract.image_to_string(img, lang="spa")
    
    return text

def parse_student_data(text: str) -> dict:
    """Uses local Ollama (gemma3:4b-cloud) to extract structured data from raw OCR text."""
    
    prompt = f"""
    Eres un asistente especializado en extraer información de currículums y cartas de pasantías.
    Extrae la siguiente información del texto proporcionado y devuelve ÚNICAMENTE un objeto JSON válido con las siguientes claves:
    - cedula (string)
    - nombre (string)
    - carrera (string)
    - facultad (string)
    - universidad (string)
    - horas (numero entero, si no hay pon null)
    - correo (string)
    - telefono (string)

    Si no encuentras algún dato, pon null. No añadas explicaciones ni formato markdown, SOLO el JSON crudo.

    Texto del documento:
    {text}
    """
    
    try:
        headers = {}
        api_key = os.getenv("OLLAMA_API_KEY")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        # Call Ollama Cloud API directly
        response = httpx.post(
            "https://ollama.com/api/generate",
            json={
                "model": "gemma3:4b-cloud",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            headers=headers,
            timeout=120.0
        )
        response.raise_for_status()
        
        result_json = response.json()
        response_text = result_json.get("response", "{}").strip()
        
        # Strip markdown formatting
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse the JSON returned by the model
        data = json.loads(response_text)
        
        return {
            "cedula": data.get("cedula"),
            "nombre": data.get("nombre"),
            "carrera": data.get("carrera"),
            "facultad": data.get("facultad"),
            "universidad": data.get("universidad"),
            "horas": data.get("horas"),
            "correo": data.get("correo"),
            "telefono": data.get("telefono")
        }
    except Exception as e:
        print(f"Error llamando a Ollama: {e}")
        try:
            print(f"Ollama Response Status: {response.status_code}")
            print(f"Ollama Response Text: {response.text}")
        except NameError:
            pass
        # Return empty data if parsing fails
        return {
            "cedula": None, "nombre": None, "carrera": None, "facultad": None,
            "universidad": None, "horas": None, "correo": None, "telefono": None
        }
