import React, { useState } from 'react';

const SECTORS = [
  'Tecnología',
  'Salud',
  'Finanzas',
  'Consumo',
  'Energía',
  'Industriales',
  'Materiales',
  'Servicios',
  'Inmobiliario',
  'Utilidades',
  'Telecomunicaciones',
];

const ETFS = [
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', description: 'Sigue el índice S&P 500, que incluye las 500 empresas más grandes de EE.UU.' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', description: 'Sigue el índice Nasdaq-100, enfocado en empresas tecnológicas y de crecimiento.' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', description: 'El ETF más líquido que sigue el índice S&P 500.' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', description: 'Exposición a todo el mercado de acciones de EE.UU., incluyendo pequeña, mediana y gran capitalización.' },
  { ticker: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF', description: 'Exposición a mercados emergentes como China, India, Brasil, etc.' },
  { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', description: 'Exposición a mercados desarrollados fuera de EE.UU. como Europa, Japón y Canadá.' },
];

const PortfolioForm = ({ onSubmit, loading }) => {
  const [amount, setAmount] = useState('');
  const [horizon, setHorizon] = useState('largo');
  const [includeTBills, setIncludeTBills] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [selectedETFs, setSelectedETFs] = useState([]);
  const [showETFDetails, setShowETFDetails] = useState({});

  const handleSectorChange = (sector) => {
    setSelectedSectors(prev =>
      prev.includes(sector)
        ? prev.filter(s => s !== sector)
        : [...prev, sector]
    );
  };

  const handleETFChange = (ticker) => {
    setSelectedETFs(prev =>
      prev.includes(ticker)
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  const toggleETFDetails = (ticker) => {
    setShowETFDetails(prev => ({
      ...prev,
      [ticker]: !prev[ticker]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ 
      amount, 
      horizon, 
      includeTBills, 
      sectors: selectedSectors,
      etfs: selectedETFs
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
      <h2>Tu Portafolio Personalizado</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold' }}>¿En qué áreas te gustaría invertir?</label><br />
        {SECTORS.map(sector => (
          <label key={sector} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={selectedSectors.includes(sector)}
              onChange={() => handleSectorChange(sector)}
            /> {sector}
          </label>
        ))}
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold' }}>Selecciona ETFs específicos para diversificar tu portfolio:</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
          {ETFS.map(etf => (
            <div key={etf.ticker} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '10px', 
              width: 'calc(50% - 10px)',
              backgroundColor: selectedETFs.includes(etf.ticker) ? '#e3f2fd' : 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedETFs.includes(etf.ticker)}
                    onChange={() => handleETFChange(etf.ticker)}
                  />
                  <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>{etf.ticker}</span>
                  <span style={{ marginLeft: '8px', fontSize: '0.9em', color: '#555' }}>
                    {etf.name}
                  </span>
                </label>
                <button 
                  type="button"
                  onClick={() => toggleETFDetails(etf.ticker)}
                  style={{ 
                    background: 'none', 
                    border: '1px solid #ccc', 
                    borderRadius: '50%', 
                    width: '24px', 
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {showETFDetails[etf.ticker] ? '-' : 'i'}
                </button>
              </div>
              {showETFDetails[etf.ticker] && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '0.85em', 
                  backgroundColor: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '4px',
                  color: '#555'
                }}>
                  {etf.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold' }}>Monto a invertir:</label><br />
        <input
          type="number"
          min="100"
          step="100"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="$ 5,000"
          required
          style={{ padding: 6, width: 160 }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold' }}>Horizonte:</label><br />
        <label>
          <input type="radio" value="corto" checked={horizon === 'corto'} onChange={() => setHorizon('corto')} /> Corto (&lt;5 años)
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" value="intermedio" checked={horizon === 'intermedio'} onChange={() => setHorizon('intermedio')} /> Intermedio (5-10 años)
        </label>
        <label style={{ marginLeft: 12 }}>
          <input type="radio" value="largo" checked={horizon === 'largo'} onChange={() => setHorizon('largo')} /> Largo (&gt;10 años)
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input type="checkbox" checked={includeTBills} onChange={e => setIncludeTBills(e.target.checked)} /> Incluir bonos del Tesoro (T-Bill)
        </label>
      </div>
      <button type="submit" disabled={loading} style={{ padding: '8px 24px', fontSize: 16 }}>
        {loading ? 'Generando...' : 'Generar portafolio recomendado'}
      </button>
    </form>
  );
};

export default PortfolioForm;
