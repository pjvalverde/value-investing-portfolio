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

# Endpoint para generar el portafolio (ejecuta el script Python)
@app.post("/generate_portfolio")
def generate_portfolio(background_tasks: BackgroundTasks):
    def run_script():
        subprocess.run([
            'python', os.path.join(DATA_DIR, 'seleccionar_portfolio.py')
        ], check=True)
    background_tasks.add_task(run_script)
    return {"status": "Portfolio generation started"}

# Endpoint para obtener el portafolio generado (CSV a JSON)
@app.get("/portfolio")
def get_portfolio():
    portfolio_path = os.path.join(RESULTS_DIR, 'portfolio_final.csv')
    if not os.path.exists(portfolio_path):
        return JSONResponse(content={"error": "Portfolio not generated yet"}, status_code=404)
    df = pd.read_csv(portfolio_path)
    return df.to_dict(orient='records')

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
