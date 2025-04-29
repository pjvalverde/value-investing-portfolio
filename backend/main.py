from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import subprocess
import os
import pandas as pd
import markdown

app = FastAPI()

# Permitir acceso desde el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs')
RESULTS_DIR = os.path.join(DATA_DIR, 'resultados')

# Endpoint para generar el portafolio
@app.post("/generate_portfolio")
def generate_portfolio():
    return {"status": "Portfolio generation not needed, done dynamically."}

# Endpoint para obtener el portafolio generado (CSV a JSON)
import os
import requests
import json
from fastapi.responses import JSONResponse

@app.get("/portfolio")
def get_portfolio():
    # Obtén las claves de Railway
    OPENBB_TOKEN = os.getenv("OPENBB_TOKEN")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

    # --- Paso 1: Obtener tickers desde OpenBB (simulado si no hay clave) ---
    if not OPENBB_TOKEN:
        return JSONResponse(content={"error": "OPENBB_TOKEN no configurado en variables de entorno."}, status_code=500)

    # Paso 1: Obtener tickers reales del S&P 500 desde OpenBB
    try:
        resp = requests.get(
            "https://api.openbb.dev/v1/index/sp500",
            headers={"Authorization": f"Bearer {OPENBB_TOKEN}"}
        )
        resp.raise_for_status()
        data = resp.json()
        tickers = data.get("constituents", [])[:10]  # Solo los primeros 10 para ejemplo
    except Exception as e:
        return JSONResponse(content={"error": f"Error consultando OpenBB: {str(e)}"}, status_code=500)

    # Paso 2: Analizar con Deepseek (simulado)
    portafolio = []
    for ticker in tickers:
        # Aquí deberías hacer la llamada real a Deepseek si tienes la API
        # Ejemplo simulado:
        resultado = {"ticker": ticker, "score": 0.8, "recomendacion": "BUY"}
        portafolio.append(resultado)

    return JSONResponse(content=portafolio)


# Endpoint para obtener la justificación (MD a HTML)
@app.get("/justification")
def get_justification():
    justification_path = os.path.join(RESULTS_DIR, 'justificacion_portfolio.md')
    if not os.path.exists(justification_path):
        return JSONResponse(content={"error": "Justification not generated yet"}, status_code=404)
    with open(justification_path, 'r', encoding='utf-8') as f:
        md_content = f.read()
    html_content = markdown.markdown(md_content)
    return {"html": html_content}

# Endpoint para obtener visualizaciones (imágenes generadas por Python)
@app.get("/visualizations/{img_name}")
def get_visualization(img_name: str):
    img_path = os.path.join(RESULTS_DIR, img_name)
    if not os.path.exists(img_path):
        return JSONResponse(content={"error": "Visualization not found"}, status_code=404)
    return FileResponse(img_path)

# Endpoint de prueba
@app.get("/")
def root():
    return {"message": "Value Investing Portfolio API running!"}
