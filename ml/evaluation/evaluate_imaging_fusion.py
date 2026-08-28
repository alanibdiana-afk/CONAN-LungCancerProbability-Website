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
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    brier_score_loss,
)

from sklearn.calibration import calibration_curve


# ============================================================
# CONAN MODEL PERFORMANCE EVALUATION
# ============================================================
#
# THIS SCRIPT ONLY EVALUATES EXISTING MODELS.
#
# IT DOES NOT:
#   - retrain the Clinical Model
#   - retrain the Imaging Model
#   - retrain the Late-Fusion Model
#   - change fusion weights
#   - change fusion thresholds
#   - change the fusion algorithm
#
# The existing Late-Fusion model is loaded from:
#
#   ml/combined/late_fusion_model.json
#
# ============================================================


# ============================================================
# PROJECT
# ============================================================

PROJECT_ROOT = Path(
    r"D:\CONAN datasets\Conan-App"
)


# ============================================================
# EXISTING FILES
# ============================================================

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


FUSION_MODEL_FILE = (
    PROJECT_ROOT
    / "ml"
    / "combined"
    / "late_fusion_model.json"
)


# ============================================================
# OUTPUT
# ============================================================

OUTPUT_DIR = (
    PROJECT_ROOT
    / "ml"
    / "evaluation"
    / "results"
)


OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# RISK CLASSES
# ============================================================

RISK_NAMES = [
    "LOW",
    "MODERATE",
    "HIGH",
]


# ============================================================
# IMAGING BINARY THRESHOLD
# ============================================================
#
# ONLY used for binary Imaging metrics.
#
# ROC-AUC uses the continuous imaging probability.
#
# ============================================================

IMAGING_THRESHOLD = 0.50


# ============================================================
# CONAN PRESENTATION THRESHOLDS
# ============================================================

LOW_THRESHOLD = 0.05

HIGH_THRESHOLD = 0.65


# ============================================================
# 1. IMAGING MODEL
# ============================================================

print()
print("=" * 72)
print("CONAN MODEL PERFORMANCE EVALUATION")
print("=" * 72)
print()


if not IMAGING_FILE.exists():

    raise FileNotFoundError(
        "Imaging prediction file not found:\n"
        f"{IMAGING_FILE}"
    )


imaging = pd.read_csv(
    IMAGING_FILE
)


required_imaging = {
    "binary_target",
    "y_prob",
}


missing_imaging = (
    required_imaging
    -
    set(
        imaging.columns
    )
)


if missing_imaging:

    raise ValueError(
        "Imaging prediction file is missing:\n"
        +
        "\n".join(
            sorted(
                missing_imaging
            )
        )
    )


imaging[
    "binary_target"
] = pd.to_numeric(
    imaging[
        "binary_target"
    ],
    errors="coerce",
)


imaging[
    "y_prob"
] = pd.to_numeric(
    imaging[
        "y_prob"
    ],
    errors="coerce",
)


imaging = imaging.dropna(
    subset=[
        "binary_target",
        "y_prob",
    ]
).copy()


imaging[
    "binary_target"
] = (
    imaging[
        "binary_target"
    ]
    .astype(int)
)


imaging[
    "y_prob"
] = (
    imaging[
        "y_prob"
    ]
    .clip(
        0,
        1,
    )
)


imaging_true = (
    imaging[
        "binary_target"
    ]
    .to_numpy()
)


imaging_probability = (
    imaging[
        "y_prob"
    ]
    .to_numpy()
)


imaging_prediction = (
    imaging_probability >=
    IMAGING_THRESHOLD
).astype(
    int
)


imaging_cm = confusion_matrix(
    imaging_true,
    imaging_prediction,
    labels=[
        0,
        1,
    ],
)


itn, ifp, ifn, itp = (
    imaging_cm.ravel()
)


imaging_sensitivity = (
    itp /
    (itp + ifn)
    if (
        itp + ifn
    ) > 0
    else 0.0
)


imaging_specificity = (
    itn /
    (itn + ifp)
    if (
        itn + ifp
    ) > 0
    else 0.0
)


imaging_precision = precision_score(
    imaging_true,
    imaging_prediction,
    zero_division=0,
)


imaging_f1 = f1_score(
    imaging_true,
    imaging_prediction,
    zero_division=0,
)


imaging_roc_auc = roc_auc_score(
    imaging_true,
    imaging_probability,
)


imaging_brier = brier_score_loss(
    imaging_true,
    imaging_probability,
)


print(
    "IMAGING MODEL"
)

print(
    "-" * 40
)

print(
    f"Cases       : {len(imaging):,}"
)

print(
    f"Sensitivity : {imaging_sensitivity:.4f}"
)

print(
    f"Specificity : {imaging_specificity:.4f}"
)

print(
    f"Precision   : {imaging_precision:.4f}"
)

print(
    f"F1-Score    : {imaging_f1:.4f}"
)

print(
    f"ROC-AUC     : {imaging_roc_auc:.4f}"
)

print(
    f"Brier Score : {imaging_brier:.4f}"
)

print()


# ============================================================
# IMAGING ROC
# ============================================================

imaging_fpr, imaging_tpr, _ = (
    roc_curve(
        imaging_true,
        imaging_probability,
    )
)


fig, ax = plt.subplots(
    figsize=(8, 7)
)


ax.plot(
    imaging_fpr,
    imaging_tpr,
    linewidth=2.5,
    label=(
        f"CONAN Imaging Model "
        f"(AUC = {imaging_roc_auc:.3f})"
    ),
)


ax.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1.5,
    label="Chance",
)


ax.set_title(
    "Receiver Operating Characteristic Curve",
    fontsize=15,
    fontweight="bold",
)


ax.set_xlabel(
    "False Positive Rate"
)


ax.set_ylabel(
    "True Positive Rate"
)


ax.set_xlim(
    0,
    1,
)


ax.set_ylim(
    0,
    1.05,
)


ax.grid(
    alpha=0.25,
)


ax.legend(
    loc="lower right"
)


fig.tight_layout()


fig.savefig(
    OUTPUT_DIR
    / "01_imaging_roc_curve.png",
    dpi=600,
    bbox_inches="tight",
)


plt.close(
    fig
)


# ============================================================
# IMAGING CALIBRATION
# ============================================================

imaging_fraction, imaging_mean = (
    calibration_curve(
        imaging_true,
        imaging_probability,
        n_bins=5,
        strategy="uniform",
    )
)


fig, ax = plt.subplots(
    figsize=(8, 7)
)


ax.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1.5,
    label="Perfect Calibration",
)


ax.plot(
    imaging_mean,
    imaging_fraction,
    marker="o",
    linewidth=2.5,
    label="CONAN Imaging Model",
)


ax.set_title(
    "Calibration Performance of the CONAN Imaging Model",
    fontsize=15,
    fontweight="bold",
)


ax.set_xlabel(
    "Mean Predicted Probability"
)


ax.set_ylabel(
    "Observed Positive Fraction"
)


ax.set_xlim(
    0,
    1,
)


ax.set_ylim(
    0,
    1,
)


ax.grid(
    alpha=0.25,
)


ax.text(
    0.05,
    0.93,
    f"Brier Score = {imaging_brier:.3f}",
    transform=ax.transAxes,
    fontsize=11,
)


ax.legend(
    loc="best"
)


fig.tight_layout()


fig.savefig(
    OUTPUT_DIR
    / "02_imaging_calibration.png",
    dpi=600,
    bbox_inches="tight",
)


plt.close(
    fig
)


# ============================================================
# IMAGING CONFUSION MATRIX
# ============================================================

fig, ax = plt.subplots(
    figsize=(7, 6)
)


image = ax.imshow(
    imaging_cm,
    interpolation="nearest",
    cmap="Blues",
)


ax.set_title(
    "CONAN Imaging Model — Confusion Matrix",
    fontsize=15,
    fontweight="bold",
)


ax.set_xlabel(
    "Predicted"
)


ax.set_ylabel(
    "Actual"
)


ax.set_xticks(
    [0, 1]
)


ax.set_yticks(
    [0, 1]
)


ax.set_xticklabels(
    [
        "Negative",
        "Positive",
    ]
)


ax.set_yticklabels(
    [
        "Negative",
        "Positive",
    ]
)


for row in range(2):

    for col in range(2):

        ax.text(
            col,
            row,
            str(
                imaging_cm[
                    row,
                    col
                ]
            ),
            ha="center",
            va="center",
            fontsize=15,
            fontweight="bold",
        )


fig.colorbar(
    image,
    ax=ax,
)


fig.tight_layout()


fig.savefig(
    OUTPUT_DIR
    / "03_imaging_confusion_matrix.png",
    dpi=600,
    bbox_inches="tight",
)


plt.close(
    fig
)


# ============================================================
# 2. LATE-FUSION MODEL
# ============================================================
#
# IMPORTANT:
#
# We DO NOT use late_fusion_predictions.csv.
#
# Instead we load the EXISTING TRAINED fusion model from:
#
#   late_fusion_model.json
#
# and apply its stored coefficients to the existing OOF
# clinical + imaging predictions.
#
# NO TRAINING OCCURS HERE.
#
# ============================================================

print()
print("=" * 72)
print("LATE-FUSION MODEL")
print("=" * 72)
print()


if not FUSION_MODEL_FILE.exists():

    print(
        "Existing Late-Fusion model file was not found:"
    )

    print(
        FUSION_MODEL_FILE
    )

    print()

    print(
        "Late-Fusion metrics cannot be calculated until"
    )

    print(
        "the already-trained fusion model file exists."
    )

    fusion_available = False

    fusion_metrics = None

    fusion_roc_auc = None

    fusion_brier = None


else:

    # --------------------------------------------------------
    # LOAD EXISTING FUSION MODEL
    # --------------------------------------------------------

    with open(
        FUSION_MODEL_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        fusion_model = json.load(
            file
        )


    print(
        "Loaded existing fusion model:"
    )

    print(
        FUSION_MODEL_FILE
    )

    print()


    # --------------------------------------------------------
    # LOAD CLINICAL DATA
    # --------------------------------------------------------

    if not CLINICAL_FILE.exists():

        raise FileNotFoundError(
            "Clinical OOF prediction file not found:\n"
            f"{CLINICAL_FILE}"
        )


    clinical = pd.read_csv(
        CLINICAL_FILE
    )


    required_clinical = {

        "clinical_target",

        "P_LOW",

        "P_MODERATE",

        "P_HIGH",

    }


    missing_clinical = (
        required_clinical
        -
        set(
            clinical.columns
        )
    )


    if missing_clinical:

        raise ValueError(
            "Clinical OOF file is missing:\n"
            +
            "\n".join(
                sorted(
                    missing_clinical
                )
            )
        )


    # --------------------------------------------------------
    # CLEAN CLINICAL
    # --------------------------------------------------------

    clinical[
        "clinical_target"
    ] = pd.to_numeric(
        clinical[
            "clinical_target"
        ],
        errors="coerce",
    )


    for column in [
        "P_LOW",
        "P_MODERATE",
        "P_HIGH",
    ]:

        clinical[column] = pd.to_numeric(
            clinical[column],
            errors="coerce",
        )


    clinical = clinical.dropna(
        subset=[
            "clinical_target",
            "P_LOW",
            "P_MODERATE",
            "P_HIGH",
        ]
    ).copy()


    clinical[
        "clinical_target"
    ] = (
        clinical[
            "clinical_target"
        ]
        .astype(int)
    )


    # --------------------------------------------------------
    # IMPORTANT ALIGNMENT
    # --------------------------------------------------------
    #
    # Your existing Late-Fusion training script explicitly
    # validates that the Clinical OOF rows and Imaging rows
    # align before fitting the model.
    #
    # We reproduce that same validation here.
    #
    # --------------------------------------------------------

    if len(clinical) != len(imaging):

        raise ValueError(
            "\nClinical and Imaging prediction files have "
            "different numbers of rows.\n\n"
            f"Clinical rows: {len(clinical)}\n"
            f"Imaging rows : {len(imaging)}\n\n"
            "Late-Fusion evaluation stopped to prevent "
            "mismatched cases."
        )


    clinical_targets = (
        clinical[
            "clinical_target"
        ]
        .to_numpy()
    )


    imaging_risk_labels = (
        pd.read_csv(
            IMAGING_FILE
        )[
            "risk_label"
        ]
        .dropna()
        .astype(int)
        .to_numpy()
    )


    if len(imaging_risk_labels) != len(
        clinical_targets
    ):

        raise ValueError(
            "Clinical and Imaging target lengths do not match."
        )


    matches = np.sum(
        clinical_targets ==
        imaging_risk_labels
    )


    print(
        "Clinical/Imaging target alignment:",
        f"{matches}/{len(clinical_targets)}",
    )


    if matches != len(
        clinical_targets
    ):

        raise ValueError(
            "\nClinical and Imaging targets do not fully align.\n"
            "Late-Fusion evaluation stopped to prevent "
            "incorrect case matching."
        )


    # --------------------------------------------------------
    # BUILD FEATURES
    # --------------------------------------------------------

    features = np.column_stack(
        [

            clinical[
                "P_LOW"
            ].to_numpy(
                dtype=float
            ),

            clinical[
                "P_MODERATE"
            ].to_numpy(
                dtype=float
            ),

            clinical[
                "P_HIGH"
            ].to_numpy(
                dtype=float
            ),

            imaging[
                "y_prob"
            ].to_numpy(
                dtype=float
            ),

        ]
    )


    y_true_fusion = (
        clinical[
            "clinical_target"
        ]
        .to_numpy()
    )


    # --------------------------------------------------------
    # LOAD STORED COEFFICIENTS
    # --------------------------------------------------------

    coefficients = np.asarray(
        fusion_model[
            "coefficients"
        ],
        dtype=float,
    )


    intercepts = np.asarray(
        fusion_model[
            "intercepts"
        ],
        dtype=float,
    )


    if coefficients.shape != (
        3,
        4
    ):

        raise ValueError(
            "Unexpected Late-Fusion coefficient shape: "
            +
            str(
                coefficients.shape
            )
        )


    if intercepts.shape != (
        3,
    ):

        raise ValueError(
            "Unexpected Late-Fusion intercept shape: "
            +
            str(
                intercepts.shape
            )
        )


    # --------------------------------------------------------
    # APPLY EXISTING MULTINOMIAL MODEL
    # --------------------------------------------------------
    #
    # This is prediction only.
    #
    # No fit(), no training, no parameter modification.
    #
    # --------------------------------------------------------

    logits = (
        features
        @
        coefficients.T
    )


    logits = (
        logits
        +
        intercepts
    )


    # --------------------------------------------------------
    # SOFTMAX
    # --------------------------------------------------------

    logits = (
        logits
        -
        np.max(
            logits,
            axis=1,
            keepdims=True,
        )
    )


    exponential = np.exp(
        logits
    )


    fusion_probability = (
        exponential
        /
        exponential.sum(
            axis=1,
            keepdims=True,
        )
    )


    # --------------------------------------------------------
    # FINAL CLASS
    # --------------------------------------------------------

    fusion_prediction = (
        np.argmax(
            fusion_probability,
            axis=1,
        )
    )


    # --------------------------------------------------------
    # CLASS METRICS
    # --------------------------------------------------------

    fusion_metrics = {}


    for class_index, class_name in enumerate(
        RISK_NAMES
    ):

        actual_binary = (
            y_true_fusion ==
            class_index
        ).astype(
            int
        )


        prediction_binary = (
            fusion_prediction ==
            class_index
        ).astype(
            int
        )


        class_cm = confusion_matrix(
            actual_binary,
            prediction_binary,
            labels=[
                0,
                1,
            ],
        )


        ftn, ffp, ffn, ftp = (
            class_cm.ravel()
        )


        sensitivity = (
            ftp /
            (ftp + ffn)
            if (
                ftp + ffn
            ) > 0
            else 0.0
        )


        specificity = (
            ftn /
            (ftn + ffp)
            if (
                ftn + ffp
            ) > 0
            else 0.0
        )


        precision = precision_score(
            actual_binary,
            prediction_binary,
            zero_division=0,
        )


        f1 = f1_score(
            actual_binary,
            prediction_binary,
            zero_division=0,
        )


        fusion_metrics[
            class_name
        ] = {

            "Sensitivity":
                float(
                    sensitivity
                ),

            "Specificity":
                float(
                    specificity
                ),

            "Precision":
                float(
                    precision
                ),

            "F1-Score":
                float(
                    f1
                ),

        }


    # --------------------------------------------------------
    # MACRO ROC-AUC
    # --------------------------------------------------------

    fusion_one_hot = (
        np.eye(
            3
        )[
            y_true_fusion
        ]
    )


    fusion_roc_auc = (
        roc_auc_score(
            fusion_one_hot,
            fusion_probability,
            multi_class="ovr",
            average="macro",
        )
    )


    # --------------------------------------------------------
    # MULTICLASS BRIER SCORE
    # --------------------------------------------------------

    fusion_brier = float(
        np.mean(
            np.sum(
                (
                    fusion_probability
                    -
                    fusion_one_hot
                )
                ** 2,
                axis=1,
            )
        )
    )


    fusion_available = True


    # ========================================================
    # PRINT FUSION RESULTS
    # ========================================================

    print(
        "Cases       :",
        len(
            y_true_fusion
        ),
    )


    print()


    for class_name in RISK_NAMES:

        m = fusion_metrics[
            class_name
        ]


        print(
            class_name
        )


        print(
            f"  Sensitivity : {m['Sensitivity']:.4f}"
        )


        print(
            f"  Specificity : {m['Specificity']:.4f}"
        )


        print(
            f"  Precision   : {m['Precision']:.4f}"
        )


        print(
            f"  F1-Score    : {m['F1-Score']:.4f}"
        )


        print()


    print(
        f"Macro ROC-AUC: {fusion_roc_auc:.4f}"
    )


    print(
        f"Brier Score  : {fusion_brier:.4f}"
    )


    print()


    # ========================================================
    # FUSION CONFUSION MATRIX
    # ========================================================

    fusion_cm = confusion_matrix(
        y_true_fusion,
        fusion_prediction,
        labels=[
            0,
            1,
            2,
        ],
    )


    fig, ax = plt.subplots(
        figsize=(8, 7)
    )


    fusion_image = ax.imshow(
        fusion_cm,
        interpolation="nearest",
        cmap="Blues",
    )


    ax.set_title(
        "CONAN Late-Fusion Model — Risk Class Confusion Matrix",
        fontsize=15,
        fontweight="bold",
    )


    ax.set_xlabel(
        "Predicted Risk Class"
    )


    ax.set_ylabel(
        "Actual Risk Class"
    )


    ax.set_xticks(
        np.arange(3)
    )


    ax.set_yticks(
        np.arange(3)
    )


    ax.set_xticklabels(
        RISK_NAMES
    )


    ax.set_yticklabels(
        RISK_NAMES
    )


    for row in range(3):

        for col in range(3):

            ax.text(
                col,
                row,
                str(
                    fusion_cm[
                        row,
                        col
                    ]
                ),
                ha="center",
                va="center",
                fontsize=14,
                fontweight="bold",
            )


    fig.colorbar(
        fusion_image,
        ax=ax,
    )


    fig.tight_layout()


    fig.savefig(
        OUTPUT_DIR
        / "04_late_fusion_confusion_matrix.png",
        dpi=600,
        bbox_inches="tight",
    )


    plt.close(
        fig
    )


    # ========================================================
    # FUSION CLASS METRICS
    # ========================================================

    x = np.arange(
        3
    )


    width = 0.20


    sensitivity_values = [

        fusion_metrics[
            class_name
        ]["Sensitivity"]

        for class_name in RISK_NAMES

    ]


    specificity_values = [

        fusion_metrics[
            class_name
        ]["Specificity"]

        for class_name in RISK_NAMES

    ]


    precision_values = [

        fusion_metrics[
            class_name
        ]["Precision"]

        for class_name in RISK_NAMES

    ]


    f1_values = [

        fusion_metrics[
            class_name
        ]["F1-Score"]

        for class_name in RISK_NAMES

    ]


    fig, ax = plt.subplots(
        figsize=(11, 7)
    )


    bars1 = ax.bar(
        x - 1.5 * width,
        sensitivity_values,
        width,
        label="Sensitivity",
    )


    bars2 = ax.bar(
        x - 0.5 * width,
        specificity_values,
        width,
        label="Specificity",
    )


    bars3 = ax.bar(
        x + 0.5 * width,
        precision_values,
        width,
        label="Precision",
    )


    bars4 = ax.bar(
        x + 1.5 * width,
        f1_values,
        width,
        label="F1-Score",
    )


    ax.set_title(
        "CONAN Late-Fusion Model — Classification Performance",
        fontsize=15,
        fontweight="bold",
    )


    ax.set_xlabel(
        "Risk Class"
    )


    ax.set_ylabel(
        "Score"
    )


    ax.set_xticks(
        x
    )


    ax.set_xticklabels(
        RISK_NAMES
    )


    ax.set_ylim(
        0,
        1.10,
    )


    ax.grid(
        axis="y",
        alpha=0.25,
    )


    ax.legend()


    for bars in [
        bars1,
        bars2,
        bars3,
        bars4,
    ]:

        ax.bar_label(
            bars,
            fmt="%.3f",
            padding=3,
        )


    fig.tight_layout()


    fig.savefig(
        OUTPUT_DIR
        / "05_late_fusion_classification_metrics.png",
        dpi=600,
        bbox_inches="tight",
    )


    plt.close(
        fig
    )


    # ========================================================
    # FUSION ROC
    # ========================================================

    fig, ax = plt.subplots(
        figsize=(8, 7)
    )


    for class_index, class_name in enumerate(
        RISK_NAMES
    ):

        actual = (
            y_true_fusion ==
            class_index
        ).astype(
            int
        )


        probability = (
            fusion_probability[
                :,
                class_index
            ]
        )


        try:

            class_fpr, class_tpr, _ = (
                roc_curve(
                    actual,
                    probability,
                )
            )


            class_auc = roc_auc_score(
                actual,
                probability,
            )


            ax.plot(
                class_fpr,
                class_tpr,
                linewidth=2,
                label=(
                    f"{class_name} "
                    f"(AUC={class_auc:.3f})"
                ),
            )


        except ValueError:

            pass


    ax.plot(
        [0, 1],
        [0, 1],
        linestyle="--",
        linewidth=1.5,
        label="Chance",
    )


    ax.set_title(
        "CONAN Late-Fusion — Multiclass ROC Curves",
        fontsize=15,
        fontweight="bold",
    )


    ax.set_xlabel(
        "False Positive Rate"
    )


    ax.set_ylabel(
        "True Positive Rate"
    )


    ax.set_xlim(
        0,
        1,
    )


    ax.set_ylim(
        0,
        1.05,
    )


    ax.grid(
        alpha=0.25,
    )


    ax.legend(
        loc="lower right"
    )


    fig.tight_layout()


    fig.savefig(
        OUTPUT_DIR
        / "06_late_fusion_roc.png",
        dpi=600,
        bbox_inches="tight",
    )


    plt.close(
        fig
    )


    # ========================================================
    # FUSION CALIBRATION
    # ========================================================

    fig, ax = plt.subplots(
        figsize=(8, 7)
    )


    ax.plot(
        [0, 1],
        [0, 1],
        linestyle="--",
        linewidth=1.5,
        label="Perfect Calibration",
    )


    markers = [
        "o",
        "s",
        "^",
    ]


    for class_index, class_name in enumerate(
        RISK_NAMES
    ):

        actual = (
            y_true_fusion ==
            class_index
        ).astype(
            int
        )


        probability = (
            fusion_probability[
                :,
                class_index
            ]
        )


        try:

            fraction, mean = (
                calibration_curve(
                    actual,
                    probability,
                    n_bins=5,
                    strategy="uniform",
                )
            )


            ax.plot(
                mean,
                fraction,
                marker=markers[
                    class_index
                ],
                linewidth=2,
                label=class_name,
            )


        except ValueError:

            pass


    ax.set_title(
        "CONAN Late-Fusion — Calibration Performance",
        fontsize=15,
        fontweight="bold",
    )


    ax.set_xlabel(
        "Mean Predicted Probability"
    )


    ax.set_ylabel(
        "Observed Fraction"
    )


    ax.set_xlim(
        0,
        1,
    )


    ax.set_ylim(
        0,
        1,
    )


    ax.grid(
        alpha=0.25,
    )


    ax.text(
        0.05,
        0.93,
        f"Multiclass Brier Score = {fusion_brier:.3f}",
        transform=ax.transAxes,
        fontsize=11,
    )


    ax.legend(
        loc="best"
    )


    fig.tight_layout()


    fig.savefig(
        OUTPUT_DIR
        / "07_late_fusion_calibration.png",
        dpi=600,
        bbox_inches="tight",
    )


    plt.close(
        fig
    )


# ============================================================
# SAVE METRICS TABLE
# ============================================================

rows = [

    {

        "Model":
            "Imaging",

        "Risk Class":
            "Binary",

        "Sensitivity":
            imaging_sensitivity,

        "Specificity":
            imaging_specificity,

        "Precision":
            imaging_precision,

        "F1-Score":
            imaging_f1,

        "ROC-AUC":
            imaging_roc_auc,

        "Brier Score":
            imaging_brier,

    }

]


if (
    fusion_available
    and
    fusion_metrics is not None
):

    for class_name in RISK_NAMES:

        m = fusion_metrics[
            class_name
        ]


        rows.append({

            "Model":
                "Late Fusion",

            "Risk Class":
                class_name,

            "Sensitivity":
                m[
                    "Sensitivity"
                ],

            "Specificity":
                m[
                    "Specificity"
                ],

            "Precision":
                m[
                    "Precision"
                ],

            "F1-Score":
                m[
                    "F1-Score"
                ],

            "ROC-AUC":
                fusion_roc_auc,

            "Brier Score":
                fusion_brier,

        })


metrics_df = pd.DataFrame(
    rows
)


metrics_df.to_csv(
    OUTPUT_DIR
    / "conan_model_performance_metrics.csv",
    index=False,
)


# ============================================================
# SAVE JSON
# ============================================================

summary = {

    "imaging": {

        "cases":
            int(
                len(imaging)
            ),

        "Sensitivity":
            float(
                imaging_sensitivity
            ),

        "Specificity":
            float(
                imaging_specificity
            ),

        "Precision":
            float(
                imaging_precision
            ),

        "F1-Score":
            float(
                imaging_f1
            ),

        "ROC-AUC":
            float(
                imaging_roc_auc
            ),

        "Brier Score":
            float(
                imaging_brier
            ),

    },

    "late_fusion": {

        "available":
            bool(
                fusion_available
            ),

        "metrics":
            fusion_metrics,

        "macro_ROC_AUC":
            (
                None
                if fusion_roc_auc is None
                else float(
                    fusion_roc_auc
                )
            ),

        "multiclass_Brier_Score":
            (
                None
                if fusion_brier is None
                else float(
                    fusion_brier
                )
            ),

    },

    "models_modified":
        False,

}


with open(
    OUTPUT_DIR
    / "conan_model_performance_metrics.json",
    "w",
    encoding="utf-8",
) as file:

    json.dump(
        summary,
        file,
        indent=2,
    )


# ============================================================
# FINAL
# ============================================================

print()
print("=" * 72)
print("CONAN EVALUATION COMPLETE")
print("=" * 72)
print()

print(
    "Metrics CSV:"
)

print(
    OUTPUT_DIR
    / "conan_model_performance_metrics.csv"
)

print()

print(
    "Metrics JSON:"
)

print(
    OUTPUT_DIR
    / "conan_model_performance_metrics.json"
)

print()

print(
    "Existing Late-Fusion model was used for prediction only."
)

print(
    "No model was retrained or modified."
)

print()