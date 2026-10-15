import json

path = r"z:\Work\генерация мебели\fastener_presets.json"
with open(path, "r", encoding="cp1251") as f:
    cfg = json.load(f)

print("Hardware:")
for k, v in cfg["hardware"].items():
    print(" ", k, "->", v["path"])

print("Schemes:")
for k, v in cfg["schemes"].items():
    print(" ", k, "->", v)
