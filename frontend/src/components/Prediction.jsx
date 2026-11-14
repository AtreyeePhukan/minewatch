/**
 * Hazard prediction section with two modes:
 *  1. Dataset Demo — select a validation observation and predict it.
 *  2. Manual Prediction — input all 18 features manually.
 */

import { useEffect, useState } from 'react';
import { getSamples, predictSample, predictManual } from '../api';
import { Section, ErrorBox } from './DatasetOverview';

const CATEGORICAL_OPTIONS = {
  seismic: ['a', 'b', 'c', 'd'],
  seismoacoustic: ['a', 'b', 'c', 'd'],
  shift: ['N', 'W'],
  hazard: ['a', 'b', 'c', 'd'],
};

const CATEGORICAL_FEATURES = ['seismic', 'seismoacoustic', 'shift', 'hazard'];

const NUMERICAL_FEATURES = [
  'genergy', 'gpuls', 'gdenergy', 'gdpuls',
  'nbumps', 'nbumps2', 'nbumps3', 'nbumps4',
  'nbumps5', 'nbumps6', 'nbumps7', 'nbumps89',
  'energy', 'maxenergy',
];

const FEATURE_LABELS = {
  seismic: 'Seismic',
  seismoacoustic: 'Seismoacoustic',
  shift: 'Shift',
  hazard: 'Hazard (ghazard)',
  genergy: 'Genergy',
  gpuls: 'Gpuls',
  gdenergy: 'Gdenergy',
  gdpuls: 'Gdpuls',
  nbumps: 'Nbumps',
  nbumps2: 'Nbumps2',
  nbumps3: 'Nbumps3',
  nbumps4: 'Nbumps4',
  nbumps5: 'Nbumps5',
  nbumps6: 'Nbumps6',
  nbumps7: 'Nbumps7',
  nbumps89: 'Nbumps89',
  energy: 'Energy',
  maxenergy: 'Max Energy',
};

const SHIFT_LABELS = { N: 'N — Preparation', W: 'W — Coal-getting' };

export default function Prediction() {
  const [mode, setMode] = useState('demo');

  return (
    <Section
      title="Hazard Prediction"
      subtitle="Compare a model prediction against the actual dataset label, or submit your own measurements."
    >
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode('demo')}
          className={mode === 'demo' ? 'mw-btn-primary' : 'mw-btn-secondary'}
        >
          Dataset Demo
        </button>
        <button
          onClick={() => setMode('manual')}
          className={mode === 'manual' ? 'mw-btn-primary' : 'mw-btn-secondary'}
        >
          Manual Prediction
        </button>
      </div>

      {mode === 'demo' ? <DatasetDemoMode /> : <ManualMode />}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Dataset Demo mode
// ---------------------------------------------------------------------------

function DatasetDemoMode() {
  const [samples, setSamples] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSamples()
      .then((data) => {
        if (active) {
          setSamples(data);
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

  const handlePredict = () => {
    if (selectedIdx === '') {
      setError('Please select a validation observation first.');
      return;
    }
    setPredicting(true);
    setError(null);
    setResult(null);
    predictSample(Number(selectedIdx))
      .then((data) => setResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setPredicting(false));
  };

  if (loading) {
    return <div className="text-sm text-sage-500">Loading validation samples…</div>;
  }

  if (error && !samples) {
    return <ErrorBox message={error} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="mw-label block mb-1.5">
            Validation Observation
          </label>
          <select
            className="mw-select"
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(e.target.value)}
          >
            <option value="">Select a sample…</option>
            {samples.samples.map((s) => (
              <option key={s.index} value={s.index}>
                #{s.index} — seismic: {s.seismic}, shift: {s.shift}, genergy: {s.genergy.toLocaleString()}, nbumps: {s.nbumps}, energy: {s.energy.toLocaleString()} {s.actual_class === 1 ? '(hazardous)' : '(non-hazardous)'}
              </option>
            ))}
          </select>
        </div>
        <button
          className="mw-btn-primary whitespace-nowrap"
          onClick={handlePredict}
          disabled={predicting || selectedIdx === ''}
        >
          {predicting ? 'Predicting…' : 'Predict'}
        </button>
      </div>

      {error && <div className="mt-4"><ErrorBox message={error} /></div>}

      {result && <PredictionResult result={result} showActual />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual prediction mode
// ---------------------------------------------------------------------------

function ManualMode() {
  const [values, setValues] = useState(() => {
    const init = {};
    CATEGORICAL_FEATURES.forEach((f) => {
      init[f] = CATEGORICAL_OPTIONS[f][0];
    });
    NUMERICAL_FEATURES.forEach((f) => {
      init[f] = '0';
    });
    return init;
  });
  const [result, setResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handlePredict = () => {
    setPredicting(true);
    setError(null);
    setResult(null);

    const payload = { ...values };
    // Validate numerical fields
    for (const f of NUMERICAL_FEATURES) {
      const num = Number(payload[f]);
      if (payload[f] === '' || isNaN(num)) {
        setError(`Please enter a valid number for ${FEATURE_LABELS[f]}.`);
        setPredicting(false);
        return;
      }
      payload[f] = num;
    }

    predictManual(payload)
      .then((data) => setResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setPredicting(false));
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORICAL_FEATURES.map((f) => (
          <div key={f}>
            <label className="mw-label block mb-1.5">{FEATURE_LABELS[f]}</label>
            <select
              className="mw-select"
              value={values[f]}
              onChange={(e) => handleChange(f, e.target.value)}
            >
              {CATEGORICAL_OPTIONS[f].map((opt) => (
                <option key={opt} value={opt}>
                  {f === 'shift' ? SHIFT_LABELS[opt] || opt : opt}
                </option>
              ))}
            </select>
          </div>
        ))}
        {NUMERICAL_FEATURES.map((f) => (
          <div key={f}>
            <label className="mw-label block mb-1.5">{FEATURE_LABELS[f]}</label>
            <input
              type="number"
              step="any"
              className="mw-input"
              value={values[f]}
              onChange={(e) => handleChange(f, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          className="mw-btn-primary"
          onClick={handlePredict}
          disabled={predicting}
        >
          {predicting ? 'Predicting…' : 'Predict Hazard'}
        </button>
      </div>

      {error && <div className="mt-4"><ErrorBox message={error} /></div>}

      {result && <PredictionResult result={result} showActual={false} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Prediction result display
// ---------------------------------------------------------------------------

function PredictionResult({ result, showActual }) {
  const isHazard = result.prediction === 1;
  const score = result.hazard_score;
  const threshold = result.threshold;
  const barPercent = Math.min(100, Math.max(0, score * 100));
  const thresholdPercent = Math.min(100, Math.max(0, threshold * 100));

  const barColor = isHazard ? '#9c5555' : '#5f7a57';
  const labelBg = isHazard ? 'bg-hazard-light/30 border-hazard-light' : 'bg-sage-100 border-sage-300';
  const labelText = isHazard ? 'text-hazard-dark' : 'text-sage-700';

  return (
    <div className="mt-5 border border-border-light bg-ivory-50 rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mw-label">Hazard Score</div>
          <div className={`text-3xl font-bold ${labelText}`}>
            {score.toFixed(4)}
          </div>
        </div>
        <div>
          <div className="mw-label">Decision Threshold</div>
          <div className="text-lg font-semibold text-charcoal-800">
            {threshold}
          </div>
        </div>
        <div className={`px-4 py-2 rounded-md border ${labelBg}`}>
          <div className="mw-label">Prediction</div>
          <div className={`text-lg font-bold ${labelText}`}>
            {result.prediction_label}
          </div>
        </div>
        {showActual && (
          <div className="px-4 py-2 rounded-md border border-border bg-white">
            <div className="mw-label">Actual Label</div>
            <div className="text-lg font-bold text-charcoal-900">
              {result.actual_label_text}
            </div>
          </div>
        )}
      </div>

      {showActual && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="mw-label">Result: </span>
          {result.correct ? (
            <span className="font-medium text-sage-600">
              Prediction matches the actual label
            </span>
          ) : (
            <span className="font-medium text-hazard-dark">
              Prediction does not match the actual label
            </span>
          )}
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-charcoal-700 mb-1">
          <span>0.0000</span>
          <span>1.0000</span>
        </div>
        <div className="relative h-7 bg-white border border-border rounded-md overflow-hidden">
          <div
            className="h-full rounded-md transition-all duration-300"
            style={{ width: `${barPercent}%`, backgroundColor: barColor }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-charcoal-800"
            style={{ left: `${thresholdPercent}%` }}
            title={`Threshold: ${threshold}`}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-sage-600">Non-hazardous zone</span>
          <span className="text-charcoal-700">
            Threshold marker at {threshold}
          </span>
          <span className="text-hazard-dark">Hazardous zone</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-charcoal-700 leading-relaxed">
        Scores equal to or above the decision threshold are classified as
        hazardous. The model score reflects the classifier's confidence based on
        seismic and operational features, not a calibrated real-world accident
        probability.
      </p>

      {showActual && result.features && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="mw-label mb-2">Observation Features</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(result.features).map(([key, val]) => (
              <div key={key} className="text-xs">
                <span className="text-sage-600">{FEATURE_LABELS[key] || key}: </span>
                <span className="text-charcoal-900 font-medium">
                  {typeof val === 'number' ? val.toLocaleString() : val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
