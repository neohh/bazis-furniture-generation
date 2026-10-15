import os, shutil

furn_dir = r"z:\Work\генерация мебели\furn"
for f in os.listdir(furn_dir):
    if "7" in f and "50" in f and f != "confirmat_7x50.f3d":
        src = os.path.join(furn_dir, f)
        dst = os.path.join(furn_dir, "eurovint_7x50.f3d")
        shutil.copy2(src, dst)
        print("Copied", src, "to", dst)
