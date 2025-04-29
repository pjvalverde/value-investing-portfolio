import React from 'react';

const MethodologyDoc = () => {
  return (
    <div className="methodology-container">
      <div className="card">
        <h2 className="section-title">Metodología de Selección según Value Investing</h2>
        
        <div className="methodology-section">
          <h3>Fundamentos del Value Investing según Buffett y Munger</h3>
          <p>
            La metodología de selección de acciones implementada en esta aplicación se basa en los principios fundamentales 
            de value investing desarrollados por Warren Buffett y Charlie Munger. Estos principios se centran en identificar 
            empresas de alta calidad a precios razonables, con ventajas competitivas duraderas y gestión competente.
          </p>
        </div>

        <div className="methodology-section">
          <h3>Proceso de Selección en 5 Pasos</h3>
          
          <div className="methodology-step">
            <h4>1. Filtrado Inicial</h4>
            <p>
              Se aplicaron filtros cuantitativos para identificar empresas con valoraciones favorables (infravaloradas o a precio justo).
              Este filtrado inicial redujo el universo de inversión a empresas que cotizan con un descuento respecto a su valor intrínseco
              o a un precio razonable, proporcionando el margen de seguridad que Buffett considera esencial.
            </p>
          </div>
          
          <div className="methodology-step">
            <h4>2. Puntuación Value Investing</h4>
            <p>
              Se asignó una puntuación a cada empresa basada en factores clave como:
            </p>
            <ul>
              <li><strong>Innovación:</strong> Capacidad de la empresa para mantener ventajas competitivas</li>
              <li><strong>Sostenibilidad:</strong> Estabilidad del modelo de negocio a largo plazo</li>
              <li><strong>Dividendos:</strong> Generación de efectivo y política de retorno al accionista</li>
              <li><strong>Recomendaciones de analistas:</strong> Percepción del mercado sobre la empresa</li>
              <li><strong>Descuento respecto al valor intrínseco:</strong> Margen de seguridad en la valoración</li>
            </ul>
            <p>
              Adicionalmente, se consideraron métricas como la tendencia de precios y desarrollos corporativos significativos
              para identificar oportunidades de valor específicas.
            </p>
          </div>
          
          <div className="methodology-step">
            <h4>3. Diversificación Sectorial</h4>
            <p>
              Siguiendo el principio de Buffett de "poner todos los huevos en pocas cestas, pero vigilarlas atentamente",
              se seleccionaron las mejores empresas de cada sector para asegurar una diversificación adecuada sin diluir
              excesivamente el portfolio. Se limitó a un máximo de 2 empresas por sector para mantener la concentración
              en las mejores ideas.
            </p>
          </div>
          
          <div className="methodology-step">
            <h4>4. Diversificación Geográfica</h4>
            <p>
              Se incluyeron empresas tanto del S&P 500 como del mercado chino para proporcionar exposición internacional.
              Esta diversificación geográfica permite aprovechar oportunidades de crecimiento en diferentes economías y
              reduce la dependencia de un solo mercado. Se aseguró una representación mínima del 30% de empresas chinas
              para garantizar una exposición significativa a este mercado en crecimiento.
            </p>
          </div>
          
          <div className="methodology-step">
            <h4>5. Selección Final</h4>
            <p>
              Se eligieron las 10 empresas con mayor puntuación de value investing, manteniendo la diversificación
              sectorial y geográfica. Esta selección final representa un balance entre concentración en las mejores
              ideas y diversificación prudente, alineado con la filosofía de Buffett de invertir con convicción
              pero con margen de seguridad.
            </p>
          </div>
        </div>

        <div className="methodology-section">
          <h3>Inclusión de T-Bills en el Portfolio</h3>
          <p>
            Siguiendo los principios de Buffett, se recomienda mantener una posición en T-Bills (Letras del Tesoro de EE.UU.) por las siguientes razones:
          </p>
          <ul>
            <li><strong>Reserva de Liquidez:</strong> Proporciona capital disponible para aprovechar oportunidades de mercado cuando surjan.</li>
            <li><strong>Protección contra Volatilidad:</strong> Ofrece estabilidad al portfolio en periodos de turbulencia del mercado.</li>
            <li><strong>Rendimiento sin Riesgo:</strong> En el entorno actual, los T-Bills ofrecen rendimientos atractivos con riesgo mínimo.</li>
          </ul>
          <p>
            La asignación recomendada del 25% a T-Bills se basa en un análisis de las condiciones actuales del mercado,
            incluyendo valoraciones generales moderadamente elevadas y un entorno de tipos de interés relativamente altos.
            Esta asignación es dinámica y puede ajustarse según cambien las condiciones del mercado.
          </p>
        </div>

        <div className="methodology-section">
          <h3>Consideraciones de Horizonte Temporal</h3>
          <p>
            El portfolio está diseñado con un enfoque predominantemente a largo plazo (7+ años), siguiendo la filosofía de Buffett:
            "Mi horizonte de inversión favorito es para siempre". Sin embargo, se han considerado factores a medio plazo (3-7 años)
            como la expansión del moat y las oportunidades de reinversión, así como factores a corto plazo (1-3 años) para
            identificar puntos de entrada atractivos.
          </p>
        </div>

        <div className="methodology-section">
          <h3>Métricas Clave Utilizadas</h3>
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Descripción</th>
                <th>Relevancia para Value Investing</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>P/E Ratio</td>
                <td>Precio / Beneficio por acción</td>
                <td>Indica cuánto pagan los inversores por cada unidad de beneficio</td>
              </tr>
              <tr>
                <td>ROE</td>
                <td>Retorno sobre el Capital</td>
                <td>Mide la eficiencia con la que la empresa utiliza el capital de los accionistas</td>
              </tr>
              <tr>
                <td>Margen de Beneficio</td>
                <td>Beneficio Neto / Ingresos</td>
                <td>Indica la rentabilidad fundamental del negocio</td>
              </tr>
              <tr>
                <td>Ratio de Deuda</td>
                <td>Deuda Total / Capital</td>
                <td>Evalúa el riesgo financiero de la empresa</td>
              </tr>
              <tr>
                <td>Crecimiento de FCF</td>
                <td>Tasa de crecimiento del Flujo de Caja Libre</td>
                <td>Mide la capacidad de generar efectivo disponible para los accionistas</td>
              </tr>
              <tr>
                <td>Moat Cualitativo</td>
                <td>Evaluación de ventajas competitivas</td>
                <td>Determina la sostenibilidad de los rendimientos a largo plazo</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="methodology-section">
          <h3>Conclusión</h3>
          <p>
            El portfolio seleccionado representa una aplicación rigurosa de los principios de value investing de Buffett y Munger,
            combinando análisis cuantitativo y cualitativo. Las empresas elegidas muestran características de negocios excepcionales
            a precios razonables, con ventajas competitivas sostenibles y gestión de calidad.
          </p>
          <p>
            La diversificación sectorial y geográfica proporciona exposición a diferentes motores de crecimiento económico,
            mientras que la inclusión de T-Bills ofrece estabilidad y flexibilidad. Este portfolio está diseñado para generar
            rendimientos atractivos a largo plazo con un riesgo controlado, alineado con la filosofía de inversión en valor.
          </p>
          <blockquote>
            "El precio es lo que pagas. El valor es lo que recibes." - Warren Buffett
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default MethodologyDoc;
