FROM python:3.11-slim

# Install system dependencies for OpenCV/Tesseract and Poppler (for pdf2image)
RUN apt-get update --fix-missing && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# The application code will be mounted as a volume for dev
# But we copy it just in case
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
