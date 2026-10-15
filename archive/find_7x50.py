import os

root = r"C:\Users\maxim\Downloads\1. Соединительная фурнитура"
for r, dirs, files in os.walk(root):
    for f in files:
        if "7x50" in f.lower():
            full = os.path.join(r, f)
            print("FULL PATH:", repr(full))
