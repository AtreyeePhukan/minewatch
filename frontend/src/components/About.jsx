/**
 * About the research section.
 * Explains the two independent research modules and dataset provenance.
 */

import { Section } from './DatasetOverview';

export default function About() {
  return (
    <Section title="About the Research">
      <div className="space-y-4 text-sm text-charcoal-700 leading-relaxed">
        <p>
          This prototype supports two independent research modules within the
          MTech project titled <em>ML-Based Investigation of the Progression of
          Mining Accidents Through Seismic and Operational Patterns</em>.
        </p>
        <div className="border border-border-light bg-white rounded-lg p-4">
          <div className="font-semibold text-charcoal-900 mb-1">
            Module 1: Historical Indian Mining Accident Pattern Analysis
          </div>
          <p className="text-sm">
            Examines historical mining accident records from DGMS SANKET data to
            identify trends and patterns in accident progression across Indian
            mining operations.
          </p>
        </div>
        <div className="border border-border-light bg-white rounded-lg p-4">
          <div className="font-semibold text-charcoal-900 mb-1">
            Module 2: Next-Shift Hazardous Seismic Bump Prediction
          </div>
          <p className="text-sm">
            Uses the UCI Seismic Bumps dataset to train a logistic regression
            model that predicts whether a hazardous seismic bump will occur in
            the next shift.
          </p>
        </div>
        <p className="text-xs text-charcoal-700">
          The two datasets are separate and are not merged. The UCI Seismic
          Bumps dataset originates from a Polish coal mine. This model is an
          academic research prototype and is not a certified mine safety warning
          system.
        </p>
      </div>
    </Section>
  );
}
