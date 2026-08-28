import json

path = r"ml\data\final-project-v4.ipynb"

with open(path, "r", encoding="utf-8") as f:
    notebook = json.load(f)

terms = [
    "cnn_finetuned_risk_probability",
    "cnn_finetuned_prediction",
    "resnet50",
    "efficientnet",
    "CLS_CKPT",
    "train_classifier",
    "predict_proba",
    "predict_proba",
    "finetuned",
]

for i, cell in enumerate(notebook.get("cells", [])):
    if cell.get("cell_type") != "code":
        continue

    source = "".join(cell.get("source", []))

    if any(term.lower() in source.lower() for term in terms):
        print("\n" + "=" * 100)
        print(f"CELL {i}")
        print("=" * 100)
        print(source)
