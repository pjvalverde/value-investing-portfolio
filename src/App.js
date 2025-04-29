import './App.css';
import { useState } from 'react';
import PortfolioCharts from './components/PortfolioCharts';
import MethodologyDoc from './components/MethodologyDoc';
import HistoricalChart from './components/HistoricalChart';
import ComparativeTable from './components/ComparativeTable';

function App() {
  const [portfolio, setPortfolio] = useState([]);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Simulación de datos históricos y comparativos
  const [historicalData, setHistoricalData] = useState([]);
  const [comparativeData, setComparativeData] = useState([]);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      // Generar portafolio (POST)
      await fetch('http://localhost:8000/generate_portfolio', { method: 'POST' });
      // Esperar unos segundos a que el backend lo genere
      await new Promise(res => setTimeout(res, 3000));
      // Obtener portafolio
      const res = await fetch('http://localhost:8000/portfolio');
      if (!res.ok) throw new Error('No se pudo obtener el portafolio');
      const data = await res.json();
      setPortfolio(data);
      // Obtener justificación
      const resJ = await fetch('http://localhost:8000/justification');
      if (resJ.ok) {
        const dataJ = await resJ.json();
        setJustification(dataJ.html);
      }
      // Simula datos históricos y comparativos (reemplazar por fetch real)
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

  return (
    <div className="App" style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <h1>Value Investing Portfolio App</h1>
      <button onClick={fetchPortfolio} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? 'Generando...' : 'Generar mi Portfolio Ideal'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {portfolio.length > 0 && <PortfolioCharts portfolio={portfolio} />}
      {/* Visualización histórica */}
      {historicalData.length > 0 && (
        <HistoricalChart data={historicalData} title="Evolución Histórica del Portfolio" companies={["CompanyA","CompanyB"]} />
      )}
      {/* Tabla comparativa */}
      {comparativeData.length > 0 && (
        <ComparativeTable data={comparativeData} metrics={["ROE","P/E","Margen de Beneficio","Ratio de Deuda","Crecimiento de FCF","Moat Cualitativo"]} />
      )}
      {/* Justificación y metodología interactiva */}
      <div style={{ marginTop: 32 }}>
        <h2>Justificación y Metodología</h2>
        <MethodologyDoc highlightMetrics={["ROE","P/E"]} />
      </div>
    </div>
  );
}

export default App;
