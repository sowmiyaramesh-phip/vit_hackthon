# Script to write backend/app/api/endpoints.py
from pathlib import Path

out_path = Path("backend/app/api/endpoints.py")
out_path.parent.mkdir(parents=True, exist_ok=True)
print("Target ready:", out_path)
