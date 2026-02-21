import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import './HistoricalPerformance.css';

const PALETTE = [
  '#1B4F72', '#C9A84C', '#00897B', '#8E44AD',
  '#C0392B', '#27AE60', '#2980B9', '#E67E22',
];

const TIME_RANGES = [
  { label: '1M', period: '1mo' },
  { label: '3M', period: '3mo' },
  { label: '6M', period: '6mo' },
  { label: '1A', period: '1y' },
  { label: '3A', period: '3y' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="hp-tooltip">
      <p className="hp-tooltip-date">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="hp-tooltip-row">
          <span className="hp-tooltip-ticker">{p.dataKey === 'SPY' ? 'S&P 500 ▴' : p.dataKey}</span>
          <span className={`hp-tooltip-val ${p.value >= 0 ? 'pos' : 'neg'}`}>
            {p.value >= 0 ? '+' : ''}{p.value?.toFixed(2)}%
          </span>
        </p>
      ))}
    </div>
  );
};

const HistoricalPerformance = ({ portfolio, baseUrl }) => {
  const [period, setPeriod] = useState('1y');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tickers, setTickers] = useState([]);
  const [activeLines, setActiveLines] = useState({});
  const [summary, setSummary] = useState({});

  // Extract tickers from portfolio
  useEffect(() => {
    if (!portfolio?.allocation) return;
    const found = [];
    Object.values(portfolio.allocation).forEach((positions) => {
      if (Array.isArray(positions)) {
        positions.forEach((p) => {
          const t = (p.symbol || p.ticker || '').toUpperCase();
          if (t && t !== 'N/A' && !found.includes(t)) found.push(t);
        });
      }
    });
    const selected = found.slice(0, 7);
    setTickers(selected);
    const initial = { SPY: true };
    selected.forEach((t) => (initial[t] = true));
    setActiveLines(initial);
  }, [portfolio]);

  const fetchData = useCallback(async () => {
    if (!tickers.length) return;
    setLoading(true);
    setError('');
    try {
      const all = [...tickers, 'SPY'];
      const resp = await fetch(`${baseUrl}/api/portfolio/historical-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: all, period }),
      });
      if (!resp.ok) throw new Error('Error obteniendo datos históricos del servidor');
      const raw = await resp.json();
      if (raw.error) throw new Error(raw.error);

      const { normalized, summaryData } = normalizeData(raw);
      setChartData(normalized);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || 'Error al cargar datos históricos');
    } finally {
      setLoading(false);
    }
  }, [tickers, period, baseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const normalizeData = (raw) => {
    const dateSet = new Set();
    Object.values(raw).forEach((series) => series.forEach((pt) => dateSet.add(pt.date)));
    const sortedDates = [...dateSet].sort();

    const base = {};
    Object.entries(raw).forEach(([tk, series]) => {
      if (series.length) base[tk] = series[0].close;
    });

    // Build chart data points
    const normalized = sortedDates.map((date) => {
      const point = { date };
      Object.entries(raw).forEach(([tk, series]) => {
        const found = series.find((p) => p.date === date);
        if (found && base[tk]) {
          point[tk] = parseFloat(((found.close / base[tk] - 1) * 100).toFixed(2));
        }
      });
      return point;
    });

    // Summary: last point return
    const summaryData = {};
    if (normalized.length) {
      const last = normalized[normalized.length - 1];
      Object.keys(raw).forEach((tk) => {
        summaryData[tk] = last[tk] ?? null;
      });
    }
    return { normalized, summaryData };
  };

  const toggleLine = (tk) =>
    setActiveLines((prev) => ({ ...prev, [tk]: !prev[tk] }));

  const allTickers = ['SPY', ...tickers];

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date + 'T00:00:00');
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
  };

  return (
    <div className="hp-root">
      <div className="hp-header">
        <div>
          <h3 className="hp-title">Rendimiento Histórico</h3>
          <p className="hp-subtitle">
            Retorno relativo normalizado (base 0%). <span className="hp-spy-label">---</span> S&amp;P 500 como referencia.
          </p>
        </div>
        <div className="hp-time-selector">
          {TIME_RANGES.map((r) => (
            <button
              key={r.label}
              className={`hp-time-btn ${period === r.period ? 'active' : ''}`}
              onClick={() => setPeriod(r.period)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      {Object.keys(summary).length > 0 && (
        <div className="hp-summary-row">
          {allTickers.filter((t) => summary[t] !== undefined && summary[t] !== null).map((tk, i) => (
            <div key={tk} className="hp-summary-chip"
              style={{ borderColor: tk === 'SPY' ? '#718096' : PALETTE[i % PALETTE.length] }}>
              <span className="hp-chip-ticker">{tk === 'SPY' ? 'S&P 500' : tk}</span>
              <span className={`hp-chip-val ${summary[tk] >= 0 ? 'pos' : 'neg'}`}>
                {summary[tk] >= 0 ? '+' : ''}{summary[tk]?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="hp-loading">
          <div className="hp-spinner" />
          <span>Cargando datos de mercado…</span>
        </div>
      )}

      {error && (
        <div className="hp-error">
          <span>⚠ {error}</span>
          <button className="hp-retry" onClick={fetchData}>Reintentar</button>
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <>
          <div className="hp-chart-wrap">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                <ReferenceLine y={0} stroke="#CBD5E0" strokeWidth={1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#718096' }}
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#718096' }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ display: 'none' }} />
                {allTickers.map((tk, i) =>
                  activeLines[tk] ? (
                    <Line
                      key={tk}
                      type="monotone"
                      dataKey={tk}
                      stroke={tk === 'SPY' ? '#A0AEC0' : PALETTE[i % PALETTE.length]}
                      strokeWidth={tk === 'SPY' ? 1.5 : 2}
                      strokeDasharray={tk === 'SPY' ? '6 4' : undefined}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ticker toggles */}
          <div className="hp-toggle-row">
            {allTickers.map((tk, i) => {
              const color = tk === 'SPY' ? '#A0AEC0' : PALETTE[i % PALETTE.length];
              const on = activeLines[tk];
              return (
                <button
                  key={tk}
                  className={`hp-toggle-btn ${on ? 'on' : 'off'}`}
                  onClick={() => toggleLine(tk)}
                  style={{
                    borderColor: color,
                    backgroundColor: on ? color : 'transparent',
                    color: on ? '#fff' : color,
                  }}
                >
                  {tk === 'SPY' ? 'S&P 500' : tk}
                </button>
              );
            })}
          </div>

          <p className="hp-disclaimer">
            Datos: Yahoo Finance vía yfinance. Rendimientos pasados no garantizan resultados futuros.
          </p>
        </>
      )}

      {!loading && !error && chartData.length === 0 && tickers.length > 0 && (
        <div className="hp-empty">
          <span>No se encontraron datos históricos para los tickers del portafolio.</span>
        </div>
      )}
    </div>
  );
};

export default HistoricalPerformance;
