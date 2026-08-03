import os

app_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

# Replace loadStaff catch block to show error message
old_catch = """    } catch (err) {
        console.error('Failed to load staff list');
        namaStaffInput.innerHTML = '<option value="">-- Gagal memuat staff --</option>';
    }"""

new_catch = """    } catch (err) {
        console.error('Failed to load staff list:', err);
        namaStaffInput.innerHTML = `<option value="">-- Error: ${err.message || 'CORS/Network'} --</option>`;
    }"""
app_js = app_js.replace(old_catch, new_catch)

# Also add cache buster to fetch
old_fetch_staff = """const res = await fetch(`${GAS_URL}?api=get_staff`);"""
new_fetch_staff = """const res = await fetch(`${GAS_URL}?api=get_staff&_t=${new Date().getTime()}`);"""
app_js = app_js.replace(old_fetch_staff, new_fetch_staff)

old_fetch_shifts = """const res = await fetch(`${GAS_URL}?api=get_shifts`);"""
new_fetch_shifts = """const res = await fetch(`${GAS_URL}?api=get_shifts&_t=${new Date().getTime()}`);"""
app_js = app_js.replace(old_fetch_shifts, new_fetch_shifts)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)
