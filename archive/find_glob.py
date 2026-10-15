import os, glob

candidates = glob.glob(r"C:\Users\maxim\Downloads\**\*7x50*.f3d", recursive=True)
for c in candidates:
    print("MATCH:", c)
    print("EXISTS:", os.path.exists(c))
