from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import pandas as pd
import markdown
import os
import requests
import json

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
@app.get("/portfolio")
def get_portfolio():
    """
    Genera el portafolio dinámicamente usando OpenBB y Deepseek (simulado),
    sin depender de archivos CSV ni de archivos en disco.
    """
    OPENBB_TOKEN = os.getenv("OPENBB_TOKEN")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

    if not OPENBB_TOKEN:
        return JSONResponse(content={"error": "OPENBB_TOKEN no configurado en variables de entorno."}, status_code=500)

    try:
        from openbb import obb
        obb.account.login(pat=OPENBB_TOKEN)
        data = obb.indices.constituents("SP500")
        tickers = list(data["Symbol"])[:10] if "Symbol" in data else []
    except Exception as e:
        return JSONResponse(content={"error": f"Error consultando OpenBB: {str(e)}"}, status_code=500)

    portafolio = []
    for ticker in tickers:
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

@app.get("/")
def root():
    return {"message": "API VIVA - TEST 2025-04-29"}
