// CONFIG
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwELxlXYsX7G_o4A25hi_5bd7dsEO3wIdFJXxmIWV4393O7CiRXyA19tDEFTuYrtmQb/exec';
let shiftData = [];
let roleData = [];
let staffUsernames = [];

// DOM Elements
const form = document.getElementById('form-absen');
const tanggalInput = document.getElementById('tanggal');
const tanggalDisplay = document.getElementById('tanggal_display');
const jamInput = document.getElementById('jam');
const shiftSelect = document.getElementById('shift');
const namaStaffInput = document.getElementById('nama_staff');

const btnSubmitAbsen = document.getElementById('btn-submit-absen');
const shiftAlert = document.getElementById('shift-alert');
const shiftAlertMsg = document.getElementById('shift-alert-msg');
const loader = document.getElementById('loader-overlay');
const catatanGroup = document.getElementById('catatan-group');
const statusRadios = document.querySelectorAll('input[name="status"]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDateTime();
    loadShifts();
    loadStaff();
    
    // Auto refresh time every minute
    setInterval(updateTime, 60000);
});

// Real-time Clock
function pad(n) { return n < 10 ? '0' + n : n; }

function initDateTime() {
    const now = new Date();
    // For backend payload: YYYY-MM-DD
    tanggalInput.value = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    
    // For display: Hari, DD-MM-YYYY
    const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    if (tanggalDisplay) {
        tanggalDisplay.value = `${hariList[now.getDay()]}, ${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
    }
    
    updateTime();
}

function updateTime() {
    const now = new Date();
    // 24-hour format HH:mm
    jamInput.value = pad(now.getHours()) + ':' + pad(now.getMinutes());
    validateShiftTime();
}

// Fetch Shifts from Backend
async function loadShifts() {
    try {
        const res = await fetch(`${GAS_URL}?api=get_shifts&_t=${new Date().getTime()}`, { redirect: 'follow', credentials: 'omit' });
        const result = await res.json();
        
        if (result.success) {
            shiftData = result.data;
            roleData = result.roles || [];
            
            // Populate initially (will be filtered later based on user role)
            populateShifts(shiftData);
        } else {
            shiftSelect.innerHTML = `<option value="">-- Error: ${result.message} --</option>`;
        }
    } catch (err) {
        showToast('Gagal memuat jadwal shift', 'danger');
    }
}

function populateShifts(shifts) {
    shiftSelect.innerHTML = '<option value="">-- Pilih Shift --</option>';
    if (!shifts || shifts.length === 0) {
        shiftSelect.innerHTML = '<option value="">-- Tidak ada shift tersedia --</option>';
        return;
    }
    shifts.forEach(shift => {
        const opt = document.createElement('option');
        opt.value = shift.nama;
        opt.textContent = `${shift.nama} (${shift.masuk} - ${shift.pulang})`;
        opt.dataset.masuk = shift.masuk;
        opt.dataset.pulang = shift.pulang;
        opt.dataset.telat = shift.telat;
        opt.dataset.id = shift.id;
        shiftSelect.appendChild(opt);
    });
}

// Fetch Staff
async function loadStaff() {
    try {
        const res = await fetch(`${GAS_URL}?api=get_staff&_t=${new Date().getTime()}`, { redirect: 'follow', credentials: 'omit' });
        const result = await res.json();
        if (result.success) {
            staffUsernames = result.data;
            namaStaffInput.innerHTML = '<option value="">-- Pilih Nama Anda --</option>';
            staffUsernames.forEach(staff => {
                const opt = document.createElement('option');
                opt.value = staff.username;
                opt.dataset.id = staff.ID_Staff || staff.id_staff || "";
                opt.dataset.roleId = staff.Role || staff.id_role || staff.nama_role || "";
                opt.dataset.roleName = staff.nama_role || "";
                
                let namaTampil = staff.nama_lengkap || staff.username;
                opt.textContent = namaTampil;
                namaStaffInput.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Failed to load staff list:', err);
        namaStaffInput.innerHTML = `<option value="">-- Error: ${err.message || 'CORS/Network'} --</option>`;
    }
}

// Handle Staff Selection and Multiple Roles
// Handle Staff Selection and Multiple Roles
namaStaffInput.addEventListener('change', () => {
    const selectedOpt = namaStaffInput.options[namaStaffInput.selectedIndex];
    const peranGroup = document.getElementById('peran-group');
    const peranSelect = document.getElementById('peran_staff');
    
    if (!selectedOpt || !selectedOpt.value) {
        peranGroup.style.display = 'none';
        peranSelect.innerHTML = '<option value="">-- Pilih Peran --</option>';
        populateShifts(shiftData); // reset to all if no staff selected
        return;
    }
    
    const roleId = selectedOpt.dataset.roleId || "";
    const roleName = selectedOpt.dataset.roleName || "";
    
    const roles = roleId.split(',').map(r => r.trim());
    const roleNames = roleName ? roleName.split(',').map(r => r.trim()) : roles;
    
    peranSelect.innerHTML = roles.length > 1 ? '<option value="">-- Pilih Peran Anda --</option>' : '';
    roles.forEach((r, idx) => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = roleNames[idx] || r;
        peranSelect.appendChild(opt);
    });
    
    peranGroup.style.display = 'block';
    peranSelect.required = true;
    
    if (roles.length > 1) {
        // Multi-role: wait for selection
        populateShifts([]);
    } else {
        // Single role: auto select
        peranSelect.value = roles[0];
        filterShiftsByRole(roles[0]);
    }
});

// Handle Peran Selection
const peranSelect = document.getElementById('peran_staff');
if (peranSelect) {
    peranSelect.addEventListener('change', () => {
        if (peranSelect.value) {
            filterShiftsByRole(peranSelect.value);
        } else {
            populateShifts([]);
        }
    });
}

function filterShiftsByRole(selectedRole) {
    // Find the role in roleData
    const role = roleData.find(r => r.id_role === selectedRole || r.nama_role === selectedRole);
    if (!role || !role.waktu_kerja) {
        shiftSelect.innerHTML = '<option value="">-- Waktu Kerja belum diatur di Kelola Peran --</option>';
        return;
    }
    
    const allowedShiftIds = role.waktu_kerja.split(',').map(s => s.trim());
    const filtered = shiftData.filter(s => allowedShiftIds.includes(s.id.toString()));
    
    if (filtered.length === 0) {
        shiftSelect.innerHTML = '<option value="">-- Shift tidak ditemukan (Cek Kelola Peran) --</option>';
        return;
    }
    
    populateShifts(filtered);
}

// Shift Validation Logic
shiftSelect.addEventListener('change', validateShiftTime);

function validateShiftTime() {
    const selectedShift = shiftSelect.options[shiftSelect.selectedIndex];
    
    // Reset
    shiftAlert.classList.add('d-none');
    if (btnMasuk) btnMasuk.disabled = false;
    if (btnPulang) btnPulang.disabled = false;
    
    if (!selectedShift || !selectedShift.value) return;

    const jamMasuk = selectedShift.dataset.masuk;
    const jamPulang = selectedShift.dataset.pulang;
    const toleransiMenit = parseInt(selectedShift.dataset.telat || 60);
    const now = new Date();
    
    // Convert jamMasuk to Date object for today
    const [masukH, masukM] = jamMasuk.split(':');
    const masukDate = new Date();
    masukDate.setHours(parseInt(masukH), parseInt(masukM), 0);
    
    // Convert jamPulang to Date object for today
    const [pulangH, pulangM] = jamPulang.split(':');
    const pulangDate = new Date();
    pulangDate.setHours(parseInt(pulangH), parseInt(pulangM), 0);
    if (pulangDate < masukDate) {
        // Shift malam menyeberang hari (misal 20:00 - 04:00)
        pulangDate.setDate(pulangDate.getDate() + 1);
    }
    
    const diffMinsMasuk = Math.floor((now - masukDate) / 60000);
    const diffMinsPulang = Math.floor((now - pulangDate) / 60000);
    
    let masukDisabled = false;
    let pulangDisabled = false;
    let msgs = [];

    // Validasi Absen Masuk
    if (diffMinsMasuk < -60) {
        masukDisabled = true;
        msgs.push(`Belum waktu Absen Masuk (buka jam ${pad(masukDate.getHours()-1)}:${pad(masukDate.getMinutes())}).`);
    } else if (diffMinsMasuk > toleransiMenit) {
        msgs.push(`Batas toleransi Absen Masuk telah lewat (${toleransiMenit} menit). Status tercatat terlambat.`);
    } else if (diffMinsMasuk > 0) {
        msgs.push(`Anda terlambat Absen Masuk ${diffMinsMasuk} menit.`);
    }

    // Validasi Absen Pulang
    if (diffMinsPulang < -480) { // misal belum boleh absen pulang kalau masih 8 jam sebelum pulang
        pulangDisabled = true;
    } else if (diffMinsPulang > toleransiMenit) {
        msgs.push(`Batas toleransi Absen Pulang telah lewat (${toleransiMenit} menit). Status tercatat terlambat.`);
    }

    if (btnMasuk) btnMasuk.disabled = masukDisabled;
    if (btnPulang) btnPulang.disabled = pulangDisabled;

    if (masukDisabled && pulangDisabled) {
        shiftAlert.className = 'shift-alert alert-danger';
        if (msgs.length === 0) msgs.push("Waktu shift ini tidak aktif saat ini.");
    } else if (msgs.length > 0) {
        shiftAlert.className = 'shift-alert alert-warning';
    }

    if (msgs.length > 0) {
        shiftAlertMsg.innerHTML = msgs.join("<br>");
        shiftAlert.classList.remove('d-none');
    }
}



// Status Toggle Note
statusRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'Sakit' || radio.value === 'Izin') {
            catatanGroup.style.display = 'block';
            document.getElementById('catatan').required = true;
        } else {
            catatanGroup.style.display = 'none';
            document.getElementById('catatan').required = false;
        }
    });
});

// Form Submission
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
        id_staff: staffId,
        tanggal: tanggalInput.value,
        jam_absen: jamInput.value,
        shift: shiftSelect.value,
        nama_staff: namaStaffInput.value,
        peran_staff: document.getElementById('peran_staff') ? document.getElementById('peran_staff').value : "",
        status: document.querySelector('input[name="status"]:checked').value,
        catatan: document.getElementById('catatan').value
    };
    
    // Add late calculation to note if late
    const selectedShift = shiftSelect.options[shiftSelect.selectedIndex];
    if (selectedShift) {
        const now = new Date();
        let targetTime = "";
        
        if (jenis === 'masuk') {
            targetTime = selectedShift.dataset.masuk;
        } else if (jenis === 'pulang') {
            targetTime = selectedShift.dataset.pulang;
        }

        if (targetTime) {
            const [targetH, targetM] = targetTime.split(':');
            const targetDate = new Date();
            targetDate.setHours(parseInt(targetH), parseInt(targetM), 0);
            
            // Adjust for overnight shifts on pulang
            if (jenis === 'pulang') {
                const [masukH, masukM] = selectedShift.dataset.masuk.split(':');
                const masukDate = new Date();
                masukDate.setHours(parseInt(masukH), parseInt(masukM), 0);
                if (targetDate < masukDate) {
                    targetDate.setDate(targetDate.getDate() + 1);
                }
            }

            const diffMins = Math.floor((now - targetDate) / 60000);
            
            // Calculate limit
            const toleransiMenit = parseInt(selectedShift.dataset.telat || 60);
            
            if (diffMins > toleransiMenit) {
                // Sangat terlambat / lewat batas
                const lateType = jenis === 'masuk' ? 'Telat Masuk' : 'Telat Pulang';
                payload.catatan = `(${lateType} Lewat Batas: ${diffMins} mnt) ` + payload.catatan;
            } else if (diffMins > 0) {
                // Terlambat biasa
                const lateType = jenis === 'masuk' ? 'Telat Masuk' : 'Telat Pulang';
                payload.catatan = `(${lateType} ${diffMins} mnt) ` + payload.catatan;
            }
        }
    }

    loader.classList.remove('d-none');
    
    try {
        const response = await fetch(`${GAS_URL}?api=submit_absen`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // GAS requires text/plain for CORS POST
            },
            redirect: 'follow',
            credentials: 'omit'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Absensi berhasil dikirim', 'success');
            form.reset();
            initDateTime();
            catatanGroup.style.display = 'none';
        } else {
            showToast(result.message || 'Gagal mengirim absen', 'danger');
        }
    } catch (err) {
        showToast('Terjadi kesalahan jaringan', 'danger');
    } finally {
        loader.classList.add('d-none');
    }
}

if(btnSubmitAbsen) {
    btnSubmitAbsen.addEventListener('click', (e) => {
        e.preventDefault();
        // Cek validasi HTML5 bawaan sebelum submit jika diperlukan
        if(!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const jenis = document.querySelector('input[name="jenis_absen"]:checked').value.toLowerCase();
        submitAbsen(jenis);
    });
}

window.updateAbsenType = function() {
    const jenis = document.querySelector('input[name="jenis_absen"]:checked').value;
    const btnText = document.getElementById('btn-submit-text');
    const btnIcon = document.getElementById('btn-submit-icon');
    const btnSubmit = document.getElementById('btn-submit-absen');
    
    if (jenis === 'Masuk') {
        btnText.textContent = 'Absen Masuk';
        btnIcon.className = 'bi bi-box-arrow-in-right';
        btnSubmit.style.background = 'var(--primary)';
        btnSubmit.style.color = '#fff';
    } else {
        btnText.textContent = 'Absen Pulang';
        btnIcon.className = 'bi bi-box-arrow-right';
        btnSubmit.style.background = '#dc3545'; // warning color for contrast
        btnSubmit.style.color = '#fff';
    }
};

// UI Toast
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'check-circle-fill' : type === 'danger' ? 'x-circle-fill' : 'exclamation-circle-fill';
    
    toast.innerHTML = `<i class="bi bi-${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
