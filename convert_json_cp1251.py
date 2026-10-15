import os

path = r"z:\Work\генерация мебели\fastener_presets.json"
try:
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
except UnicodeDecodeError:
    with open(path, "r", encoding="cp1251") as f:
        text = f.read()

with open(path, "w", encoding="cp1251") as f:
    f.write(text)

print("fastener_presets.json is encoded in cp1251 successfully!")
