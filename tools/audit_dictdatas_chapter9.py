#!/usr/bin/env python3
"""Focused Chapter 9 audit for a large AssetStudio DictDatas text export."""
from __future__ import annotations
import re, sys
from collections import Counter
from pathlib import Path

if len(sys.argv) < 2:
    raise SystemExit("Usage: python audit_dictdatas_chapter9.py 123.txt [output.txt]")
src = Path(sys.argv[1])
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("chapter9_dictdatas_audit.txt")
if not src.is_file():
    raise SystemExit(f"Input file not found: {src}")

chapter_id_re = re.compile(r'\bchapterId\b["\']?\s*[:=]\s*["\']?(\d+)\b', re.I)
root_re = re.compile(r'^\t(?!\t)(Dict\w+)\s+(\w+)\s*$')
data_re = re.compile(r'^\t{2,}(Dict\w+)\s+data\s*$')
index_re = re.compile(r'^\t{2,}\[(\d+)\]\s*$')
field_re = re.compile(r'^\s*(?:[\w<>]+)\s+(\w+)\s*=\s*(.*?)\s*$')

chapter_counts = Counter()
keyword_counts = Counter()
exact_hits = []
main_records = []
main_chapter_counts = Counter()
other_ch9_records = []
total_lines = 0

with src.open("r", encoding="utf-8-sig", errors="replace") as f:
    for line_no, line in enumerate(f, 1):
        total_lines = line_no
        low = line.lower()
        for word in ("dictchapter", "dictmainstoryset", "dictmainstory", "dictsubstory",
                     "dictsubstoryread", "chapter_name_0009", "chapter9", "dialogids"):
            keyword_counts[word] += low.count(word)
        for m in chapter_id_re.finditer(line):
            val = int(m.group(1))
            chapter_counts[val] += 1
            if val == 9:
                exact_hits.append((line_no, line.rstrip()))

section_class = None
section_name = None
current_index = None
record = None
record_section = None

def finish_record():
    global record
    if not record:
        return
    if record_section and record_section.lower().startswith("mainstoryset"):
        ch = record.get("chapterId")
        if ch is not None:
            try:
                main_chapter_counts[int(ch)] += 1
            except ValueError:
                pass
        if ch == "9":
            main_records.append(dict(record))
    elif "chapterId" in record and record.get("chapterId") == "9":
        other_ch9_records.append((record_section, dict(record)))
    record = None

with src.open("r", encoding="utf-8-sig", errors="replace") as f:
    for line in f:
        root = root_re.match(line)
        if root:
            finish_record()
            section_class, section_name = root.group(1), root.group(2)
            record = None
            current_index = None
            continue
        idx = index_re.match(line)
        if idx:
            current_index = idx.group(1)
        data = data_re.match(line)
        if data and section_class and data.group(1) == section_class:
            finish_record()
            record_section = section_name
            record = {"_class": data.group(1), "_section": record_section, "_index": current_index}
            continue
        if record is not None:
            field = field_re.match(line)
            if field:
                record[field.group(1)] = field.group(2).strip().strip('"')

finish_record()

lines = [
    "DictDatas Chapter 9 detailed audit",
    f"Source: {src.name}",
    f"File size: {src.stat().st_size:,} bytes ({src.stat().st_size/1024/1024:.2f} MiB)",
    f"Total lines: {total_lines:,}",
    "",
    "1) chapterId frequency across the entire file",
]
lines.extend(f"  chapterId={k}: {v}" for k, v in sorted(chapter_counts.items()))
lines += ["", "2) MainStorySet chapterId frequency (parsed by data records)"]
lines.extend(f"  chapterId={k}: {v}" for k, v in sorted(main_chapter_counts.items()))
lines += ["", f"3) MainStorySet records with chapterId=9 ({len(main_records)})"]
for i, rec in enumerate(main_records, 1):
    lines.append(f"  [{i}] " + " | ".join(f"{k}={v}" for k, v in rec.items()))
lines += ["", f"4) Other parsed Dict* records with chapterId=9 ({len(other_ch9_records)})"]
for section, rec in other_ch9_records:
    lines.append("  " + section + ": " + " | ".join(f"{k}={v}" for k, v in rec.items()))
lines += ["", f"5) All raw chapterId=9 field locations ({len(exact_hits)})"]
for n, content in exact_hits:
    lines.append(f"  L{n}: {content.strip()[:700]}")
lines += ["", "6) Context around each chapterId=9 record"]
windows = []
for n, _ in exact_hits:
    a, b = max(1, n-12), n+12
    if windows and a <= windows[-1][1] + 1:
        windows[-1] = (windows[-1][0], max(windows[-1][1], b))
    else:
        windows.append((a,b))
wanted = {n for a,b in windows for n in range(a,b+1)}
if wanted:
    lo, hi = min(wanted), max(wanted)
    with src.open("r", encoding="utf-8-sig", errors="replace") as f:
        for n, line in enumerate(f, 1):
            if n in wanted:
                lines.append(f"L{n}: {line.rstrip()[:700]}")
            if n >= hi:
                break
else:
    lines.append("  No chapterId=9 fields found.")
lines += ["", "7) Keyword counts"]
lines.extend(f"  {k}: {v}" for k,v in keyword_counts.items())

out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Scanned {total_lines:,} lines ({src.stat().st_size:,} bytes)")
print("chapterId: " + ", ".join(f"{k}={v}" for k,v in sorted(chapter_counts.items())))
print(f"MainStorySet chapterId=9 records: {len(main_records)}")
print(f"Raw chapterId=9 hits: {len(exact_hits)}")
print(f"Report: {out} ({out.stat().st_size:,} bytes)")
