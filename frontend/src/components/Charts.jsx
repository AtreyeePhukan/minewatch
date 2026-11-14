/**
 * Data visualisation section with three Recharts charts.
 * All data fetched from GET /api/charts.
 */

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getCharts } from '../api';
import { Section, ErrorBox } from './DatasetOverview';

const SAFE_COLOR = '#5f7a57';
const HAZARD_COLOR = '#9c5555';
const ENERGY_COLOR = '#84a07c';
const MAXENERGY_COLOR = '#c4a882';

export default function Charts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCharts()
      .then((d) => {
        if (active) {
          setData(d);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Section title="Data Visualisation">
        <div className="text-sm text-sage-500">Loading chart data…</div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Data Visualisation">
        <ErrorBox message={error} />
      </Section>
    );
  }

  return (
    <Section
      title="Data Visualisation"
      subtitle="Charts computed from the original seismic-bumps dataset."
    >
      <div className="space-y-6">
        <ChartCard title="Class Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.class_distribution}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe4" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#3d3d3d' }}
                axisLine={{ stroke: '#ccd8c8' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#3d3d3d' }}
                axisLine={{ stroke: '#ccd8c8' }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => {
                  if (name === 'count') return [value, 'Count'];
                  return [value, name];
                }}
              />
              <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
                {data.class_distribution.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.name === 'Hazardous' ? HAZARD_COLOR : SAFE_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-charcoal-700">
            {data.class_distribution.map((c) => (
              <span key={c.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{
                    background:
                      c.name === 'Hazardous' ? HAZARD_COLOR : SAFE_COLOR,
                  }}
                />
                {c.label}: {c.count.toLocaleString()} ({c.percentage}%)
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Seismic Energy Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.energy_distribution}
              margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe4" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11, fill: '#3d3d3d' }}
                axisLine={{ stroke: '#ccd8c8' }}
                label={{
                  value: 'Energy range (Joules, log scale)',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 11, fill: '#5f7a57' },
                }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#3d3d3d' }}
                axisLine={{ stroke: '#ccd8c8' }}
                label={{
                  value: 'Number of observations',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: '#5f7a57' },
                }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="energy"
                name="Total Energy"
                fill={ENERGY_COLOR}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="maxenergy"
                name="Max Energy"
                fill={MAXENERGY_COLOR}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hazard Distribution by Shift">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data.hazard_by_shift}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e6ebe4" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#3d3d3d' }}
                axisLine={{ stroke: '#ccd8c8' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#3d3d3d' }}
                axisLine={{ stroke: '#ccd8c8' }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="non_hazardous"
                name="Non-hazardous"
                stackId="a"
                fill={SAFE_COLOR}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="hazardous"
                name="Hazardous"
                stackId="a"
                fill={HAZARD_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </Section>
  );
}

const tooltipStyle = {
  backgroundColor: '#f5f3ec',
  border: '1px solid #ccd8c8',
  borderRadius: '6px',
  fontSize: 12,
  color: '#1e1e1e',
};

function ChartCard({ title, children }) {
  return (
    <div className="mw-card">
      <h3 className="text-sm font-semibold text-charcoal-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
