import os

path = r"z:\Work\генерация мебели\fastener_presets.json"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

with open(path, "w", encoding="cp1251") as f:
    f.write(text)

print("Converted fastener_presets.json to cp1251 successfully!")
