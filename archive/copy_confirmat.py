import shutil, glob, os

candidates = glob.glob(r"C:\Users\maxim\Downloads\**\*7x50*.f3d", recursive=True)
dest_dir = r"z:\Work\генерация мебели\furn"
os.makedirs(dest_dir, exist_ok=True)

if candidates:
    src = candidates[0]
    dest = os.path.join(dest_dir, "confirmat_7x50.f3d")
    shutil.copy2(src, dest)
    print("Copied to:", dest)
    print("Exists:", os.path.exists(dest))
