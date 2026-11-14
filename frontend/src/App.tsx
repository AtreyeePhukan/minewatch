/**
 * MineWatch — Mining Seismic Hazard Monitor
 *
 * Single-page research dashboard that fetches all data from the FastAPI
 * backend. No local mock data is used.
 */

import { useEffect, useState } from 'react';
import { getHealth } from './api';
import Header from './components/Header';
import DatasetOverview from './components/DatasetOverview';
import Charts from './components/Charts';
import Prediction from './components/Prediction';
import About from './components/About';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    const poll = () => {
      getHealth()
        .then((data) => {
          if (active) setHealth(data);
        })
        .catch(() => {
          if (active) setHealth(null);
        });
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-ivory-100">
      <Header health={health} />
      <main>
        <DatasetOverview />
        <Charts />
        <Prediction />
        <About />
      </main>
      <footer className="border-t border-border bg-ivory-100">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-charcoal-700">
          MineWatch — ML-Based Investigation of the Progression of Mining
          Accidents Through Seismic and Operational Patterns. Academic research
          prototype. Not a certified mine safety system.
        </div>
      </footer>
    </div>
  );
}

export default App;
