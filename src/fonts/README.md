Store fonts are self-hosted through `next/font/local`; every shipped WOFF2 retains
the source glyph set, including Latin and Vietnamese. There is no runtime font CDN.
The font loader uses `swap` and loads faces on demand instead of preloading all faces.

- TeX Gyre Termes text, version 2.004: Regular 400, Bold 700, Italic 400,
  Bold Italic 700. Downloaded from the official CTAN distribution:
  https://mirrors.ctan.org/fonts/tex-gyre.zip (the `opentype/texgyretermes-*.otf` files).
  Copyright: B. Jackowski and J. M. Nowacki. GUST Font License,
  included in `GUST-FONT-LICENSE.txt`, under LPPL 1.3c or later.
- Cormorant Garamond: real static instances of Normal 500/600 and Italic 500
  generated from the official Google Fonts variable sources. Copyright 2015
  The Cormorant Project Authors. SIL OFL 1.1 in `Cormorant-OFL.txt`.
  Source: https://github.com/google/fonts/tree/main/ofl/cormorantgaramond;
  source metadata is retained in `METADATA.pb`.

Conversion used FontTools 4.66.1 / Brotli 1.2.0: `TTFont(source)`,
`instantiateVariableFont(font, {"wght": weight}, inplace=True)` for Cormorant only,
then `font.flavor = "woff2"; font.save(destination)`. No subsetting or glyph edits.

Run `python scripts/verify-store-fonts.py` to check every face's cmap and actual
weight/style. Termes does not expose standalone combining horn U+031B in cmap;
all Vietnamese precomposed characters are present. Current content is NFC.
The browser review also checks NFC/NFD shaping with actual platform-font inspection.

Store tokens map text weights 500/600 to real 400/700; headings use real 500/600,
and existing italic headings use the actual 500 Italic face. Font synthesis is off.
Root Lora / Be Vietnam Pro remain for Admin/auth and the brand fallback tokens.
