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
def get_portfolio(date: str = None):
    """
    Devuelve el portafolio con precios reales desde Alpha Vantage.
    - Si se pasa ?date=YYYY-MM-DD, devuelve el precio de cierre de esa fecha para cada ticker.
    - Si no se pasa fecha, devuelve el último precio disponible.
    """
    import requests
    ALPHAVANTAGE_API_KEY = os.getenv("ALPHAVANTAGE_API_KEY")
    tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "UNH"]
    portafolio = []
    for ticker in tickers:
        if date:
            url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol={ticker}&apikey={ALPHAVANTAGE_API_KEY}"
        else:
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={ALPHAVANTAGE_API_KEY}"
        try:
            resp = requests.get(url)
            data = resp.json()
            if date:
                ts = data.get("Time Series (Daily)", {})
                day_data = ts.get(date)
                price = day_data["4. close"] if day_data else None
            else:
                price = data.get("Global Quote", {}).get("05. price")
            resultado = {
                "ticker": ticker,
                "price": price,
                "score": 0.8,
                "recomendacion": "BUY"
            }
        except Exception as e:
            resultado = {
                "ticker": ticker,
                "error": str(e)
            }
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
