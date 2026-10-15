import subprocess, os

out_dir = r"z:\Work\генерация мебели\tmp_help"
os.makedirs(out_dir, exist_ok=True)
chm_file = r"C:\Program Files (x86)\BazisSoft\Bazis\Help\ru\Script.chm"

res = subprocess.run(["hh.exe", "-decompile", out_dir, chm_file], capture_output=True, text=True)
print("Returncode:", res.returncode)
files = os.listdir(out_dir)
print("Files count:", len(files))
for f in files:
    if "elastic" in f.lower():
        print("Found:", f)
