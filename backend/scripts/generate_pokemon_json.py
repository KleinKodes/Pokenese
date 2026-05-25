#!/usr/bin/env python3
"""
Convert the frontend TypeScript pokemon.ts constant file to pokemon.json.

This is a simple regex/string parsing approach — it extracts the JSON array
embedded in the TypeScript file and writes it to data/pokemon.json.

Usage:
    python scripts/generate_pokemon_json.py [--input path/to/pokemon.ts] [--output data/pokemon.json]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _strip_ts_comments(content: str) -> str:
    """Remove single-line (//) and multi-line (/* */) TypeScript comments."""
    # Remove block comments
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    # Remove line comments (but not URLs like http://)
    content = re.sub(r"(?<!:)//[^\n]*", "", content)
    return content


def _extract_json_array(ts_content: str) -> str:
    """
    Extract the JSON array from a TypeScript file like:
        export const POKEMON_DATA: PokemonType[] = [ ... ];

    Returns the raw JSON string.
    """
    # Strip comments first
    clean = _strip_ts_comments(ts_content)

    # Find the array start
    # Pattern: = [ or = [
    match = re.search(r"=\s*(\[)", clean)
    if not match:
        raise ValueError("Could not find array assignment in TypeScript file")

    array_start = match.start(1)
    depth = 0
    in_string = False
    string_char = None
    i = array_start

    while i < len(clean):
        ch = clean[i]

        if in_string:
            if ch == "\\" and i + 1 < len(clean):
                i += 2  # skip escaped character
                continue
            if ch == string_char:
                in_string = False
        else:
            if ch in ('"', "'", "`"):
                in_string = True
                string_char = ch
            elif ch == "[" or ch == "{":
                depth += 1
            elif ch == "]" or ch == "}":
                depth -= 1
                if depth == 0:
                    array_end = i + 1
                    return clean[array_start:array_end]
        i += 1

    raise ValueError("Unterminated array in TypeScript file")


def _fix_ts_json(raw: str) -> str:
    """
    Fix TypeScript-specific JSON issues:
    - Trailing commas before } or ]
    - Single-quoted strings (rare in generated files but handle anyway)
    - null type annotations
    """
    # Remove trailing commas in objects/arrays
    raw = re.sub(r",\s*([\]\}])", r"\1", raw)

    # TypeScript allows `as const`, `satisfies X`, etc. — strip trailing TS assertions
    # (These shouldn't appear in the generated file but handle defensively)
    raw = re.sub(r"\s+as\s+const\s*$", "", raw.strip())
    raw = re.sub(r"\s+satisfies\s+\w+\[\]\s*$", "", raw.strip())

    return raw


def convert_ts_to_json(
    ts_path: Path,
    json_path: Path,
) -> int:
    """
    Convert TypeScript pokemon constants to JSON.
    Returns number of Pokemon converted.
    """
    with open(ts_path, "r", encoding="utf-8") as f:
        ts_content = f.read()

    raw_array = _extract_json_array(ts_content)
    fixed = _fix_ts_json(raw_array)

    try:
        data = json.loads(fixed)
    except json.JSONDecodeError as e:
        # Try to give a useful error
        line_no = e.lineno
        context_start = max(0, e.pos - 100)
        context = fixed[context_start : e.pos + 50]
        raise ValueError(
            f"JSON parse error at line {line_no}: {e.msg}\n"
            f"Context: ...{context!r}..."
        ) from e

    if not isinstance(data, list):
        raise ValueError(f"Expected array, got {type(data)}")

    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return len(data)


def main() -> None:
    _script_dir = Path(__file__).resolve().parent
    _backend_dir = _script_dir.parent
    _frontend_dir = _backend_dir.parent / "frontend"

    default_input = _frontend_dir / "src" / "data" / "pokemon.ts"
    default_output = _backend_dir / "data" / "pokemon.json"

    parser = argparse.ArgumentParser(
        description="Convert pokemon.ts TypeScript constants to pokemon.json"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=default_input,
        help=f"Path to pokemon.ts (default: {default_input})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=default_output,
        help=f"Path to output pokemon.json (default: {default_output})",
    )
    args = parser.parse_args()

    if not args.input.exists():
        print(f"[convert] ERROR: Input file not found: {args.input}")
        print("[convert] Hint: Run scripts/scrape_pokemon.py first to generate pokemon.ts")
        sys.exit(1)

    print(f"[convert] Reading: {args.input}")
    count = convert_ts_to_json(args.input, args.output)
    print(f"[convert] Written {count} Pokemon to: {args.output}")


if __name__ == "__main__":
    main()
