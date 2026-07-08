# Validador Inteligente de Documentos de Pasantías

Este proyecto es una aplicación web interna diseñada para automatizar y agilizar el registro de estudiantes de pasantías mediante el uso de **OCR** y **Procesamiento de Lenguaje Natural (PLN)** local y en la nube. La reclutadora puede subir currículums o cartas de pasantías en formato PDF, extraer automáticamente los datos del estudiante, planificar turnos, gestionar estados, y generar de forma inmediata un certificado PDF listo para enviar al director del área.

---

## 🛠️ Tecnologías y Arquitectura

- **Frontend**: React + Vite + Tailwind CSS v3. Diseño moderno con estética *Glassmorphic* oscura, animaciones fluidas y pastillas interactivas de arrastrar y soltar.
- **Backend**: FastAPI (Python) + SQLite + SQLAlchemy.
- **OCR e IA**: 
  - **PyMuPDF** para extracción nativa de textos en PDF.
  - **Tesseract OCR + Poppler-utils** para digitalización de PDFs escaneados (modo imagen).
  - **Ollama Cloud (Gemma 3:4b-cloud)** para procesamiento semántico y conversión de texto no estructurado a JSON estructurado y normalizado.
- **Generación de Reportes**: **FPDF2** para la inyección automática de datos en la plantilla de salida.
- **Orquestación**: Docker + Docker Compose.

---

## 🚀 Instalación y Ejecución con Docker

### Requisitos Previos
1. Tener instalado **Docker Desktop** y ejecutándose.
2. Contar con un token de acceso (API Key) de Ollama si utilizas modelos de nube (se inyecta en el compose).

### Pasos para iniciar el proyecto

1. Clona el repositorio y ubícate en la carpeta raíz del proyecto:
   ```bash
   git clone https://github.com/jnaranjoe/proyectoAduanaGCS.git
   cd proyectoAduanaGCS
   ```

2. Levanta los contenedores usando Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
   *(El flag `-d` ejecutará los servicios en segundo plano).*

3. Abre tu navegador e ingresa a la aplicación:
   - **Frontend**: `http://localhost:5173`
   - **Documentación de la API (Swagger)**: `http://localhost:8000/docs`

---

## 📁 Estructura del Proyecto

```text
├── .github/workflows/   # Configuraciones de Integración Continua (CI)
├── backend/             # Código fuente del servidor (FastAPI)
│   ├── data/            # Almacenamiento de base de datos SQLite
│   ├── pdfs/            # Directorio donde se guardan los certificados generados
│   ├── services/        # Servicios de OCR, fechas y generación de PDF
│   └── tests/           # Pruebas automatizadas de servicios y APIs
├── frontend/            # Código fuente de la interfaz web (React)
│   ├── src/components/  # Componentes del Dashboard, Formularios y Plantillas
│   └── tailwind.config.js
└── docker-compose.yml   # Orquestación de servicios
```

---

## ⚙️ Integración Continua (CI / GitHub Actions)

Este repositorio cuenta con un pipeline de **Integración Continua (CI)** automatizado mediante **GitHub Actions** (`.github/workflows/ci.yml`). El pipeline se ejecuta automáticamente cada vez que se hace un `push` o un `pull request` hacia la rama principal (`main`).

El flujo de trabajo se divide en dos trabajos en paralelo:

### 1. Pruebas del Backend (`backend-tests`)
Este trabajo verifica que el servidor de Python cumpla con todas las reglas de negocio y no introduzca fallos de código:
- **Entorno**: Levanta un runner en la nube con Ubuntu y Python 3.11.
- **Dependencias de Sistema**: Instala `tesseract-ocr`, `tesseract-ocr-spa` (español), `poppler-utils` y dependencias de OpenGL necesarias para que el procesamiento de imágenes y OCR se ejecute de manera idéntica al entorno de producción.
- **Ejecución de Pruebas (`pytest`)**:
  - **Pruebas de Calendario y Fechas (`test_services.py`)**: Valida que el cálculo de la fecha de salida sea exacto sumando la cantidad de horas en base al turno elegido (Matutino: 6h/día, Vespertino: 5h/día), omitiendo fines de semana y aplicando correctamente el calendario de feriados nacionales de Ecuador y locales de Guayaquil (ej. 25 de Julio, 9 de Octubre).
  - **Pruebas de la API (`test_api.py`)**: Levanta una base de datos SQLite en memoria de prueba para validar que las llamadas HTTP a los endpoints funcionen. Prueba la detección de duplicados (conflicto 409 al registrar una cédula repetida), la resolución y actualización de perfiles de estudiantes, y la actualización de los estados (`pendiente`, `aprobado`, `en prácticas`, `pospuesto`, `rechazado`, `reevaluado`).

### 2. Validación del Frontend (`frontend-build`)
Este trabajo asegura que la aplicación web esté libre de errores sintácticos y estructurales:
- **Entorno**: Levanta un runner con Node.js v20.
- **Validación**: Instala las dependencias de React mediante caché segura y compila el proyecto (`npm run build`). Si existe algún error de importación, sintaxis o tipado en los componentes de Vite/Tailwind, la compilación fallará alertando al desarrollador antes de desplegar.

---

## 📝 Uso del Validador

1. **Subir Documentos**: Arrastra uno o varios PDFs de los estudiantes. El sistema los procesará en orden y llamará a la API de Ollama para pre-llenar los datos.
2. **Registro Manual**: Si un estudiante no tiene CV físico, presiona "Registro Manual" para llenar la ficha de registro directamente.
3. **Turnos y Fechas**: Al ingresar la fecha de inicio del estudiante y seleccionar el turno (Matutino o Vespertino), el sistema calculará dinámicamente el último día de prácticas sin contar fines de semana ni feriados.
4. **Editor de Plantilla**: En la sección "Plantilla PDF", escribe el cuerpo del documento final arrastrando las variables dinámicas (como `{nombre}`, `{cedula}`, `{horas}`) hacia el editor.
5. **Directorio**: Filtra el directorio de estudiantes por carrera, universidad, estado o mes de salida para monitorear quién finaliza sus prácticas en fechas específicas. Puedes descargar su PDF de salida, editar sus datos o eliminarlos permanentemente.
