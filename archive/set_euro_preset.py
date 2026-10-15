import json

path = r"z:\Work\генерация мебели\fastener_presets.json"
with open(path, "r", encoding="cp1251") as f:
    cfg = json.load(f)

# Прописываем именно экспортированный Евровинт 7х50
cfg["hardware"]["confirmat"]["name"] = "Евровинт 7х50 (Артикул 69)"
cfg["hardware"]["confirmat"]["path"] = r"z:\Work\генерация мебели\furn\eurovint_7x50.f3d"

with open(path, "w", encoding="cp1251") as f:
    json.dump(cfg, f, ensure_ascii=False, indent=2)

print("Updated fastener_presets.json with eurovint_7x50.f3d successfully!")
