from pathlib import Path
import json

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt


# ============================================================
# CONAN IMAGING MODEL
# RESEARCH-PAPER PERFORMANCE FIGURES
# ============================================================

PROJECT_ROOT = Path(
    r"D:\CONAN datasets\Conan-App"
)

EVALUATION_DIR = (
    PROJECT_ROOT
    / "ml"
    / "imaging"
    / "evaluation"
)

PREDICTION_FILE = (
    EVALUATION_DIR
    / "imaging_predictions.csv"
)

METRICS_FILE = (
    EVALUATION_DIR
    / "imaging_metrics.json"
)

FIGURE_DIR = (
    EVALUATION_DIR
    / "research_figures"
)

FIGURE_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# LOAD EXISTING METRICS
# ============================================================

if not METRICS_FILE.exists():

    raise FileNotFoundError(
        "Metrics file not found:\n"
        + str(METRICS_FILE)
        + "\n\n"
        "Run the imaging evaluation first."
    )


with METRICS_FILE.open(
    "r",
    encoding="utf-8"
) as file:

    metrics = json.load(file)


sensitivity = float(
    metrics["sensitivity"]
)

specificity = float(
    metrics["specificity"]
)

precision = float(
    metrics["precision"]
)

f1_score = float(
    metrics["f1_score"]
)

roc_auc = float(
    metrics["roc_auc"]
)

brier_score = float(
    metrics["brier_score"]
)


# ============================================================
# GRAPH 1
# PERFORMANCE METRICS BAR CHART
# ============================================================

metric_names = [
    "Sensitivity",
    "Specificity",
    "Precision",
    "F1-Score"
]

metric_values = [
    sensitivity,
    specificity,
    precision,
    f1_score
]


plt.figure(
    figsize=(9, 6)
)


bars = plt.bar(
    metric_names,
    metric_values
)


plt.ylabel(
    "Score"
)

plt.xlabel(
    "Performance Metric"
)

plt.title(
    "Performance of the CONAN Imaging Model"
)

plt.ylim(
    0,
    1.10
)


plt.grid(
    axis="y",
    alpha=0.25
)


for bar, value in zip(
    bars,
    metric_values
):

    plt.text(
        bar.get_x()
        +
        bar.get_width()
        /
        2,
        value + 0.025,
        f"{value:.3f}",
        ha="center",
        va="bottom",
        fontsize=11
    )


plt.tight_layout()


performance_file = (
    FIGURE_DIR
    /
    "Figure_1_Imaging_Performance_Metrics.png"
)


plt.savefig(
    performance_file,
    dpi=600,
    bbox_inches="tight"
)


plt.close()


# ============================================================
# GRAPH 2
# ROC CURVE
# ============================================================

if not PREDICTION_FILE.exists():

    raise FileNotFoundError(
        "Prediction file not found:\n"
        + str(PREDICTION_FILE)
    )


import pandas as pd
import numpy as np


predictions = pd.read_csv(
    PREDICTION_FILE
)


if (
    "binary_target"
    not in predictions.columns
):

    raise ValueError(
        "binary_target column is missing "
        "from imaging_predictions.csv"
    )


if (
    "y_prob"
    not in predictions.columns
):

    raise ValueError(
        "y_prob column is missing "
        "from imaging_predictions.csv"
    )


y_true = (
    predictions[
        "binary_target"
    ]
    .astype(int)
    .to_numpy()
)


y_prob = (
    predictions[
        "y_prob"
    ]
    .astype(float)
    .to_numpy()
)


# ------------------------------------------------------------
# Calculate ROC points
# ------------------------------------------------------------

threshold_values = np.linspace(
    0,
    1,
    501
)


false_positive_rates = []

true_positive_rates = []


for threshold in threshold_values:

    predicted = (
        y_prob >=
        threshold
    ).astype(int)


    tp = np.sum(
        (
            y_true == 1
        )
        &
        (
            predicted == 1
        )
    )


    fn = np.sum(
        (
            y_true == 1
        )
        &
        (
            predicted == 0
        )
    )


    tn = np.sum(
        (
            y_true == 0
        )
        &
        (
            predicted == 0
        )
    )


    fp = np.sum(
        (
            y_true == 0
        )
        &
        (
            predicted == 1
        )
    )


    sensitivity_value = (
        tp /
        (tp + fn)
        if (tp + fn) > 0
        else 0.0
    )


    false_positive_value = (
        fp /
        (fp + tn)
        if (fp + tn) > 0
        else 0.0
    )


    true_positive_rates.append(
        sensitivity_value
    )


    false_positive_rates.append(
        false_positive_value
    )


# ------------------------------------------------------------
# ROC graph
# ------------------------------------------------------------

plt.figure(
    figsize=(8, 7)
)


plt.plot(
    false_positive_rates,
    true_positive_rates,
    linewidth=2.5,
    label=(
        f"CONAN Imaging Model "
        f"(AUC = {roc_auc:.3f})"
    )
)


plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1.5,
    label="Chance"
)


plt.xlabel(
    "False Positive Rate"
)

plt.ylabel(
    "True Positive Rate"
)

plt.title(
    "Receiver Operating Characteristic Curve"
)


plt.xlim(
    0,
    1
)

plt.ylim(
    0,
    1.05
)


plt.grid(
    alpha=0.25
)


plt.legend(
    loc="lower right"
)


plt.tight_layout()


roc_file = (
    FIGURE_DIR
    /
    "Figure_2_Imaging_ROC_Curve.png"
)


plt.savefig(
    roc_file,
    dpi=600,
    bbox_inches="tight"
)


plt.close()


# ============================================================
# GRAPH 3
# CALIBRATION PLOT
# ============================================================

number_of_bins = 5


bin_edges = np.linspace(
    0,
    1,
    number_of_bins + 1
)


mean_predicted = []

observed_fraction = []


for i in range(
    number_of_bins
):

    lower = (
        bin_edges[i]
    )

    upper = (
        bin_edges[i + 1]
    )


    if (
        i ==
        number_of_bins - 1
    ):

        mask = (
            (y_prob >= lower)
            &
            (y_prob <= upper)
        )

    else:

        mask = (
            (y_prob >= lower)
            &
            (y_prob < upper)
        )


    if np.sum(mask) == 0:

        continue


    mean_probability = np.mean(
        y_prob[mask]
    )


    observed = np.mean(
        y_true[mask]
    )


    mean_predicted.append(
        mean_probability
    )


    observed_fraction.append(
        observed
    )


# ------------------------------------------------------------
# Calibration graph
# ------------------------------------------------------------

plt.figure(
    figsize=(8, 7)
)


plt.plot(
    mean_predicted,
    observed_fraction,
    marker="o",
    linewidth=2.5,
    label="CONAN Imaging Model"
)


plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1.5,
    label="Perfect Calibration"
)


plt.xlabel(
    "Mean Predicted Probability"
)


plt.ylabel(
    "Observed Positive Fraction"
)


plt.title(
    "Calibration Performance of the CONAN Imaging Model"
)


plt.xlim(
    0,
    1
)

plt.ylim(
    0,
    1
)


plt.grid(
    alpha=0.25
)


plt.text(
    0.05,
    0.93,
    f"Brier Score = {brier_score:.3f}",
    transform=plt.gca().transAxes,
    fontsize=11
)


plt.legend(
    loc="best"
)


plt.tight_layout()


calibration_file = (
    FIGURE_DIR
    /
    "Figure_3_Imaging_Calibration.png"
)


plt.savefig(
    calibration_file,
    dpi=600,
    bbox_inches="tight"
)


plt.close()


# ============================================================
# PRINT RESULTS
# ============================================================

print()
print("=" * 70)
print("RESEARCH-PAPER FIGURES CREATED")
print("=" * 70)

print()

print(
    "Figure 1:",
    performance_file
)

print(
    "Figure 2:",
    roc_file
)

print(
    "Figure 3:",
    calibration_file
)

print()

print(
    "Metrics used:"
)

print(
    f"Sensitivity = {sensitivity:.4f}"
)

print(
    f"Specificity = {specificity:.4f}"
)

print(
    f"Precision   = {precision:.4f}"
)

print(
    f"F1-Score    = {f1_score:.4f}"
)

print(
    f"ROC-AUC     = {roc_auc:.4f}"
)

print(
    f"Brier Score = {brier_score:.4f}"
)

print()

print(
    "All figures saved at 600 DPI."
)

print()