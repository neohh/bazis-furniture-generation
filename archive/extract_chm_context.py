import os, re

with open(r"C:\Program Files (x86)\BazisSoft\Bazis\Help\ru\Script.chm", "rb") as f:
    data = f.read()

idx = 0
while True:
    pos = data.find(b"ElasticResize", idx)
    if pos == -1:
        break
    start = max(0, pos - 200)
    end = min(len(data), pos + 300)
    print("--- FOUND AT", pos, "---")
    snippet = data[start:end]
    clean = "".join([chr(c) if 32 <= c <= 126 or c in (10, 13) else " " for c in snippet])
    print(clean)
    idx = pos + 1
