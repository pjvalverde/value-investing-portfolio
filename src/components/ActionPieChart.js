import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFE', '#F47C7C'];

/**
 * ActionPieChart
 * Props:
 *   metrics: Array of objects: [{ name: 'P/E', value: 28 }, ...]
 *   title: string
 */
export default function ActionPieChart({ metrics = [], title = '' }) {
  if (!metrics || metrics.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 320, margin: '0 auto', background: '#f8f9fa', borderRadius: 12, padding: 16 }}>
      <h3 style={{ textAlign: 'center', marginBottom: 16 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={metrics}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            fill="#8884d8"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {metrics.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
