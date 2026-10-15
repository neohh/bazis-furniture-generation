import os, re

chm_path = r"C:\Program Files (x86)\BazisSoft\Bazis\Help\ru\Script.chm"
if os.path.exists(chm_path):
    with open(chm_path, "rb") as f:
        data = f.read()
    
    words = set(re.findall(rb"[A-Za-z0-9_]{3,35}", data))
    elastic_words = [w.decode('latin1') for w in words if b"elastic" in w.lower()]
    print("Found words:", sorted(elastic_words))

    # Also search for Cyrillic 'эластич' in cp1251
    cp1251_matches = re.findall(rb"([^\x00-\x1f\x7f-\x9f]{1,100}\xed\xeb\xe0\xf1\xf2\xe8\xf7[^\x00-\x1f\x7f-\x9f]{1,100})", data)
    print("Found snippets (cp1251):", len(cp1251_matches))
    for s in cp1251_matches[:5]:
        try:
            print("Snippet:", s.decode('cp1251', errors='ignore'))
        except:
            pass
