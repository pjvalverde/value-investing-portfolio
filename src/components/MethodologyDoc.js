import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const METRIC_KEYS = [
  { key: 'P/E Ratio',          label: 'P/E Ratio',            framework: 'Buffett/Damodaran' },
  { key: 'ROE',                 label: 'ROE',                   framework: 'Buffett' },
  { key: 'ROIC',                label: 'ROIC',                  framework: 'Damodaran ★' },
  { key: 'WACC',                label: 'WACC',                  framework: 'Damodaran ★' },
  { key: 'EV/EBITDA',           label: 'EV/EBITDA',             framework: 'Damodaran ★' },
  { key: 'FCF Yield',           label: 'FCF Yield',             framework: 'Damodaran ★' },
  { key: 'Revenue CAGR 5Y',     label: 'Crecimiento Ingresos',  framework: 'Damodaran ★' },
  { key: 'Margen de Beneficio', label: 'Margen de Beneficio',   framework: 'Buffett' },
  { key: 'Ratio de Deuda',      label: 'Ratio de Deuda',        framework: 'Buffett/Munger' },
  { key: 'Moat Cualitativo',    label: 'Moat Competitivo',      framework: 'Buffett/Munger' },
  { key: 'Margen de Seguridad', label: 'Margen de Seguridad',   framework: 'Buffett/Damodaran' },
];

const Section = ({ title, id, open, onToggle, children }) => (
  <div className="methodology-section">
    <h3
      style={{
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        borderRadius: 8,
        background: open ? '#0D1B2A' : '#F7FAFC',
        color: open ? '#fff' : '#2D3748',
        border: '1px solid #E2E8F0',
        userSelect: 'none',
        fontSize: '0.95rem',
        fontWeight: 700,
      }}
      onClick={() => onToggle(id)}
    >
      {title}
      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
    </h3>
    {open && (
      <div style={{ padding: '16px 4px 8px', lineHeight: 1.65, fontSize: '0.88rem', color: '#2D3748' }}>
        {children}
      </div>
    )}
  </div>
);

const MethodologyDoc = ({ highlightMetrics = [] }) => {
  const [openSections, setOpenSections] = useState({});
  const contentRef = useRef();

  const toggleSection = (id) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  /* ── PDF Export ── */
  const exportPDF = async () => {
    // 1. Open all sections
    const allOpen = {};
    ['framework', 'damodaran', 'buffett', 'proceso', 'tbills', 'horizonte', 'metricas'].forEach(
      (s) => (allOpen[s] = true)
    );
    setOpenSections(allOpen);

    // 2. Wait for React to re-render
    await new Promise((r) => setTimeout(r, 600));

    const input = contentRef.current;
    if (!input) return;

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        scrollY: 0,
        windowWidth: 900,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentW = pageW - 2 * margin;

      // Scale image to fit content width
      const scaledHeight = (canvas.height * contentW) / canvas.width;

      let yPos = margin;
      let remainingHeight = scaledHeight;
      let sourceY = 0;
      let pageCount = 0;

      while (remainingHeight > 0) {
        if (pageCount > 0) {
          pdf.addPage();
          yPos = margin;
        }
        const availH = pageH - 2 * margin;
        const sliceH = Math.min(remainingHeight, availH);
        const sourceSlicePx = (sliceH / scaledHeight) * canvas.height;

        // Create a slice canvas for this page
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(sourceSlicePx);
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, sourceY, canvas.width, Math.ceil(sourceSlicePx),
          0, 0, canvas.width, Math.ceil(sourceSlicePx));

        const sliceImgData = sliceCanvas.toDataURL('image/png');
        pdf.addImage(sliceImgData, 'PNG', margin, yPos, contentW, sliceH);

        remainingHeight -= sliceH;
        sourceY += Math.ceil(sourceSlicePx);
        pageCount++;
      }

      pdf.save('metodologia_valueport_ai.pdf');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Error al exportar PDF. Intenta de nuevo.');
    }
  };

  return (
    <div className="methodology-container">
      {/* Export button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={exportPDF}
          style={{
            background: '#0D1B2A', color: '#C9A84C',
            border: '2px solid #C9A84C', borderRadius: 8,
            padding: '9px 20px', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          📄 Exportar PDF
        </button>
      </div>

      {/* Content to export */}
      <div ref={contentRef} style={{ background: '#fff', padding: 24, borderRadius: 12 }}>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 8 }}>
          Metodología de Inversión
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#718096', marginBottom: 24 }}>
          Framework combinado: Buffett/Munger + Damodaran · ValuePort AI
        </p>

        {/* Framework overview */}
        <Section title="🔬 Framework Combinado: Damodaran + Buffett/Munger"
          id="framework" open={openSections['framework']} onToggle={toggleSection}>
          <p>
            ValuePort AI integra dos escuelas de pensamiento complementarias para construir portafolios
            superiores al mercado con un perfil de riesgo controlado:
          </p>
          <ul style={{ paddingLeft: 20, margin: '10px 0' }}>
            <li><strong>Warren Buffett &amp; Charlie Munger:</strong> Empresas de alta calidad con moat
              competitivo duradero, management excelente y precio razonable. "Es mejor comprar una empresa
              maravillosa a un precio justo que una empresa justa a un precio maravilloso."</li>
            <li style={{ marginTop: 8 }}><strong>Aswath Damodaran:</strong> Rigor cuantitativo en la
              valoración. El valor de cualquier activo es el valor presente de sus flujos de caja futuros
              descontados al coste de capital (WACC). ROIC &gt; WACC = creación de valor real.</li>
          </ul>
        </Section>

        {/* Damodaran section */}
        <Section title="📐 Principios Damodaran: Valoración Cuantitativa"
          id="damodaran" open={openSections['damodaran']} onToggle={toggleSection}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ background: '#F7FAFC', borderRadius: 8, padding: 14, borderLeft: '3px solid #1B4F72' }}>
              <h4 style={{ margin: '0 0 6px', color: '#0D1B2A' }}>ROIC vs WACC</h4>
              <p>
                El Retorno sobre Capital Invertido (ROIC) debe superar al Coste Medio Ponderado de Capital
                (WACC). Cuando ROIC &gt; WACC, cada euro de crecimiento crea valor. Cuando ROIC &lt; WACC,
                el crecimiento destruye valor. Buscamos un spread ROIC–WACC positivo y creciente.
              </p>
            </div>
            <div style={{ background: '#F7FAFC', borderRadius: 8, padding: 14, borderLeft: '3px solid #C9A84C' }}>
              <h4 style={{ margin: '0 0 6px', color: '#0D1B2A' }}>DCF &amp; Valor Intrínseco</h4>
              <p>
                El precio justo de una acción es el valor presente de todos sus flujos de caja libres futuros.
                Compramos solo cuando el precio de mercado ofrece un descuento significativo al valor intrínseco
                estimado (margen de seguridad ≥ 15%).
              </p>
            </div>
            <div style={{ background: '#F7FAFC', borderRadius: 8, padding: 14, borderLeft: '3px solid #276749' }}>
              <h4 style={{ margin: '0 0 6px', color: '#0D1B2A' }}>EV/EBITDA &amp; FCF Yield</h4>
              <p>
                EV/EBITDA permite comparar empresas de distintos sectores eliminando el efecto de la
                estructura de capital y los impuestos. FCF Yield (Flujo de Caja Libre / Capitalización
                bursátil) es la métrica más honesta de retorno real para el accionista. Buscamos FCF Yield &gt; 4%.
              </p>
            </div>
          </div>
        </Section>

        {/* Buffett/Munger */}
        <Section title="🏰 Principios Buffett/Munger: Calidad Cualitativa"
          id="buffett" open={openSections['buffett']} onToggle={toggleSection}>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Moat Competitivo:</strong> Ventaja económica duradera — marca, efectos de red, costes de
              cambio, ventaja de coste. El moat protege el ROIC superior durante décadas.</li>
            <li style={{ marginTop: 6 }}><strong>Management Orientado al Capital:</strong> Directivos que tratan
              el capital como si fuera su propio dinero. Evaluamos historial de asignación de capital, honestidad
              en la comunicación y alineación con accionistas.</li>
            <li style={{ marginTop: 6 }}><strong>Margen de Seguridad:</strong> Nunca pagamos el valor intrínseco
              completo. El descuento protege contra errores de análisis y sorpresas negativas.</li>
            <li style={{ marginTop: 6 }}><strong>Horizonte Largo:</strong> "Nuestro horizonte favorito es para
              siempre." El compounding funciona mejor con décadas, no trimestres.</li>
          </ul>
        </Section>

        {/* Process */}
        <Section title="⚙️ Proceso de Selección (5 Filtros)"
          id="proceso" open={openSections['proceso']} onToggle={toggleSection}>
          {[
            { n: 1, title: 'Filtro Cuantitativo Damodaran', desc: 'ROIC > WACC, FCF Yield > 3%, EV/EBITDA comparado vs sector, Revenue CAGR > 8% en los últimos 3 años, margen de seguridad > 10% vs valor DCF estimado.' },
            { n: 2, title: 'Filtro Cuantitativo Buffett', desc: 'ROE > 12% sostenido, P/E < 18, Deuda/Equity < 0.6, Margen neto > 15%, generación consistente de FCF por más de 5 años.' },
            { n: 3, title: 'Filtro Moat Cualitativo', desc: 'Evaluación de la ventaja competitiva: ¿Es duradera? ¿Puede el management defenderla? ¿El mercado la reconoce en el ROE/ROIC histórico?' },
            { n: 4, title: 'Diversificación Estratégica', desc: 'Máximo 2 posiciones por sector. Exposición geográfica balanceada (US, Europa, mercados emergentes selectivos). Correlaciones bajas entre categorías.' },
            { n: 5, title: 'Decisión Final con IA', desc: 'Claude analiza el portafolio completo con el framework dual, identifica concentraciones, red flags y genera una decisión de inversión con score 0-100.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                background: '#0D1B2A', color: '#C9A84C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800,
              }}>{step.n}</div>
              <div>
                <strong style={{ color: '#0D1B2A' }}>{step.title}</strong>
                <p style={{ margin: '2px 0 0', color: '#4A5568' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* T-Bills */}
        <Section title="🛡 Bonos y T-Bills como Ancla del Portafolio"
          id="tbills" open={openSections['tbills']} onToggle={toggleSection}>
          <p>
            La renta fija cumple tres funciones estratégicas en el portafolio:
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li><strong>Reserva de Liquidez:</strong> Capital disponible para aprovechar caídas del mercado sin vender posiciones.</li>
            <li style={{ marginTop: 6 }}><strong>Reducción de Correlación:</strong> Los bonos gubernamentales tienen correlación negativa con la renta variable en crisis, amortiguando la volatilidad del portafolio.</li>
            <li style={{ marginTop: 6 }}><strong>Rendimiento sin Riesgo:</strong> Los ETFs de bonos gubernamentales ofrecen rendimientos reales atractivos como alternativa a la liquidez sin retorno.</li>
          </ul>
        </Section>

        {/* Horizonte */}
        <Section title="⏳ Horizonte Temporal y el Poder del Compounding"
          id="horizonte" open={openSections['horizonte']} onToggle={toggleSection}>
          <p>
            El value investing con framework Damodaran requiere tiempo para que el mercado reconozca
            el valor intrínseco. Buffett: "El tiempo es amigo de los negocios maravillosos y enemigo de los mediocres."
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li><strong>Largo plazo (&gt;10 años):</strong> Ideal para value investing. Permite múltiples ciclos de compounding y reduce el riesgo de valoración.</li>
            <li style={{ marginTop: 6 }}><strong>Intermedio (5-10 años):</strong> Suficiente para que el mercado corrija subvaloraciones significativas. Incluir más bonos para estabilidad.</li>
            <li style={{ marginTop: 6 }}><strong>Corto plazo (&lt;5 años):</strong> Value investing subóptimo. Aumentar weight en bonos y reducir growth/disruptivas.</li>
          </ul>
        </Section>

        {/* Metrics table */}
        <Section title="📊 Métricas Clave del Framework Dual"
          id="metricas" open={openSections['metricas']} onToggle={toggleSection}>
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Framework</th>
                <th>Descripción</th>
                <th>Umbral Objetivo</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_KEYS.map(({ key, label, framework }) => (
                <tr key={key} className={highlightMetrics.includes(key) ? 'highlight-metric' : ''}>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem',
                    color: framework.includes('Damodaran') ? '#1B4F72' : '#276749' }}>
                    {framework}
                  </td>
                  <td>
                    {key === 'P/E Ratio'          && 'Precio por acción / Beneficio por acción'}
                    {key === 'ROE'                 && 'Beneficio neto / Patrimonio de accionistas'}
                    {key === 'ROIC'                && 'NOPAT / Capital invertido (deuda + equity)'}
                    {key === 'WACC'                && 'Coste medio ponderado de capital (deuda + equity)'}
                    {key === 'EV/EBITDA'           && 'Valor empresa / EBITDA (excluye estructura capital)'}
                    {key === 'FCF Yield'           && 'Flujo de Caja Libre / Capitalización bursátil'}
                    {key === 'Revenue CAGR 5Y'     && 'Tasa compuesta de crecimiento de ingresos (5 años)'}
                    {key === 'Margen de Beneficio' && 'Beneficio neto / Ingresos totales'}
                    {key === 'Ratio de Deuda'      && 'Deuda financiera neta / EBITDA'}
                    {key === 'Moat Cualitativo'    && 'Ventaja competitiva duradera: marca, red, coste, switching'}
                    {key === 'Margen de Seguridad' && 'Descuento del precio de mercado al valor intrínseco DCF'}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {key === 'P/E Ratio'          && '< 18'}
                    {key === 'ROE'                 && '> 15%'}
                    {key === 'ROIC'                && '> WACC (≥ 15%)'}
                    {key === 'WACC'                && '< ROIC'}
                    {key === 'EV/EBITDA'           && '< Sector (razonable)'}
                    {key === 'FCF Yield'           && '> 4%'}
                    {key === 'Revenue CAGR 5Y'     && '> 8%'}
                    {key === 'Margen de Beneficio' && '> 15%'}
                    {key === 'Ratio de Deuda'      && '< 2.5x'}
                    {key === 'Moat Cualitativo'    && 'Fuerte o Amplio'}
                    {key === 'Margen de Seguridad' && '≥ 15%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </div>
  );
};

export default MethodologyDoc;
