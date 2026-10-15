with open(r"C:\Users\maxim\Downloads\ящик НОВЫЙ.f3d", "rb") as fp:
    data = fp.read()

import re
matches = re.findall(rb"[A-Za-zА-Яа-я0-9_\-\.\s]{5,40}", data)
for m in matches:
    s = m.decode("cp1251", errors="ignore")
    if "евро" in s.lower() or "винт" in s.lower() or "69" in s:
        print("Match:", repr(s))
