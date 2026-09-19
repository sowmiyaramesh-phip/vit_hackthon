from pathlib import Path
p = Path("backend/app/monitor/review_crew.py")
text = p.read_text(encoding="utf-8")
if "import uuid" not in text:
    text = "import uuid\n" + text
text = text.replace(
    'cycle_code = f"CYC-{self.study.study_id}-CUT{self.cut_number}-{int(datetime.utcnow().timestamp())}"',
    'cycle_code = f"CYC-{self.study.study_id}-CUT{self.cut_number}-{uuid.uuid4().hex[:8].upper()}"'
)
p.write_text(text, encoding="utf-8")
print("review_crew.py successfully updated with uuid!")
