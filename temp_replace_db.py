import re
from pathlib import Path
root = Path('src')
patterns = [
    (r'doc\(db\s*,', 'doc(db!,'),
    (r'collection\(db\s*,', 'collection(db!,')
]
for path in root.rglob('*'):
    if path.suffix in ('.ts', '.tsx'):
        text = path.read_text(encoding='utf-8', errors='ignore')
        new_text = text
        for pattern, repl in patterns:
            new_text = re.sub(pattern, repl, new_text)
        if new_text != text:
            path.write_text(new_text, encoding='utf-8')
