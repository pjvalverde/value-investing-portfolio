import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const METRIC_KEYS = [
  { key: 'P/E Ratio', label: 'P/E Ratio' },
  { key: 'ROE', label: 'ROE' },
  { key: 'Margen de Beneficio', label: 'Margen de Beneficio' },
  { key: 'Ratio de Deuda', label: 'Ratio de Deuda' },
  { key: 'Crecimiento de FCF', label: 'Crecimiento de FCF' },
  { key: 'Moat Cualitativo', label: 'Moat Cualitativo' }
];

// Recibe como prop opcional: highlightMetrics (array de strings)
const MethodologyDoc = ({ highlightMetrics = [] }) => {
  const [openSections, setOpenSections] = useState({});
  const ref = useRef();

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Exportar como PDF
  const exportPDF = async () => {
    const input = ref.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('metodologia_value_investing.pdf');
  };

  return (
    <div className="methodology-container">
      <button onClick={exportPDF} style={{ float: 'right', marginBottom: 12 }}>Exportar como PDF</button>
      <div className="card" ref={ref}>
        <h2 className="section-title">Metodología de Selección según Value Investing</h2>
        {/* Fundamentos */}
        <div className="methodology-section">
          <h3 style={{ cursor: 'pointer' }} onClick={() => toggleSection('fundamentos')}>
            Fundamentos del Value Investing según Buffett y Munger {openSections['fundamentos'] ? '▲' : '▼'}
          </h3>
          {openSections['fundamentos'] && (
            <p>
              La metodología de selección de acciones implementada en esta aplicación se basa en los principios fundamentales de value investing desarrollados por Warren Buffett y Charlie Munger. Estos principios se centran en identificar empresas de alta calidad a precios razonables, con ventajas competitivas duraderas y gestión competente.
            </p>
          )}
        </div>
        {/* Proceso de selección */}
        <div className="methodology-section">
          <h3 style={{ cursor: 'pointer' }} onClick={() => toggleSection('proceso')}>
            Proceso de Selección en 5 Pasos {openSections['proceso'] ? '▲' : '▼'}
          </h3>
          {openSections['proceso'] && (
            <>
              <div className="methodology-step"><h4>1. Filtrado Inicial</h4><p>Se aplicaron filtros cuantitativos para identificar empresas con valoraciones favorables (infravaloradas o a precio justo). Este filtrado inicial redujo el universo de inversión a empresas que cotizan con un descuento respecto a su valor intrínseco o a un precio razonable, proporcionando el margen de seguridad que Buffett considera esencial.</p></div>
              <div className="methodology-step"><h4>2. Puntuación Value Investing</h4><p>Se asignó una puntuación a cada empresa basada en factores clave como:</p><ul><li><strong>Innovación:</strong> Capacidad de la empresa para mantener ventajas competitivas</li><li><strong>Sostenibilidad:</strong> Estabilidad del modelo de negocio a largo plazo</li><li><strong>Dividendos:</strong> Generación de efectivo y política de retorno al accionista</li><li><strong>Recomendaciones de analistas:</strong> Percepción del mercado sobre la empresa</li><li><strong>Descuento respecto al valor intrínseco:</strong> Margen de seguridad en la valoración</li></ul><p>Adicionalmente, se consideraron métricas como la tendencia de precios y desarrollos corporativos significativos para identificar oportunidades de valor específicas.</p></div>
              <div className="methodology-step"><h4>3. Diversificación Sectorial</h4><p>Siguiendo el principio de Buffett de "poner todos los huevos en pocas cestas, pero vigilarlas atentamente", se seleccionaron las mejores empresas de cada sector para asegurar una diversificación adecuada sin diluir excesivamente el portfolio. Se limitó a un máximo de 2 empresas por sector para mantener la concentración en las mejores ideas.</p></div>
              <div className="methodology-step"><h4>4. Diversificación Geográfica</h4><p>Se incluyeron empresas tanto del S&P 500 como del mercado chino para proporcionar exposición internacional. Esta diversificación geográfica permite aprovechar oportunidades de crecimiento en diferentes economías y reduce la dependencia de un solo mercado. Se aseguró una representación mínima del 30% de empresas chinas para garantizar una exposición significativa a este mercado en crecimiento.</p></div>
              <div className="methodology-step"><h4>5. Selección Final</h4><p>Se eligieron las 10 empresas con mayor puntuación de value investing, manteniendo la diversificación sectorial y geográfica. Esta selección final representa un balance entre concentración en las mejores ideas y diversificación prudente, alineado con la filosofía de Buffett de invertir con convicción pero con margen de seguridad.</p></div>
            </>
          )}
        </div>
        {/* T-Bills */}
        <div className="methodology-section">
          <h3 style={{ cursor: 'pointer' }} onClick={() => toggleSection('tbills')}>
            Inclusión de T-Bills en el Portfolio {openSections['tbills'] ? '▲' : '▼'}
          </h3>
          {openSections['tbills'] && (
            <>
              <p>Siguiendo los principios de Buffett, se recomienda mantener una posición en T-Bills (Letras del Tesoro de EE.UU.) por las siguientes razones:</p>
              <ul>
                <li><strong>Reserva de Liquidez:</strong> Proporciona capital disponible para aprovechar oportunidades de mercado cuando surjan.</li>
                <li><strong>Protección contra Volatilidad:</strong> Ofrece estabilidad al portfolio en periodos de turbulencia del mercado.</li>
                <li><strong>Rendimiento sin Riesgo:</strong> En el entorno actual, los T-Bills ofrecen rendimientos atractivos con riesgo mínimo.</li>
              </ul>
              <p>La asignación recomendada del 25% a T-Bills se basa en un análisis de las condiciones actuales del mercado, incluyendo valoraciones generales moderadamente elevadas y un entorno de tipos de interés relativamente altos. Esta asignación es dinámica y puede ajustarse según cambien las condiciones del mercado.</p>
            </>
          )}
        </div>
        {/* Horizonte temporal */}
        <div className="methodology-section">
          <h3 style={{ cursor: 'pointer' }} onClick={() => toggleSection('horizonte')}>
            Consideraciones de Horizonte Temporal {openSections['horizonte'] ? '▲' : '▼'}
          </h3>
          {openSections['horizonte'] && (
            <p>El portfolio está diseñado con un enfoque predominantemente a largo plazo (7+ años), siguiendo la filosofía de Buffett: "Mi horizonte de inversión favorito es para siempre". Sin embargo, se han considerado factores a medio plazo (3-7 años) como la expansión del moat y las oportunidades de reinversión, así como factores a corto plazo (1-3 años) para identificar puntos de entrada atractivos.</p>
          )}
        </div>
        {/* Métricas clave */}
        <div className="methodology-section">
          <h3 style={{ cursor: 'pointer' }} onClick={() => toggleSection('metricas')}>
            Métricas Clave Utilizadas {openSections['metricas'] ? '▲' : '▼'}
          </h3>
          {openSections['metricas'] && (
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Descripción</th>
                  <th>Relevancia para Value Investing</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_KEYS.map(({ key, label }) => (
                  <tr key={key} className={highlightMetrics.includes(key) ? 'highlight-metric' : ''}>
                    <td>{label}</td>
                    <td>{
                      key === 'P/E Ratio' ? 'Precio / Beneficio por acción' :
                      key === 'ROE' ? 'Retorno sobre el Capital' :
                      key === 'Margen de Beneficio' ? 'Beneficio Neto / Ingresos' :
                      key === 'Ratio de Deuda' ? 'Deuda Total / Capital' :
                      key === 'Crecimiento de FCF' ? 'Tasa de crecimiento del Flujo de Caja Libre' :
                      key === 'Moat Cualitativo' ? 'Evaluación de ventajas competitivas' : ''
                    }</td>
                    <td>{
                      key === 'P/E Ratio' ? 'Indica cuánto pagan los inversores por cada unidad de beneficio' :
                      key === 'ROE' ? 'Mide la eficiencia con la que la empresa utiliza el capital de los accionistas' :
                      key === 'Margen de Beneficio' ? 'Indica la rentabilidad fundamental del negocio' :
                      key === 'Ratio de Deuda' ? 'Evalúa el riesgo financiero de la empresa' :
                      key === 'Crecimiento de FCF' ? 'Mide la capacidad de generar efectivo disponible para los accionistas' :
                      key === 'Moat Cualitativo' ? 'Determina la sostenibilidad de los rendimientos a largo plazo' : ''
                    }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MethodologyDoc;
