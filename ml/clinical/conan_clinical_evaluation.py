"""
================================================================================
CONAN — FINAL CLINICAL MODEL EVALUATION
================================================================================

Model:
    Multinomial Logistic Regression

Classes:
    LOW
    MODERATE
    HIGH

Clinical variables:
    All 23 variables from the CONAN clinical dataset

Evaluation parameters:
    2.1 Sensitivity
    2.2 Specificity
    2.3 Precision
    2.4 F1-score
    2.5 ROC-AUC
    2.6 Calibration performance

Validation:
    Stratified 5-fold cross-validation
    Out-of-fold predictions

Outputs:
    - Metrics CSV
    - OOF predictions CSV
    - Confusion matrix
    - ROC-AUC curves
    - Sensitivity / Specificity graph
    - Precision / F1 graph
    - Calibration curve
================================================================================
"""

import os
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder, label_binarize
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
    log_loss,
    brier_score_loss,
)
from sklearn.calibration import calibration_curve

warnings.filterwarnings("ignore")


# =============================================================================
# CONFIGURATION
# =============================================================================

DATASET = "ml/data/cancer patient data sets.csv"
OUTPUT_DIR = "ml/clinical"

RANDOM_STATE = 42
N_SPLITS = 5

# The regularization selected during the previous CONAN experiment.
C_VALUE = 0.1

os.makedirs(OUTPUT_DIR, exist_ok=True)


# =============================================================================
# HEADER
# =============================================================================

print("=" * 80)
print("CONAN — FINAL CLINICAL MODEL EVALUATION")
print("=" * 80)

print("""
Model:
  Multinomial Logistic Regression

Primary evaluation parameters:
  2.1 Sensitivity
  2.2 Specificity
  2.3 Precision
  2.4 F1-score
  2.5 ROC-AUC
  2.6 Calibration performance

Validation:
  Stratified 5-fold cross-validation
  Out-of-fold predictions
""")


# =============================================================================
# LOAD DATA
# =============================================================================

df = pd.read_csv(DATASET)

print(f"Dataset: {DATASET}")
print(f"Shape: {df.shape}")


# =============================================================================
# CLINICAL VARIABLES
# =============================================================================

CLINICAL_FEATURES = [
    "Age",
    "Gender",
    "Air Pollution",
    "Alcohol use",
    "Dust Allergy",
    "OccuPational Hazards",
    "Genetic Risk",
    "chronic Lung Disease",
    "Balanced Diet",
    "Obesity",
    "Smoking",
    "Passive Smoker",
    "Chest Pain",
    "Coughing of Blood",
    "Fatigue",
    "Weight Loss",
    "Shortness of Breath",
    "Wheezing",
    "Swallowing Difficulty",
    "Clubbing of Finger Nails",
    "Frequent Cold",
    "Dry Cough",
    "Snoring",
]

print()
print(f"Clinical variables: {len(CLINICAL_FEATURES)}")

for i, feature in enumerate(CLINICAL_FEATURES, start=1):
    print(f"{i:02d}. {feature}")


# =============================================================================
# CHECK VARIABLES
# =============================================================================

missing_features = [
    feature for feature in CLINICAL_FEATURES
    if feature not in df.columns
]

if missing_features:
    raise ValueError(
        "Missing clinical variables:\n"
        + "\n".join(missing_features)
    )


# =============================================================================
# TARGET
# =============================================================================

TARGET = "Level"

if TARGET not in df.columns:
    raise ValueError(f"Target column '{TARGET}' not found.")


print()
print("Target distribution:")
print(df[TARGET].value_counts())


# =============================================================================
# STANDARDIZE CLASS LABELS
# =============================================================================

# Convert possible variations to the three official CONAN classes.
class_mapping = {
    "Low": "LOW",
    "LOW": "LOW",
    "Medium": "MODERATE",
    "MEDIUM": "MODERATE",
    "Moderate": "MODERATE",
    "MODERATE": "MODERATE",
    "High": "HIGH",
    "HIGH": "HIGH",
}

df[TARGET] = (
    df[TARGET]
    .astype(str)
    .str.strip()
    .map(class_mapping)
)

if df[TARGET].isna().any():
    bad_values = df.loc[df[TARGET].isna(), TARGET]
    raise ValueError(
        f"Unknown target values detected: {bad_values.unique()}"
    )


# =============================================================================
# FORCE OFFICIAL CLASS ORDER
# =============================================================================

CLASS_NAMES = np.array([
    "LOW",
    "MODERATE",
    "HIGH"
])

class_to_index = {
    "LOW": 0,
    "MODERATE": 1,
    "HIGH": 2
}

y = df[TARGET].map(class_to_index).to_numpy()

X = df[CLINICAL_FEATURES].copy()

# Ensure numeric
X = X.apply(pd.to_numeric, errors="coerce")

if X.isna().any().any():
    raise ValueError(
        "Missing/non-numeric values detected in clinical variables."
    )

print()
print("CONAN class order:")
print("  0 = LOW")
print("  1 = MODERATE")
print("  2 = HIGH")


# =============================================================================
# OUT-OF-FOLD STORAGE
# =============================================================================

n_samples = len(df)
n_classes = len(CLASS_NAMES)

oof_proba = np.zeros((n_samples, n_classes))
oof_pred = np.zeros(n_samples, dtype=int)


# =============================================================================
# STRATIFIED 5-FOLD CROSS-VALIDATION
# =============================================================================

cv = StratifiedKFold(
    n_splits=N_SPLITS,
    shuffle=True,
    random_state=RANDOM_STATE
)

print()
print("=" * 80)
print("STRATIFIED 5-FOLD OUT-OF-FOLD EVALUATION")
print("=" * 80)

for fold, (train_idx, test_idx) in enumerate(
    cv.split(X, y),
    start=1
):

    print(f"\nFold {fold}/{N_SPLITS}")

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y[train_idx]
    y_test = y[test_idx]

    # -------------------------------------------------------------------------
    # Multinomial Logistic Regression
    #
    # IMPORTANT:
    # We intentionally do NOT use multi_class= because newer versions of
    # scikit-learn handle multinomial logistic regression automatically.
    # -------------------------------------------------------------------------

    model = LogisticRegression(
        C=C_VALUE,
        solver="lbfgs",
        max_iter=5000,
        random_state=RANDOM_STATE
    )

    model.fit(X_train, y_train)

    fold_proba = model.predict_proba(X_test)

    # Reorder probabilities according to official class order.
    # LogisticRegression classes_ should contain [0,1,2], but this guarantees
    # correct ordering.
    aligned_proba = np.zeros_like(fold_proba)

    for local_index, class_index in enumerate(model.classes_):
        aligned_proba[:, int(class_index)] = fold_proba[:, local_index]

    fold_pred = np.argmax(aligned_proba, axis=1)

    oof_proba[test_idx] = aligned_proba
    oof_pred[test_idx] = fold_pred

    fold_accuracy = accuracy_score(y_test, fold_pred)

    print(
        f"  Test samples: {len(test_idx)}"
    )

    print(
        f"  Accuracy: {fold_accuracy:.4f}"
    )


# =============================================================================
# BASIC PERFORMANCE
# =============================================================================

accuracy = accuracy_score(y, oof_pred)

balanced_accuracy = balanced_accuracy_score(
    y,
    oof_pred
)

precision_macro = precision_score(
    y,
    oof_pred,
    average="macro",
    zero_division=0
)

recall_macro = recall_score(
    y,
    oof_pred,
    average="macro",
    zero_division=0
)

f1_macro = f1_score(
    y,
    oof_pred,
    average="macro",
    zero_division=0
)

logloss = log_loss(
    y,
    oof_proba,
    labels=np.arange(n_classes)
)


# =============================================================================
# CONFUSION MATRIX
# =============================================================================

cm = confusion_matrix(
    y,
    oof_pred,
    labels=np.arange(n_classes)
)


# =============================================================================
# SENSITIVITY / SPECIFICITY / PRECISION / F1 PER CLASS
# =============================================================================

metrics_rows = []

for class_index, class_name in enumerate(CLASS_NAMES):

    tp = cm[class_index, class_index]

    fn = cm[class_index, :].sum() - tp

    fp = cm[:, class_index].sum() - tp

    tn = cm.sum() - (tp + fn + fp)

    sensitivity = (
        tp / (tp + fn)
        if (tp + fn) > 0
        else 0.0
    )

    specificity = (
        tn / (tn + fp)
        if (tn + fp) > 0
        else 0.0
    )

    precision = (
        tp / (tp + fp)
        if (tp + fp) > 0
        else 0.0
    )

    f1 = (
        2 * precision * sensitivity /
        (precision + sensitivity)
        if (precision + sensitivity) > 0
        else 0.0
    )

    metrics_rows.append({
        "Class": class_name,
        "Sensitivity": sensitivity,
        "Specificity": specificity,
        "Precision": precision,
        "F1_score": f1,
        "TP": tp,
        "TN": tn,
        "FP": fp,
        "FN": fn
    })


metrics_df = pd.DataFrame(metrics_rows)


# =============================================================================
# MACRO AVERAGES
# =============================================================================

macro_sensitivity = metrics_df["Sensitivity"].mean()
macro_specificity = metrics_df["Specificity"].mean()
macro_precision = metrics_df["Precision"].mean()
macro_f1 = metrics_df["F1_score"].mean()


# =============================================================================
# MULTICLASS ROC-AUC
# =============================================================================

y_binary = label_binarize(
    y,
    classes=np.arange(n_classes)
)

class_auc = {}

for i, class_name in enumerate(CLASS_NAMES):

    class_auc[class_name] = roc_auc_score(
        y_binary[:, i],
        oof_proba[:, i]
    )

roc_auc_macro = roc_auc_score(
    y_binary,
    oof_proba,
    average="macro",
    multi_class="ovr"
)

roc_auc_weighted = roc_auc_score(
    y_binary,
    oof_proba,
    average="weighted",
    multi_class="ovr"
)


# =============================================================================
# CALIBRATION
# =============================================================================

calibration_rows = []

for i, class_name in enumerate(CLASS_NAMES):

    observed = y_binary[:, i]
    predicted = oof_proba[:, i]

    brier = brier_score_loss(
        observed,
        predicted
    )

    fraction_positive, mean_predicted = calibration_curve(
        observed,
        predicted,
        n_bins=10,
        strategy="uniform"
    )

    for bin_number, (mean_p, frac_p) in enumerate(
        zip(mean_predicted, fraction_positive),
        start=1
    ):

        calibration_rows.append({
            "Class": class_name,
            "Bin": bin_number,
            "Mean_Predicted_Probability": mean_p,
            "Observed_Frequency": frac_p
        })


calibration_df = pd.DataFrame(calibration_rows)

brier_scores = {}

for i, class_name in enumerate(CLASS_NAMES):

    brier_scores[class_name] = brier_score_loss(
        y_binary[:, i],
        oof_proba[:, i]
    )

mean_brier = np.mean(
    list(brier_scores.values())
)


# =============================================================================
# PRINT RESULTS
# =============================================================================

print()
print("=" * 80)
print("CONAN CLINICAL MODEL — FINAL PERFORMANCE")
print("=" * 80)

print(f"\nAccuracy:             {accuracy:.6f}")
print(f"Balanced Accuracy:    {balanced_accuracy:.6f}")
print(f"Macro Sensitivity:    {macro_sensitivity:.6f}")
print(f"Macro Specificity:    {macro_specificity:.6f}")
print(f"Macro Precision:      {macro_precision:.6f}")
print(f"Macro F1-score:       {macro_f1:.6f}")
print(f"Macro ROC-AUC:        {roc_auc_macro:.6f}")
print(f"Weighted ROC-AUC:     {roc_auc_weighted:.6f}")
print(f"Log Loss:             {logloss:.6f}")
print(f"Mean Brier Score:     {mean_brier:.6f}")


# =============================================================================
# PER-CLASS METRICS
# =============================================================================

print()
print("=" * 80)
print("PER-CLASS PERFORMANCE")
print("=" * 80)

print(
    metrics_df[
        [
            "Class",
            "Sensitivity",
            "Specificity",
            "Precision",
            "F1_score"
        ]
    ].to_string(index=False)
)


# =============================================================================
# CLASS AUC
# =============================================================================

print()
print("=" * 80)
print("PER-CLASS ROC-AUC")
print("=" * 80)

for class_name in CLASS_NAMES:

    print(
        f"{class_name:10s}: "
        f"{class_auc[class_name]:.6f}"
    )


# =============================================================================
# CONFUSION MATRIX
# =============================================================================

print()
print("=" * 80)
print("CONFUSION MATRIX")
print("=" * 80)

cm_df = pd.DataFrame(
    cm,
    index=[f"Actual {x}" for x in CLASS_NAMES],
    columns=[f"Predicted {x}" for x in CLASS_NAMES]
)

print(cm_df)


# =============================================================================
# SAVE METRICS
# =============================================================================

metrics_output = pd.DataFrame({
    "Metric": [
        "Accuracy",
        "Balanced Accuracy",
        "Sensitivity",
        "Specificity",
        "Precision",
        "F1-score",
        "ROC-AUC",
        "Weighted ROC-AUC",
        "Log Loss",
        "Mean Brier Score"
    ],
    "Value": [
        accuracy,
        balanced_accuracy,
        macro_sensitivity,
        macro_specificity,
        macro_precision,
        macro_f1,
        roc_auc_macro,
        roc_auc_weighted,
        logloss,
        mean_brier
    ]
})

metrics_output.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_evaluation_metrics.csv",
    index=False
)

metrics_df.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_per_class_metrics.csv",
    index=False
)

calibration_df.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_calibration.csv",
    index=False
)


# =============================================================================
# SAVE OOF PREDICTIONS
# =============================================================================

oof_output = pd.DataFrame({
    "Actual": [CLASS_NAMES[i] for i in y],
    "Predicted": [CLASS_NAMES[i] for i in oof_pred],
    "P_LOW": oof_proba[:, 0],
    "P_MODERATE": oof_proba[:, 1],
    "P_HIGH": oof_proba[:, 2],
})

oof_output.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_oof_predictions.csv",
    index=False
)


# =============================================================================
# GRAPH 1 — CONFUSION MATRIX
# =============================================================================

plt.figure(figsize=(8, 6))

plt.imshow(cm, interpolation="nearest")

plt.title(
    "CONAN Clinical Model — Confusion Matrix"
)

plt.xlabel("Predicted Class")
plt.ylabel("Actual Class")

plt.xticks(
    np.arange(n_classes),
    CLASS_NAMES
)

plt.yticks(
    np.arange(n_classes),
    CLASS_NAMES
)

for i in range(n_classes):
    for j in range(n_classes):

        plt.text(
            j,
            i,
            str(cm[i, j]),
            ha="center",
            va="center"
        )

plt.colorbar()

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/conan_clinical_confusion_matrix.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()


# =============================================================================
# GRAPH 2 — SENSITIVITY / SPECIFICITY
# =============================================================================

x = np.arange(n_classes)
width = 0.35

plt.figure(figsize=(9, 6))

plt.bar(
    x - width / 2,
    metrics_df["Sensitivity"],
    width,
    label="Sensitivity"
)

plt.bar(
    x + width / 2,
    metrics_df["Specificity"],
    width,
    label="Specificity"
)

plt.xticks(
    x,
    CLASS_NAMES
)

plt.ylabel("Score")
plt.xlabel("Risk Class")

plt.ylim(0, 1.05)

plt.title(
    "CONAN Clinical Model — Sensitivity and Specificity"
)

plt.legend()

plt.grid(
    axis="y",
    alpha=0.3
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/conan_clinical_sensitivity_specificity.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()


# =============================================================================
# GRAPH 3 — PRECISION / F1
# =============================================================================

plt.figure(figsize=(9, 6))

plt.bar(
    x - width / 2,
    metrics_df["Precision"],
    width,
    label="Precision"
)

plt.bar(
    x + width / 2,
    metrics_df["F1_score"],
    width,
    label="F1-score"
)

plt.xticks(
    x,
    CLASS_NAMES
)

plt.ylabel("Score")
plt.xlabel("Risk Class")

plt.ylim(0, 1.05)

plt.title(
    "CONAN Clinical Model — Precision and F1-score"
)

plt.legend()

plt.grid(
    axis="y",
    alpha=0.3
)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/conan_clinical_precision_f1.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()


# =============================================================================
# GRAPH 4 — MULTICLASS ROC CURVES
# =============================================================================

plt.figure(figsize=(9, 7))

for i, class_name in enumerate(CLASS_NAMES):

    fpr, tpr, _ = roc_curve(
        y_binary[:, i],
        oof_proba[:, i]
    )

    auc_value = roc_auc_score(
        y_binary[:, i],
        oof_proba[:, i]
    )

    plt.plot(
        fpr,
        tpr,
        linewidth=2,
        label=(
            f"{str(class_name).upper()} "
            f"(AUC={auc_value:.3f})"
        )
    )

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1,
    label="Random classifier"
)

plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")

plt.title(
    "CONAN Clinical Model — Multiclass ROC Curves"
)

plt.legend(
    loc="lower right"
)

plt.grid(alpha=0.3)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/conan_clinical_roc_auc.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()


# =============================================================================
# GRAPH 5 — CALIBRATION CURVES
# =============================================================================

plt.figure(figsize=(9, 7))

for i, class_name in enumerate(CLASS_NAMES):

    observed = y_binary[:, i]
    predicted = oof_proba[:, i]

    fraction_positive, mean_predicted = calibration_curve(
        observed,
        predicted,
        n_bins=10,
        strategy="uniform"
    )

    plt.plot(
        mean_predicted,
        fraction_positive,
        marker="o",
        linewidth=2,
        label=(
            f"{str(class_name).upper()} "
            f"(Brier={brier_scores[class_name]:.3f})"
        )
    )

plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--",
    linewidth=1,
    label="Perfect calibration"
)

plt.xlabel("Mean Predicted Probability")
plt.ylabel("Observed Frequency")

plt.title(
    "CONAN Clinical Model — Calibration Curves"
)

plt.legend()

plt.grid(alpha=0.3)

plt.tight_layout()

plt.savefig(
    f"{OUTPUT_DIR}/conan_clinical_calibration.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()


# =============================================================================
# FINAL SUMMARY
# =============================================================================

print()
print("=" * 80)
print("GRAPHICAL OUTPUTS SAVED")
print("=" * 80)

print(
    f"{OUTPUT_DIR}/conan_clinical_confusion_matrix.png"
)

print(
    f"{OUTPUT_DIR}/conan_clinical_sensitivity_specificity.png"
)

print(
    f"{OUTPUT_DIR}/conan_clinical_precision_f1.png"
)

print(
    f"{OUTPUT_DIR}/conan_clinical_roc_auc.png"
)

print(
    f"{OUTPUT_DIR}/conan_clinical_calibration.png"
)


print()
print("=" * 80)
print("DATA OUTPUTS SAVED")
print("=" * 80)

print(
    f"{OUTPUT_DIR}/conan_clinical_evaluation_metrics.csv"
)

print(
    f"{OUTPUT_DIR}/conan_clinical_per_class_metrics.csv"
)

print(
    f"{OUTPUT_DIR}/conan_clinical_calibration.csv"
)

print(
    f"{OUTPUT_DIR}/conan_clinical_oof_predictions.csv"
)


print()
print("=" * 80)
print("CONAN CLINICAL MODEL EVALUATION COMPLETE")
print("=" * 80)