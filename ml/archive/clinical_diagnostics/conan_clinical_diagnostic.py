# =============================================================================
# CONAN — CLINICAL MODEL DIAGNOSTIC
# =============================================================================
#
# Purpose:
#   Determine WHY multinomial logistic regression obtains near/perfect
#   performance on the CONAN clinical dataset.
#
# Checks:
#   1. Target leakage
#   2. Duplicate clinical patterns
#   3. Conflicting clinical patterns
#   4. Class distribution by feature
#   5. Single-feature predictive strength
#   6. Logistic regression baseline
#   7. Decision-tree baseline
#   8. Cross-validation performance
#   9. Coefficient stability
#  10. Exact duplicate rows
#
# =============================================================================

import os
import warnings
import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    roc_auc_score,
)

warnings.filterwarnings("ignore")

# =============================================================================
# CONFIGURATION
# =============================================================================

DATASET = "ml/data/cancer patient data sets.csv"

OUTPUT_DIR = "ml/clinical"
os.makedirs(OUTPUT_DIR, exist_ok=True)

RANDOM_STATE = 42
N_SPLITS = 5

# =============================================================================
# LOAD DATA
# =============================================================================

print("=" * 80)
print("CONAN — CLINICAL MODEL DIAGNOSTIC")
print("=" * 80)

df = pd.read_csv(DATASET)

print(f"\nDataset: {DATASET}")
print(f"Shape:   {df.shape}")

# =============================================================================
# IDENTIFY VARIABLES
# =============================================================================

TARGET = "Level"

DROP_COLUMNS = [
    "index",
    "Patient Id",
    TARGET,
]

FEATURES = [
    c for c in df.columns
    if c not in DROP_COLUMNS
]

print(f"\nClinical feature count: {len(FEATURES)}")

for i, c in enumerate(FEATURES, 1):
    print(f"{i:02d}. {c}")

X = df[FEATURES].copy()
y = df[TARGET].copy()

# Explicit CONAN class order
CLASS_ORDER = ["Low", "Medium", "High"]

y = pd.Categorical(
    y,
    categories=CLASS_ORDER,
    ordered=True
)

y_codes = y.codes

# =============================================================================
# TARGET DISTRIBUTION
# =============================================================================

print("\n" + "=" * 80)
print("TARGET DISTRIBUTION")
print("=" * 80)

print(
    pd.Series(y)
    .value_counts()
    .reindex(CLASS_ORDER)
)

# =============================================================================
# 1. CHECK TARGET LEAKAGE THROUGH COLUMNS
# =============================================================================

print("\n" + "=" * 80)
print("1. TARGET LEAKAGE CHECK")
print("=" * 80)

print("\nColumns excluded from modeling:")

for c in DROP_COLUMNS:
    print(f"  - {c}")

print("\nPotential leakage inspection:")

for c in df.columns:
    if c == TARGET:
        continue

    name_lower = c.lower()

    suspicious_terms = [
        "level",
        "target",
        "label",
        "risk",
        "class",
        "diagnosis",
        "outcome",
        "cancer"
    ]

    if any(term in name_lower for term in suspicious_terms):
        print(f"  WARNING: suspicious column -> {c}")

print("\nNo obvious target-named clinical feature should remain.")

# =============================================================================
# 2. EXACT DUPLICATE ROW CHECK
# =============================================================================

print("\n" + "=" * 80)
print("2. EXACT DUPLICATE CHECK")
print("=" * 80)

duplicate_count = df.duplicated().sum()

print(f"Exact duplicated rows: {duplicate_count}")

if duplicate_count > 0:
    print("\nWARNING:")
    print("Exact duplicate rows exist and may cross validation folds.")

# =============================================================================
# 3. UNIQUE CLINICAL PATTERN CHECK
# =============================================================================

print("\n" + "=" * 80)
print("3. UNIQUE CLINICAL PATTERN ANALYSIS")
print("=" * 80)

pattern_counts = X.astype(str).agg("|".join, axis=1)

unique_patterns = pattern_counts.nunique()

print(f"Total patients:              {len(df)}")
print(f"Unique clinical patterns:    {unique_patterns}")
print(f"Repeated pattern rows:       {len(df) - unique_patterns}")

# =============================================================================
# 4. CHECK WHETHER IDENTICAL PATTERNS HAVE DIFFERENT TARGETS
# =============================================================================

print("\n" + "=" * 80)
print("4. CLINICAL PATTERN → TARGET CONSISTENCY")
print("=" * 80)

pattern_table = pd.DataFrame({
    "pattern": pattern_counts,
    "target": df[TARGET].astype(str)
})

pattern_target_counts = (
    pattern_table
    .groupby("pattern")["target"]
    .nunique()
)

conflicting_patterns = (
    pattern_target_counts[
        pattern_target_counts > 1
    ]
)

print(
    f"Patterns with conflicting classes: "
    f"{len(conflicting_patterns)}"
)

if len(conflicting_patterns) == 0:
    print(
        "\nIMPORTANT:"
        "\nEvery repeated clinical pattern maps to exactly one class."
    )
    print(
        "This means the dataset contains deterministic class patterns."
    )
else:
    print(
        "\nSome identical clinical patterns occur with different classes."
    )

# =============================================================================
# 5. SHOW MOST COMMON CLINICAL PATTERNS
# =============================================================================

print("\n" + "=" * 80)
print("5. MOST COMMON CLINICAL PATTERNS")
print("=" * 80)

common_patterns = (
    pattern_table
    .groupby(["pattern", "target"])
    .size()
    .reset_index(name="count")
    .sort_values("count", ascending=False)
    .head(20)
)

print(common_patterns.to_string(index=False))

# =============================================================================
# 6. FEATURE / TARGET ASSOCIATION
# =============================================================================

print("\n" + "=" * 80)
print("6. FEATURE–TARGET ASSOCIATION")
print("=" * 80)

association_results = []

for feature in FEATURES:

    means = (
        df.groupby(TARGET)[feature]
        .mean()
        .reindex(CLASS_ORDER)
    )

    # ANOVA-like between-class variance ratio
    overall_mean = df[feature].mean()

    between = sum(
        len(df[df[TARGET] == cls]) *
        (means.loc[cls] - overall_mean) ** 2
        for cls in CLASS_ORDER
    )

    within = 0.0

    for cls in CLASS_ORDER:
        values = df.loc[df[TARGET] == cls, feature]
        within += ((values - means.loc[cls]) ** 2).sum()

    eta_squared = (
        between / (between + within)
        if (between + within) > 0
        else 0
    )

    association_results.append({
        "Feature": feature,
        "Eta_squared": eta_squared,
        "Low_mean": means["Low"],
        "Medium_mean": means["Medium"],
        "High_mean": means["High"],
    })

association_df = (
    pd.DataFrame(association_results)
    .sort_values("Eta_squared", ascending=False)
)

print(
    association_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.4f}"
    )
)

association_df.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_feature_association.csv",
    index=False
)

# =============================================================================
# 7. SINGLE-FEATURE LOGISTIC TEST
# =============================================================================

print("\n" + "=" * 80)
print("7. SINGLE-FEATURE MULTINOMIAL LOGISTIC TEST")
print("=" * 80)

cv = StratifiedKFold(
    n_splits=N_SPLITS,
    shuffle=True,
    random_state=RANDOM_STATE
)

single_feature_results = []

for feature in FEATURES:

    Xi = X[[feature]]

    model = Pipeline([
        ("scaler", StandardScaler()),
        (
            "logistic",
            LogisticRegression(
                C=0.1,
                max_iter=5000,
                solver="lbfgs"
            )
        )
    ])

    scores = cross_val_score(
        model,
        Xi,
        y_codes,
        cv=cv,
        scoring="accuracy"
    )

    single_feature_results.append({
        "Feature": feature,
        "Mean_CV_Accuracy": scores.mean(),
        "Std_CV_Accuracy": scores.std()
    })

single_feature_df = (
    pd.DataFrame(single_feature_results)
    .sort_values(
        "Mean_CV_Accuracy",
        ascending=False
    )
)

print(
    single_feature_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.4f}"
    )
)

single_feature_df.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_single_feature_results.csv",
    index=False
)

# =============================================================================
# 8. MULTINOMIAL LOGISTIC BASELINE
# =============================================================================

print("\n" + "=" * 80)
print("8. MULTINOMIAL LOGISTIC BASELINE")
print("=" * 80)

logistic_model = Pipeline([
    ("scaler", StandardScaler()),
    (
        "logistic",
        LogisticRegression(
            C=0.1,
            max_iter=5000,
            solver="lbfgs"
        )
    )
])

logistic_scores = cross_val_score(
    logistic_model,
    X,
    y_codes,
    cv=cv,
    scoring="accuracy"
)

print(
    f"Mean CV Accuracy: {logistic_scores.mean():.6f}"
)

print(
    f"Std CV Accuracy:  {logistic_scores.std():.6f}"
)

print(
    f"Fold scores:      "
    f"{np.round(logistic_scores, 6)}"
)

# =============================================================================
# 9. DECISION TREE BASELINES
# =============================================================================

print("\n" + "=" * 80)
print("9. DECISION TREE BASELINES")
print("=" * 80)

tree_results = []

for depth in [1, 2, 3, 4, 5, None]:

    tree = DecisionTreeClassifier(
        max_depth=depth,
        random_state=RANDOM_STATE
    )

    scores = cross_val_score(
        tree,
        X,
        y_codes,
        cv=cv,
        scoring="accuracy"
    )

    tree_results.append({
        "Depth": depth,
        "Mean_CV_Accuracy": scores.mean(),
        "Std_CV_Accuracy": scores.std()
    })

    print(
        f"Depth={str(depth):>4} | "
        f"Accuracy={scores.mean():.6f} | "
        f"Std={scores.std():.6f}"
    )

tree_df = pd.DataFrame(tree_results)

tree_df.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_tree_diagnostic.csv",
    index=False
)

# =============================================================================
# 10. CHECK WHETHER TARGET CAN BE RECONSTRUCTED FROM SIMPLE RULES
# =============================================================================

print("\n" + "=" * 80)
print("10. SIMPLE FEATURE-TARGET RELATIONSHIPS")
print("=" * 80)

for feature in association_df.head(10)["Feature"]:

    print(f"\n--- {feature} ---")

    table = pd.crosstab(
        df[feature],
        df[TARGET]
    )

    print(table.to_string())

# =============================================================================
# 11. COEFFICIENT STABILITY
# =============================================================================

print("\n" + "=" * 80)
print("11. LOGISTIC COEFFICIENT STABILITY")
print("=" * 80)

coefficient_records = []

for fold, (train_idx, test_idx) in enumerate(
    cv.split(X, y_codes),
    start=1
):

    model = Pipeline([
        ("scaler", StandardScaler()),
        (
            "logistic",
            LogisticRegression(
                C=0.1,
                max_iter=5000,
                solver="lbfgs"
            )
        )
    ])

    model.fit(
        X.iloc[train_idx],
        y_codes[train_idx]
    )

    classifier = model.named_steps["logistic"]

    for class_index, class_name in enumerate(
        classifier.classes_
    ):

        for feature_index, feature in enumerate(FEATURES):

            coefficient_records.append({
                "Fold": fold,
                "Class": CLASS_ORDER[class_index],
                "Feature": feature,
                "Coefficient": classifier.coef_[
                    class_index,
                    feature_index
                ]
            })

coef_df = pd.DataFrame(coefficient_records)

coef_summary = (
    coef_df
    .groupby(["Class", "Feature"])["Coefficient"]
    .agg(
        Mean="mean",
        Std="std",
        Minimum="min",
        Maximum="max"
    )
    .reset_index()
)

coef_summary.to_csv(
    f"{OUTPUT_DIR}/conan_clinical_coefficient_stability.csv",
    index=False
)

print(
    "\nCoefficient stability saved to:"
    "\nml/clinical/conan_clinical_coefficient_stability.csv"
)

# =============================================================================
# 12. FINAL DIAGNOSTIC INTERPRETATION
# =============================================================================

print("\n" + "=" * 80)
print("12. DIAGNOSTIC SUMMARY")
print("=" * 80)

print(
    f"\nUnique clinical patterns: "
    f"{unique_patterns} / {len(df)}"
)

print(
    f"Conflicting patterns: "
    f"{len(conflicting_patterns)}"
)

print(
    f"Logistic CV accuracy: "
    f"{logistic_scores.mean():.6f}"
)

best_single = single_feature_df.iloc[0]

print(
    f"\nBest single feature:"
    f"\n  {best_single['Feature']}"
    f"\n  CV Accuracy = {best_single['Mean_CV_Accuracy']:.6f}"
)

best_tree = tree_df.iloc[
    tree_df["Mean_CV_Accuracy"].argmax()
]

print(
    f"\nBest decision tree:"
    f"\n  Depth = {best_tree['Depth']}"
    f"\n  CV Accuracy = {best_tree['Mean_CV_Accuracy']:.6f}"
)

print("\nInterpretation:")

if logistic_scores.mean() >= 0.99:

    print(
        """
The clinical dataset produces near-perfect multinomial
logistic classification.

This result requires further investigation before the model
is described as generalizable clinical performance.

The next investigation should focus on whether the dataset
itself contains deterministic or synthetic relationships
between the clinical variables and the risk class.
"""
    )

elif logistic_scores.mean() >= 0.90:

    print(
        """
The clinical dataset is highly predictive.

The model should undergo additional external/generalization
analysis before final deployment.
"""
    )

else:

    print(
        """
The clinical model does not show perfect predictive behavior.
This is more consistent with a difficult clinical prediction
problem.
"""
    )

print("\n" + "=" * 80)
print("DIAGNOSTIC COMPLETE")
print("=" * 80)

print("\nSaved diagnostic files:")

print("ml/clinical/conan_clinical_feature_association.csv")
print("ml/clinical/conan_clinical_single_feature_results.csv")
print("ml/clinical/conan_clinical_tree_diagnostic.csv")
print("ml/clinical/conan_clinical_coefficient_stability.csv")