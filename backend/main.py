from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Request
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

# Memoria temporal para guardar el último portafolio generado por usuario (simulación)
last_portfolio = {}

# Ejemplo de universo de acciones, ETFs y T-Bills por sector (puedes expandirlo)
UNIVERSE = [
    {"ticker": "AAPL", "sector": "Tecnología", "tipo": "Acción"},
    {"ticker": "MSFT", "sector": "Tecnología", "tipo": "Acción"},
    {"ticker": "JNJ", "sector": "Salud", "tipo": "Acción"},
    {"ticker": "V", "sector": "Finanzas", "tipo": "Acción"},
    {"ticker": "JPM", "sector": "Finanzas", "tipo": "Acción"},
    {"ticker": "VOO", "sector": "ETF", "tipo": "ETF"},
    {"ticker": "QQQ", "sector": "ETF", "tipo": "ETF"},
    {"ticker": "SPY", "sector": "ETF", "tipo": "ETF"},
    {"ticker": "T-BILL", "sector": "Gobierno", "tipo": "Bono"},
]

# Simulación de métricas de value investing (en producción, usar Alpha Vantage y DeepSeek)
METRICAS = {
    "AAPL": {"ROE": 30, "P/E": 28, "Margen de Beneficio": 23, "Ratio de Deuda": 0.5, "Crecimiento de FCF": 10, "Moat Cualitativo": "Alto"},
    "MSFT": {"ROE": 35, "P/E": 32, "Margen de Beneficio": 31, "Ratio de Deuda": 0.4, "Crecimiento de FCF": 12, "Moat Cualitativo": "Alto"},
    "JNJ": {"ROE": 25, "P/E": 18, "Margen de Beneficio": 20, "Ratio de Deuda": 0.3, "Crecimiento de FCF": 8, "Moat Cualitativo": "Medio"},
    "V": {"ROE": 40, "P/E": 34, "Margen de Beneficio": 51, "Ratio de Deuda": 0.5, "Crecimiento de FCF": 15, "Moat Cualitativo": "Alto"},
    "JPM": {"ROE": 18, "P/E": 12, "Margen de Beneficio": 25, "Ratio de Deuda": 0.8, "Crecimiento de FCF": 5, "Moat Cualitativo": "Medio"},
    "VOO": {"ROE": 16, "P/E": 22, "Margen de Beneficio": 18, "Ratio de Deuda": 0.4, "Crecimiento de FCF": 7, "Moat Cualitativo": "Diversificado"},
    "QQQ": {"ROE": 18, "P/E": 25, "Margen de Beneficio": 20, "Ratio de Deuda": 0.5, "Crecimiento de FCF": 8, "Moat Cualitativo": "Diversificado"},
    "SPY": {"ROE": 15, "P/E": 21, "Margen de Beneficio": 17, "Ratio de Deuda": 0.4, "Crecimiento de FCF": 6, "Moat Cualitativo": "Diversificado"},
    "T-BILL": {"ROE": None, "P/E": None, "Margen de Beneficio": None, "Ratio de Deuda": None, "Crecimiento de FCF": None, "Moat Cualitativo": None},
}

# Endpoint para generar el portafolio
@app.post("/generate_portfolio")
async def generate_portfolio(request: Request):
    params = await request.json()
    amount = float(params.get("amount", 0))
    horizon = params.get("horizon", "largo")
    include_tbills = params.get("includeTBills", False)
    sectors = params.get("sectors", [])
    # Lógica de selección según monto
    filtered = []
    if amount < 2000:
        # Prioriza ETFs y T-Bills
        filtered = [a for a in UNIVERSE if (a["tipo"] == "ETF" and (not sectors or a["sector"] in sectors))]
        if include_tbills:
            filtered.append(next(a for a in UNIVERSE if a["ticker"] == "T-BILL"))
    else:
        # Prioriza acciones, luego ETFs si hay poco sector seleccionado
        filtered = [a for a in UNIVERSE if (a["sector"] in sectors and a["tipo"] == "Acción")]
        if len(filtered) < 2:
            filtered += [a for a in UNIVERSE if a["tipo"] == "ETF"]
        if include_tbills:
            filtered.append(next(a for a in UNIVERSE if a["ticker"] == "T-BILL"))
    # Simulación de asignación de pesos
    n = len(filtered)
    weights = {}
    if n == 0:
        return JSONResponse(content={"error": "No hay activos en los sectores seleccionados."}, status_code=400)
    if include_tbills and any(a["ticker"] == "T-BILL" for a in filtered):
        if horizon == "corto":
            for a in filtered:
                weights[a["ticker"]] = 0.3 if a["ticker"] == "T-BILL" else (0.7/(n-1) if n > 1 else 0.0)
        elif horizon == "intermedio":
            for a in filtered:
                weights[a["ticker"]] = 0.15 if a["ticker"] == "T-BILL" else (0.85/(n-1) if n > 1 else 0.0)
        else:
            for a in filtered:
                weights[a["ticker"]] = 1.0/n
    else:
        for a in filtered:
            weights[a["ticker"]] = 1.0/n
    # Construir portafolio con precios y cantidades
    portfolio = []
    ALPHAVANTAGE_API_KEY = os.getenv("ALPHAVANTAGE_API_KEY")
    for a in filtered:
        ticker = a["ticker"]
        peso = round(weights[ticker]*100, 2)
        tipo = a["tipo"]
        sector = a["sector"]
        metricas = METRICAS.get(ticker, {})
        price = None
        cantidad = 0
        inversion = 0
        if ticker != "T-BILL":
            try:
                url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={ALPHAVANTAGE_API_KEY}"
                resp = requests.get(url)
                data = resp.json()
                price = float(data.get("Global Quote", {}).get("05. price", 0))
                cantidad = int((amount * weights[ticker]) // price) if price > 0 else 0
                inversion = round(cantidad * price, 2)
            except Exception:
                price = None
        else:
            # Simulación: T-BILL, asigna todo el peso restante
            inversion = round(amount * weights[ticker], 2)
        portfolio.append({
            "ticker": ticker,
            "sector": sector,
            "peso": peso,
            "tipo": tipo,
            "price": price,
            "cantidad": cantidad,
            "inversion": inversion,
            "recomendacion": "Comprar" if tipo in ["Acción", "ETF"] else "Mantener",
            **metricas
        })
    # Guardar en memoria temporal (simulación por usuario único)
    global last_portfolio
    last_portfolio = {"portfolio": portfolio, "amount": amount, "params": params}
    return {"status": "ok"}

# Endpoint para obtener el portafolio generado
@app.get("/portfolio")
def get_portfolio():
    if not last_portfolio:
        return JSONResponse(content={"error": "No se ha generado un portafolio aún."}, status_code=404)
    return JSONResponse(content=last_portfolio["portfolio"])

# Endpoint para obtener la justificación (DeepSeek API)
@app.get("/justification")
def get_justification():
    global last_portfolio
    if not last_portfolio:
        return JSONResponse(content={"error": "No se ha generado un portafolio aún."}, status_code=404)
    portfolio = last_portfolio["portfolio"]
    params = last_portfolio["params"]
    # Construir prompt para DeepSeek
    prompt = (
        "Eres un analista de inversiones. Explica de manera detallada y didáctica por qué las siguientes acciones y bonos fueron seleccionados para el portafolio de un inversionista, "
        "basado en los principios del Value Investing (ventaja competitiva, calidad, margen de seguridad, diversificación, horizonte). "
        "Incluye un análisis de las métricas clave para cada activo y cómo se relacionan con el perfil del usuario.\n\n"
        f"Parámetros del usuario: {json.dumps(params, ensure_ascii=False)}\n"
        f"Portafolio generado: {json.dumps(portfolio, ensure_ascii=False)}\n"
        "Responde en español."
    )
    # Llamar DeepSeek API
    import os, requests
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Eres un analista financiero experto en Value Investing."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 900
    }
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=25)
        resp.raise_for_status()
        result = resp.json()
        content = result["choices"][0]["message"]["content"]
        return {"html": content}
    except Exception as e:
        return JSONResponse(content={"error": f"Error al conectar con DeepSeek: {str(e)}"}, status_code=500)

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
