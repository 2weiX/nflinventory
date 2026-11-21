#!/usr/bin/env python3
"""Privacy-guard subset of zipbiz's pipeline/export_aggregates.py, ported 2026-11-21.

bin/sync's privacy check (bin/privacy-staged) imports LEAKS, _fold and
assert_no_personal_data from this module. In zipbiz the same names live inside the full
export pipeline; this repo has no scan state to export, so only the guard itself was
brought over, code verbatim from /home/dennis/zipbiz/pipeline/export_aggregates.py
(2026-11-21). The patterns are the security-relevant part and must not be weakened
here. bin/publish-data's export half stays zipbiz-only on purpose.
"""
import json, re, sys, unicodedata

# Any of these appearing in the output means a record-level field leaked into an aggregate.
LEAKS = (
    ("e-mail address", r"[\w.+-]+@[\w-]+\.[a-z]{2,}"),
    ("e-mail address", r"[\w.+-]+\s*[\[({<]\s*(?:at|ät)\s*[\])}>]\s*[\w-]+"
                       r"(?:\.|\s*[\[({<]\s*(?:dot|punkt)\s*[\])}>]\s*)[a-z]{2,}"),
    ("phone number", r"(?:\+49|\b0)[\d][\d \-/()]{6,}\d"),
    ("phone number", r"(?:\+|\b00)[1-9]\d{0,2}[\d \-/().]{6,}\d"),
    # 2026-11-21 (nflinventory copy): the single-number form fired on a test
    # timing ('money parsing (0.419609ms)') and an agent transcript's metrics
    # ('duration_ms 131.855238'). A real coordinate leak is a PAIR or carries
    # its label - so the pattern wants either 'lat/lon <number>' or a
    # comma-space pair '52.5185, 13.4023'. A lone decimal is a metric, not a
    # coordinate.
    ("coordinate", r"(?:lat|lon|latitude|longitude)\D{0,20}\d{1,3}[.,]\d{4,}"),
    ("coordinate", r"\b\d{1,3}[.,]\d{4,}\s*,\s*-?\d{1,3}[.,]\d{4,}\b"),
    ("street address", r"\b\w*(?:stra(?:ß|ss)e|damm|allee|gasse|platz|weg)\s+\d"),
    ("street address", r"\b\w*str(?:\.\s*|\s+)\d"),
    ("postcode + city", r"\b\d{5}\s+[A-ZÄÖÜ]\w+"),
    ("city + postcode", r"\b[A-ZÄÖÜ][a-zäöüß]+\s+\d{5}\b"),
)
# Case-sensitive: these turn on capitalisation, which re.I would erase. Every label the export
# legitimately carries is sentence case ("Hair & beauty", "No website") or slash-joined
# ("Steuerberater / Buchhaltung"), so two capitalised words in a row read as a person or a street.
SHAPES = (
    ("street address", r"\b[A-ZÄÖÜ][a-zäöüß]+\.?\s+\d{1,4}\s?[a-z]?(?![\d.,])\b"),
    ("personal name", r"\b(?:Inh(?:aber(?:in)?)?|Gesch[äa]ftsf[üu]hrer(?:in)?|GF|Herr|Frau|Dr|Prof)\b\.?:?"
                      r"\s+[A-ZÄÖÜ]"),
    ("personal name", r"\b[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?\s+[A-ZÄÖÜ][a-zäöüß]+"),
)
PROSE_KEYS = {"privacy", "zip", "scan_date", "exported", "radius_km", "status"}


def _fold(s):
    """NFKC and drop invisible format characters, so a zero-width space or a fullwidth '@' cannot
    split a value out of the patterns above."""
    s = unicodedata.normalize("NFKC", s)
    return "".join(c for c in s if unicodedata.category(c) != "Cf")


def assert_no_personal_data(out):
    """Refuse to write an export that carries record-level data. Called on every run."""
    blob = _fold(json.dumps(out, ensure_ascii=False))
    found = [name for name, rx in LEAKS if re.search(rx, blob, re.I)]
    # structural rule: outside the prose fields, every leaf must be a number or a short label.
    # The shape rules run on every key and every string, prose fields included: exempting a field
    # from the length rule must not exempt it from carrying a name or an address.
    def leaves(node, key=None):
        if isinstance(node, dict):
            for k, v in node.items():
                yield str(k)
                yield from leaves(v, k)
        elif isinstance(node, list):
            for v in node:
                yield from leaves(v, key)
        elif isinstance(node, str):
            if key not in PROSE_KEYS and len(node) > 80:
                found.append(f"long free-text value under {key!r}")
            yield node
    for s in leaves(out):
        s = _fold(s)
        found += [name for name, rx in SHAPES if re.search(rx, s)]
    if found:
        sys.exit("REFUSED: export would contain " + ", ".join(sorted(set(found)))
                 + ". Aggregates must be counts only - see bin/privacy-staged.")


if __name__ == "__main__":
    sys.exit("This repo carries only the privacy-guard subset. The full exporter is zipbiz's "
             "pipeline/export_aggregates.py; bin/publish-data is not usable here.")
