#!/usr/bin/env python3
"""
Build MESSAGES.it / el / ko / zhCN from EN + scripts/.i18n-locale-cache.json.
- Italian: usually already fully cached (prior Google Translate run).
- Other locales: fills missing keys via MyMemory (timeout, no infinite hang), EN fallback on failure.

Usage:
  python3 scripts/build-i18n-locales.py              # emit only (cache + EN fallback)
  python3 scripts/build-i18n-locales.py --fill       # translate missing keys first, then emit
"""
from __future__ import annotations

import argparse
import json
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
I18N = ROOT / "src/js/i18n.js"
CACHE = ROOT / "scripts/.i18n-locale-cache.json"
OUT = ROOT / "scripts/.i18n-generated-locales.js.txt"

socket.setdefaulttimeout(25)

PLACEHOLDER_RE = re.compile(r"\{[a-z]+\}")

# BCP-ish codes for MyMemory + Google gtx (?tl=)
LANG_CODES = {"it": "it", "el": "el", "ko": "ko", "zhCN": "zh-CN"}
LOCALE_COMMENT = {
    "it": "Italian (it-IT): inherits EN; overrides below.",
    "el": "Greek (el-GR): inherits EN; overrides below.",
    "ko": "Korean (ko-KR): inherits EN; overrides below.",
    "zhCN": "Chinese Simplified (zh-CN): inherits EN; overrides below.",
}


def protect_ph(s: str) -> tuple[str, list[str]]:
    found: list[str] = []

    def repl(m: re.Match[str]) -> str:
        t = m.group(0)
        found.append(t)
        return f"⟪{len(found) - 1}⟫"

    return PLACEHOLDER_RE.sub(repl, s), found


def restore_ph(s: str, ph: list[str]) -> str:
    for i, tok in enumerate(ph):
        s = s.replace(f"⟪{i}⟫", tok)
    return s


def js_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def parse_en_block(text: str) -> list[tuple[str, str]]:
    lines = text.splitlines()
    start = next(i for i, l in enumerate(lines) if l.strip().startswith("en: {"))
    depth = 0
    end = None
    for j in range(start, len(lines)):
        depth += lines[j].count("{") - lines[j].count("}")
        if j > start and depth == 0:
            end = j
            break
    inner = lines[start + 1 : end]
    out: list[tuple[str, str]] = []
    for line in inner:
        m = re.match(r"\s+'([^']+)':\s*'(.*)',\s*$", line)
        if not m:
            raise ValueError(f"Unparsed EN line: {line[:120]}")
        out.append((m.group(1), m.group(2)))
    return out


def load_cache() -> dict:
    if CACHE.is_file():
        return json.loads(CACHE.read_text(encoding="utf-8"))
    return {}


def save_cache(c: dict) -> None:
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(c, ensure_ascii=False, indent=0), encoding="utf-8")


def translate_google_gtx(text: str, target: str) -> str | None:
    """Unofficial Google Translate (gtx) — works without API key; use sparingly."""
    if not text.strip():
        return text
    q = text if len(text) <= 4500 else text[:4497] + "..."
    # tl: it, el, ko, zh-CN, etc.
    params = urllib.parse.urlencode({"client": "gtx", "sl": "en", "tl": target, "dt": "t", "q": q})
    url = f"https://translate.googleapis.com/translate_a/single?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "PrizmHub-i18n/1.2"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        data = json.loads(raw)
        if not data or not data[0]:
            return None
        parts = [p[0] for p in data[0] if p and p[0]]
        return "".join(parts) if parts else None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError, IndexError, TypeError):
        return None


def translate_mymemory(text: str, target: str) -> str | None:
    if not text.strip():
        return text
    q = text if len(text) <= 450 else text[:447] + "..."
    pair = f"en|{target}"
    params = urllib.parse.urlencode({"q": q, "langpair": pair})
    url = f"https://api.mymemory.translated.net/get?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "PrizmHub-i18n/1.1"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        data = json.loads(raw)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return None
    if data.get("responseStatus") != 200 or data.get("quotaFinished"):
        return None
    rd = data.get("responseData") or {}
    out = rd.get("translatedText")
    return out if isinstance(out, str) and out else None


def translate_en_string(val: str, lang: str) -> str:
    """Prefer Google gtx, then MyMemory, then original English."""
    tgt = LANG_CODES[lang]
    prot, ph = protect_ph(val)
    tr = translate_google_gtx(prot, tgt)
    if not tr:
        tr = translate_mymemory(prot, tgt)
    if not tr:
        tr = val
    return restore_ph(tr, ph)


def fill_missing(cache: dict, pairs: list[tuple[str, str]], langs: list[str]) -> None:
    for lang in langs:
        nmiss = sum(1 for k, _ in pairs if f"{lang}:{k}" not in cache)
        print(f"[fill] {lang}: missing {nmiss} / {len(pairs)}", flush=True)
        for i, (key, val) in enumerate(pairs):
            ck = f"{lang}:{key}"
            if ck in cache:
                continue
            cache[ck] = translate_en_string(val, lang)
            if i % 25 == 0:
                save_cache(cache)
                print(f"  … {lang} {i}/{len(pairs)}", flush=True)
            time.sleep(0.05)
        save_cache(cache)


def emit_all(cache: dict, pairs: list[tuple[str, str]]) -> str:
    parts: list[str] = []
    for lang in ["it", "el", "ko", "zhCN"]:
        lines = [
            f"  /** {LOCALE_COMMENT[lang]} */",
            f"  MESSAGES.{lang} = Object.assign({{}}, MESSAGES.en, {{",
        ]
        for key, enval in pairs:
            ck = f"{lang}:{key}"
            tr = cache.get(ck, enval)
            lines.append(f"    '{key}': '{js_escape(tr)}',")
        lines.append("  });")
        lines.append("")
        parts.append("\n".join(lines))
    return "\n".join(parts)


def patch_i18n(js_frag: str) -> None:
    """Splice the generated locale blocks directly into src/js/i18n.js."""
    text = I18N.read_text(encoding="utf-8")
    it_marker = "\n\n  /** Italian (it-IT)"
    stor_marker = "\n  function getStoredLang()"
    if it_marker not in text:
        print("ERROR: Italian block marker not found in i18n.js; skipping patch.", flush=True)
        return
    it_start = text.index(it_marker)
    stor_start = text.index(stor_marker)
    new_text = (
        text[:it_start]
        + "\n\n"
        + js_frag.rstrip()
        + "\n"
        + text[stor_start:]
    )
    I18N.write_text(new_text, encoding="utf-8")
    print(f"Patched {I18N} ({len(new_text)} bytes)", flush=True)


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Build / patch MESSAGES.it / el / ko / zhCN in src/js/i18n.js."
    )
    ap.add_argument(
        "--fill",
        action="store_true",
        help="Translate missing keys via Google gtx / MyMemory before emitting.",
    )
    ap.add_argument(
        "--langs",
        default="el,ko,zhCN",
        help="Comma-separated locales to fill (default: el,ko,zhCN).",
    )
    ap.add_argument(
        "--patch",
        action="store_true",
        default=True,
        help="Auto-patch src/js/i18n.js with the generated blocks (default: True).",
    )
    ap.add_argument(
        "--no-patch",
        dest="patch",
        action="store_false",
        help="Skip patching i18n.js; only write the .js.txt fragment.",
    )
    args = ap.parse_args()

    text = I18N.read_text(encoding="utf-8")
    pairs = parse_en_block(text)
    cache = load_cache()

    if args.fill:
        langs = [x.strip() for x in args.langs.split(",") if x.strip()]
        fill_missing(cache, pairs, langs)

    js = emit_all(cache, pairs)
    OUT.write_text(js, encoding="utf-8")
    print(f"Wrote fragment {OUT} ({len(js)} bytes)", flush=True)

    if args.patch:
        patch_i18n(js)
        import subprocess
        result = subprocess.run(["node", "--check", str(I18N)], capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ node --check passed", flush=True)
        else:
            print("✗ node --check FAILED:", result.stderr, flush=True)


if __name__ == "__main__":
    main()
