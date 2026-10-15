import os

root = r"C:\Users\maxim\Downloads\1. Соединительная фурнитура"
for r, dirs, files in os.walk(root):
    for f in files:
        if any(w in f.lower() for w in ["confirmat", "евро", "7x50", "7х50", "стяжка"]):
            print(os.path.join(r, f))
