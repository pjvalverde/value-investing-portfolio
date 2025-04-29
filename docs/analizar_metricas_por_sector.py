import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Configurar estilo de visualización
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("Blues_r")

# Cargar datos de empresas S&P 500 y China
print("Cargando datos de empresas...")
sp500_df = pd.read_csv('/home/ubuntu/metricas_sp500.csv')
china_df = pd.read_csv('/home/ubuntu/metricas_china.csv')

# Añadir columna de mercado a SP500 si no existe
if 'Mercado' not in sp500_df.columns:
    sp500_df['Mercado'] = 'S&P 500'

# Combinar los dataframes
df_combinado = pd.concat([sp500_df, china_df], ignore_index=True)

# Crear directorio para gráficos si no existe
if not os.path.exists('/home/ubuntu/graficos'):
    os.makedirs('/home/ubuntu/graficos')

# Análisis por sector
print("Analizando métricas por sector...")

# Identificar sectores únicos
sectores = df_combinado['Sector'].dropna().unique()
print(f"Sectores identificados: {len(sectores)}")
print(sectores)

# Crear un DataFrame para almacenar métricas por sector
metricas_sector = pd.DataFrame(columns=[
    'Sector',
    'ROE_Medio',
    'Margen_Medio',
    'Valoracion_Media',
    'Innovacion_Media',
    'Sostenibilidad_Media',
    'Dividendos_Medio',
    'Num_Empresas'
])

# Analizar cada sector
for sector in sectores:
    if pd.isna(sector) or sector == '':
        continue
        
    # Filtrar empresas del sector
    sector_df = df_combinado[df_combinado['Sector'] == sector]
    
    # Calcular métricas promedio del sector
    fila = {
        'Sector': sector,
        'ROE_Medio': np.nan,  # No tenemos ROE directo en los datos
        'Margen_Medio': np.nan,  # No tenemos margen directo en los datos
        'Valoracion_Media': sector_df['Valoración'].value_counts().index[0] if not sector_df['Valoración'].empty else np.nan,
        'Innovacion_Media': sector_df['Innovación'].mean(),
        'Sostenibilidad_Media': sector_df['Sostenibilidad'].mean(),
        'Dividendos_Medio': sector_df['Dividendos'].mean(),
        'Num_Empresas': len(sector_df)
    }
    
    # Añadir fila al DataFrame
    metricas_sector = pd.concat([metricas_sector, pd.DataFrame([fila])], ignore_index=True)

# Guardar métricas por sector
metricas_sector.to_csv('/home/ubuntu/metricas_por_sector.csv', index=False)
print("Métricas por sector guardadas en '/home/ubuntu/metricas_por_sector.csv'")

# Visualizar métricas por sector
print("Generando visualizaciones por sector...")

# 1. Innovación por sector
plt.figure(figsize=(12, 8))
sectores_ordenados = metricas_sector.sort_values('Innovacion_Media', ascending=False)
sns.barplot(x='Innovacion_Media', y='Sector', data=sectores_ordenados)
plt.title('Nivel de Innovación por Sector', fontsize=16)
plt.xlabel('Puntuación de Innovación', fontsize=12)
plt.ylabel('Sector', fontsize=12)
plt.tight_layout()
plt.savefig('/home/ubuntu/graficos/innovacion_por_sector.png')

# 2. Sostenibilidad por sector
plt.figure(figsize=(12, 8))
sectores_ordenados = metricas_sector.sort_values('Sostenibilidad_Media', ascending=False)
sns.barplot(x='Sostenibilidad_Media', y='Sector', data=sectores_ordenados)
plt.title('Nivel de Sostenibilidad por Sector', fontsize=16)
plt.xlabel('Puntuación de Sostenibilidad', fontsize=12)
plt.ylabel('Sector', fontsize=12)
plt.tight_layout()
plt.savefig('/home/ubuntu/graficos/sostenibilidad_por_sector.png')

# 3. Dividendos por sector
plt.figure(figsize=(12, 8))
sectores_ordenados = metricas_sector.sort_values('Dividendos_Medio', ascending=False)
sns.barplot(x='Dividendos_Medio', y='Sector', data=sectores_ordenados)
plt.title('Nivel de Dividendos por Sector', fontsize=16)
plt.xlabel('Puntuación de Dividendos', fontsize=12)
plt.ylabel('Sector', fontsize=12)
plt.tight_layout()
plt.savefig('/home/ubuntu/graficos/dividendos_por_sector.png')

# 4. Número de empresas por sector
plt.figure(figsize=(12, 8))
sectores_ordenados = metricas_sector.sort_values('Num_Empresas', ascending=False)
sns.barplot(x='Num_Empresas', y='Sector', data=sectores_ordenados)
plt.title('Número de Empresas por Sector', fontsize=16)
plt.xlabel('Número de Empresas', fontsize=12)
plt.ylabel('Sector', fontsize=12)
plt.tight_layout()
plt.savefig('/home/ubuntu/graficos/empresas_por_sector.png')

# Análisis por mercado (S&P 500 vs China)
print("Analizando diferencias entre mercados...")

# Crear un DataFrame para comparar mercados
comparacion_mercados = pd.DataFrame(columns=[
    'Mercado',
    'Innovacion_Media',
    'Sostenibilidad_Media',
    'Dividendos_Medio',
    'Num_Empresas'
])

# Analizar cada mercado
for mercado in ['S&P 500', 'China']:
    # Filtrar empresas del mercado
    mercado_df = df_combinado[df_combinado['Mercado'] == mercado]
    
    # Calcular métricas promedio del mercado
    fila = {
        'Mercado': mercado,
        'Innovacion_Media': mercado_df['Innovación'].mean(),
        'Sostenibilidad_Media': mercado_df['Sostenibilidad'].mean(),
        'Dividendos_Medio': mercado_df['Dividendos'].mean(),
        'Num_Empresas': len(mercado_df)
    }
    
    # Añadir fila al DataFrame
    comparacion_mercados = pd.concat([comparacion_mercados, pd.DataFrame([fila])], ignore_index=True)

# Guardar comparación de mercados
comparacion_mercados.to_csv('/home/ubuntu/comparacion_mercados.csv', index=False)
print("Comparación de mercados guardada en '/home/ubuntu/comparacion_mercados.csv'")

# Visualizar comparación de mercados
print("Generando visualizaciones de comparación de mercados...")

# 1. Innovación por mercado
plt.figure(figsize=(10, 6))
sns.barplot(x='Mercado', y='Innovacion_Media', data=comparacion_mercados)
plt.title('Nivel de Innovación por Mercado', fontsize=16)
plt.xlabel('Mercado', fontsize=12)
plt.ylabel('Puntuación de Innovación', fontsize=12)
plt.tight_layout()
plt.savefig('/home/ubuntu/graficos/innovacion_por_mercado.png')

# 2. Sostenibilidad por mercado
plt.figure(figsize=(10, 6))
sns.barplot(x='Mercado', y='Sostenibilidad_Media', data=comparacion_mercados)
plt.title('Nivel de Sostenibilidad por Mercado', fontsize=16)
plt.xlabel('Mercado', fontsize=12)
plt.ylabel('Puntuación de Sostenibilidad', fontsize=12)
plt.tight_layout()
plt.savefig('/home/ubuntu/graficos/sostenibilidad_por_mercado.png')

# 3. Dividendos por mercado
plt.figure(figsize=(10, 6))
sns.barplot(x='Mercado', y='Dividendos_Medio', data=comparacion_mercados)
plt.title('Nivel de Dividendos por Mercado', fontsize=16)
plt.xlabel('Mercado', fontsize=12)
plt.ylabel('Puntuación de Dividendos', fontsize=12)
plt.tight_layout()
plt.savefig('/home/ubuntu/graficos/dividendos_por_mercado.png')

# Crear documento con ajustes de métricas por sector
print("Generando documento de ajustes de métricas por sector...")

# Definir ajustes de métricas por sector
ajustes_metricas = """# Ajustes de Métricas por Sector para Value Investing

## Introducción

Las métricas financieras y los umbrales establecidos en el documento de métricas cuantitativas deben ajustarse según el sector, ya que diferentes industrias tienen características financieras inherentemente distintas. Este documento establece los ajustes necesarios para interpretar correctamente las métricas de value investing en el contexto de cada sector.

## Ajustes Generales por Sector

### Tecnología

- **ROE**: Umbral ideal ≥ 18% (superior al estándar general)
- **ROIC**: Umbral ideal ≥ 15% (mantiene el estándar general)
- **Margen Bruto**: Umbral ideal ≥ 50% (superior al estándar general)
- **Margen Operativo**: Umbral ideal ≥ 25% (superior al estándar general)
- **Crecimiento de Ingresos**: Umbral ideal ≥ 10% (superior al estándar general)
- **P/E**: Umbral máximo aceptable ≤ 25 (superior al estándar general)
- **Deuda/EBITDA**: Umbral ideal ≤ 1.5x (inferior al estándar general)

**Justificación**: Las empresas tecnológicas suelen tener márgenes más altos, mayor crecimiento y menor necesidad de activos físicos, lo que justifica ROE y márgenes más altos. Se acepta una valoración P/E más alta debido al mayor potencial de crecimiento, pero se espera menor apalancamiento.

### Finanzas

- **ROE**: Umbral ideal ≥ 12% (inferior al estándar general)
- **ROIC**: No es la métrica más relevante para este sector
- **Margen Neto**: Umbral ideal ≥ 20% (superior al estándar general)
- **Ratio de Eficiencia**: Umbral ideal ≤ 60% (específico del sector)
- **Ratio de Capital Tier 1**: Umbral ideal ≥ 12% (específico del sector)
- **P/B**: Umbral ideal ≤ 1.5 (inferior al estándar general)
- **Deuda/Patrimonio**: No aplicable de la misma manera que en otros sectores

**Justificación**: Las instituciones financieras operan con modelos de negocio basados en apalancamiento, por lo que las métricas de deuda tradicionales no son aplicables. El P/B es más relevante que el P/E, y se espera que sea más bajo que en otros sectores.

### Salud

- **ROE**: Umbral ideal ≥ 15% (mantiene el estándar general)
- **Margen Bruto**: Umbral ideal ≥ 60% (superior al estándar general)
- **Margen Operativo**: Umbral ideal ≥ 20% (mantiene el estándar general)
- **Gasto en I+D/Ventas**: Umbral ideal ≥ 10% (específico del sector)
- **P/E**: Umbral máximo aceptable ≤ 22 (superior al estándar general)
- **Deuda/EBITDA**: Umbral ideal ≤ 2.5x (superior al estándar general)

**Justificación**: Las empresas de salud suelen tener altos márgenes brutos pero significativos gastos en I+D. Se acepta mayor apalancamiento debido a la estabilidad de los flujos de caja y se tolera un P/E más alto por el crecimiento sostenible a largo plazo.

### Consumo Básico

- **ROE**: Umbral ideal ≥ 15% (mantiene el estándar general)
- **Margen Bruto**: Umbral ideal ≥ 40% (mantiene el estándar general)
- **Margen Operativo**: Umbral ideal ≥ 15% (inferior al estándar general)
- **Crecimiento de Ingresos**: Umbral ideal ≥ 4% (inferior al estándar general)
- **Rendimiento por Dividendo**: Umbral ideal ≥ 2.5% (superior al estándar general)
- **P/E**: Umbral máximo aceptable ≤ 22 (superior al estándar general)

**Justificación**: Las empresas de consumo básico suelen tener crecimiento más lento pero estable, con flujos de caja predecibles que permiten dividendos consistentes. Se acepta un P/E ligeramente más alto debido a la estabilidad.

### Consumo Discrecional

- **ROE**: Umbral ideal ≥ 15% (mantiene el estándar general)
- **Margen Operativo**: Umbral ideal ≥ 12% (inferior al estándar general)
- **Crecimiento de Ingresos**: Umbral ideal ≥ 6% (inferior al estándar general)
- **P/E**: Umbral máximo aceptable ≤ 20 (mantiene el estándar general)
- **Deuda/EBITDA**: Umbral ideal ≤ 2.0x (mantiene el estándar general)

**Justificación**: Las empresas de consumo discrecional son más cíclicas, con márgenes generalmente más bajos que el consumo básico. Se espera un crecimiento moderado y una valoración en línea con el mercado general.

### Industria

- **ROE**: Umbral ideal ≥ 15% (mantiene el estándar general)
- **ROIC**: Umbral ideal ≥ 12% (inferior al estándar general)
- **Margen Operativo**: Umbral ideal ≥ 12% (inferior al estándar general)
- **Conversión de Efectivo**: Umbral ideal ≥ 0.9 (superior al estándar general)
- **P/E**: Umbral máximo aceptable ≤ 18 (inferior al estándar general)
- **Deuda/EBITDA**: Umbral ideal ≤ 2.5x (superior al estándar general)

**Justificación**: Las empresas industriales suelen ser intensivas en capital, lo que justifica un ROIC más bajo y mayor apalancamiento. Se espera una valoración P/E más conservadora debido a la naturaleza cíclica del sector.

### Energía

- **ROE**: Umbral ideal ≥ 10% (inferior al estándar general)
- **ROIC**: Umbral ideal ≥ 8% (inferior al estándar general)
- **Margen Operativo**: Umbral ideal ≥ 15% (mantiene el estándar general)
- **Ratio de Reemplazo de Reservas**: Umbral ideal ≥ 100% (específico del sector)
- **P/E**: Umbral máximo aceptable ≤ 15 (inferior al estándar general)
- **EV/EBITDA**: Umbral ideal ≤ 6x (específico del sector)
- **Deuda/EBITDA**: Umbral ideal ≤ 2.0x (mantiene el estándar general)

**Justificación**: Las empresas energéticas son intensivas en capital y están sujetas a la volatilidad de los precios de las materias primas. Se esperan retornos más bajos sobre el capital y valoraciones más conservadoras.

### Materiales

- **ROE**: Umbral ideal ≥ 12% (inferior al estándar general)
- **ROIC**: Umbral ideal ≥ 10% (inferior al estándar general)
- **Margen Operativo**: Umbral ideal ≥ 15% (mantiene el estándar general)
- **P/E**: Umbral máximo aceptable ≤ 16 (inferior al estándar general)
- **Deuda/EBITDA**: Umbral ideal ≤ 2.5x (superior al estándar general)

**Justificación**: Similar al sector energético, las empresas de materiales son intensivas en capital y cíclicas. Se esperan retornos más bajos sobre el capital y valoraciones más conservadoras.

### Servicios Públicos

- **ROE**: Umbral ideal ≥ 10% (inferior al estándar general)
- **Margen Operativo**: Umbral ideal ≥ 20% (mantiene el estándar general)
- **Rendimiento por Dividendo**: Umbral ideal ≥ 3.5% (superior al estándar general)
- **P/E**: Umbral máximo aceptable ≤ 18 (inferior al estándar general)
- **Deuda/EBITDA**: Umbral ideal ≤ 4.0x (superior al estándar general)

**Justificación**: Las empresas de servicios públicos tienen flujos de caja estables y regulados, lo que permite mayor apalancamiento y dividendos más altos. Se esperan retornos más bajos sobre el capital debido a la regulación.

### Inmobiliario

- **ROE**: Umbral ideal ≥ 10% (inferior al estándar general)
- **Fondos de Operaciones (FFO)**: Métrica específica del sector
- **Crecimiento de FFO**: Umbral ideal ≥ 5% (específico del sector)
- **Rendimiento por Dividendo**: Umbral ideal ≥ 4.0% (superior al estándar general)
- **P/FFO**: Umbral máximo aceptable ≤ 18x (específico del sector)
- **Deuda/Activos Totales**: Umbral ideal ≤ 50% (específico del sector)

**Justificación**: Las empresas inmobiliarias se evalúan principalmente por FFO en lugar de beneficios. Se espera un rendimiento por dividendo más alto y se acepta mayor apalancamiento debido a la naturaleza de los activos.

### Telecomunicaciones

- **ROE**: Umbral ideal ≥ 12% (inferior al estándar general)
- **Margen EBITDA**: Umbral ideal ≥ 35% (específico del sector)
- **Rendimiento por Dividendo**: Umbral ideal ≥ 3.0% (superior al estándar general)
- **P/E**: Umbral máximo aceptable ≤ 16 (inferior al estándar general)
- **Deuda/EBITDA**: Umbral ideal ≤ 3.0x (superior al estándar general)

**Justificación**: Las empresas de telecomunicaciones son intensivas en capital con altos costos fijos, lo que justifica márgenes EBITDA más altos y mayor apalancamiento. Se esperan dividendos más altos debido a la generación de efectivo estable.

## Ajustes Específicos para Mercados Emergentes (China)

Para empresas chinas, se deben considerar los siguientes ajustes adicionales:

- **ROE**: Reducir umbral ideal en 1-2 puntos porcentuales respecto al sector equivalente en mercados desarrollados
- **Margen Neto**: Reducir umbral ideal en 1-2 puntos porcentuales respecto al sector equivalente
- **P/E**: Reducir umbral máximo aceptable en 10-15% respecto al sector equivalente
- **Deuda/EBITDA**: Mantener umbrales similares a los mercados desarrollados
- **Gobierno Corporativo**: Aplicar criterios más estrictos en la evaluación cualitativa

**Justificación**: Las empresas en mercados emergentes suelen enfrentar mayores costos de capital, mayor competencia de precios y entornos regulatorios menos predecibles. La valoración debe ser más conservadora para compensar estos riesgos adicionales.

## Consideraciones Adicionales

### Ciclo Económico

Los umbrales deben interpretarse en el contexto del ciclo económico actual:

- **Expansión**: Enfatizar métricas de crecimiento y valoración
- **Contracción**: Enfatizar solidez del balance y generación de efectivo

### Tamaño de la Empresa

- **Grandes Empresas**: Aplicar umbrales estándar
- **Medianas Empresas**: Ajustar umbrales de crecimiento al alza (+2-3 puntos porcentuales)
- **Pequeñas Empresas**: Ajustar umbrales de crecimiento al alza (+3-5 puntos porcentuales) y ser más conservador con métricas de deuda

### Madurez 
(Content truncated due to size limit. Use line ranges to read in chunks)