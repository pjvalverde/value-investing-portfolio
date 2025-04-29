print("Este script ya no genera el portafolio. Ahora la generación es dinámica desde el backend FastAPI usando OpenBB y Deepseek. Ejecuta la app y usa el endpoint /portfolio para obtener resultados en tiempo real.")
].copy()

print(f"Empresas con valoración favorable: {len(df_filtrado)}")

# 2. Añadir puntuación de value investing
df_filtrado["puntuacion_value"] = 0

# Puntuar por innovación (mayor es mejor)
df_filtrado.loc[df_filtrado["Innovación"] >= 7, "puntuacion_value"] += 2
df_filtrado.loc[(df_filtrado["Innovación"] >= 5) & (df_filtrado["Innovación"] < 7), "puntuacion_value"] += 1

# Puntuar por sostenibilidad (mayor es mejor)
df_filtrado.loc[df_filtrado["Sostenibilidad"] >= 7, "puntuacion_value"] += 2
df_filtrado.loc[(df_filtrado["Sostenibilidad"] >= 5) & (df_filtrado["Sostenibilidad"] < 7), "puntuacion_value"] += 1

# Puntuar por dividendos (mayor es mejor para value investing)
df_filtrado.loc[df_filtrado["Dividendos"] >= 7, "puntuacion_value"] += 2
df_filtrado.loc[(df_filtrado["Dividendos"] >= 5) & (df_filtrado["Dividendos"] < 7), "puntuacion_value"] += 1

# Puntuar por recomendación
df_filtrado.loc[df_filtrado["Recomendación"] == "BUY", "puntuacion_value"] += 2
df_filtrado.loc[df_filtrado["Recomendación"] == "HOLD", "puntuacion_value"] += 1

# Puntuar por descuento (si está disponible)
df_filtrado.loc[df_filtrado["Descuento"].str.contains("discount", na=False, case=False), "puntuacion_value"] += 2

# Añadir métricas adicionales de los datos completos
print("Añadiendo métricas adicionales...")
for idx, row in df_filtrado.iterrows():
    ticker = row["Ticker"]
    metricas_adicionales = extraer_metricas_adicionales(ticker, datos_completos)
    
    # Puntuar por tendencia de precio positiva
    if "tendencia_precio" in metricas_adicionales:
        tendencia = metricas_adicionales.get("tendencia_precio", np.nan)
        if not np.isnan(tendencia):
            if tendencia > 10:  # Crecimiento significativo
                df_filtrado.loc[idx, "puntuacion_value"] += 1
            elif tendencia < -10:  # Caída significativa (posible oportunidad de value)
                df_filtrado.loc[idx, "puntuacion_value"] += 2
    
    # Puntuar por actividad corporativa (desarrollos significativos)
    num_sig_devs = metricas_adicionales.get("num_sig_devs", 0)
    if num_sig_devs >= 3:
        df_filtrado.loc[idx, "puntuacion_value"] += 1

# 3. Ordenar por puntuación de value investing
df_filtrado = df_filtrado.sort_values("puntuacion_value", ascending=False)

# 4. Asegurar diversificación sectorial y geográfica
print("Asegurando diversificación sectorial y geográfica...")

# Obtener los sectores únicos
sectores = df_filtrado["Sector"].dropna().unique()

# Crear un DataFrame para el portfolio final
portfolio_final = pd.DataFrame(columns=df_filtrado.columns)

# Seleccionar las mejores empresas de cada sector (máximo 2 por sector)
for sector in sectores:
    sector_df = df_filtrado[df_filtrado["Sector"] == sector].head(2)
    portfolio_final = pd.concat([portfolio_final, sector_df], ignore_index=True)

# Asegurar diversificación geográfica (al menos 3 empresas de China)
num_china = len(portfolio_final[portfolio_final["Mercado"] == "China"])
if num_china < 3:
    # Añadir más empresas chinas si es necesario
    empresas_china_faltantes = 3 - num_china
    empresas_china_adicionales = df_filtrado[
        (df_filtrado["Mercado"] == "China") & 
        (~df_filtrado["Ticker"].isin(portfolio_final["Ticker"]))
    ].head(empresas_china_faltantes)
    
    portfolio_final = pd.concat([portfolio_final, empresas_china_adicionales], ignore_index=True)

# 5. Seleccionar las 10 mejores empresas para el portfolio final
portfolio_final = portfolio_final.sort_values("puntuacion_value", ascending=False).head(10)

# Guardar el portfolio final
portfolio_final.to_csv("/home/ubuntu/resultados/portfolio_final.csv", index=False)
print(f"Portfolio final guardado en '/home/ubuntu/resultados/portfolio_final.csv'")

# Crear visualización del portfolio final
print("Generando visualizaciones del portfolio final...")

# 1. Distribución por sector
plt.figure(figsize=(12, 8))
sector_counts = portfolio_final["Sector"].value_counts()
if not sector_counts.empty:
    sector_counts.plot(kind="bar", color=sns.color_palette("Blues_r", len(sector_counts)))
    plt.title("Distribución del Portfolio por Sector", fontsize=16)
    plt.xlabel("Sector", fontsize=12)
    plt.ylabel("Número de Empresas", fontsize=12)
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig("/home/ubuntu/resultados/distribucion_sectorial.png")
else:
    print("No hay datos de sector para graficar.")

# 2. Distribución por mercado
plt.figure(figsize=(10, 6))
mercado_counts = portfolio_final["Mercado"].value_counts()
if not mercado_counts.empty:
    colors = sns.color_palette("Blues_r", len(mercado_counts))
    mercado_counts.plot(kind="pie", autopct="%1.1f%%", colors=colors)
    plt.title("Distribución del Portfolio por Mercado", fontsize=16)
    plt.ylabel("")
    plt.tight_layout()
    plt.savefig("/home/ubuntu/resultados/distribucion_mercado.png")
else:
    print("No hay datos de mercado para graficar.")

# 3. Puntuación de value investing
plt.figure(figsize=(12, 8))
if not portfolio_final.empty:
    portfolio_final_sorted = portfolio_final.sort_values("puntuacion_value", ascending=True)
    sns.barplot(x="puntuacion_value", y="Ticker", data=portfolio_final_sorted, palette="Blues_r")
    plt.title("Puntuación de Value Investing por Empresa", fontsize=16)
    plt.xlabel("Puntuación", fontsize=12)
    plt.ylabel("Empresa", fontsize=12)
    plt.tight_layout()
    plt.savefig("/home/ubuntu/resultados/puntuacion_value.png")
else:
    print("No hay datos de puntuación para graficar.")

# Crear documento con justificación de selección
print("Generando documento de justificación de selección...")

justificacion = f"""# Justificación de Selección de Portfolio según Value Investing

## Introducción

Este documento detalla la justificación de la selección de las 10 acciones que componen el portfolio de value investing, siguiendo los principios de Warren Buffett y Charlie Munger. La selección se ha basado en un análisis exhaustivo de métricas cuantitativas y cualitativas, ajustadas por sector y considerando diferentes horizontes temporales.

## Metodología de Selección

El proceso de selección ha seguido estos pasos:

1. **Filtrado Inicial**: Se aplicaron filtros cuantitativos para identificar empresas con valoraciones favorables (infravaloradas o a precio justo).
2. **Puntuación Value Investing**: Se asignó una puntuación a cada empresa basada en factores clave como innovación, sostenibilidad, dividendos, recomendaciones de analistas y descuento respecto al valor intrínseco.
3. **Diversificación Sectorial**: Se seleccionaron las mejores empresas de cada sector para asegurar una diversificación adecuada.
4. **Diversificación Geográfica**: Se incluyeron empresas tanto del S&P 500 como del mercado chino para proporcionar exposición internacional.
5. **Selección Final**: Se eligieron las 10 empresas con mayor puntuación de value investing, manteniendo la diversificación.

## Portfolio Seleccionado

Las siguientes empresas han sido seleccionadas para el portfolio:

"""

# Añadir detalles de cada empresa en el portfolio
if not portfolio_final.empty:
    for idx, row in portfolio_final.iterrows():
        ticker = row["Ticker"]
        nombre = row["Nombre"] if not pd.isna(row["Nombre"]) else ticker
        sector = row["Sector"] if not pd.isna(row["Sector"]) else "No especificado"
        mercado = row["Mercado"] if not pd.isna(row["Mercado"]) else "No especificado"
        valoracion = row["Valoración"] if not pd.isna(row["Valoración"]) else "No especificada"
        puntuacion = row["puntuacion_value"]
        
        justificacion += f"""### {nombre} ({ticker})

- **Sector**: {sector}
- **Mercado**: {mercado}
- **Valoración**: {valoracion}
- **Puntuación Value Investing**: {puntuacion}

**Justificación de Selección**:
"""
        
        # Añadir justificaciones específicas basadas en las métricas
        if not pd.isna(row["Innovación"]) and row["Innovación"] >= 5:
            innovacion = row["Innovación"]
            justificacion += f"- Alta puntuación en innovación ({innovacion}), indicando ventaja competitiva sostenible.\n"
        
        if not pd.isna(row["Sostenibilidad"]) and row["Sostenibilidad"] >= 5:
            sostenibilidad = row["Sostenibilidad"]
            justificacion += f"- Buena sostenibilidad del negocio ({sostenibilidad}), alineada con la visión a largo plazo de Buffett.\n"
        
        if not pd.isna(row["Dividendos"]) and row["Dividendos"] >= 5:
            dividendos = row["Dividendos"]
            justificacion += f"- Sólida política de dividendos ({dividendos}), señalando generación de efectivo estable.\n"
        
        if not pd.isna(row["Recomendación"]):
            recomendacion = row["Recomendación"]
            justificacion += f"- Recomendación de analistas: {recomendacion}.\n"
        
        if not pd.isna(row["Descuento"]) and "discount" in str(row["Descuento"]).lower():
            descuento = row["Descuento"]
            justificacion += f"- Cotiza con descuento respecto a su valor intrínseco ({descuento}), proporcionando margen de seguridad.\n"
        
        # Añadir métricas adicionales si están disponibles
        metricas_adicionales = extraer_metricas_adicionales(ticker, datos_completos)
        if "tendencia_precio" in metricas_adicionales and not np.isnan(metricas_adicionales["tendencia_precio"]):
            tendencia = metricas_adicionales["tendencia_precio"]
            if tendencia > 10:
                justificacion += f"- Tendencia de precio positiva (+{tendencia:.1f}% en el último año), mostrando momentum favorable.\n"
            elif tendencia < -10:
                justificacion += f"- Caída significativa del precio (-{abs(tendencia):.1f}% en el último año), creando posible oportunidad de compra.\n"
        
        if "num_sig_devs" in metricas_adicionales and metricas_adicionales["num_sig_devs"] > 0:
            num_devs = metricas_adicionales["num_sig_devs"]
            justificacion += f"- {num_devs} desarrollos corporativos significativos recientes.\n"
        
        justificacion += "\n"
else:
    justificacion += "No se seleccionaron empresas para el portfolio según los criterios aplicados.\n"

# Añadir consideraciones sobre T-Bills
justificacion += """## Consideraciones sobre T-Bills

Siguiendo los principios de Buffett, se recomienda mantener una posición en T-Bills (Letras del Tesoro de EE.UU.) por las siguientes razones:

1. **Reserva de Liquidez**: Proporciona capital disponible para aprovechar oportunidades de mercado cuando surjan.
2. **Protección contra Volatilidad**: Ofrece estabilidad al portfolio en periodos de turbulencia del mercado.
3. **Rendimiento sin Riesgo**: En el entorno actual, los T-Bills ofrecen rendimientos atractivos con riesgo mínimo.

Se recomienda una asignación del 20-30% del portfolio a T-Bills, ajustable según las condiciones del mercado y las oportunidades disponibles.

## Horizonte Temporal

Este portfolio está diseñado con un enfoque predominantemente a largo plazo (7+ años), siguiendo la filosofía de Buffett y Munger. Sin embargo, se han considerado factores a medio plazo (3-7 años) como la expansión del moat y las oportunidades de reinversión, así como factores a corto plazo (1-3 años) para identificar puntos de entrada atractivos.

## Conclusión

El portfolio seleccionado representa una aplicación rigurosa de los principios de value investing de Buffett y Munger, combinando análisis cuantitativo y cualitativo. Las empresas elegidas muestran características de negocios excepcionales a precios razonables, con ventajas competitivas sostenibles y gestión de calidad.

La diversificación sectorial y geográfica proporciona exposición a diferentes motores de crecimiento económico, mientras que la inclusión recomendada de T-Bills ofrece estabilidad y flexibilidad. Este portfolio está diseñado para generar rendimientos atractivos a largo plazo con un riesgo controlado, alineado con la filosofía de inversión en valor."""

# Guardar el documento de justificación
with open("/home/ubuntu/resultados/justificacion_portfolio.md", "w") as f:
    f.write(justificacion)

print(f"Documento de justificación guardado en '/home/ubuntu/resultados/justificacion_portfolio.md'")
print("Selección de portfolio completada.")
