#!/usr/bin/env python3
"""Extract DictDialog records from an AssetStudio MonoBehaviour Dump.
Outputs metadata and localization resource keys only; does not export story text.
"""
import argparse, json, re
from pathlib import Path
ENTRY = re.compile(r'^\s*\[(\d+)\]\s*$')
FIELD = re.compile(r'^\s*(SInt16|int|float|string)\s+(\w+)\s*=\s*(.*?)\s*$')
FIELDS = {"id","order","portraitId","type1","type2","type3","text","delay","strValue"}
TYPE_NAMES = {
 (1,1):"SpeakText", (5,50):"ChoiceQuestion", (5,51):"ChoiceBranch",
}
def parse(path):
    lines=Path(path).read_text(encoding="utf-8-sig",errors="replace").splitlines()
    out=[]; active=False; current=None
    for line in lines:
        if re.match(r'^\s*DictDialog dialogs\s*$',line): active=True; continue
        if not active: continue
        if re.match(r'^\s*Dict\w+\s+\w+\s*$',line) and 'DictDialog data' not in line:
            if current and FIELDS.issubset(current): out.append(current)
            current=None
            if out: break
        if re.match(r'^\s*DictDialog data\s*$',line):
            if current and FIELDS.issubset(current): out.append(current)
            current={}; continue
        if current is None: continue
        m=FIELD.match(line)
        if not m: continue
        typ,key,val=m.groups()
        if key not in FIELDS: continue
        if typ=='string': val=val.strip().strip('"')
        elif typ=='float': val=float(val)
        else: val=int(val)
        current[key]=val
    if current and FIELDS.issubset(current): out.append(current)
    return out
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('dump');ap.add_argument('-o','--output',default='dict-dialogs.json');args=ap.parse_args()
    rows=parse(args.dump)
    rows.sort(key=lambda x:(x['id'],x['order']))
    Path(args.output).write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'Exported {len(rows):,} DictDialog rows to {args.output}')
