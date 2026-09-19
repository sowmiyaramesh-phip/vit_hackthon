# Builder script for ATLAS + MONITOR backend
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
BACKEND = BASE / 'backend' / 'app'

def write_file(rel_path, content):
    target = BACKEND / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + '\n', encoding='utf-8')
    print(f'Wrote: {rel_path}')

print('Builder initialized')
