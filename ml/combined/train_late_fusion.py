from pathlib import Path
import json
import numpy as np
import pandas as pd


# ============================================================
# CONAN MODEL 3 — LATE FUSION
# ============================================================
#
# Model 1:
#   Clinical multinomial model
#   P_LOW
#   P_MODERATE
#   P_HIGH
#
# Model 2:
#   Imaging model
#   y_prob
#
# Model 3:
#   Transparent late fusion
#
# IMPORTANT:
# Clinical and imaging datasets are NOT patient-level paired.
#
# Therefore this script does NOT:
#   - match clinical rows to imaging rows
#   - create artificial patient pairs
#   - train a classifier on fake multimodal samples
#   - report multimodal accuracy/AUC/F1
#
# The actual production fusion occurs at inference time:
#
#   clinical questionnaire
#          ↓
#   clinical model probabilities
#          +
#   uploaded X-ray
#          ↓
#   imaging model probability
#          ↓
#   Model 3 late fusion
#
# ============================================================


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(
    r"D:\CONAN datasets\Conan-App"
)

COMBINED_DIR = (
    PROJECT_ROOT
    / "ml"
    / "combined"
)

CLINICAL_FILE = (
    PROJECT_ROOT
    / "ml"
    / "clinical"
    / "conan_clinical_oof_predictions.csv"
)

IMAGING_FILE = (
    PROJECT_ROOT
    / "ml"
    / "imaging"
    / "evaluation"
    / "imaging_predictions.csv"
)

PREDICTION_FILE = (
    COMBINED_DIR
    / "late_fusion_predictions.csv"
)

MODEL_FILE = (
    COMBINED_DIR
    / "late_fusion_model.json"
)

CONFIG_FILE = (
    COMBINED_DIR
    / "late_fusion_config.json"
)

METRICS_FILE = (
    COMBINED_DIR
    / "late_fusion_metrics.json"
)

COMBINED_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# OFFICIAL MODEL 3 CONFIGURATION
# ============================================================

CLINICAL_WEIGHT = 0.35
IMAGING_WEIGHT = 0.65

LOW_THRESHOLD = 0.05
HIGH_THRESHOLD = 0.65


# ============================================================
# DISPLAY
# ============================================================

print()
print("=" * 70)
print("CONAN MODEL 3 — LATE FUSION")
print("=" * 70)

print()
print("Clinical source:")
print(CLINICAL_FILE)

print()
print("Imaging source:")
print(IMAGING_FILE)

print()
print("Fusion:")
print("  Clinical : 35%")
print("  Imaging  : 65%")


# ============================================================
# CHECK FILES
# ============================================================

if not CLINICAL_FILE.exists():
    raise FileNotFoundError(
        f"Clinical prediction file not found:\n{CLINICAL_FILE}"
    )

if not IMAGING_FILE.exists():
    raise FileNotFoundError(
        f"Imaging prediction file not found:\n{IMAGING_FILE}"
    )


# ============================================================
# LOAD CLINICAL OOF
# ============================================================

clinical = pd.read_csv(
    CLINICAL_FILE
)

required_clinical = [
    "P_LOW",
    "P_MODERATE",
    "P_HIGH",
]

for column in required_clinical:

    if column not in clinical.columns:

        raise ValueError(
            f"Missing clinical column: {column}"
        )

    clinical[column] = pd.to_numeric(
        clinical[column],
        errors="coerce"
    )

    if clinical[column].isna().any():

        raise ValueError(
            f"Invalid clinical probability values: {column}"
        )

    if (
        (clinical[column] < 0).any()
        or
        (clinical[column] > 1).any()
    ):

        raise ValueError(
            f"Clinical probabilities must be between 0 and 1: {column}"
        )


# ============================================================
# LOAD IMAGING
# ============================================================

imaging = pd.read_csv(
    IMAGING_FILE
)

required_imaging = [
    "study_id",
    "y_prob",
]

for column in required_imaging:

    if column not in imaging.columns:

        raise ValueError(
            f"Missing imaging column: {column}"
        )

imaging["y_prob"] = pd.to_numeric(
    imaging["y_prob"],
    errors="coerce"
)

if imaging["y_prob"].isna().any():

    raise ValueError(
        "Invalid imaging y_prob values."
    )

if (
    (imaging["y_prob"] < 0).any()
    or
    (imaging["y_prob"] > 1).any()
):

    raise ValueError(
        "Imaging probabilities must be between 0 and 1."
    )


# ============================================================
# DATASET INFORMATION
# ============================================================

print()
print("=" * 70)
print("DATASET INFORMATION")
print("=" * 70)

print()
print("Clinical OOF rows :", len(clinical))
print("Imaging rows      :", len(imaging))

print()
print("IMPORTANT:")
print(
    "Clinical and imaging rows are NOT paired."
)

print(
    "No row matching or artificial pairing is performed."
)


# ============================================================
# CLINICAL REFERENCE DISTRIBUTION
# ============================================================
#
# This is ONLY descriptive.
#
# It is NOT used as the clinical probability for a real
# production user.
#
# Production uses the actual clinical model prediction.
#
# ============================================================

reference_clinical = {

    "low": float(
        clinical["P_LOW"].mean()
    ),

    "moderate": float(
        clinical["P_MODERATE"].mean()
    ),

    "high": float(
        clinical["P_HIGH"].mean()
    ),
}


reference_total = sum(
    reference_clinical.values()
)

if reference_total <= 0:

    raise ValueError(
        "Invalid clinical reference distribution."
    )

reference_clinical = {

    key:
        value / reference_total

    for key, value
    in reference_clinical.items()
}


print()
print("Clinical reference distribution:")

print(
    f"LOW      : {reference_clinical['low']:.6f}"
)

print(
    f"MODERATE : {reference_clinical['moderate']:.6f}"
)

print(
    f"HIGH     : {reference_clinical['high']:.6f}"
)


# ============================================================
# DESCRIPTIVE IMAGING OUTPUT
# ============================================================

def probability_to_risk(
    probability: float
) -> str:

    if probability < LOW_THRESHOLD:

        return "LOW"

    if probability <= HIGH_THRESHOLD:

        return "MODERATE"

    return "HIGH"


imaging_risk = [
    probability_to_risk(
        float(value)
    )
    for value
    in imaging["y_prob"]
]


risk_distribution = {

    risk:
        int(
            np.sum(
                np.array(imaging_risk)
                == risk
            )
        )

    for risk in [
        "LOW",
        "MODERATE",
        "HIGH",
    ]
}


# ============================================================
# SAVE IMAGING-ONLY REFERENCE FILE
# ============================================================
#
# This is NOT multimodal validation.
#
# It is simply a case-level reference table showing what
# Model 2 produces for the available imaging cases.
#
# ============================================================

reference_output = pd.DataFrame({

    "study_id":
        imaging["study_id"].astype(str),

    "imaging_probability":
        imaging["y_prob"],

    "imaging_risk":
        imaging_risk,

})

reference_output.to_csv(
    PREDICTION_FILE,
    index=False
)


# ============================================================
# SAVE MODEL CONFIGURATION
# ============================================================

model_information = {

    "model":
        "CONAN Model 3 Late Fusion",

    "model_type":
        "transparent_probability_fusion",

    "clinical_weight":
        CLINICAL_WEIGHT,

    "imaging_weight":
        IMAGING_WEIGHT,

    "risk_thresholds": {

        "LOW":
            "< 0.05",

        "MODERATE":
            "0.05 <= probability <= 0.65",

        "HIGH":
            "> 0.65",
    },

    "clinical_input":
        [
            "P_LOW",
            "P_MODERATE",
            "P_HIGH",
        ],

    "imaging_input":
        "imaging_probability",

    "clinical_imaging_pairing":
        False,

    "production_fusion":
        (
            "Actual clinical model probabilities are combined "
            "with the actual uploaded X-ray model probability "
            "at inference time."
        ),

    "training":
        False,

    "validation":
        False,

    "note":
        (
            "The clinical and imaging datasets are independent "
            "and are not patient-level paired. The OOF clinical "
            "predictions and imaging predictions are therefore "
            "not used to construct artificial multimodal pairs."
        ),
}


with MODEL_FILE.open(
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        model_information,
        file,
        indent=4
    )


# ============================================================
# SAVE CONFIG
# ============================================================

config = {

    "clinical_weight":
        CLINICAL_WEIGHT,

    "imaging_weight":
        IMAGING_WEIGHT,

    "low_threshold":
        LOW_THRESHOLD,

    "high_threshold":
        HIGH_THRESHOLD,

    "clinical_class_order": [
        "LOW",
        "MODERATE",
        "HIGH",
    ],

    "pairing_required":
        False,

    "production_input": {

        "clinical":
            [
                "P_LOW",
                "P_MODERATE",
                "P_HIGH",
            ],

        "imaging":
            "imaging_probability",
    },

    "production_output": [
        "LOW",
        "MODERATE",
        "HIGH",
    ],
}


with CONFIG_FILE.open(
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        config,
        file,
        indent=4
    )


# ============================================================
# DESCRIPTIVE METRICS
# ============================================================

metrics = {

    "evaluation_type":
        "descriptive_only",

    "patient_level_validation":
        False,

    "clinical_sample_count":
        int(len(clinical)),

    "imaging_sample_count":
        int(len(imaging)),

    "clinical_reference_distribution":
        reference_clinical,

    "imaging_probability_mean":
        float(
            imaging["y_prob"].mean()
        ),

    "imaging_probability_median":
        float(
            imaging["y_prob"].median()
        ),

    "imaging_risk_distribution":
        risk_distribution,

    "clinical_weight":
        CLINICAL_WEIGHT,

    "imaging_weight":
        IMAGING_WEIGHT,

    "note":
        (
            "No multimodal accuracy, sensitivity, specificity, "
            "precision, recall, ROC-AUC, or F1-score is reported "
            "because the clinical and imaging datasets are not "
            "patient-level paired."
        ),
}


with METRICS_FILE.open(
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        metrics,
        file,
        indent=4
    )


# ============================================================
# RESULTS
# ============================================================

print()
print("=" * 70)
print("MODEL 3 CONFIGURATION COMPLETE")
print("=" * 70)

print()
print("Clinical weight :", f"{CLINICAL_WEIGHT:.2f}")
print("Imaging weight  :", f"{IMAGING_WEIGHT:.2f}")

print()
print("Clinical rows :", len(clinical))
print("Imaging rows  :", len(imaging))

print()
print("No patient-level pairing performed.")
print("No artificial multimodal training performed.")
print("No multimodal validation metrics reported.")

print()
print("Prediction/reference file:")
print(PREDICTION_FILE)

print()
print("Model:")
print(MODEL_FILE)

print()
print("Config:")
print(CONFIG_FILE)

print()
print("Metrics:")
print(METRICS_FILE)

print()
print("=" * 70)
print("MODEL 3 READY")
print("=" * 70)