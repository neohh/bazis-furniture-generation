import json, os

path = r"z:\Work\генерация мебели\fastener_presets.json"
with open(path, "r", encoding="cp1251") as f:
    cfg = json.load(f)

# Указываем надежный локальный путь к конфирмату 7х50
cfg["hardware"]["confirmat"]["path"] = r"z:\Work\генерация мебели\furn\confirmat_7x50.f3d"

with open(path, "w", encoding="cp1251") as f:
    json.dump(cfg, f, ensure_ascii=False, indent=2)

print("Updated confirmat path in fastener_presets.json successfully!")
