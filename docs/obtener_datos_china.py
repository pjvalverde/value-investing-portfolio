import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient
import json
import pandas as pd
import time

# Inicializar el cliente de API
client = ApiClient()

# Lista de empresas chinas que cotizan en bolsas internacionales
# Incluye empresas de diferentes sectores y tamaños
china_tickers = [
    # Tecnología
    "BABA",  # Alibaba Group
    "JD",    # JD.com
    "PDD",   # Pinduoduo
    "BIDU",  # Baidu
    "NTES",  # NetEase
    "TCOM",  # Trip.com
    "BILI",  # Bilibili
    
    # Finanzas
    "FUTU",  # Futu Holdings
    "TIGR",  # UP Fintech Holding
    
    # Consumo
    "NIO",   # NIO Inc. (vehículos eléctricos)
    "LI",    # Li Auto (vehículos eléctricos)
    "XPEV",  # XPeng (vehículos eléctricos)
    
    # Educación y Servicios
    "TAL",   # TAL Education Group
    "EDU",   # New Oriental Education
    
    # Salud
    "BNR",   # Burning Rock Biotech
    "ZH",    # Zhihu (plataforma de conocimiento)
    
    # Comercio electrónico y retail
    "VIPS",  # Vipshop Holdings
    "DADA",  # Dada Nexus
    
    # Entretenimiento
    "HUYA",  # HUYA Inc. (streaming de juegos)
    "DOYU",  # DouYu International (streaming de juegos)
    
    # Empresas que cotizan en Hong Kong (se usan sufijos para indicar la bolsa)
    "9988.HK",  # Alibaba Group (Hong Kong)
    "9618.HK",  # JD.com (Hong Kong)
    "0700.HK",  # Tencent Holdings
    "3690.HK",  # Meituan
    "9999.HK",  # NetEase (Hong Kong)
    
    # Empresas estatales chinas
    "PTR",   # PetroChina
    "CHA",   # China Telecom
    "CHU",   # China Unicom
    "CNOOC", # CNOOC Limited
    "SNP",   # China Petroleum & Chemical
    
    # Otras empresas importantes
    "ZTO",   # ZTO Express (logística)
    "HTHT",  # Huazhu Group (hoteles)
    "YUMC",  # Yum China Holdings (restaurantes)
    "ATHM",  # Autohome (información automotriz)
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

# Recopilar datos para todas las empresas chinas
print("Iniciando recopilación de datos financieros para empresas chinas...")
datos_empresas = []

for ticker in china_tickers:
    print(f"Obteniendo datos para {ticker}...")
    datos = obtener_datos_empresa(ticker)
    datos_empresas.append(datos)
    # Pausa para evitar límites de tasa de la API
    time.sleep(1)

# Guardar los datos en un archivo JSON
with open('/home/ubuntu/datos_china.json', 'w') as f:
    json.dump(datos_empresas, f)

print(f"Datos guardados en '/home/ubuntu/datos_china.json'")

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
    'Precio_Objetivo',
    'Mercado'  # Añadimos columna para identificar el mercado (China)
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
            'Precio_Objetivo': recommendation.get('targetPrice', 0),
            'Mercado': 'China'  # Identificador de mercado
        }
        
        # Añadir fila al DataFrame
        metricas_df = pd.concat([metricas_df, pd.DataFrame([fila])], ignore_index=True)
        
    except Exception as e:
        print(f"Error al procesar datos para {ticker}: {str(e)}")

# Guardar métricas en un archivo CSV
metricas_df.to_csv('/home/ubuntu/metricas_china.csv', index=False)
print(f"Métricas guardadas en '/home/ubuntu/metricas_china.csv'")
