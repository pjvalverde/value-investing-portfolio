import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './AntifragilePanel.css';

const AntifragilePanel = ({ portfolio, amount }) => {
  const calculateAntifragileSplit = (allocation) => {
    if (!allocation) {
      return {
        secureAmount: 0,
        riskyAmount: 0,
        totalAmount: 0,
        securePercentage: 0,
        riskyPercentage: 0,
      };
    }

    const secureAmount = (allocation.bonds || []).reduce((sum, pos) => sum + pos.amount, 0) +
                         (allocation.value || []).reduce((sum, pos) => sum + pos.amount, 0);

    const riskyAmount = (allocation.growth || []).reduce((sum, pos) => sum + pos.amount, 0) +
                        (allocation.disruptive || []).reduce((sum, pos) => sum + pos.amount, 0);

    const totalInvested = secureAmount + riskyAmount;

    // Recalculate percentages based on the total portfolio amount including cash
    const totalPortfolioAmount = amount;

    return {
      secureAmount,
      riskyAmount,
      totalInvested,
      securePercentage: totalPortfolioAmount > 0 ? (secureAmount / totalPortfolioAmount) * 100 : 0,
      riskyPercentage: totalPortfolioAmount > 0 ? (riskyAmount / totalPortfolioAmount) * 100 : 0,
    };
  };

  const { allocation } = portfolio || {};
  const split = calculateAntifragileSplit(allocation);

  const data = [
    { name: 'Seguro', value: split.secureAmount },
    { name: 'Riesgoso', value: split.riskyAmount },
  ];

  const cash = amount - split.totalInvested;
  if(cash > 0) {
    data.push({ name: 'Efectivo', value: cash });
  }

  const COLORS = ['#4a6fa5', '#ff6f61', '#cccccc']; // Secure: Blue, Risky: Red, Cash: Gray

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (split.totalInvested === 0) {
    return null; // Don't render the panel if there's no data
  }

  return (
    <div className="antifragile-panel">
      <h3>Análisis Antifrágil (Estrategia Barbell)</h3>
      <div className="antifragile-content">
        <div className="antifragile-chart">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="antifragile-summary">
          <h4>Desglose del Portfolio</h4>
          <p>
            <strong>Seguro:</strong> {formatMoney(split.secureAmount)} ({split.securePercentage.toFixed(2)}%)
            <br />
            <small>(Activos de bajo riesgo como Bonos y acciones Value)</small>
          </p>
          <p>
            <strong>Riesgoso:</strong> {formatMoney(split.riskyAmount)} ({split.riskyPercentage.toFixed(2)}%)
            <br />
            <small>(Activos de alto crecimiento y/o disruptivos)</small>
          </p>
           {cash > 0 && (
            <p>
              <strong>Efectivo:</strong> {formatMoney(cash)} ({((cash / amount) * 100).toFixed(2)}%)
              <br />
              <small>(Capital no invertido, opcionalidad)</small>
            </p>
          )}
          <p className="explanation">
            Este portafolio aplica una <strong>estrategia "Barbell"</strong>, concentrando las inversiones en los extremos de seguridad y riesgo. El objetivo es crear un portafolio robusto a eventos negativos ("cisnes negros") y al mismo tiempo mantener un potencial de crecimiento significativo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AntifragilePanel;
