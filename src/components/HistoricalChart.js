import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// Espera un prop: data = [{ date, value, company }]
const HistoricalChart = ({ data = [], title = 'Histórico de Rendimiento', companies = [] }) => {
  if (!data.length) return <div>No hay datos históricos.</div>;
  // Si hay varias empresas, genera una línea por empresa
  const lines = companies.length
    ? companies.map((company, idx) => (
        <Line key={company} dataKey={company} stroke={['#0088FE','#FF8042','#00C49F','#FFBB28','#A28CFF','#FF6F91','#6FFFBF'][idx%7]} dot={false} />
      ))
    : [<Line key="value" dataKey="value" stroke="#0088FE" dot={false} />];
  return (
    <div className="card">
      <div className="section-title">{title}</div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
export default HistoricalChart;
