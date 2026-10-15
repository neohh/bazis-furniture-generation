import os

needle1 = "Евровинт 7х50".encode("cp1251")
needle2 = "Артикул 69".encode("cp1251")

search_dirs = [
    r"C:\Users\maxim\OneDrive\Документы\Bazis",
    r"C:\Users\maxim\Downloads",
    r"C:\Users\maxim\AppData\Roaming\BazisSoft"
]

for d in search_dirs:
    if not os.path.exists(d): continue
    for root, dirs, files in os.walk(d):
        for f in files:
            if f.endswith((".f3d", ".fr3d", ".fdb", ".xml", ".ini", ".cfg", ".dat")):
                p = os.path.join(root, f)
                try:
                    with open(p, "rb") as fp:
                        c = fp.read()
                        if needle1 in c and needle2 in c:
                            print("FOUND IN:", p)
                except:
                    pass
