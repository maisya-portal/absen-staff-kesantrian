import os

app_path = "C:/1.MAISYA-PORTAL/absen-staff-kesantrian/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

# Update get_shifts
old_fetch_shifts = """const res = await fetch(`${GAS_URL}?api=get_shifts&_t=${new Date().getTime()}`);"""
new_fetch_shifts = """const res = await fetch(`${GAS_URL}?api=get_shifts&_t=${new Date().getTime()}`, { redirect: 'follow', credentials: 'omit' });"""
app_js = app_js.replace(old_fetch_shifts, new_fetch_shifts)

# Update get_staff
old_fetch_staff = """const res = await fetch(`${GAS_URL}?api=get_staff&_t=${new Date().getTime()}`);"""
new_fetch_staff = """const res = await fetch(`${GAS_URL}?api=get_staff&_t=${new Date().getTime()}`, { redirect: 'follow', credentials: 'omit' });"""
app_js = app_js.replace(old_fetch_staff, new_fetch_staff)

# Update submit_absen
old_fetch_submit = """        const response = await fetch(`${GAS_URL}?api=submit_absen`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // GAS requires text/plain for CORS POST
            }
        });"""
new_fetch_submit = """        const response = await fetch(`${GAS_URL}?api=submit_absen`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' // GAS requires text/plain for CORS POST
            },
            redirect: 'follow',
            credentials: 'omit'
        });"""
app_js = app_js.replace(old_fetch_submit, new_fetch_submit)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)
