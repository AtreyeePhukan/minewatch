/**
 * Header section for MineWatch.
 * Shows the project title, subtitle and research prototype label.
 */

export default function Header({ health }) {
  const connected = health?.dataset_loaded && health?.model_loaded;
  const datasetOnly = health?.dataset_loaded && !health?.model_loaded;
  const offline = !health;

  let statusText = 'Connecting…';
  let statusColor = 'text-sage-500 bg-sage-50 border-sage-200';

  if (connected) {
    statusText = 'Backend connected';
    statusColor = 'text-sage-700 bg-sage-100 border-sage-300';
  } else if (datasetOnly) {
    statusText = 'Dataset loaded, model missing';
    statusColor = 'text-hazard-dark bg-hazard-light/40 border-hazard-light';
  } else if (offline || health?.error) {
    statusText = 'Backend offline';
    statusColor = 'text-hazard-dark bg-hazard-light/40 border-hazard-light';
  }

  return (
    <header className="border-b border-border bg-ivory-100">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">
                MineWatch
              </h1>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-sage-300 bg-sage-50 text-sage-700">
                Research Prototype
              </span>
            </div>
            <p className="mt-1 text-base font-medium text-sage-600">
              Mining Seismic Hazard Monitor
            </p>
          </div>
          <div
            className={`text-xs font-medium px-3 py-1.5 rounded-md border ${statusColor}`}
          >
            {statusText}
          </div>
        </div>
        <p className="mt-3 text-sm text-charcoal-700 max-w-2xl leading-relaxed">
          Investigation of seismic and operational patterns associated with
          mining hazards.
        </p>
      </div>
    </header>
  );
}
