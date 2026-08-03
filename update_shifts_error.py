import os

app_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

old_shifts_logic = """        if (result.success) {
            shiftData = result.data;
            shiftSelect.innerHTML = '<option value="">-- Pilih Shift --</option>';
            shiftData.forEach(shift => {
                const opt = document.createElement('option');
                opt.value = shift.nama;
                opt.textContent = `${shift.nama} (${shift.masuk} - ${shift.pulang})`;
                opt.dataset.masuk = shift.masuk;
                opt.dataset.pulang = shift.pulang;
                opt.dataset.telat = shift.telat;
                shiftSelect.appendChild(opt);
            });
        }"""

new_shifts_logic = """        if (result.success) {
            shiftData = result.data;
            shiftSelect.innerHTML = '<option value="">-- Pilih Shift --</option>';
            shiftData.forEach(shift => {
                const opt = document.createElement('option');
                opt.value = shift.nama;
                opt.textContent = `${shift.nama} (${shift.masuk} - ${shift.pulang})`;
                opt.dataset.masuk = shift.masuk;
                opt.dataset.pulang = shift.pulang;
                opt.dataset.telat = shift.telat;
                shiftSelect.appendChild(opt);
            });
        } else {
            shiftSelect.innerHTML = `<option value="">-- Error: ${result.message} --</option>`;
        }"""
app_js = app_js.replace(old_shifts_logic, new_shifts_logic)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)
