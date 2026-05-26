// components/charts/Charts.jsx
// Recharts wrappers themed for GigCredit teal palette.

import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

const palette = ['#00c2a8', '#4da1ff', '#f6a623', '#f25f5c', '#3ecf8e', '#9d97ff'];

const baseAxisProps = {
  stroke: '#6b95a8',
  fontSize: 11,
  tickLine: false,
  axisLine: { stroke: 'rgba(0,194,168,.2)' },
};

const tooltipStyle = {
  background: '#0f1f38',
  border: '1px solid rgba(0,194,168,.2)',
  borderRadius: 8,
  color: '#e8f4f8',
  fontSize: 12.5,
  padding: '8px 12px',
};
const tooltipItemStyle  = { color: '#e8f4f8' };
const tooltipLabelStyle = { color: '#00c2a8', fontSize: 11, marginBottom: 4 };
const gridColor         = 'rgba(0,194,168,.1)';

export function LineSeries({ data, xKey, lines = [], height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
        <XAxis dataKey={xKey} {...baseAxisProps} />
        <YAxis {...baseAxisProps} />
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#a8ccd8' }} />}
        {lines.map((l, i) => (
          <Line
            key={l.key} type="monotone" dataKey={l.key}
            name={l.name || l.key}
            stroke={l.color || palette[i % palette.length]}
            strokeWidth={2} dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaSeries({ data, xKey, areaKey, color = '#00c2a8', height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="gcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
        <XAxis dataKey={xKey} {...baseAxisProps} />
        <YAxis {...baseAxisProps} />
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
        <Area type="monotone" dataKey={areaKey} stroke={color} strokeWidth={2} fill="url(#gcGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({ data, xKey, bars = [], height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
        <XAxis dataKey={xKey} {...baseAxisProps} />
        <YAxis {...baseAxisProps} />
        <Tooltip
          cursor={{ fill: 'rgba(0,194,168,.06)' }}
          contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle}
        />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#a8ccd8' }} />}
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} name={b.name || b.key}
            fill={b.color || palette[i % palette.length]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie({ data, dataKey = 'value', nameKey = 'name', height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey}
          innerRadius={60} outerRadius={88} paddingAngle={3} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#a8ccd8' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
