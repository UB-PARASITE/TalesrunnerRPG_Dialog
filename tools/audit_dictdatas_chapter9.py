#!/usr/bin/env python3
"""Extract a compact Chapter 9 audit from a large DictDatas.txt file."""
from __future__ import annotations

import re
import sys
from collections import Counter, deque
from pathlib import Path

if len(sys.argv) < 2:
    raise SystemExit("Usage: python audit_dictdatas_chapter9.py 123.txt [output.txt]")

src = Path(sys.argv[1])
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("chapter9_dictdatas_audit.txt")
if not src.is_file():
    raise SystemExit(f"Input file not found: {src}")

# Decode line-by-line to avoid loading the 100+ MB file into memory.
chapter_id_re = re.compile(r'\bchapterId\b["\']?\s*[:=]\s*["\']?(\d+)\b', re.I)
needles = (
    "dictchapter", "dictmainstoryset", "dictmainstory",
    "dictsubstory", "dictsubstoryread", "chaptertype",
    "chapter_name_0009", "chapter9", "dialogids",
)
interesting = re.compile(
    r'DictChapter|DictMainStorySet|DictMainStory|DictSubStoryRead?|ChapterType|'
    r'Chapter_Name_0009|Chapter9|chapterId\s*[:=]\s*["\']?9\b',
    re.I,
)
header_re = re.compile(
    r'Dict(?:Chapter|MainStorySet|MainStory|SubStoryRead?|FriendshipStory)\b|ChapterType',
    re.I,
)

chapter_counts = Counter()
keyword_counts = Counter()
header_hits = []
exact_ch9_hits = []
total_lines = 0
file_bytes = src.stat().st_size
last_context = deque(maxlen=4)
pending_context = 0
context_blocks = []
max_context_blocks = 120

with src.open("r", encoding="utf-8-sig", errors="replace") as f:
    for line_no, line in enumerate(f, 1):
        total_lines = line_no
        low = line.lower()
        for word in needles:
            if word in low:
                keyword_counts[word] += low.count(word)

        for m in chapter_id_re.finditer(line):
            chapter_counts[int(m.group(1))] += 1

        if header_re.search(line) and len(header_hits) < 100:
            header_hits.append(f"L{line_no}: {line.rstrip()[:500]}")

        if re.search(r'Chapter_Name_0009|Chapter9|chapterId\s*[:=]\s*["\']?9\b', line, re.I):
            exact_ch9_hits.append((line_no, line.rstrip()[:1000]))

        if interesting.search(line) and len(context_blocks) < max_context_blocks:
            block = list(last_context)
            block.append(f"L{line_no}: {line.rstrip()[:700]}")
            context_blocks.append("\n".join(block))
            pending_context = 3
        elif pending_context > 0 and context_blocks:
            context_blocks[-1] += f"\nL{line_no}: {line.rstrip()[:700]}"
            pending_context -= 1

        last_context.append(f"L{line_no}: {line.rstrip()[:700]}")

lines = []
lines.append("DictDatas Chapter 9 audit")
lines.append(f"Source: {src.name}")
lines.append(f"File size: {file_bytes:,} bytes ({file_bytes / 1024 / 1024:.2f} MiB)")
lines.append(f"Total lines: {total_lines:,}")
lines.append("")
lines.append("1) Count of chapterId fields by value (whole file)")
if chapter_counts:
    for key, value in sorted(chapter_counts.items()):
        lines.append(f"  chapterId={key}: {value:,}")
else:
    lines.append("  No chapterId fields matched the expected text pattern.")
lines.append("")
lines.append("2) Keyword occurrence counts")
for word in needles:
    lines.append(f"  {word}: {keyword_counts[word]:,}")
lines.append("")
lines.append("3) Table/type declaration lines")
lines.extend(header_hits or ["  No table/type declarations matched."])
lines.append("")
lines.append("4) Exact Chapter 9 hits")
if exact_ch9_hits:
    lines.extend(f"L{n}: {text}" for n, text in exact_ch9_hits[:250])
    if len(exact_ch9_hits) > 250:
        lines.append(f"... {len(exact_ch9_hits) - 250} additional hits omitted")
else:
    lines.append("  No exact Chapter_Name_0009 / Chapter9 / chapterId=9 lines found.")
lines.append("")
lines.append("5) Context around relevant tables and Chapter 9 references")
lines.extend(context_blocks or ["  No relevant context found."])

out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Input: {src} ({file_bytes:,} bytes)")
print(f"Lines scanned: {total_lines:,}")
print("chapterId counts: " + ", ".join(f"{k}={v}" for k, v in sorted(chapter_counts.items())))
print(f"Exact Chapter 9 hits: {len(exact_ch9_hits)}")
print(f"Report written: {out} ({out.stat().st_size:,} bytes)")
