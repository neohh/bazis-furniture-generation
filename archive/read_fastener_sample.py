import os

scripts_root = r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts"
matches = []
for r, dirs, files in os.walk(scripts_root):
    for f in files:
        if f.endswith(".js"):
            matches.append(os.path.join(r, f))

print("Total scripts found:", len(matches))
for m in matches:
    if "крепеж" in m.lower() or "схеме" in m.lower():
        print("Script:", m)
        try:
            with open(m, "r", encoding="cp1251") as fp:
                lines = fp.readlines()[:25]
                print("".join(lines))
                print("-" * 50)
        except Exception as e:
            print("Error reading:", e)
