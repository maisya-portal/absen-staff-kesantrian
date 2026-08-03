import os

# --- Update index.html ---
index_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/index.html"
with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

old_html = """                <div class="form-group autocomplete-container">
                    <label for="nama_staff">Nama Staff / Username</label>
                    <div class="input-with-icon">
                        <i class="bi bi-person"></i>
                        <input type="text" id="nama_staff" name="nama_staff" placeholder="Ketik nama Anda..." autocomplete="off" required>
                    </div>
                    <ul id="autocomplete-list" class="autocomplete-list d-none"></ul>
                </div>"""

new_html = """                <div class="form-group">
                    <label for="nama_staff">Nama Staff / Username</label>
                    <div class="input-with-icon">
                        <i class="bi bi-person"></i>
                        <select id="nama_staff" name="nama_staff" required>
                            <option value="">-- Memuat Staff... --</option>
                        </select>
                    </div>
                </div>"""

html = html.replace(old_html, new_html)
with open(index_path, "w", encoding="utf-8") as f:
    f.write(html)

# --- Update app.js ---
app_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

# Fix shifts
old_shifts = """            shiftData.forEach(shift => {
                const opt = document.createElement('option');
                opt.value = shift.Nama_Shift;
                opt.textContent = `${shift.Nama_Shift} (${shift.Jam_Masuk} - ${shift.Jam_Pulang})`;
                opt.dataset.masuk = shift.Jam_Masuk;
                opt.dataset.pulang = shift.Jam_Pulang;
                opt.dataset.telat = shift.Toleransi_Telat_Menit;
                shiftSelect.appendChild(opt);
            });"""

new_shifts = """            shiftData.forEach(shift => {
                const opt = document.createElement('option');
                opt.value = shift.nama;
                opt.textContent = `${shift.nama} (${shift.masuk} - ${shift.pulang})`;
                opt.dataset.masuk = shift.masuk;
                opt.dataset.pulang = shift.pulang;
                opt.dataset.telat = shift.telat;
                shiftSelect.appendChild(opt);
            });"""
app_js = app_js.replace(old_shifts, new_shifts)

# Fix staff loading and remove autocomplete
old_staff = """// Fetch Staff for Autocomplete
async function loadStaff() {
    try {
        const res = await fetch(`${GAS_URL}?api=get_staff`);
        const result = await res.json();
        if (result.success) {
            staffUsernames = result.data;
        }
    } catch (err) {
        console.error('Failed to load staff list');
    }
}

// Autocomplete Logic
namaStaffInput.addEventListener('input', function() {
    const val = this.value;
    autocompleteList.innerHTML = '';
    
    if (!val || val.length < 1) {
        autocompleteList.classList.add('d-none');
        return;
    }
    
    const matches = staffUsernames.filter(item => item.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
    
    if (matches.length > 0) {
        autocompleteList.classList.remove('d-none');
        matches.forEach(match => {
            const li = document.createElement('li');
            li.textContent = match;
            li.addEventListener('click', () => {
                namaStaffInput.value = match.split('(')[0].trim();
                autocompleteList.classList.add('d-none');
            });
            autocompleteList.appendChild(li);
        });
    } else {
        autocompleteList.classList.add('d-none');
    }
});

document.addEventListener('click', (e) => {
    if (e.target !== namaStaffInput) {
        autocompleteList.classList.add('d-none');
    }
});"""

new_staff = """// Fetch Staff
async function loadStaff() {
    try {
        const res = await fetch(`${GAS_URL}?api=get_staff`);
        const result = await res.json();
        if (result.success) {
            staffUsernames = result.data;
            namaStaffInput.innerHTML = '<option value="">-- Pilih Nama Anda --</option>';
            staffUsernames.forEach(staff => {
                const opt = document.createElement('option');
                opt.value = staff.username;
                let namaTampil = staff.nama_lengkap || staff.username;
                opt.textContent = `${namaTampil} (${staff.nama_role})`;
                namaStaffInput.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Failed to load staff list');
        namaStaffInput.innerHTML = '<option value="">-- Gagal memuat staff --</option>';
    }
}"""
app_js = app_js.replace(old_staff, new_staff)

# Also remove autocompleteList from DOM Elements section since it's removed
app_js = app_js.replace("const autocompleteList = document.getElementById('autocomplete-list');", "")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)

print("Updated index.html and app.js")
