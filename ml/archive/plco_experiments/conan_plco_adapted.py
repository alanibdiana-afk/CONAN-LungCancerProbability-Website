# =============================================================================
# CONAN — PLCOm2012-INSPIRED ADAPTED CLINICAL β-RISK EQUATION
# =============================================================================
#
# PURPOSE
# -------
# Adapt the general mathematical structure of established lung-cancer
# risk equations to ALL available CONAN clinical variables.
#
# IMPORTANT
# ---------
# This is NOT the original PLCOm2012 equation.
#
# PLCOm2012 provides the risk-equation framework:
#
#       Linear Predictor = β0 + β1X1 + β2X2 + ... + βnXn
#       Probability      = 1 / (1 + exp(-Linear Predictor))
#
# The β coefficients below are estimated from the CONAN dataset.
#
# ALL 23 CONAN clinical variables are used.
#
# The experiment is kept separate from the original CONAN model.
#
# =============================================================================

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    roc_auc_score,
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    log_loss,
    confusion_matrix,
    classification_report
)

# =============================================================================
# 1. SETTINGS
# =============================================================================

DATA_PATH = "ml/data/cancer patient data sets.csv"

RANDOM_STATE = 42
N_SPLITS = 5

# Regularization values to test
C_VALUES = [
    0.01,
    0.03,
    0.1,
    0.3,
    1.0,
    3.0,
    10.0
]

# =============================================================================
# 2. LOAD DATA
# =============================================================================

df = pd.read_csv(DATA_PATH)

print("=" * 90)
print("CONAN — PLCOm2012-INSPIRED ADAPTED CLINICAL β-RISK EQUATION")
print("=" * 90)

print(f"\nDataset: {DATA_PATH}")
print(f"Shape:   {df.shape}")

# =============================================================================
# 3. CONAN CLINICAL VARIABLES
# =============================================================================
#
# ALL available clinical variables are included.
#
# =============================================================================

FEATURES = [
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
    "Snoring"
]

missing = [
    feature
    for feature in FEATURES
    if feature not in df.columns
]

if missing:
    raise ValueError(
        "The following CONAN clinical variables are missing:\n"
        + "\n".join(missing)
    )

X = df[FEATURES].copy()

print("\nClinical feature count:", X.shape[1])

print("\nClinical variables:")
for i, feature in enumerate(FEATURES, 1):
    print(f"{i:02d}. {feature}")

# =============================================================================
# 4. TARGET
# =============================================================================

TARGET = "Level"

LEVEL_MAP = {
    "Low": 0,
    "Medium": 1,
    "High": 2
}

y_multiclass = df[TARGET].map(LEVEL_MAP)

if y_multiclass.isna().any():
    raise ValueError("Unexpected Level values found.")

y_multiclass = y_multiclass.astype(int)

print("\nTarget distribution:")
print(df[TARGET].value_counts())

# =============================================================================
# 5. CREATE BINARY CLINICAL RISK TARGET
# =============================================================================
#
# We need ONE probability for the β-risk equation.
#
# Therefore:
#
# LOW       = 0
# MODERATE  = 1
# HIGH      = 1
#
# This makes the equation estimate:
#
#       P(MODERATE or HIGH clinical risk)
#
# rather than creating three separate β equations.
#
# =============================================================================

y_binary = (y_multiclass >= 1).astype(int)

print("\nBinary clinical-risk target:")
print("0 = LOW")
print("1 = MODERATE/HIGH")

print("\nBinary distribution:")
print(
    pd.Series(y_binary)
    .map({
        0: "LOW",
        1: "MODERATE/HIGH"
    })
    .value_counts()
)

# =============================================================================
# 6. CROSS-VALIDATION
# =============================================================================

cv = StratifiedKFold(
    n_splits=N_SPLITS,
    shuffle=True,
    random_state=RANDOM_STATE
)

# =============================================================================
# 7. MODEL
# =============================================================================
#
# Standardization is performed INSIDE the pipeline.
#
# This prevents information leakage during cross-validation.
#
# =============================================================================

def make_model(C):

    return Pipeline([
        (
            "scaler",
            StandardScaler()
        ),
        (
            "logistic",
            LogisticRegression(
                C=C,
                penalty="l2",
                solver="lbfgs",
                max_iter=5000,
                random_state=RANDOM_STATE
            )
        )
    ])

# =============================================================================
# 8. TEST REGULARIZATION
# =============================================================================

print("\n")
print("=" * 90)
print("TESTING β-RISK EQUATION REGULARIZATION")
print("=" * 90)

results = []

for C in C_VALUES:

    model = make_model(C)

    # Out-of-fold probability
    proba = cross_val_predict(
        model,
        X,
        y_binary,
        cv=cv,
        method="predict_proba",
        n_jobs=-1
    )[:, 1]

    pred = (proba >= 0.50).astype(int)

    auc = roc_auc_score(
        y_binary,
        proba
    )

    accuracy = accuracy_score(
        y_binary,
        pred
    )

    balanced = balanced_accuracy_score(
        y_binary,
        pred
    )

    precision = precision_score(
        y_binary,
        pred,
        zero_division=0
    )

    recall = recall_score(
        y_binary,
        pred,
        zero_division=0
    )

    f1 = f1_score(
        y_binary,
        pred,
        zero_division=0
    )

    ll = log_loss(
        y_binary,
        proba
    )

    results.append({
        "C": C,
        "ROC_AUC": auc,
        "Accuracy": accuracy,
        "Balanced_Accuracy": balanced,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "LogLoss": ll
    })

    print(
        f"C={C:<5} | "
        f"AUC={auc:.4f} | "
        f"Accuracy={accuracy:.4f} | "
        f"Balanced={balanced:.4f} | "
        f"F1={f1:.4f} | "
        f"LogLoss={ll:.6f}"
    )

results_df = pd.DataFrame(results)

# =============================================================================
# 9. SELECT BEST MODEL
# =============================================================================

best_row = results_df.sort_values(
    ["ROC_AUC", "F1"],
    ascending=False
).iloc[0]

BEST_C = float(best_row["C"])

print("\n")
print("=" * 90)
print("BEST β-RISK EQUATION")
print("=" * 90)

print(f"Best C:             {BEST_C}")
print(f"ROC-AUC:            {best_row['ROC_AUC']:.6f}")
print(f"Accuracy:           {best_row['Accuracy']:.6f}")
print(f"Balanced Accuracy:  {best_row['Balanced_Accuracy']:.6f}")
print(f"F1:                 {best_row['F1']:.6f}")
print(f"Log Loss:           {best_row['LogLoss']:.6f}")

# =============================================================================
# 10. FINAL OOF EVALUATION
# =============================================================================

final_model = make_model(BEST_C)

oof_probability = cross_val_predict(
    final_model,
    X,
    y_binary,
    cv=cv,
    method="predict_proba",
    n_jobs=-1
)[:, 1]

oof_prediction = (
    oof_probability >= 0.50
).astype(int)

auc = roc_auc_score(
    y_binary,
    oof_probability
)

accuracy = accuracy_score(
    y_binary,
    oof_prediction
)

balanced = balanced_accuracy_score(
    y_binary,
    oof_prediction
)

precision = precision_score(
    y_binary,
    oof_prediction,
    zero_division=0
)

recall = recall_score(
    y_binary,
    oof_prediction,
    zero_division=0
)

f1 = f1_score(
    y_binary,
    oof_prediction,
    zero_division=0
)

ll = log_loss(
    y_binary,
    oof_probability
)

print("\n")
print("=" * 90)
print("CONAN ADAPTED β-RISK EQUATION — OUT-OF-FOLD EVALUATION")
print("=" * 90)

print(f"ROC-AUC:             {auc:.6f}")
print(f"Accuracy:            {accuracy:.6f}")
print(f"Balanced Accuracy:   {balanced:.6f}")
print(f"Precision:           {precision:.6f}")
print(f"Recall:              {recall:.6f}")
print(f"F1:                  {f1:.6f}")
print(f"Log Loss:            {ll:.6f}")

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_binary,
        oof_prediction
    )
)

print("\nClassification Report:")

print(
    classification_report(
        y_binary,
        oof_prediction,
        target_names=[
            "LOW",
            "MODERATE/HIGH"
        ],
        digits=4,
        zero_division=0
    )
)

# =============================================================================
# 11. TRAIN FINAL MODEL ON ALL DATA
# =============================================================================
#
# This is ONLY for extracting the final β coefficients.
#
# Performance above remains the OOF performance.
#
# =============================================================================

final_model.fit(
    X,
    y_binary
)

scaler = final_model.named_steps["scaler"]
logistic = final_model.named_steps["logistic"]

# =============================================================================
# 12. CONVERT STANDARDIZED β TO ORIGINAL FEATURE SCALE
# =============================================================================
#
# Logistic regression was trained on:
#
#       X_standardized
#
# We convert coefficients back to:
#
#       original CONAN feature scale
#
# so that the final equation can directly use the questionnaire values.
#
# =============================================================================

beta_standardized = logistic.coef_[0]
intercept_standardized = logistic.intercept_[0]

means = scaler.mean_
scales = scaler.scale_

beta_original = beta_standardized / scales

beta0_original = (
    intercept_standardized
    - np.sum(
        beta_standardized * means / scales
    )
)

# =============================================================================
# 13. COEFFICIENT TABLE
# =============================================================================

coef_table = pd.DataFrame({
    "Feature": FEATURES,
    "Beta": beta_original
})

print("\n")
print("=" * 90)
print("CONAN ADAPTED β COEFFICIENTS")
print("=" * 90)

print(
    f"\nβ0 (Intercept) = {beta0_original:.12f}"
)

print("\nFeature coefficients:")

print(
    coef_table.to_string(
        index=False
    )
)

# =============================================================================
# 14. PRINT COMPLETE FORMULA
# =============================================================================

print("\n")
print("=" * 90)
print("CONAN PLCOm2012-INSPIRED ADAPTED CLINICAL β FORMULA")
print("=" * 90)

formula = f"LP = ({beta0_original:.12f})"

for feature, beta in zip(
    FEATURES,
    beta_original
):

    sign = "+" if beta >= 0 else "-"

    formula += (
        f" {sign} "
        f"{abs(beta):.12f}*[{feature}]"
    )

print("\n")
print(formula)

print("\n")
print("Clinical probability:")
print(
    "P(clinical risk) = "
    "1 / (1 + exp(-LP))"
)

# =============================================================================
# 15. RISK CATEGORIES
# =============================================================================
#
# IMPORTANT:
#
# We do NOT claim that PLCOm2012's original probability thresholds apply
# directly to CONAN.
#
# We initially use:
#
#       LOW            < 0.33
#       MODERATE       0.33–0.66
#       HIGH           >= 0.66
#
# These are CONAN classification thresholds for this experiment.
#
# =============================================================================

LOW_THRESHOLD = 0.33
HIGH_THRESHOLD = 0.66

def classify_risk(probability):

    if probability < LOW_THRESHOLD:
        return "LOW"

    elif probability < HIGH_THRESHOLD:
        return "MODERATE"

    else:
        return "HIGH"

risk_classes = np.array([
    classify_risk(p)
    for p in oof_probability
])

print("\n")
print("=" * 90)
print("CONAN CLINICAL RISK CATEGORIES")
print("=" * 90)

print(
    f"\nLOW:       P < {LOW_THRESHOLD}"
)

print(
    f"MODERATE:  {LOW_THRESHOLD} ≤ P < {HIGH_THRESHOLD}"
)

print(
    f"HIGH:      P ≥ {HIGH_THRESHOLD}"
)

print("\nOOF predicted risk distribution:")

print(
    pd.Series(
        risk_classes
    ).value_counts()
)

# =============================================================================
# 16. FEATURE CONTRIBUTION
# =============================================================================
#
# β magnitude alone does not tell the whole story because the variables have
# different scales.
#
# This table is provided for interpretation.
#
# =============================================================================

importance = pd.DataFrame({
    "Feature": FEATURES,
    "Beta": beta_original,
    "Absolute_Beta": np.abs(beta_original)
}).sort_values(
    "Absolute_Beta",
    ascending=False
)

print("\n")
print("=" * 90)
print("MOST INFLUENTIAL β COEFFICIENTS")
print("=" * 90)

print(
    importance.to_string(
        index=False
    )
)

# =============================================================================
# 17. SAVE COEFFICIENTS
# =============================================================================

coef_output = pd.DataFrame({
    "Feature": ["Intercept"] + FEATURES,
    "Beta": [beta0_original] + list(beta_original)
})

coef_output.to_csv(
    "ml/clinical/conan_plco_adapted_coefficients.csv",
    index=False
)

# =============================================================================
# 18. SAVE REGULARIZATION RESULTS
# =============================================================================

results_df.to_csv(
    "ml/clinical/conan_plco_adapted_regularization.csv",
    index=False
)

# =============================================================================
# 19. SAVE OOF PREDICTIONS
# =============================================================================

oof_output = df[
    ["Patient Id", "Level"]
].copy()

oof_output["Clinical_Probability"] = oof_probability

oof_output["Predicted_Risk"] = risk_classes

oof_output.to_csv(
    "ml/clinical/conan_plco_adapted_oof_predictions.csv",
    index=False
)

# =============================================================================
# 20. SAVE HUMAN-READABLE FORMULA
# =============================================================================

with open(
    "ml/clinical/conan_plco_adapted_formula.txt",
    "w",
    encoding="utf-8"
) as f:

    f.write(
        "CONAN — PLCOm2012-INSPIRED ADAPTED CLINICAL β-RISK EQUATION\n"
    )

    f.write("=" * 80 + "\n\n")

    f.write(
        "This is a CONAN-specific adapted risk equation.\n"
    )

    f.write(
        "It does NOT reproduce the original PLCOm2012 equation.\n\n"
    )

    f.write(
        "Linear predictor:\n\n"
    )

    f.write(
        formula + "\n\n"
    )

    f.write(
        "Probability:\n\n"
    )

    f.write(
        "P(clinical risk) = 1 / (1 + exp(-LP))\n\n"
    )

    f.write(
        "Risk categories:\n"
    )

    f.write(
        f"LOW       : P < {LOW_THRESHOLD}\n"
    )

    f.write(
        f"MODERATE  : {LOW_THRESHOLD} <= P < {HIGH_THRESHOLD}\n"
    )

    f.write(
        f"HIGH      : P >= {HIGH_THRESHOLD}\n\n"
    )

    f.write(
        "β coefficients:\n\n"
    )

    f.write(
        coef_output.to_string(index=False)
    )

# =============================================================================
# 21. FINAL SUMMARY
# =============================================================================

print("\n")
print("=" * 90)
print("FILES SAVED")
print("=" * 90)

print(
    "ml/clinical/conan_plco_adapted_coefficients.csv"
)

print(
    "ml/clinical/conan_plco_adapted_regularization.csv"
)

print(
    "ml/clinical/conan_plco_adapted_oof_predictions.csv"
)

print(
    "ml/clinical/conan_plco_adapted_formula.txt"
)

print("\n")
print("=" * 90)
print("CONAN PLCO-INSPIRED ADAPTATION COMPLETE")
print("=" * 90)

print(
    "\n23/23 CONAN clinical variables were included."
)

print(
    "\nONE β equation → ONE clinical probability → "
    "LOW / MODERATE / HIGH"
)

print(
    "\nThe original CONAN model remains unchanged."
)

print(
    "\nThis experiment is separate and can be discarded "
    "if it does not improve the baseline."
)