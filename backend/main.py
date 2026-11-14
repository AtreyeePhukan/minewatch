from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "seismic-bumps.csv"
MODEL_PATH = BASE_DIR / "models" / "final_logistic_model.pkl"

TARGET_COLUMN = "class"

CATEGORICAL_FEATURES = ["seismic", "seismoacoustic", "shift", "hazard"]

NUMERICAL_FEATURES = [
    "genergy", "gpuls", "gdenergy", "gdpuls",
    "nbumps", "nbumps2", "nbumps3", "nbumps4",
    "nbumps5", "nbumps6", "nbumps7", "nbumps89",
    "energy", "maxenergy",
]

FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

DEFAULT_THRESHOLD = 0.6599896314739998
MODEL_NAME = "Random Oversampling Logistic Regression"

CATEGORICAL_OPTIONS = {
    "seismic": ["a", "b", "c", "d"],
    "seismoacoustic": ["a", "b", "c", "d"],
    "shift": ["N", "W"],
    "hazard": ["a", "b", "c", "d"],
}

app = FastAPI(
    title="MineWatch API",
    description="Mining seismic hazard prediction backend for the MineWatch research prototype.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AppState:
    """Mutable container for resources loaded at startup."""

    df: pd.DataFrame | None = None
    model: Any = None
    threshold: float = DEFAULT_THRESHOLD
    model_name: str = MODEL_NAME
    X_val: pd.DataFrame | None = None
    y_val: pd.Series | None = None
    val_indices: list[int] | None = None
    dataset_loaded: bool = False
    model_loaded: bool = False
    load_error: str | None = None


state = AppState()

@app.on_event("startup")
def load_resources() -> None:
    """Load the CSV dataset, the saved model bundle, and recreate the split."""
    # 1. Dataset -------------------------------------------------------------
    if not DATA_PATH.exists():
        state.load_error = f"Dataset file not found at {DATA_PATH}. Place seismic-bumps.csv in backend/data/."
        return
    try:
        df = pd.read_csv(DATA_PATH)
        # Normalise the class column to integer
        df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)
        state.df = df
        state.dataset_loaded = True
    except Exception as exc:  # pragma: no cover - defensive
        state.load_error = f"Failed to read dataset: {exc}"
        return

    # 2. Model bundle --------------------------------------------------------
    if not MODEL_PATH.exists():
        # Dataset loaded but model missing — record the error but keep going
        # so summary/chart endpoints still work.
        state.load_error = (
            f"Model file not found at {MODEL_PATH}. "
            "Place final_logistic_model.pkl in backend/models/."
        )
        return
    try:
        bundle = joblib.load(MODEL_PATH)
        # The bundle may be a dict, a tuple, or a bare estimator. Handle each.
        if isinstance(bundle, dict):
            state.model = bundle.get("model") or bundle.get("estimator") or bundle.get("pipeline")
            thr = bundle.get("threshold") or bundle.get("decision_threshold")
            state.threshold = float(thr) if thr is not None else DEFAULT_THRESHOLD
            name = bundle.get("model_name") or bundle.get("name")
            if name:
                state.model_name = str(name)
        elif isinstance(bundle, (list, tuple)):
            state.model = bundle[0]
            if len(bundle) > 1 and bundle[1] is not None:
                state.threshold = float(bundle[1])
        else:
            state.model = bundle
        state.model_loaded = True
    except Exception as exc:  # pragma: no cover - defensive
        state.load_error = f"Failed to load model: {exc}"
        return

    # 3. Recreate the original stratified split ------------------------------
    try:
        _recreate_split()
    except Exception as exc:  # pragma: no cover - defensive
        state.load_error = f"Failed to recreate data split: {exc}"


def _recreate_split() -> None:
    """Reproduce the two-stage stratified split used to train the model."""
    from sklearn.model_selection import train_test_split

    df = state.df
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()

    # First split: 70% train, 30% temp (validation + testing)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=42
    )
    # Second split: temp split 50/50 into validation and testing
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
    )

    state.X_val = X_val.reset_index(drop=True)
    state.y_val = y_val.reset_index(drop=True)
    state.val_indices = list(range(len(X_val)))


def _require_resources(*, need_model: bool = False) -> None:
    """Raise a 503 if the required resources are not loaded."""
    if not state.dataset_loaded:
        raise HTTPException(
            status_code=503,
            detail=state.load_error or "Dataset not loaded.",
        )
    if need_model and not state.model_loaded:
        raise HTTPException(
            status_code=503,
            detail=state.load_error or "Model not loaded.",
        )


def _predict_proba_one(features_df: pd.DataFrame) -> float:
    """Return P(class=1) for a single observation using the saved model."""
    model = state.model
    proba = model.predict_proba(features_df)
    # predict_proba columns are ordered by model.classes_
    classes = list(getattr(model, "classes_", [0, 1]))
    try:
        col_idx = classes.index(1)
    except ValueError:
        col_idx = 1
    return float(proba[0][col_idx])


def _apply_threshold(score: float) -> int:
    return 1 if score >= state.threshold else 0


def _label_text(value: int) -> str:
    return "HAZARDOUS" if value == 1 else "NON-HAZARDOUS"


def _features_to_dict(row: pd.Series) -> dict[str, Any]:
    """Serialise a single feature row, coercing numpy types to native Python."""
    out: dict[str, Any] = {}
    for col in FEATURE_COLUMNS:
        val = row[col]
        if pd.isna(val):
            out[col] = None
        elif col in CATEGORICAL_FEATURES:
            out[col] = str(val)
        else:
            out[col] = float(val)
    return out


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class SampleRequest(BaseModel):
    sample_index: int = Field(..., ge=0)


class ManualRequest(BaseModel):
    seismic: str
    seismoacoustic: str
    shift: str
    hazard: str
    genergy: float
    gpuls: float
    gdenergy: float
    gdpuls: float
    nbumps: float
    nbumps2: float
    nbumps3: float
    nbumps4: float
    nbumps5: float
    nbumps6: float
    nbumps7: float
    nbumps89: float
    energy: float
    maxenergy: float


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "online",
            "dataset_loaded": state.dataset_loaded,
            "model_loaded": state.model_loaded,
            "model_name": state.model_name if state.model_loaded else None,
            "threshold": state.threshold if state.model_loaded else None,
            "validation_samples": len(state.val_indices) if state.val_indices is not None else 0,
            "error": state.load_error,
        }
    )


@app.get("/api/summary")
def summary() -> JSONResponse:
    _require_resources()
    df = state.df
    total = len(df)
    hazardous = int((df[TARGET_COLUMN] == 1).sum())
    non_hazardous = int((df[TARGET_COLUMN] == 0).sum())
    pct = round(hazardous / total * 100, 2) if total else 0.0
    return JSONResponse(
        {
            "total_observations": total,
            "hazardous": hazardous,
            "non_hazardous": non_hazardous,
            "hazardous_percentage": pct,
            "model_name": state.model_name,
            "threshold": state.threshold,
        }
    )


@app.get("/api/charts")
def charts() -> JSONResponse:
    _require_resources()
    df = state.df

    # 1. Class distribution --------------------------------------------------
    total = len(df)
    hazardous = int((df[TARGET_COLUMN] == 1).sum())
    non_hazardous = int((df[TARGET_COLUMN] == 0).sum())
    class_distribution = [
        {
            "name": "Non-hazardous",
            "label": "Non-hazardous",
            "count": non_hazardous,
            "percentage": round(non_hazardous / total * 100, 2),
        },
        {
            "name": "Hazardous",
            "label": "Hazardous",
            "count": hazardous,
            "percentage": round(hazardous / total * 100, 2),
        },
    ]

    # 2. Seismic energy distribution -----------------------------------------
    # Build a histogram of total energy (log10 scale, since values span many
    # orders of magnitude) plus maxenergy, using fixed bins.
    energy = df["energy"].astype(float)
    maxenergy = df["maxenergy"].astype(float)

    # Use log10 bins; add 1 to avoid log(0). Bins 0..6 cover 10^0..10^6+.
    bins = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8])
    bin_labels = [
        "0", "1-10", "10-100", "100-1k", "1k-10k", "10k-100k", "100k-1M", "1M+",
    ]

    def _hist(series: pd.Series) -> list[int]:
        log_vals = np.log10(series.replace(0, 0.5))
        counts, _ = np.histogram(log_vals, bins=bins)
        return [int(c) for c in counts]

    energy_distribution = [
        {
            "range": bin_labels[i],
            "energy": _hist(energy)[i],
            "maxenergy": _hist(maxenergy)[i],
        }
        for i in range(len(bin_labels))
    ]

    # 3. Hazard distribution by shift ----------------------------------------
    shift_order = ["N", "W"]
    shift_labels = {"N": "Preparation (N)", "W": "Coal-getting (W)"}
    hazard_by_shift = []
    for sh in shift_order:
        subset = df[df["shift"] == sh]
        h = int((subset[TARGET_COLUMN] == 1).sum())
        nh = int((subset[TARGET_COLUMN] == 0).sum())
        hazard_by_shift.append(
            {
                "shift": sh,
                "label": shift_labels.get(sh, sh),
                "hazardous": h,
                "non_hazardous": nh,
            }
        )

    return JSONResponse(
        {
            "class_distribution": class_distribution,
            "energy_distribution": energy_distribution,
            "hazard_by_shift": hazard_by_shift,
        }
    )


@app.get("/api/samples")
def samples() -> JSONResponse:
    _require_resources(need_model=True)
    X_val = state.X_val
    y_val = state.y_val

    sample_list = []
    for i in range(len(X_val)):
        row = X_val.iloc[i]
        sample_list.append(
            {
                "index": i,
                "seismic": str(row["seismic"]),
                "seismoacoustic": str(row["seismoacoustic"]),
                "shift": str(row["shift"]),
                "genergy": float(row["genergy"]),
                "nbumps": float(row["nbumps"]),
                "energy": float(row["energy"]),
                "actual_class": int(y_val.iloc[i]),
            }
        )

    return JSONResponse(
        {
            "count": len(sample_list),
            "features": FEATURE_COLUMNS,
            "categorical_options": CATEGORICAL_OPTIONS,
            "samples": sample_list,
        }
    )


@app.post("/api/predict/sample")
def predict_sample(req: SampleRequest) -> JSONResponse:
    _require_resources(need_model=True)
    idx = req.sample_index
    if idx < 0 or idx >= len(state.X_val):
        raise HTTPException(
            status_code=400,
            detail=f"sample_index {idx} is out of range (0..{len(state.X_val) - 1}).",
        )

    row = state.X_val.iloc[idx]
    features_df = pd.DataFrame([row.values], columns=FEATURE_COLUMNS)

    score = _predict_proba_one(features_df)
    prediction = _apply_threshold(score)
    actual = int(state.y_val.iloc[idx])

    return JSONResponse(
        {
            "sample_index": idx,
            "hazard_score": round(score, 4),
            "threshold": state.threshold,
            "prediction": prediction,
            "prediction_label": _label_text(prediction),
            "actual_label": actual,
            "actual_label_text": _label_text(actual),
            "correct": prediction == actual,
            "features": _features_to_dict(row),
        }
    )


@app.post("/api/predict/manual")
def predict_manual(req: ManualRequest) -> JSONResponse:
    _require_resources(need_model=True)

    # Validate categorical values
    for col, options in CATEGORICAL_OPTIONS.items():
        val = getattr(req, col)
        if val not in options:
            raise HTTPException(
                status_code=422,
                detail=f"{col} must be one of {options}, got '{val}'.",
            )

    features = {col: getattr(req, col) for col in FEATURE_COLUMNS}
    features_df = pd.DataFrame([features], columns=FEATURE_COLUMNS)

    score = _predict_proba_one(features_df)
    prediction = _apply_threshold(score)

    return JSONResponse(
        {
            "hazard_score": round(score, 4),
            "threshold": state.threshold,
            "prediction": prediction,
            "prediction_label": _label_text(prediction),
        }
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("MINEWATCH_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
