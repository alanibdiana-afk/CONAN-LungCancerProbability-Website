from pathlib import Path
import json

import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt

from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    f1_score,
    roc_auc_score,
    roc_curve,
)


# ============================================================
# CONAN IMAGING MODEL
# RESEARCH-PAPER EVALUATION FIGURES
# ============================================================
#
# Risk categories:
#
# LOW       < 5%
# MODERATE  5% - 65%
# HIGH      > 65%
#
# Class labels in the JSRT-derived dataset:
#
# 0 = LOW
# 1 = MODERATE
# 2 = HIGH
#
# The deployed model outputs a single sigmoid lung-cancer
# probability. That score is converted into the three CONAN
# risk categories using the thresholds above.
#
# ============================================================


# ============================================================
# PATHS
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
# CHECK FILES
# ============================================================

if not PREDICTION_FILE.exists():

    raise FileNotFoundError(
        "Prediction file not found:\n"
        + str(PREDICTION_FILE)
        + "\n\n"
        "Run evaluate_imaging.py first."
    )


if not METRICS_FILE.exists():

    raise FileNotFoundError(
        "Metrics file not found:\n"
        + str(METRICS_FILE)
        + "\n\n"
        "Run evaluate_imaging.py first."
    )


# ============================================================
# LOAD DATA
# ============================================================

predictions = pd.read_csv(
    PREDICTION_FILE
)


with METRICS_FILE.open(
    "r",
    encoding="utf-8"
) as file:

    overall_metrics = json.load(
        file
    )


# ============================================================
# REQUIRED COLUMNS
# ============================================================

required_columns = [
    "risk_label",
    "binary_target",
    "y_prob"
]


for column in required_columns:

    if column not in predictions.columns:

        raise ValueError(
            "Missing required column: "
            + column
        )


# ============================================================
# CLEAN DATA
# ============================================================

predictions = (
    predictions
    .dropna(
        subset=[
            "risk_label",
            "binary_target",
            "y_prob"
        ]
    )
    .copy()
)


predictions["risk_label"] = (
    predictions[
        "risk_label"
    ]
    .astype(int)
)


predictions["binary_target"] = (
    predictions[
        "binary_target"
    ]
    .astype(int)
)


predictions["y_prob"] = (
    predictions[
        "y_prob"
    ]
    .astype(float)
)


# ============================================================
# CONAN RISK THRESHOLDS
# ============================================================

LOW_THRESHOLD = 0.05

HIGH_THRESHOLD = 0.65


# ============================================================
# RISK CLASS NAMES
# ============================================================

RISK_NAMES = [
    "LOW",
    "MODERATE",
    "HIGH"
]


RISK_LABELS = [
    0,
    1,
    2
]


# ============================================================
# CONVERT SIGMOID SCORE INTO RISK CATEGORY
# ============================================================

def score_to_risk_class(
    score
):

    if score < LOW_THRESHOLD:

        return 0

    elif score <= HIGH_THRESHOLD:

        return 1

    else:

        return 2


predictions[
    "predicted_risk_label"
] = (
    predictions[
        "y_prob"
    ]
    .apply(
        score_to_risk_class
    )
    .astype(int)
)


# ============================================================
# ARRAYS
# ============================================================

true_risk = (
    predictions[
        "risk_label"
    ]
    .to_numpy()
)


predicted_risk = (
    predictions[
        "predicted_risk_label"
    ]
    .to_numpy()
)


y_true_binary = (
    predictions[
        "binary_target"
    ]
    .to_numpy()
)


y_prob = (
    predictions[
        "y_prob"
    ]
    .to_numpy()
)


# ============================================================
# VALIDATION
# ============================================================

if len(
    predictions
) == 0:

    raise ValueError(
        "No valid prediction rows were found."
    )


if not set(
    true_risk
).issubset(
    set(RISK_LABELS)
):

    raise ValueError(
        "risk_label must contain only 0, 1, and 2."
    )


if not set(
    predicted_risk
).issubset(
    set(RISK_LABELS)
):

    raise ValueError(
        "Predicted risk labels must contain only 0, 1, and 2."
    )


# ============================================================
# FIGURE SETTINGS
# ============================================================

DPI = 600

WIDTH = 8

HEIGHT = 6

TITLE_SIZE = 15

LABEL_SIZE = 12

TICK_SIZE = 11


# ============================================================
# HELPER
# ============================================================

def save_figure(
    filename
):

    path = (
        FIGURE_DIR
        / filename
    )


    plt.savefig(
        path,
        dpi=DPI,
        bbox_inches="tight"
    )


    plt.close()


    print(
        "Created:",
        path
    )


# ============================================================
# FUNCTION:
# ONE-VS-REST METRICS FOR EACH RISK CLASS
# ============================================================

def calculate_class_metrics():

    sensitivity_values = []

    specificity_values = []

    precision_values = []

    f1_values = []


    for class_label in RISK_LABELS:

        true_positive = np.sum(
            (
                true_risk ==
                class_label
            )
            &
            (
                predicted_risk ==
                class_label
            )
        )


        false_negative = np.sum(
            (
                true_risk ==
                class_label
            )
            &
            (
                predicted_risk !=
                class_label
            )
        )


        false_positive = np.sum(
            (
                true_risk !=
                class_label
            )
            &
            (
                predicted_risk ==
                class_label
            )
        )


        true_negative = np.sum(
            (
                true_risk !=
                class_label
            )
            &
            (
                predicted_risk !=
                class_label
            )
        )


        # -----------------------------------------------
        # Sensitivity / recall
        # -----------------------------------------------

        if (
            true_positive
            +
            false_negative
        ) > 0:

            sensitivity = (
                true_positive
                /
                (
                    true_positive
                    +
                    false_negative
                )
            )

        else:

            sensitivity = 0.0


        # -----------------------------------------------
        # Specificity
        # -----------------------------------------------

        if (
            true_negative
            +
            false_positive
        ) > 0:

            specificity = (
                true_negative
                /
                (
                    true_negative
                    +
                    false_positive
                )
            )

        else:

            specificity = 0.0


        # -----------------------------------------------
        # Precision
        # -----------------------------------------------

        if (
            true_positive
            +
            false_positive
        ) > 0:

            precision = (
                true_positive
                /
                (
                    true_positive
                    +
                    false_positive
                )
            )

        else:

            precision = 0.0


        # -----------------------------------------------
        # F1
        # -----------------------------------------------

        denominator = (
            precision
            +
            sensitivity
        )


        if denominator > 0:

            f1 = (
                2
                *
                precision
                *
                sensitivity
                /
                denominator
            )

        else:

            f1 = 0.0


        sensitivity_values.append(
            sensitivity
        )

        specificity_values.append(
            specificity
        )

        precision_values.append(
            precision
        )

        f1_values.append(
            f1
        )


    return (
        sensitivity_values,
        specificity_values,
        precision_values,
        f1_values
    )


# ============================================================
# CALCULATE PER-CLASS METRICS
# ============================================================

(
    class_sensitivity,
    class_specificity,
    class_precision,
    class_f1
) = calculate_class_metrics()


# ============================================================
# SAVE THREE-CLASS METRICS
# ============================================================

class_metrics = {

    "LOW": {
        "sensitivity":
            float(class_sensitivity[0]),

        "specificity":
            float(class_specificity[0]),

        "precision":
            float(class_precision[0]),

        "f1_score":
            float(class_f1[0])
    },

    "MODERATE": {
        "sensitivity":
            float(class_sensitivity[1]),

        "specificity":
            float(class_specificity[1]),

        "precision":
            float(class_precision[1]),

        "f1_score":
            float(class_f1[1])
    },

    "HIGH": {
        "sensitivity":
            float(class_sensitivity[2]),

        "specificity":
            float(class_specificity[2]),

        "precision":
            float(class_precision[2]),

        "f1_score":
            float(class_f1[2])
    }
}


CLASS_METRICS_FILE = (
    EVALUATION_DIR
    / "imaging_risk_class_metrics.json"
)


with CLASS_METRICS_FILE.open(
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        class_metrics,
        file,
        indent=4
    )


# ============================================================
# FIGURE 1
# SENSITIVITY BY RISK CLASS
# ============================================================

plt.figure(
    figsize=(
        WIDTH,
        HEIGHT
    )
)


bars = plt.bar(
    RISK_NAMES,
    class_sensitivity
)


plt.xlabel(
    "Risk Class",
    fontsize=LABEL_SIZE
)


plt.ylabel(
    "Sensitivity",
    fontsize=LABEL_SIZE
)


plt.title(
    "Sensitivity by CONAN Imaging Risk Class",
    fontsize=TITLE_SIZE,
    pad=14
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
    class_sensitivity
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


save_figure(
    "Figure_1_Sensitivity_by_Risk_Class.png"
)


# ============================================================
# FIGURE 2
# SPECIFICITY BY RISK CLASS
# ============================================================

plt.figure(
    figsize=(
        WIDTH,
        HEIGHT
    )
)


bars = plt.bar(
    RISK_NAMES,
    class_specificity
)


plt.xlabel(
    "Risk Class",
    fontsize=LABEL_SIZE
)


plt.ylabel(
    "Specificity",
    fontsize=LABEL_SIZE
)


plt.title(
    "Specificity by CONAN Imaging Risk Class",
    fontsize=TITLE_SIZE,
    pad=14
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
    class_specificity
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


save_figure(
    "Figure_2_Specificity_by_Risk_Class.png"
)


# ============================================================
# FIGURE 3
# PRECISION BY RISK CLASS
# ============================================================

plt.figure(
    figsize=(
        WIDTH,
        HEIGHT
    )
)


bars = plt.bar(
    RISK_NAMES,
    class_precision
)


plt.xlabel(
    "Risk Class",
    fontsize=LABEL_SIZE
)


plt.ylabel(
    "Precision",
    fontsize=LABEL_SIZE
)


plt.title(
    "Precision by CONAN Imaging Risk Class",
    fontsize=TITLE_SIZE,
    pad=14
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
    class_precision
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


save_figure(
    "Figure_3_Precision_by_Risk_Class.png"
)


# ============================================================
# FIGURE 4
# F1-SCORE BY RISK CLASS
# ============================================================

plt.figure(
    figsize=(
        WIDTH,
        HEIGHT
    )
)


bars = plt.bar(
    RISK_NAMES,
    class_f1
)


plt.xlabel(
    "Risk Class",
    fontsize=LABEL_SIZE
)


plt.ylabel(
    "F1-Score",
    fontsize=LABEL_SIZE
)


plt.title(
    "F1-Score by CONAN Imaging Risk Class",
    fontsize=TITLE_SIZE,
    pad=14
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
    class_f1
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


save_figure(
    "Figure_4_F1_Score_by_Risk_Class.png"
)


# ============================================================
# FIGURE 5
# ROC-AUC
# ============================================================
#
# The deployed model produces a single sigmoid probability.
# Therefore ROC-AUC is evaluated for:
#
#   malignant vs non-malignant
#
# rather than artificially creating three independent ROC
# outputs that the model does not produce.
# ============================================================

if (
    len(
        np.unique(
            y_true_binary
        )
    )
    ==
    2
):


    roc_thresholds = np.linspace(
        1.0,
        0.0,
        501
    )


    roc_fpr = []

    roc_tpr = []


    for threshold in roc_thresholds:

        prediction = (
            y_prob >=
            threshold
        ).astype(int)


        tp_value = np.sum(
            (
                y_true_binary == 1
            )
            &
            (
                prediction == 1
            )
        )


        fn_value = np.sum(
            (
                y_true_binary == 1
            )
            &
            (
                prediction == 0
            )
        )


        tn_value = np.sum(
            (
                y_true_binary == 0
            )
            &
            (
                prediction == 0
            )
        )


        fp_value = np.sum(
            (
                y_true_binary == 0
            )
            &
            (
                prediction == 1
            )
        )


        if (
            tp_value +
            fn_value
        ) > 0:

            tpr = (
                tp_value
                /
                (
                    tp_value +
                    fn_value
                )
            )

        else:

            tpr = 0.0


        if (
            fp_value +
            tn_value
        ) > 0:

            fpr = (
                fp_value
                /
                (
                    fp_value +
                    tn_value
                )
            )

        else:

            fpr = 0.0


        roc_tpr.append(
            tpr
        )


        roc_fpr.append(
            fpr
        )


    roc_auc = roc_auc_score(
        y_true_binary,
        y_prob
    )


    roc_points = sorted(
        zip(
            roc_fpr,
            roc_tpr
        )
    )


    roc_x = [
        point[0]
        for point in roc_points
    ]


    roc_y = [
        point[1]
        for point in roc_points
    ]


    plt.figure(
        figsize=(
            WIDTH,
            7
        )
    )


    plt.plot(
        roc_x,
        roc_y,
        linewidth=2.5,
        label=(
            f"CONAN Imaging Model "
            f"(AUC = {roc_auc:.4f})"
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
        "False Positive Rate",
        fontsize=LABEL_SIZE
    )


    plt.ylabel(
        "True Positive Rate",
        fontsize=LABEL_SIZE
    )


    plt.title(
        "Receiver Operating Characteristic Curve",
        fontsize=TITLE_SIZE,
        pad=14
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
        loc="lower right",
        fontsize=LABEL_SIZE
    )


    plt.tight_layout()


    save_figure(
        "Figure_5_ROC_AUC.png"
    )


else:

    roc_auc = None


# ============================================================
# FIGURE 6
# CALIBRATION PERFORMANCE BY RISK CLASS
# ============================================================
#
# Each CONAN risk class is treated as a probability range.
#
# For each range we compare:
#
#   Mean predicted malignant probability
#
# against:
#
#   Observed malignant fraction
#
# This lets the paper show calibration behavior across:
#
#   LOW
#   MODERATE
#   HIGH
#
# ============================================================

mean_predicted_probability = []

observed_malignant_fraction = []


for risk_class in RISK_LABELS:

    mask = (
        predictions[
            "predicted_risk_label"
        ]
        .to_numpy()
        ==
        risk_class
    )


    if not np.any(
        mask
    ):

        mean_predicted_probability.append(
            np.nan
        )

        observed_malignant_fraction.append(
            np.nan
        )

        continue


    predicted_values = (
        y_prob[
            mask
        ]
    )


    observed_values = (
        y_true_binary[
            mask
        ]
    )


    mean_predicted_probability.append(
        float(
            np.mean(
                predicted_values
            )
        )
    )


    observed_malignant_fraction.append(
        float(
            np.mean(
                observed_values
            )
        )
    )


positions = np.arange(
    len(
        RISK_NAMES
    )
)


bar_width = 0.34


plt.figure(
    figsize=(
        9,
        6
    )
)


prediction_bars = plt.bar(
    positions
    -
    bar_width / 2,

    mean_predicted_probability,

    width=bar_width,

    label="Mean Predicted Probability"
)


observed_bars = plt.bar(
    positions
    +
    bar_width / 2,

    observed_malignant_fraction,

    width=bar_width,

    label="Observed Malignant Fraction"
)


plt.xticks(
    positions,
    RISK_NAMES,
    fontsize=TICK_SIZE
)


plt.yticks(
    fontsize=TICK_SIZE
)


plt.xlabel(
    "CONAN Risk Class",
    fontsize=LABEL_SIZE
)


plt.ylabel(
    "Probability / Observed Fraction",
    fontsize=LABEL_SIZE
)


plt.title(
    "Calibration Performance by CONAN Imaging Risk Class",
    fontsize=TITLE_SIZE,
    pad=14
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
    prediction_bars,
    mean_predicted_probability
):

    if not np.isnan(
        value
    ):

        plt.text(
            bar.get_x()
            +
            bar.get_width()
            / 2,
            value + 0.025,
            f"{value:.3f}",
            ha="center",
            va="bottom",
            fontsize=9
        )


for bar, value in zip(
    observed_bars,
    observed_malignant_fraction
):

    if not np.isnan(
        value
    ):

        plt.text(
            bar.get_x()
            +
            bar.get_width()
            / 2,
            value + 0.025,
            f"{value:.3f}",
            ha="center",
            va="bottom",
            fontsize=9
        )


plt.legend(
    fontsize=LABEL_SIZE
)


plt.tight_layout()


save_figure(
    "Figure_6_Calibration_by_Risk_Class.png"
)


# ============================================================
# FIGURE 7
# PRECISION + F1 BY RISK CLASS
# ============================================================

plt.figure(
    figsize=(
        9,
        6
    )
)


precision_bars = plt.bar(
    positions
    -
    bar_width / 2,

    class_precision,

    width=bar_width,

    label="Precision"
)


f1_bars = plt.bar(
    positions
    +
    bar_width / 2,

    class_f1,

    width=bar_width,

    label="F1-Score"
)


plt.xticks(
    positions,
    RISK_NAMES,
    fontsize=TICK_SIZE
)


plt.yticks(
    fontsize=TICK_SIZE
)


plt.xlabel(
    "Risk Class",
    fontsize=LABEL_SIZE
)


plt.ylabel(
    "Score",
    fontsize=LABEL_SIZE
)


plt.title(
    "CONAN Imaging Model - Precision and F1-Score by Risk Class",
    fontsize=TITLE_SIZE,
    pad=14
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
    precision_bars,
    class_precision
):

    plt.text(
        bar.get_x()
        +
        bar.get_width()
        / 2,
        value + 0.025,
        f"{value:.3f}",
        ha="center",
        va="bottom",
        fontsize=10
    )


for bar, value in zip(
    f1_bars,
    class_f1
):

    plt.text(
        bar.get_x()
        +
        bar.get_width()
        / 2,
        value + 0.025,
        f"{value:.3f}",
        ha="center",
        va="bottom",
        fontsize=10
    )


plt.legend(
    fontsize=LABEL_SIZE
)


plt.tight_layout()


save_figure(
    "Figure_7_Precision_F1_by_Risk_Class.png"
)


# ============================================================
# FIGURE 8
# THREE-CLASS CONFUSION MATRIX
# ============================================================

risk_matrix = confusion_matrix(
    true_risk,
    predicted_risk,
    labels=[
        0,
        1,
        2
    ]
)


plt.figure(
    figsize=(
        7,
        6
    )
)


image = plt.imshow(
    risk_matrix,
    interpolation="nearest"
)


plt.colorbar(
    image
)


plt.xticks(
    [
        0,
        1,
        2
    ],
    RISK_NAMES,
    fontsize=TICK_SIZE
)


plt.yticks(
    [
        0,
        1,
        2
    ],
    RISK_NAMES,
    fontsize=TICK_SIZE
)


plt.xlabel(
    "Predicted Risk Class",
    fontsize=LABEL_SIZE
)


plt.ylabel(
    "True Risk Class",
    fontsize=LABEL_SIZE
)


plt.title(
    "CONAN Imaging Risk-Class Confusion Matrix",
    fontsize=TITLE_SIZE,
    pad=14
)


matrix_cutoff = (
    risk_matrix.max()
    /
    2
)


for row_index in range(3):

    for column_index in range(3):

        value = risk_matrix[
            row_index,
            column_index
        ]


        text_color = (
            "white"
            if value > matrix_cutoff
            else "black"
        )


        plt.text(
            column_index,
            row_index,
            str(value),
            ha="center",
            va="center",
            color=text_color,
            fontsize=13,
            fontweight="bold"
        )


plt.tight_layout()


save_figure(
    "Figure_8_Imaging_Risk_Class_Confusion_Matrix.png"
)


# ============================================================
# PRINT RESULTS
# ============================================================

print()
print("=" * 75)
print("CONAN IMAGING RISK-CLASS EVALUATION")
print("=" * 75)
print()


for index, risk_name in enumerate(
    RISK_NAMES
):

    print(
        risk_name
        +
        " Sensitivity :",
        f"{class_sensitivity[index]:.4f}"
    )

    print(
        risk_name
        +
        " Specificity :",
        f"{class_specificity[index]:.4f}"
    )

    print(
        risk_name
        +
        " Precision   :",
        f"{class_precision[index]:.4f}"
    )

    print(
        risk_name
        +
        " F1-Score    :",
        f"{class_f1[index]:.4f}"
    )

    print()


if roc_auc is not None:

    print(
        "Overall malignant-vs-not-malignant ROC-AUC:",
        f"{roc_auc:.4f}"
    )


print()

print(
    "Calibration by risk class:"
)


for index, risk_name in enumerate(
    RISK_NAMES
):

    print(
        risk_name
        +
        " mean predicted probability:",
        (
            f"{mean_predicted_probability[index]:.4f}"
            if not np.isnan(
                mean_predicted_probability[index]
            )
            else "N/A"
        )
    )


    print(
        risk_name
        +
        " observed malignant fraction:",
        (
            f"{observed_malignant_fraction[index]:.4f}"
            if not np.isnan(
                observed_malignant_fraction[index]
            )
            else "N/A"
        )
    )


    print()


# ============================================================
# FINAL OUTPUT
# ============================================================

print("=" * 75)
print("RESEARCH FIGURES COMPLETE")
print("=" * 75)
print()


print(
    "Output directory:"
)


print(
    FIGURE_DIR
)


print()


print(
    "Created:"
)


print(
    "Figure_1_Sensitivity_by_Risk_Class.png"
)


print(
    "Figure_2_Specificity_by_Risk_Class.png"
)


print(
    "Figure_3_Precision_by_Risk_Class.png"
)


print(
    "Figure_4_F1_Score_by_Risk_Class.png"
)


print(
    "Figure_5_ROC_AUC.png"
)


print(
    "Figure_6_Calibration_by_Risk_Class.png"
)


print(
    "Figure_7_Precision_F1_by_Risk_Class.png"
)


print(
    "Figure_8_Imaging_Risk_Class_Confusion_Matrix.png"
)


print()
print(
    "Class metrics saved to:"
)


print(
    CLASS_METRICS_FILE
)