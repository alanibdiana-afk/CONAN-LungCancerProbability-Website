# =============================================================================
# CONAN — CLEAN CLINICAL β-FORMULA EXPERIMENT
# =============================================================================
#
# PURPOSE
# -------
# Derive an explicit β-coefficient clinical risk formula for CONAN.
#
# IMPORTANT
# ---------
# 1. This is NOT the original PLCOm2012 equation.
# 2. No PLCOm2012 coefficients are copied or invented.
# 3. All β coefficients are learned from the CONAN dataset.
# 4. No PLCO-inspired feature engineering is used.
# 5. No Age^2, interactions, exposure burden, etc.
# 6. The original clinical variables are preserved.
# 7. Evaluation uses out-of-fold predictions.
# 8. Final coefficients are converted back to the ORIGINAL feature scale,
#    so the printed formula can actually be used by CONAN.
#
# TARGET
# ------
# LOW / MODERATE / HIGH
#
# MODEL
# -----
# Multinomial Logistic Regression
#
# MATHEMATICAL FORM
# -----------------
#
# z_k = β0_k + β1_k X1 + ... + βn_k Xn
#
# P(Y=k) = exp(z_k) / sum_j exp(z_j)
#
# =============================================================================

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    roc_auc_score,
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    log_loss
)

# =============================================================================
# 1. CONFIGURATION
# =============================================================================

DATA_PATH = "ml/data/cancer patient data sets.csv"

OUTPUT_COMPARISON = "ml/clinical/conan_beta_formula_results.csv"
OUTPUT_COEFFICIENTS = "ml/clinical/conan_beta_coefficients.csv"
OUTPUT_FORMULA = "ml/clinical/conan_beta_formula.txt"

RANDOM_STATE = 42

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
print("CONAN — CLEAN CLINICAL β-FORMULA EXPERIMENT")
print("=" * 90)

print(f"\nDataset: {DATA_PATH}")
print(f"Shape:   {df.shape}")

# =============================================================================
# 3. TARGET
# =============================================================================

TARGET = "Level"

LEVEL_MAP = {
    "Low": 0,
    "Medium": 1,
    "High": 2
}

DISPLAY_NAMES = [
    "LOW",
    "MODERATE",
    "HIGH"
]

df["target"] = df[TARGET].map(LEVEL_MAP)

if df["target"].isna().any():
    raise ValueError("Unexpected values found in Level column.")

y = df["target"].astype(int).values

print("\nTarget distribution:")
print(
    df[TARGET]
    .value_counts()
    .reindex(["High", "Medium", "Low"])
)

# =============================================================================
# 4. ORIGINAL CONAN CLINICAL FEATURES
# =============================================================================
#
# IMPORTANT:
# These are the actual available variables.
#
# We are NOT adding:
#   - Age squared
#   - interactions
#   - PLCO synthetic variables
#   - exposure burden
#   - symptom burden
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
        f"Missing required clinical features: {missing}"
    )

X = df[FEATURES].copy()

print("\nClinical feature count:", X.shape[1])

print("\nClinical features:")
for i, feature in enumerate(FEATURES, start=1):
    print(f"{i:02d}. {feature}")

# =============================================================================
# 5. CROSS-VALIDATION
# =============================================================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=RANDOM_STATE
)

# =============================================================================
# 6. MODEL FACTORY
# =============================================================================
#
# IMPORTANT:
# We intentionally DO NOT specify multi_class.
#
# This keeps the script compatible with newer sklearn versions where
# multi_class has changed/deprecated.
#
# lbfgs automatically handles the multiclass problem here.
#
# =============================================================================

def make_model(C=1.0):

    return Pipeline([
        (
            "scaler",
            StandardScaler()
        ),
        (
            "model",
            LogisticRegression(
                C=C,
                solver="lbfgs",
                max_iter=5000,
                random_state=RANDOM_STATE
            )
        )
    ])


# =============================================================================
# 7. EVALUATION FUNCTION
# =============================================================================

def evaluate_model(X_data, C):

    model = make_model(C)

    # -------------------------------------------------------------------------
    # OUT-OF-FOLD PROBABILITIES
    # -------------------------------------------------------------------------

    proba = cross_val_predict(
        model,
        X_data,
        y,
        cv=cv,
        method="predict_proba",
        n_jobs=-1
    )

    pred = np.argmax(proba, axis=1)

    # -------------------------------------------------------------------------
    # METRICS
    # -------------------------------------------------------------------------

    auc = roc_auc_score(
        y,
        proba,
        multi_class="ovr",
        average="macro"
    )

    accuracy = accuracy_score(
        y,
        pred
    )

    balanced_accuracy = balanced_accuracy_score(
        y,
        pred
    )

    precision = precision_score(
        y,
        pred,
        average="macro",
        zero_division=0
    )

    recall = recall_score(
        y,
        pred,
        average="macro",
        zero_division=0
    )

    f1 = f1_score(
        y,
        pred,
        average="macro",
        zero_division=0
    )

    ll = log_loss(
        y,
        proba
    )

    return {
        "C": C,
        "ROC_AUC": auc,
        "Accuracy": accuracy,
        "Balanced_Accuracy": balanced_accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "Log_Loss": ll,
        "proba": proba,
        "pred": pred
    }


# =============================================================================
# 8. TEST REGULARIZATION
# =============================================================================

print("\n")
print("=" * 90)
print("TESTING β-FORMULA REGULARIZATION")
print("=" * 90)

results = []

for C in C_VALUES:

    result = evaluate_model(X, C)

    results.append({
        "C": result["C"],
        "ROC_AUC": result["ROC_AUC"],
        "Accuracy": result["Accuracy"],
        "Balanced_Accuracy": result["Balanced_Accuracy"],
        "Precision": result["Precision"],
        "Recall": result["Recall"],
        "F1": result["F1"],
        "Log_Loss": result["Log_Loss"]
    })

    print(
        f"C={C:<5} | "
        f"AUC={result['ROC_AUC']:.4f} | "
        f"Accuracy={result['Accuracy']:.4f} | "
        f"Balanced={result['Balanced_Accuracy']:.4f} | "
        f"F1={result['F1']:.4f} | "
        f"LogLoss={result['Log_Loss']:.6f}"
    )

results_df = pd.DataFrame(results)

# =============================================================================
# 9. SELECT BEST C
# =============================================================================
#
# Primary criterion:
#   ROC-AUC
#
# Secondary criterion:
#   F1
#
# Tertiary criterion:
#   Log Loss (LOWER is better)
#
# =============================================================================

best_row = (
    results_df
    .sort_values(
        ["ROC_AUC", "F1", "Log_Loss"],
        ascending=[False, False, True]
    )
    .iloc[0]
)

BEST_C = float(best_row["C"])

print("\n")
print("=" * 90)
print("BEST β-FORMULA MODEL")
print("=" * 90)

print(f"Best C:              {BEST_C}")
print(f"ROC-AUC:             {best_row['ROC_AUC']:.6f}")
print(f"Accuracy:            {best_row['Accuracy']:.6f}")
print(f"Balanced Accuracy:   {best_row['Balanced_Accuracy']:.6f}")
print(f"F1:                  {best_row['F1']:.6f}")
print(f"Log Loss:            {best_row['Log_Loss']:.6f}")

# =============================================================================
# 10. FINAL OUT-OF-FOLD EVALUATION
# =============================================================================

best_result = evaluate_model(
    X,
    BEST_C
)

proba = best_result["proba"]
pred = best_result["pred"]

print("\n")
print("=" * 90)
print("CONAN β-FORMULA — OUT-OF-FOLD EVALUATION")
print("=" * 90)

print(
    f"ROC-AUC:             {best_result['ROC_AUC']:.6f}"
)

print(
    f"Accuracy:            {best_result['Accuracy']:.6f}"
)

print(
    f"Balanced Accuracy:   {best_result['Balanced_Accuracy']:.6f}"
)

print(
    f"Precision:           {best_result['Precision']:.6f}"
)

print(
    f"Recall:              {best_result['Recall']:.6f}"
)

print(
    f"F1:                  {best_result['F1']:.6f}"
)

print(
    f"Log Loss:            {best_result['Log_Loss']:.6f}"
)

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y,
        pred
    )
)

print("\nClassification Report:")

print(
    classification_report(
        y,
        pred,
        target_names=DISPLAY_NAMES,
        digits=4,
        zero_division=0
    )
)

# =============================================================================
# 11. TRAIN FINAL MODEL ON ALL DATA
# =============================================================================
#
# This model is ONLY used to obtain the final β coefficients.
#
# Evaluation above remains based on out-of-fold predictions.
#
# =============================================================================

final_model = make_model(BEST_C)

final_model.fit(
    X,
    y
)

scaler = final_model.named_steps["scaler"]
lr = final_model.named_steps["model"]

# =============================================================================
# 12. CONVERT STANDARDIZED COEFFICIENTS TO ORIGINAL-SCALE β COEFFICIENTS
# =============================================================================
#
# sklearn internally uses:
#
# z = intercept_scaled + coef_scaled * ((X - mean) / std)
#
# We convert this to:
#
# z = β0 + β1 X1 + β2 X2 + ...
#
# Therefore:
#
# β_i = coef_i / std_i
#
# β0 = intercept - sum(coef_i * mean_i / std_i)
#
# This gives coefficients that can be used directly with the ORIGINAL
# clinical feature values.
#
# =============================================================================

coef_scaled = lr.coef_
intercept_scaled = lr.intercept_

means = scaler.mean_
stds = scaler.scale_

coef_original = coef_scaled / stds

intercept_original = (
    intercept_scaled
    - np.sum(
        coef_scaled * means / stds,
        axis=1
    )
)

# =============================================================================
# 13. COEFFICIENT TABLE
# =============================================================================

coef_table = pd.DataFrame(
    coef_original.T,
    index=FEATURES,
    columns=[
        "β_LOW",
        "β_MODERATE",
        "β_HIGH"
    ]
)

intercept_table = pd.DataFrame({
    "Class": DISPLAY_NAMES,
    "β0": intercept_original
})

print("\n")
print("=" * 90)
print("CONAN β COEFFICIENTS — ORIGINAL FEATURE SCALE")
print("=" * 90)

print("\nIntercepts:")

for class_name, beta0 in zip(
    DISPLAY_NAMES,
    intercept_original
):
    print(
        f"β0_{class_name:<9} = {beta0:.12f}"
    )

print("\nFeature coefficients:")

print(
    coef_table.to_string(
        float_format=lambda x: f"{x:.12f}"
    )
)

# =============================================================================
# 14. GENERATE HUMAN-READABLE FORMULA
# =============================================================================

def build_formula(
    class_index,
    class_name
):

    terms = []

    beta0 = intercept_original[class_index]

    formula = (
        f"z_{class_name} = "
        f"({beta0:.12f})"
    )

    for feature, beta in zip(
        FEATURES,
        coef_original[class_index]
    ):

        if beta >= 0:
            formula += (
                f" + ({beta:.12f})*{feature}"
            )
        else:
            formula += (
                f" - ({abs(beta):.12f})*{feature}"
            )

    return formula


formulas = {}

for class_index, class_name in enumerate(
    DISPLAY_NAMES
):

    formulas[class_name] = build_formula(
        class_index,
        class_name
    )

# =============================================================================
# 15. PRINT FORMULAS
# =============================================================================

print("\n")
print("=" * 90)
print("CONAN CLINICAL β FORMULA")
print("=" * 90)

for class_name in DISPLAY_NAMES:

    print("\n")
    print(formulas[class_name])

# =============================================================================
# 16. MATHEMATICAL PROBABILITY FORMULA
# =============================================================================

print("\n")
print("=" * 90)
print("CONAN MULTINOMIAL RISK PROBABILITY")
print("=" * 90)

print(
    """
For the three risk classes:

P(LOW) =
exp(z_LOW) /
[exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH)]

P(MODERATE) =
exp(z_MODERATE) /
[exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH)]

P(HIGH) =
exp(z_HIGH) /
[exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH)]
"""
)

# =============================================================================
# 17. CREATE COEFFICIENT CSV
# =============================================================================

coef_output = coef_table.copy()

coef_output.insert(
    0,
    "Feature",
    coef_output.index
)

coef_output.reset_index(
    drop=True,
    inplace=True
)

intercept_rows = pd.DataFrame({
    "Feature": ["INTERCEPT β0"],
    "β_LOW": [intercept_original[0]],
    "β_MODERATE": [intercept_original[1]],
    "β_HIGH": [intercept_original[2]]
})

coef_output = pd.concat(
    [
        intercept_rows,
        coef_output
    ],
    ignore_index=True
)

coef_output.to_csv(
    OUTPUT_COEFFICIENTS,
    index=False
)

# =============================================================================
# 18. SAVE FORMULA TEXT
# =============================================================================

with open(
    OUTPUT_FORMULA,
    "w",
    encoding="utf-8"
) as f:

    f.write(
        "CONAN — CLINICAL β FORMULA\n"
    )

    f.write(
        "=" * 80 + "\n\n"
    )

    f.write(
        "IMPORTANT:\n"
    )

    f.write(
        "These coefficients were learned from the CONAN clinical dataset.\n"
    )

    f.write(
        "They are NOT the original PLCOm2012 coefficients.\n\n"
    )

    f.write(
        f"Best C = {BEST_C}\n\n"
    )

    for class_name in DISPLAY_NAMES:

        f.write(
            formulas[class_name]
        )

        f.write(
            "\n\n"
        )

    f.write(
        "\nPROBABILITY EQUATIONS\n"
    )

    f.write(
        "-" * 80 + "\n\n"
    )

    f.write(
        "P(LOW) = exp(z_LOW) / "
        "[exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH)]\n\n"
    )

    f.write(
        "P(MODERATE) = exp(z_MODERATE) / "
        "[exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH)]\n\n"
    )

    f.write(
        "P(HIGH) = exp(z_HIGH) / "
        "[exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH)]\n"
    )

# =============================================================================
# 19. SAVE PERFORMANCE
# =============================================================================

results_df.to_csv(
    OUTPUT_COMPARISON,
    index=False
)

# =============================================================================
# 20. FINAL SUMMARY
# =============================================================================

print("\n")
print("=" * 90)
print("FILES SAVED")
print("=" * 90)

print(
    OUTPUT_COMPARISON
)

print(
    OUTPUT_COEFFICIENTS
)

print(
    OUTPUT_FORMULA
)

print("\n")
print("=" * 90)
print("CONAN β-FORMULA EXPERIMENT COMPLETE")
print("=" * 90)

print(
    "\nIMPORTANT:"
)

print(
    "The printed β coefficients are on the ORIGINAL clinical feature scale."
)

print(
    "They can therefore be translated directly into the CONAN clinical"
)

print(
    "risk calculation."
)

print(
    "\nThis experiment does NOT claim to reproduce PLCOm2012."
)

print(
    "It establishes an explicit, data-derived CONAN β risk formula."
)