import './App.css';
import { useState } from 'react';
import PortfolioForm from './components/PortfolioForm';
import PortfolioTable from './components/PortfolioTable';
import PortfolioCharts from './components/PortfolioCharts';
import MethodologyDoc from './components/MethodologyDoc';
import HistoricalChart from './components/HistoricalChart';
import ActionAnalysisModal from './components/ActionAnalysisModal';
import ComparativeTable from './components/ComparativeTable';

function App() {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedActionAnalysis, setSelectedActionAnalysis] = useState('');
  const [selectedActionMetrics, setSelectedActionMetrics] = useState([]);

  // Estados adicionales necesarios para el funcionamiento del componente
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [comparativeData, setComparativeData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);

  // Mostrar análisis individual usando Claude y métricas
  const handleShowActionAnalysis = async (action) => {
    setSelectedAction(action);
    setSelectedActionAnalysis('Cargando análisis...');
    setSelectedActionMetrics([]);
    try {
      const BASE_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '');
      // Nuevo endpoint: /justification/accion?ticker=XXX
      const res = await fetch(`${BASE_URL}/justification/accion?ticker=${action.ticker}`);
      if (!res.ok) throw new Error('No se pudo obtener el análisis individual');
      const data = await res.json();
      setSelectedActionAnalysis(data.analysis || '');
      // Preparar métricas para el gráfico pastel
      const metrics = [];
      if (action.ROE !== undefined && action.ROE !== null) metrics.push({ name: 'ROE', value: action.ROE });
      if (action.PE !== undefined && action.PE !== null) metrics.push({ name: 'P/E', value: action.PE });
      if (action.margen_beneficio !== undefined && action.margen_beneficio !== null) metrics.push({ name: 'Margen', value: action.margen_beneficio });
      if (action.ratio_deuda !== undefined && action.ratio_deuda !== null) metrics.push({ name: 'Deuda', value: action.ratio_deuda });
      if (action.crecimiento_fcf !== undefined && action.crecimiento_fcf !== null) metrics.push({ name: 'FCF', value: action.crecimiento_fcf });
      if (action.moat !== undefined && action.moat !== null) metrics.push({ name: 'Moat', value: action.moat });
      setSelectedActionMetrics(metrics);
      
      // Actualizar precios en tiempo real si es necesario
      if (!action.price || action.price === 'NaN') {
        try {
          const priceRes = await fetch(`${BASE_URL}/real_time_price?ticker=${action.ticker}`);
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            if (priceData.price) {
              // Actualizar el precio en el portfolio local
              const updatedPortfolio = portfolio.map(item => 
                item.ticker === action.ticker ? {...item, price: priceData.price} : item
              );
              setPortfolio(updatedPortfolio);
            }
          }
        } catch (priceErr) {
          console.error('Error al obtener precio en tiempo real:', priceErr);
        }
      }
    } catch (e) {
      setSelectedActionAnalysis(`<span style='color:red'>${e.message}</span>`);
    }
  };

  const fetchPortfolio = async (formData) => {
    setLoading(true);
    setError('');
    setShowAnalysis(false);
    setWarnings([]);
    try {
      const BASE_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '');
      const resGen = await fetch(`${BASE_URL}/generate_portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!resGen.ok) throw new Error('No se pudo generar el portafolio');
      const genData = await resGen.json();
      if (genData.warnings) setWarnings(genData.warnings);
      await new Promise(res => setTimeout(res, 2000));
      const res = await fetch(`${BASE_URL}/portfolio`, { method: 'GET' });
      if (!res.ok) throw new Error('No se pudo obtener el portafolio');
      const data = await res.json();
      setPortfolio(data);
      setHistoricalData([
        { date: '2022-01', value: 100, CompanyA: 100, CompanyB: 100 },
        { date: '2022-06', value: 110, CompanyA: 115, CompanyB: 108 },
        { date: '2023-01', value: 120, CompanyA: 125, CompanyB: 119 },
        { date: '2023-06', value: 130, CompanyA: 140, CompanyB: 127 },
        { date: '2024-01', value: 145, CompanyA: 150, CompanyB: 140 }
      ]);
      setComparativeData([
        { company: 'CompanyA', ROE: 18, 'P/E': 14, 'Margen de Beneficio': '22%', 'Ratio de Deuda': '0.3', 'Crecimiento de FCF': '9%', 'Moat Cualitativo': 'Alto' },
        { company: 'CompanyB', ROE: 15, 'P/E': 17, 'Margen de Beneficio': '18%', 'Ratio de Deuda': '0.4', 'Crecimiento de FCF': '7%', 'Moat Cualitativo': 'Medio' }
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAnalysis = async () => {
    setAnalysisLoading(true);
    setShowAnalysis(true);
    setAnalysis('');
    setComparativeData([]);
    setHistoricalData([]);
    try {
      const BASE_URL = process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '');
      const res = await fetch(`${BASE_URL}/justification`);
      if (!res.ok) throw new Error('No se pudo obtener el análisis detallado');
      const data = await res.json();
      setAnalysis(data.analysis || data.html || '');
      if (data.metrics && Array.isArray(data.metrics)) {
        // Adaptar para ComparativeTable
        setComparativeData(
          data.metrics.map(m => ({
            company: m.ticker,
            ROE: m.ROE ?? '-',
            'P/E': m.PE ?? '-',
            'Margen de Beneficio': m.margen_beneficio ?? '-',
            'Ratio de Deuda': m.ratio_deuda ?? '-',
            'Crecimiento de FCF': m.crecimiento_fcf ?? '-',
            'Moat Cualitativo': m.moat ?? '-'
          }))
        );
      }
      // Obtener históricos
      if (data.metrics && data.metrics.length > 0) {
        const tickers = data.metrics.map(m => m.ticker);
        const resHist = await fetch(`${BASE_URL}/historical_prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers })
        });
        if (resHist.ok) {
          const histData = await resHist.json();
          // Formatear para HistoricalChart
          const allDates = new Set();
          Object.values(histData.historical).forEach(arr => arr.forEach(d => allDates.add(d.date)));
          const sortedDates = Array.from(allDates).sort();
          const chartData = sortedDates.map(date => {
            const row = { date };
            for (const ticker of tickers) {
              const found = (histData.historical[ticker] || []).find(d => d.date === date);
              row[ticker] = found ? found.close : null;
            }
            return row;
          });
          setHistoricalData(chartData);
        }
      }
    } catch (e) {
      setAnalysis(`<span style='color:red'>${e.message}</span>`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="App" style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <h1>Value Investing Portfolio App</h1>
      <PortfolioForm onSubmit={fetchPortfolio} loading={loading} />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {warnings.length > 0 && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: 12, borderRadius: 6, marginBottom: 12, border: '1px solid #ffeeba' }}>
          <strong>Advertencia:</strong>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
      {portfolio.length > 0 && (
        <>
          <PortfolioCharts portfolio={portfolio} />
          <PortfolioTable portfolio={portfolio} onShowAnalysis={handleShowActionAnalysis} />
          {/* Eliminados los botones de acciones */}
          {/* Modal de análisis individual */}
          <ActionAnalysisModal
            open={!!selectedAction}
            onClose={() => setSelectedAction(null)}
            action={selectedAction?.ticker}
            analysis={selectedActionAnalysis}
            metrics={selectedActionMetrics}
          />
          <div style={{ margin: '24px 0', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            <button 
              onClick={() => {
                // Reiniciar el formulario para crear un nuevo portfolio
                setPortfolio([]);
                setShowAnalysis(false);
                setAnalysis('');
                setHistoricalData([]);
                setComparativeData([]);
              }} 
              disabled={loading}
              style={{
                background: '#4CAF50',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Armar otro portfolio
            </button>
          </div>
        </>
      )}
      {showAnalysis && (
        <>
          <div className="card" style={{ marginTop: 24, padding: 24, background: '#fffbe8' }}>
            <h2>Análisis Detallado del Portafolio</h2>
            <div dangerouslySetInnerHTML={{ __html: analysis }} />
          </div>
          {historicalData.length > 0 && (
            <HistoricalChart data={historicalData} title="Evolución Histórica del Portfolio" companies={comparativeData.map(d => d.company)} />
          )}
          {comparativeData.length > 0 && (
            <ComparativeTable data={comparativeData} metrics={["ROE","P/E","Margen de Beneficio","Ratio de Deuda","Crecimiento de FCF","Moat Cualitativo"]} />
          )}
        </>
      )}
      <div style={{ marginTop: 32 }}>
        <h2>Justificación y Metodología</h2>
        <MethodologyDoc highlightMetrics={["ROE","P/E"]} />
      </div>
    </div>
  );
}

export default App;
