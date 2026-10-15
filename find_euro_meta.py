with open(r"C:\Users\maxim\Downloads\ящик НОВЫЙ.f3d", "rb") as fp:
    data = fp.read()

needle = "Евровинт 7х50".encode("cp1251")
pos = 0
found = 0
while True:
    pos = data.find(needle, pos)
    if pos == -1: break
    start = max(0, pos - 100)
    end = min(len(data), pos + 200)
    chunk = data[start:end].decode("cp1251", errors="ignore")
    print(f"--- MATCH {found} at {pos} ---")
    print(repr(chunk))
    found += 1
    pos += len(needle)
    if found >= 3: break
