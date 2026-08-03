import os

html_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

old_btn = """<button type="submit" id="btn-submit" class="btn-submit">
                    <i class="bi bi-send"></i> Kirim Absensi
                </button>"""

new_btn = """<div style="display: flex; gap: 10px;">
                    <button type="button" id="btn-masuk" class="btn-submit" style="background: var(--primary);">
                        <i class="bi bi-box-arrow-in-right"></i> Absen Masuk
                    </button>
                    <button type="button" id="btn-pulang" class="btn-submit" style="background: var(--danger);">
                        <i class="bi bi-box-arrow-right"></i> Absen Pulang
                    </button>
                </div>"""
html = html.replace(old_btn, new_btn)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
