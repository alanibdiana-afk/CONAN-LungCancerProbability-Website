import json

path = r"ml\data\final-project-v4.ipynb"

with open(path, "r", encoding="utf-8") as f:
    notebook = json.load(f)

for i, cell in enumerate(notebook.get("cells", [])):
    if cell.get("cell_type") != "code":
        continue

    source = "".join(cell.get("source", []))

    if "CACHE_DIR" in source or "CACHE_VERSION" in source:
        print("\n" + "=" * 100)
        print(f"CELL {i}")
        print("=" * 100)
        print(source)
