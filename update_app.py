import os

js_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/app.js"
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Update DOM elements
old_dom = """const btnSubmit = document.getElementById('btn-submit');"""
new_dom = """const btnMasuk = document.getElementById('btn-masuk');
const btnPulang = document.getElementById('btn-pulang');"""
js = js.replace(old_dom, new_dom)

# Update validateShiftTime
old_val = """    // Reset
    shiftAlert.classList.add('d-none');
    btnSubmit.disabled = false;"""
new_val = """    // Reset
    shiftAlert.classList.add('d-none');
    if (btnMasuk) btnMasuk.disabled = false;
    if (btnPulang) btnPulang.disabled = false;"""
js = js.replace(old_val, new_val)

old_val2 = """        shiftAlert.classList.remove('d-none');
        btnSubmit.disabled = true;"""
new_val2 = """        shiftAlert.classList.remove('d-none');
        if (btnMasuk) btnMasuk.disabled = true;
        if (btnPulang) btnPulang.disabled = true;"""
js = js.replace(old_val2, new_val2).replace(old_val2, new_val2) # replace twice

# Update form submission to use buttons
old_sub = """// Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {"""
new_sub = """// Form Submission
async function submitAbsen(jenis) {
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    let staffSelect = document.getElementById('nama_staff');
    let staffId = "";
    if(staffSelect && staffSelect.options[staffSelect.selectedIndex]) {
        let opt = staffSelect.options[staffSelect.selectedIndex];
        staffId = opt.dataset.id || "";
    }
    
    const payload = {
        jenis_absen: jenis,
        id_staff: staffId,"""
js = js.replace(old_sub, new_sub)

# Change staff options to include dataset.id
old_opt = """                opt.value = staff.username;
                let namaTampil = staff.nama_lengkap || staff.username;
                opt.textContent = `${namaTampil} (${staff.nama_role})`;
                namaStaffInput.appendChild(opt);"""
new_opt = """                opt.value = staff.username;
                opt.dataset.id = staff.ID_Staff || staff.id_staff || "";
                let namaTampil = staff.nama_lengkap || staff.username;
                opt.textContent = `${namaTampil} (${staff.nama_role || staff.Role || '-'})`;
                namaStaffInput.appendChild(opt);"""
js = js.replace(old_opt, new_opt)

# End of submitAbsen
old_end = """    } finally {
        loader.classList.add('d-none');
    }
});"""
new_end = """    } finally {
        loader.classList.add('d-none');
    }
}

if(btnMasuk) btnMasuk.addEventListener('click', () => submitAbsen('masuk'));
if(btnPulang) btnPulang.addEventListener('click', () => submitAbsen('pulang'));"""
js = js.replace(old_end, new_end)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)
