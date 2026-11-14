/**
 * Dataset overview section.
 * Displays summary statistics fetched from GET /api/summary.
 */

import { useEffect, useState } from 'react';
import { getSummary } from '../api';

export default function DatasetOverview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSummary()
      .then((data) => {
        if (active) {
          setSummary(data);
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
      <Section title="Dataset Overview">
        <div className="text-sm text-sage-500">Loading dataset statistics…</div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Dataset Overview">
        <ErrorBox message={error} />
      </Section>
    );
  }

  const stats = [
    {
      label: 'Total Observations',
      value: summary.total_observations.toLocaleString(),
    },
    {
      label: 'Hazardous Observations',
      value: summary.hazardous.toLocaleString(),
      accent: 'hazard',
    },
    {
      label: 'Non-Hazardous Observations',
      value: summary.non_hazardous.toLocaleString(),
      accent: 'safe',
    },
    {
      label: 'Hazardous Class Percentage',
      value: `${summary.hazardous_percentage}%`,
      accent: 'hazard',
    },
  ];

  return (
    <Section
      title="Dataset Overview"
      subtitle="UCI Seismic Bumps dataset — statistics computed from the original CSV."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border-light bg-ivory-50 rounded-lg p-4"
          >
            <div className="mw-label">{stat.label}</div>
            <div
              className={`mt-1.5 text-2xl font-bold ${
                stat.accent === 'hazard'
                  ? 'text-hazard-dark'
                  : stat.accent === 'safe'
                    ? 'text-sage-600'
                    : 'text-charcoal-900'
              }`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-charcoal-700">
        <span>
          <span className="mw-label">Model: </span>
          {summary.model_name}
        </span>
        <span>
          <span className="mw-label">Decision Threshold: </span>
          {summary.threshold}
        </span>
      </div>
    </Section>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="border-b border-border-light">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="text-lg font-semibold text-charcoal-900">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-charcoal-700">{subtitle}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="border border-hazard-light bg-hazard-light/20 rounded-lg p-4 text-sm text-hazard-dark">
      {message}
    </div>
  );
}

export { Section, ErrorBox };
