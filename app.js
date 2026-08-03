// CONFIG
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwELxlXYsX7G_o4A25hi_5bd7dsEO3wIdFJXxmIWV4393O7CiRXyA19tDEFTuYrtmQb/exec';
let shiftData = [];
let staffUsernames = [];

// DOM Elements
const form = document.getElementById('form-absen');
const tanggalInput = document.getElementById('tanggal');
const jamInput = document.getElementById('jam');
const shiftSelect = document.getElementById('shift');
const namaStaffInput = document.getElementById('nama_staff');

const btnSubmit = document.getElementById('btn-submit');
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
function initDateTime() {
    const now = new Date();
    tanggalInput.value = now.toISOString().split('T')[0];
    updateTime();
}

function updateTime() {
    const now = new Date();
    jamInput.value = now.toTimeString().split(' ')[0].substring(0, 5);
    validateShiftTime();
}

// Fetch Shifts from Backend
async function loadShifts() {
    try {
        const res = await fetch(`${GAS_URL}?api=get_shifts&_t=${new Date().getTime()}`);
        const result = await res.json();
        
        if (result.success) {
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
        }
    } catch (err) {
        showToast('Gagal memuat jadwal shift', 'danger');
    }
}

// Fetch Staff
async function loadStaff() {
    try {
        const res = await fetch(`${GAS_URL}?api=get_staff&_t=${new Date().getTime()}`);
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
        console.error('Failed to load staff list:', err);
        namaStaffInput.innerHTML = `<option value="">-- Error: ${err.message || 'CORS/Network'} --</option>`;
    }
}

// Shift Validation Logic
shiftSelect.addEventListener('change', validateShiftTime);

function validateShiftTime() {
    const selectedShift = shiftSelect.options[shiftSelect.selectedIndex];
    
    // Reset
    shiftAlert.classList.add('d-none');
    btnSubmit.disabled = false;
    
    if (!selectedShift.value) return;

    const jamMasuk = selectedShift.dataset.masuk;
    const toleransiMenit = parseInt(selectedShift.dataset.telat || 60);
    const now = new Date();
    
    // Convert jamMasuk to Date object for today
    const [masukH, masukM] = jamMasuk.split(':');
    const masukDate = new Date();
    masukDate.setHours(parseInt(masukH), parseInt(masukM), 0);
    
    const diffMs = now - masukDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    // Validation Rules:
    // 1. Can't check in more than 60 mins before shift
    if (diffMins < -60) {
        shiftAlert.className = 'shift-alert alert-warning';
        shiftAlertMsg.innerHTML = `Belum masuk jam kerja shift ini. Absensi dibuka mulai jam ${pad(masukDate.getHours()-1)}:${pad(masukDate.getMinutes())}.`;
        shiftAlert.classList.remove('d-none');
        btnSubmit.disabled = true;
    }
    // 2. Can't check in if passing tolerance (e.g. 180 mins late)
    else if (diffMins > toleransiMenit) {
        shiftAlert.className = 'shift-alert alert-danger';
        shiftAlertMsg.innerHTML = `Batas waktu pengajuan absen untuk shift ini telah lewat (${toleransiMenit} menit dari jam masuk).`;
        shiftAlert.classList.remove('d-none');
        btnSubmit.disabled = true;
    }
    // 3. Late but within tolerance
    else if (diffMins > 0) {
        shiftAlert.className = 'shift-alert alert-warning';
        shiftAlertMsg.innerHTML = `Anda terlambat ${diffMins} menit. Catatan keterlambatan akan disimpan.`;
        shiftAlert.classList.remove('d-none');
    }
}

function pad(num) {
    return num.toString().padStart(2, '0');
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
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        tanggal: tanggalInput.value,
        jam_absen: jamInput.value,
        shift: shiftSelect.value,
        nama_staff: namaStaffInput.value,
        status: document.querySelector('input[name="status"]:checked').value,
        catatan: document.getElementById('catatan').value
    };
    
    // Add late calculation to note if late
    const selectedShift = shiftSelect.options[shiftSelect.selectedIndex];
    if (selectedShift) {
        const jamMasuk = selectedShift.dataset.masuk;
        const [masukH, masukM] = jamMasuk.split(':');
        const masukDate = new Date();
        masukDate.setHours(parseInt(masukH), parseInt(masukM), 0);
        const diffMins = Math.floor((new Date() - masukDate) / 60000);
        
        if (diffMins > 0) {
            payload.catatan = `(Terlambat ${diffMins} mnt) ` + payload.catatan;
        }
    }

    loader.classList.remove('d-none');
    
    try {
        const response = await fetch(`${GAS_URL}?api=submit_absen`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // GAS requires text/plain for CORS POST
            }
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
});

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
