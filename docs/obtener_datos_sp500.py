import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient
import json
import pandas as pd
import time

# Inicializar el cliente de API
client = ApiClient()

# Lista de empresas del S&P 500 (muestra representativa de diferentes sectores)
# Esta es una lista reducida para demostración, en una implementación completa se usarían todas las empresas del S&P 500
sp500_tickers = [
    # Tecnología
    "AAPL",  # Apple
    "MSFT",  # Microsoft
    "GOOGL", # Alphabet (Google)
    "AMZN",  # Amazon
    "META",  # Meta Platforms (Facebook)
    "NVDA",  # NVIDIA
    "TSLA",  # Tesla
    
    # Finanzas
    "JPM",   # JPMorgan Chase
    "BAC",   # Bank of America
    "BRK-B", # Berkshire Hathaway
    "V",     # Visa
    "MA",    # Mastercard
    
    # Salud
    "JNJ",   # Johnson & Johnson
    "UNH",   # UnitedHealth Group
    "PFE",   # Pfizer
    "ABBV",  # AbbVie
    "MRK",   # Merck
    
    # Consumo
    "PG",    # Procter & Gamble
    "KO",    # Coca-Cola
    "PEP",   # PepsiCo
    "WMT",   # Walmart
    "COST",  # Costco
    
    # Industria
    "HON",   # Honeywell
    "UPS",   # United Parcel Service
    "CAT",   # Caterpillar
    "GE",    # General Electric
    "BA",    # Boeing
    
    # Energía
    "XOM",   # Exxon Mobil
    "CVX",   # Chevron
    
    # Telecomunicaciones
    "VZ",    # Verizon
    "T",     # AT&T
    
    # Inmobiliario
    "AMT",   # American Tower
    "WELL",  # Welltower
    
    # Materiales
    "LIN",   # Linde
    "FCX",   # Freeport-McMoRan
]

# Función para obtener datos financieros detallados de una empresa
def obtener_datos_empresa(ticker):
    try:
        # Obtener insights de la acción
        insights = client.call_api('YahooFinance/get_stock_insights', query={'symbol': ticker})
        
        # Obtener datos históricos de la acción (últimos 5 años, datos mensuales)
        chart_data = client.call_api('YahooFinance/get_stock_chart', 
                                    query={
                                        'symbol': ticker,
                                        'interval': '1mo',
                                        'range': '5y',
                                        'includeAdjustedClose': True
                                    })
        
        return {
            'ticker': ticker,
            'insights': insights,
            'chart_data': chart_data
        }
    except Exception as e:
        print(f"Error al obtener datos para {ticker}: {str(e)}")
        return {
            'ticker': ticker,
            'error': str(e)
        }

# Recopilar datos para todas las empresas
print("Iniciando recopilación de datos financieros para empresas del S&P 500...")
datos_empresas = []

for ticker in sp500_tickers:
    print(f"Obteniendo datos para {ticker}...")
    datos = obtener_datos_empresa(ticker)
    datos_empresas.append(datos)
    # Pausa para evitar límites de tasa de la API
    time.sleep(1)

# Guardar los datos en un archivo JSON
with open('/home/ubuntu/datos_sp500.json', 'w') as f:
    json.dump(datos_empresas, f)

print(f"Datos guardados en '/home/ubuntu/datos_sp500.json'")

# Extraer métricas clave para análisis
print("Extrayendo métricas clave para análisis...")

# Crear un DataFrame para almacenar las métricas
metricas_df = pd.DataFrame(columns=[
    'Ticker', 
    'Nombre', 
    'Sector',
    'Precio',
    'Soporte',
    'Resistencia',
    'Valoración',
    'Descuento',
    'Innovación',
    'Sostenibilidad',
    'Sentimiento_Interno',
    'Dividendos',
    'Recomendación',
    'Precio_Objetivo'
])

# Extraer métricas de los datos recopilados
for datos in datos_empresas:
    if 'error' in datos:
        continue
    
    ticker = datos['ticker']
    insights = datos['insights']
    
    try:
        # Extraer datos de la respuesta JSON
        result = insights.get('finance', {}).get('result', {})
        instrument_info = result.get('instrumentInfo', {})
        company_snapshot = result.get('companySnapshot', {})
        recommendation = result.get('recommendation', {})
        
        # Extraer métricas específicas
        tech_events = instrument_info.get('technicalEvents', {})
        key_technicals = instrument_info.get('keyTechnicals', {})
        valuation = instrument_info.get('valuation', {})
        company = company_snapshot.get('company', {})
        
        # Crear fila para el DataFrame
        fila = {
            'Ticker': ticker,
            'Nombre': result.get('upsell', {}).get('companyName', ''),
            'Sector': tech_events.get('sector', ''),
            'Precio': result.get('meta', {}).get('regularMarketPrice', 0),
            'Soporte': key_technicals.get('support', 0),
            'Resistencia': key_technicals.get('resistance', 0),
            'Valoración': valuation.get('description', ''),
            'Descuento': valuation.get('discount', ''),
            'Innovación': company.get('innovativeness', 0),
            'Sostenibilidad': company.get('sustainability', 0),
            'Sentimiento_Interno': company.get('insiderSentiments', 0),
            'Dividendos': company.get('dividends', 0),
            'Recomendación': recommendation.get('rating', ''),
            'Precio_Objetivo': recommendation.get('targetPrice', 0)
        }
        
        # Añadir fila al DataFrame
        metricas_df = pd.concat([metricas_df, pd.DataFrame([fila])], ignore_index=True)
        
    except Exception as e:
        print(f"Error al procesar datos para {ticker}: {str(e)}")

# Guardar métricas en un archivo CSV
metricas_df.to_csv('/home/ubuntu/metricas_sp500.csv', index=False)
print(f"Métricas guardadas en '/home/ubuntu/metricas_sp500.csv'")
