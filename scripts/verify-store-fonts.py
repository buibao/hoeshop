"""Run with Python + fonttools[brotli]; validates the shipped files, not a fallback.

python -m pip install fonttools brotli
python scripts/verify-store-fonts.py
"""
from pathlib import Path
import json
import unicodedata
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
sample = (
    "Hòe gửi hoa, chill ghé nhà. Những đóa hoa của Hòe "
    "Hoa Tâm — Hoa Thời — Hoa Ý Một chút dịu dàng, một chút yêu thương "
    "Đặt hoa theo cảm xúc — Lịch nhận hoa — Địa chỉ "
    "Ă Â Đ Ê Ô Ơ Ư / ă â đ ê ô ơ ư 0123456789 ₫"
    + "".join(chr(code) for code in range(0x1EA0, 0x1EFA))
)
required = set(map(ord, sample))
results = []
for file in sorted((root / "src/fonts").glob("*.woff2")):
    font = TTFont(file)
    cmap = font.getBestCmap()
    missing = required - cmap.keys()
    assert not missing, f"{file.name}: missing {sorted(missing)}"
    assert "fvar" not in font, f"Expected real static face: {file.name}"
    results.append({"file": file.name, "weight": font["OS/2"].usWeightClass,
                    "italic": bool(font["OS/2"].fsSelection & 1),
                    "vietnamese_nfc": "pass",
                    "combining_horn_cmap": 0x031B in cmap})
non_nfc = []
for folder in ["content", "tests/fixtures/content"]:
    for file in (root / folder).rglob("*"):
        if file.suffix in [".json", ".md"]:
            text = file.read_text(encoding="utf-8-sig")
            if text != unicodedata.normalize("NFC", text):
                non_nfc.append(str(file.relative_to(root)))
print(json.dumps({"faces": results, "non_nfc_content": non_nfc}, indent=2))
