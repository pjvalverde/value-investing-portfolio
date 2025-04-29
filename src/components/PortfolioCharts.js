import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4a6fa5', '#6d8cb0', '#5c8dd6', '#68b7a0', '#9b59b6', '#e67e22', '#f1c40f'];

// portfolio: array de empresas, cada una con campos como sector, mercado, peso, etc.
// portfolioDistribution: objeto { sector: peso } (opcional, para compatibilidad)
const PortfolioCharts = ({ portfolio, portfolioDistribution }) => {
  if (!portfolio || portfolio.length === 0) return <div>No portfolio data.</div>;

  // Pie: distribución por sector
  let sectorDistribution = portfolioDistribution;
  if (!sectorDistribution) {
    sectorDistribution = portfolio.reduce((acc, item) => {
      const sector = item.Sector || item.sector;
      const peso = parseFloat(item.Allocation || item.peso || 1);
      acc[sector] = (acc[sector] || 0) + peso;
      return acc;
    }, {});
  }
  const pieData = Object.entries(sectorDistribution).map(([name, value]) => ({ name, value }));
  const sectorData = [...pieData].sort((a, b) => b.value - a.value);

  // Barras: distribución por mercado
  const marketDistribution = {};
  portfolio.forEach(item => {
    const mercado = item.Market || item.mercado;
    const peso = parseFloat(item.Allocation || item.peso || 1);
    if (mercado) {
      marketDistribution[mercado] = (marketDistribution[mercado] || 0) + peso;
    }
  });
  const marketData = Object.entries(marketDistribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="card">
        <div className="section-title">Distribución del Portfolio por Sector</div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="section-title">Distribución por Sector (Peso %)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sectorData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="value" name="Peso (%)" fill="#4a6fa5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="section-title">Distribución por Mercado (Peso %)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={marketData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="value" name="Peso (%)" fill="#68b7a0" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="section-title">Principios de Value Investing Aplicados</div>
        <div className="value-principles">
          <div className="principle-item">
            <h3>Ventaja Competitiva Duradera (Moat)</h3>
            <p>Las empresas seleccionadas poseen ventajas competitivas sostenibles como marcas fuertes, efectos de red, o ventajas de coste.</p>
          </div>
          <div className="principle-item">
            <h3>Gestión de Calidad</h3>
            <p>Se priorizaron empresas con equipos directivos que han demostrado asignación eficiente de capital y alineación con los intereses de los accionistas.</p>
          </div>
          <div className="principle-item">
            <h3>Margen de Seguridad</h3>
            <p>Todas las acciones fueron seleccionadas con un precio por debajo de su valor intrínseco estimado, proporcionando un margen de seguridad.</p>
          </div>
          <div className="principle-item">
            <h3>Diversificación Inteligente</h3>
            <p>El portfolio incluye exposición a diferentes sectores y mercados geográficos, manteniendo concentración en las mejores ideas.</p>
          </div>
          <div className="principle-item">
            <h3>Horizonte a Largo Plazo</h3>
            <p>Las empresas fueron seleccionadas con una perspectiva de inversión de 7+ años, ignorando fluctuaciones a corto plazo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCharts;
