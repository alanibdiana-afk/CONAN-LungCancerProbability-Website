# =============================================================================
# CONAN — DATASET-DERIVED MULTINOMIAL LOGISTIC RISK MODEL
# =============================================================================
#
# PURPOSE:
#   Develop a CONAN-specific three-category clinical risk equation using
#   multinomial logistic regression.
#
# RISK CATEGORIES:
#   LOW
#   MODERATE
#   HIGH
#
# IMPORTANT:
#   - ALL 23 clinical variables are retained.
#   - β coefficients are learned from the CONAN dataset.
#   - No PLCOm2012 coefficients are copied.
#   - No binary LOW vs HIGH/MODERATE collapse is used.
#   - The resulting equations produce three probabilities.
#
# MATHEMATICAL BASIS:
#
#   z_k = β_0k + β_1k X_1 + ... + β_pk X_p
#
#   P(k) = exp(z_k) / Σ exp(z_j)
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
    log_loss,
    confusion_matrix,
    classification_report
)

# =============================================================================
# 1. CONFIGURATION
# =============================================================================

DATA_PATH = "ml/data/cancer patient data sets.csv"

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

# =============================================================================
# 2. LOAD DATA
# =============================================================================

df = pd.read_csv(DATA_PATH)

print("=" * 90)
print("CONAN — DATASET-DERIVED MULTINOMIAL LOGISTIC RISK MODEL")
print("=" * 90)

print(f"\nDataset: {DATA_PATH}")
print(f"Shape:   {df.shape}")

# =============================================================================
# 3. IDENTIFY ALL CLINICAL VARIABLES
# =============================================================================

EXCLUDE_COLUMNS = [
    "index",
    "Patient Id",
    "Level"
]

FEATURES = [
    c for c in df.columns
    if c not in EXCLUDE_COLUMNS
]

print(f"\nClinical feature count: {len(FEATURES)}")

if len(FEATURES) != 23:
    raise ValueError(
        f"Expected 23 clinical variables, found {len(FEATURES)}"
    )

print("\nClinical variables:")

for i, feature in enumerate(FEATURES, 1):
    print(f"{i:02d}. {feature}")

# =============================================================================
# 4. TARGET
# =============================================================================

y = df[TARGET].map(LEVEL_MAP).values

if np.isnan(y).any():
    raise ValueError("Unexpected target values found.")

print("\nTarget distribution:")

print(
    df[TARGET]
    .value_counts()
    .reindex(["High", "Medium", "Low"])
)

# =============================================================================
# 5. FEATURE MATRIX
# =============================================================================

X = df[FEATURES].copy()

# Make sure all predictors are numeric
X = X.apply(pd.to_numeric, errors="raise")

# =============================================================================
# 6. CROSS-VALIDATION
# =============================================================================

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

# =============================================================================
# 7. MODEL
# =============================================================================
#
# IMPORTANT:
#   We deliberately do NOT specify multi_class because recent versions
#   of scikit-learn automatically handle the multiclass case.
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
                solver="lbfgs",
                max_iter=5000,
                random_state=42
            )
        )
    ])

# =============================================================================
# 8. EVALUATION FUNCTION
# =============================================================================

def evaluate_model(X_data, C):

    model = make_model(C)

    proba = cross_val_predict(
        model,
        X_data,
        y,
        cv=cv,
        method="predict_proba",
        n_jobs=-1
    )

    pred = np.argmax(proba, axis=1)

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

    balanced = balanced_accuracy_score(
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
        "AUC": auc,
        "Accuracy": accuracy,
        "Balanced_Accuracy": balanced,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "LogLoss": ll,
        "proba": proba,
        "pred": pred
    }

# =============================================================================
# 9. TEST REGULARIZATION
# =============================================================================

C_VALUES = [
    0.01,
    0.03,
    0.1,
    0.3,
    1.0,
    3.0,
    10.0
]

results = []

print("\n" + "=" * 90)
print("TESTING MULTINOMIAL LOGISTIC REGULARIZATION")
print("=" * 90)

for C in C_VALUES:

    result = evaluate_model(
        X,
        C
    )

    results.append({
        "C": C,
        "ROC_AUC": result["AUC"],
        "Accuracy": result["Accuracy"],
        "Balanced_Accuracy": result["Balanced_Accuracy"],
        "Precision": result["Precision"],
        "Recall": result["Recall"],
        "F1": result["F1"],
        "LogLoss": result["LogLoss"]
    })

    print(
        f"C={C:<5} | "
        f"AUC={result['AUC']:.4f} | "
        f"Accuracy={result['Accuracy']:.4f} | "
        f"Balanced={result['Balanced_Accuracy']:.4f} | "
        f"F1={result['F1']:.4f} | "
        f"LogLoss={result['LogLoss']:.6f}"
    )

results_df = pd.DataFrame(results)

# =============================================================================
# 10. SELECT BEST C
# =============================================================================

best = results_df.sort_values(
    ["ROC_AUC", "F1"],
    ascending=False
).iloc[0]

BEST_C = float(best["C"])

print("\n" + "=" * 90)
print("BEST MULTINOMIAL LOGISTIC MODEL")
print("=" * 90)

print(f"Best C:              {BEST_C}")
print(f"ROC-AUC:             {best['ROC_AUC']:.6f}")
print(f"Accuracy:            {best['Accuracy']:.6f}")
print(f"Balanced Accuracy:   {best['Balanced_Accuracy']:.6f}")
print(f"F1:                  {best['F1']:.6f}")
print(f"Log Loss:            {best['LogLoss']:.6f}")

# =============================================================================
# 11. FINAL OOF EVALUATION
# =============================================================================

final_result = evaluate_model(
    X,
    BEST_C
)

proba = final_result["proba"]
pred = final_result["pred"]

print("\n" + "=" * 90)
print("CONAN MULTINOMIAL LOGISTIC — OUT-OF-FOLD EVALUATION")
print("=" * 90)

print(f"ROC-AUC:             {final_result['AUC']:.6f}")
print(f"Accuracy:            {final_result['Accuracy']:.6f}")
print(f"Balanced Accuracy:   {final_result['Balanced_Accuracy']:.6f}")
print(f"Precision:           {final_result['Precision']:.6f}")
print(f"Recall:              {final_result['Recall']:.6f}")
print(f"F1:                  {final_result['F1']:.6f}")
print(f"Log Loss:            {final_result['LogLoss']:.6f}")

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
# 12. TRAIN FINAL MODEL
# =============================================================================

final_model = make_model(
    BEST_C
)

final_model.fit(
    X,
    y
)

lr = final_model.named_steps["logistic"]

# =============================================================================
# 13. EXTRACT COEFFICIENTS
# =============================================================================

coef = lr.coef_

intercepts = lr.intercept_

# IMPORTANT:
# StandardScaler was used during training.
#
# Convert coefficients back to the ORIGINAL clinical feature scale so that
# the printed equation can directly use the original dataset values.
#
# z = beta_original * X + intercept_original
#
# beta_original = beta_scaled / std
#
# intercept_original =
#   intercept_scaled - Σ(beta_scaled * mean / std)
# =============================================================================

scaler = final_model.named_steps["scaler"]

means = scaler.mean_
stds = scaler.scale_

coef_original = coef / stds

intercepts_original = (
    intercepts
    - np.sum(
        coef * means / stds,
        axis=1
    )
)

# =============================================================================
# 14. COEFFICIENT TABLE
# =============================================================================

coef_table = pd.DataFrame(
    coef_original.T,
    index=FEATURES,
    columns=DISPLAY_NAMES
)

print("\n" + "=" * 90)
print("CONAN β COEFFICIENTS — ORIGINAL FEATURE SCALE")
print("=" * 90)

print("\nIntercepts:")

for i, name in enumerate(DISPLAY_NAMES):
    print(
        f"β0_{name:<9} = "
        f"{intercepts_original[i]:.12f}"
    )

print("\nFeature coefficients:")

print(
    coef_table.to_string()
)

# =============================================================================
# 15. GENERATE THREE LOGISTIC EQUATIONS
# =============================================================================

def format_equation(intercept, coefficients, features):

    equation = f"({intercept:.12f})"

    for beta, feature in zip(
        coefficients,
        features
    ):

        sign = "+" if beta >= 0 else "-"

        equation += (
            f" {sign} "
            f"{abs(beta):.12f}*[{feature}]"
        )

    return equation

equations = {}

for i, category in enumerate(DISPLAY_NAMES):

    equations[category] = format_equation(
        intercepts_original[i],
        coef_original[i],
        FEATURES
    )

print("\n" + "=" * 90)
print("CONAN MULTINOMIAL LOGISTIC EQUATIONS")
print("=" * 90)

for category in DISPLAY_NAMES:

    print(
        f"\nz_{category} = "
        f"{equations[category]}"
    )

# =============================================================================
# 16. PROBABILITY EQUATIONS
# =============================================================================

print("\n" + "=" * 90)
print("CONAN THREE-CLASS PROBABILITY EQUATIONS")
print("=" * 90)

print("""
P(LOW) =
exp(z_LOW) /
[
    exp(z_LOW)
    + exp(z_MODERATE)
    + exp(z_HIGH)
]

P(MODERATE) =
exp(z_MODERATE) /
[
    exp(z_LOW)
    + exp(z_MODERATE)
    + exp(z_HIGH)
]

P(HIGH) =
exp(z_HIGH) /
[
    exp(z_LOW)
    + exp(z_MODERATE)
    + exp(z_HIGH)
]
""")

# =============================================================================
# 17. PREDICTED RISK CATEGORY
# =============================================================================

risk_labels = np.array(
    DISPLAY_NAMES
)

predicted_categories = risk_labels[
    pred
]

risk_distribution = pd.Series(
    predicted_categories
).value_counts()

print("\n" + "=" * 90)
print("OOF PREDICTED RISK DISTRIBUTION")
print("=" * 90)

print(
    risk_distribution
)

# =============================================================================
# 18. SAVE COEFFICIENTS
# =============================================================================

coef_output = coef_table.copy()

coef_output.loc[
    "INTERCEPT"
] = intercepts_original

coef_output.to_csv(
    "ml/clinical/conan_multinomial_logistic_coefficients.csv"
)

# =============================================================================
# 19. SAVE REGULARIZATION RESULTS
# =============================================================================

results_df.to_csv(
    "ml/clinical/conan_multinomial_logistic_regularization.csv",
    index=False
)

# =============================================================================
# 20. SAVE OOF PREDICTIONS
# =============================================================================

oof_df = pd.DataFrame({
    "Actual": risk_labels[y],
    "Predicted": risk_labels[pred],
    "P_LOW": proba[:, 0],
    "P_MODERATE": proba[:, 1],
    "P_HIGH": proba[:, 2]
})

oof_df.to_csv(
    "ml/clinical/conan_multinomial_logistic_oof.csv",
    index=False
)

# =============================================================================
# 21. SAVE FORMULA
# =============================================================================

with open(
    "ml/clinical/conan_multinomial_logistic_formula.txt",
    "w",
    encoding="utf-8"
) as f:

    f.write(
        "CONAN DATASET-DERIVED MULTINOMIAL LOGISTIC RISK MODEL\n"
    )

    f.write(
        "=" * 80 + "\n\n"
    )

    f.write(
        "Risk categories:\n"
    )

    f.write(
        "LOW, MODERATE, HIGH\n\n"
    )

    f.write(
        "Clinical variables: 23\n\n"
    )

    for category in DISPLAY_NAMES:

        f.write(
            f"z_{category} = "
            f"{equations[category]}\n\n"
        )

    f.write(
        "Probability equations:\n\n"
    )

    f.write(
        "P(LOW) = exp(z_LOW) / "
        "(exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH))\n\n"
    )

    f.write(
        "P(MODERATE) = exp(z_MODERATE) / "
        "(exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH))\n\n"
    )

    f.write(
        "P(HIGH) = exp(z_HIGH) / "
        "(exp(z_LOW) + exp(z_MODERATE) + exp(z_HIGH))\n\n"
    )

    f.write(
        "Final risk category = category with maximum probability.\n"
    )

# =============================================================================
# 22. COMPLETION
# =============================================================================

print("\n" + "=" * 90)
print("FILES SAVED")
print("=" * 90)

print(
    "ml/clinical/conan_multinomial_logistic_coefficients.csv"
)

print(
    "ml/clinical/conan_multinomial_logistic_regularization.csv"
)

print(
    "ml/clinical/conan_multinomial_logistic_oof.csv"
)

print(
    "ml/clinical/conan_multinomial_logistic_formula.txt"
)

print("\n" + "=" * 90)
print("CONAN MULTINOMIAL LOGISTIC EXPERIMENT COMPLETE")
print("=" * 90)

print(
    "\n23/23 clinical variables were used."
)

print(
    "Three categories were modeled directly:"
)

print(
    "LOW / MODERATE / HIGH"
)

print(
    "\nβ coefficients were learned from the CONAN dataset."
)

print(
    "No PLCOm2012 coefficients were copied."
)