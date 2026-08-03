import os

sw_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/sw.js"
with open(sw_path, "r", encoding="utf-8") as f:
    sw_js = f.read()

sw_js = sw_js.replace("CACHE_NAME = 'absen-pwa-v4'", "CACHE_NAME = 'absen-pwa-v5'")

with open(sw_path, "w", encoding="utf-8") as f:
    f.write(sw_js)
