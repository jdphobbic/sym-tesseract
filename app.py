from flask import Flask, render_template, request, jsonify, Response, redirect, session, url_for
import json
import csv
import io
import re
import os
from werkzeug.utils import secure_filename

import database
import email_service

app = Flask(__name__)
app.secret_key = 'tesseract26_admin_auth_secret_key_2026'

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'Helloworld'

# Initialize database tables & seed data on app start
with app.app_context():
    database.init_db()

def is_admin_authenticated():
    return session.get('admin_logged_in') is True

# Input Validation Helpers
def validate_registration_payload(data):
    errors = {}
    
    name = (data.get('participant_name') or '').strip()
    if not name or len(name) < 2:
        errors['participant_name'] = 'Full Name must be at least 2 characters.'
    elif re.search(r'\d', name):
        errors['participant_name'] = 'Name must not contain numbers.'
        
    email = (data.get('email') or '').strip()
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not email or not re.match(email_regex, email):
        errors['email'] = 'Please enter a valid email address.'
        
    mobile = (data.get('mobile') or '').strip()
    if not mobile or not re.match(r'^[6-9]\d{9}$', mobile):
        errors['mobile'] = 'Please enter a valid 10-digit Indian mobile number.'
        
    for field in ['college', 'department', 'year', 'city']:
        val = (data.get(field) or '').strip()
        if not val:
            errors[field] = f"{field.replace('_', ' ').title()} is required."
            
    event_id = data.get('event_id')
    if not event_id:
        errors['event_id'] = 'Event selection is required.'
        
    return errors

# Public Pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/events')
def events_page():
    return render_template('register.html')

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('images/favicon.ico')

# Admin Portal & Authentication
@app.route('/admin')
def admin():
    if is_admin_authenticated():
        return render_template('admin.html')
    return render_template('admin_login.html')

@app.route('/api/admin/login', methods=['POST'])
@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() if request.is_json else request.form
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session['admin_logged_in'] = True
        return jsonify({"success": True, "message": "Login successful"})
    
    return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route('/admin/logout')
@app.route('/api/admin/logout', methods=['GET', 'POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect('/admin')

# Public API Endpoints
@app.route('/api/events', methods=['GET'])
def get_events():
    include_closed = request.args.get('include_closed', '1') == '1'
    conn = database.get_db()
    try:
        events = database.get_all_events(conn, include_closed=include_closed)
        return jsonify({"success": True, "events": events})
    finally:
        conn.close()

@app.route('/api/events/<event_id>', methods=['GET'])
def get_event(event_id):
    conn = database.get_db()
    try:
        evt = database.get_event_by_id(conn, event_id)
        if not evt:
            return jsonify({"success": False, "message": "Event not found"}), 404
        return jsonify({"success": True, "event": evt})
    finally:
        conn.close()

@app.route('/api/register', methods=['POST'])
def submit_registration():
    data = request.get_json() or {}
    
    errors = validate_registration_payload(data)
    if errors:
        return jsonify({"success": False, "errors": errors, "message": "Validation failed"}), 400
        
    conn = database.get_db()
    try:
        event = database.get_event_by_id(conn, data['event_id'])
        if not event:
            return jsonify({"success": False, "message": "Invalid event selected"}), 400
            
        if not event['registration_open']:
            return jsonify({"success": False, "message": "REGISTRATION CLOSED for this event"}), 403
            
        registration = database.create_registration(conn, data)
        email_res = email_service.send_confirmation_email(conn, registration)
        registration['email_status'] = email_res
        
        return jsonify({
            "success": True,
            "message": "Registration successful!",
            "registration": registration
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/api/registration/<reg_id>', methods=['GET'])
def get_registration(reg_id):
    conn = database.get_db()
    try:
        reg = database.get_registration_by_reg_id(conn, reg_id)
        if not reg:
            return jsonify({"success": False, "message": "Registration not found"}), 404
        return jsonify({"success": True, "registration": reg})
    finally:
        conn.close()

# Protected Admin API Endpoints
@app.route('/api/admin/registrations', methods=['GET'])
def admin_get_registrations():
    if not is_admin_authenticated():
        return jsonify({"success": False, "message": "Unauthorized. Please login to access admin APIs."}), 401

    event_id = request.args.get('event_id')
    search = request.args.get('search')
    status = request.args.get('status')
    
    conn = database.get_db()
    try:
        regs = database.get_all_registrations(conn, event_id=event_id, search=search, status=status)
        return jsonify({"success": True, "registrations": regs, "count": len(regs)})
    finally:
        conn.close()

@app.route('/api/admin/registration/<reg_id>/status', methods=['PUT'])
def admin_update_reg_status(reg_id):
    if not is_admin_authenticated():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    payload = request.get_json() or {}
    new_status = payload.get('status')
    if new_status not in ['confirmed', 'pending', 'cancelled']:
        return jsonify({"success": False, "message": "Invalid status value"}), 400
        
    conn = database.get_db()
    try:
        updated = database.update_registration_status(conn, reg_id, new_status)
        if updated:
            return jsonify({"success": True, "message": f"Registration {reg_id} status updated to {new_status}"})
        return jsonify({"success": False, "message": "Registration not found"}), 404
    finally:
        conn.close()

@app.route('/api/admin/events/<event_id>/status', methods=['PUT'])
def admin_toggle_event_status(event_id):
    if not is_admin_authenticated():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    payload = request.get_json() or {}
    registration_open = payload.get('registration_open')
    if registration_open is None:
        return jsonify({"success": False, "message": "'registration_open' boolean is required"}), 400
        
    conn = database.get_db()
    try:
        updated = database.update_event_status(conn, event_id, bool(registration_open))
        if updated:
            return jsonify({
                "success": True,
                "message": f"Registration for event '{event_id}' updated to {'OPEN' if registration_open else 'CLOSED'}"
            })
        return jsonify({"success": False, "message": "Event not found"}), 404
    finally:
        conn.close()

@app.route('/api/admin/events/<event_id>', methods=['PUT'])
def admin_update_event(event_id):
    if not is_admin_authenticated():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    payload = request.get_json() or {}
    conn = database.get_db()
    try:
        updated = database.update_event(
            conn,
            event_id,
            venue=payload.get('venue'),
            prizes=payload.get('prizes'),
            max_team_size=payload.get('max_team_size'),
            custom_fields=payload.get('custom_fields'),
            poster_url=payload.get('poster_url')
        )
        if updated:
            return jsonify({"success": True, "message": "Event updated successfully"})
        return jsonify({"success": False, "message": "Event not found or no changes made"}), 404
    finally:
        conn.close()

@app.route('/api/admin/upload-poster', methods=['POST'])
def admin_upload_poster():
    if not is_admin_authenticated():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    if 'poster' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400
    file = request.files['poster']
    if file.filename == '':
        return jsonify({"success": False, "message": "No selected file"}), 400
    
    allowed_exts = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        return jsonify({"success": False, "message": f"Unsupported file type. Allowed: {', '.join(allowed_exts)}"}), 400
    
    event_id = request.form.get('event_id') or 'poster'
    clean_event_id = secure_filename(event_id)
    filename = f"{clean_event_id}{ext}"
    
    posters_dir = os.path.join(app.static_folder, 'images', 'posters')
    os.makedirs(posters_dir, exist_ok=True)
    
    file_path = os.path.join(posters_dir, filename)
    file.save(file_path)
    
    poster_url = f"/static/images/posters/{filename}"
    return jsonify({
        "success": True,
        "poster_url": poster_url,
        "message": "Poster uploaded successfully!"
    })

@app.route('/api/admin/emails', methods=['GET'])
def admin_get_email_logs():
    if not is_admin_authenticated():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    conn = database.get_db()
    try:
        logs = database.get_email_logs(conn)
        return jsonify({"success": True, "logs": logs})
    finally:
        conn.close()

@app.route('/api/admin/export', methods=['GET'])
def admin_export_csv():
    if not is_admin_authenticated():
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    event_id = request.args.get('event_id')
    search = request.args.get('search')
    status = request.args.get('status')
    
    conn = database.get_db()
    try:
        regs = database.get_all_registrations(conn, event_id=event_id, search=search, status=status)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow([
            'Registration ID', 'Event Title', 'Participant Name', 'Email', 'Mobile',
            'College', 'Department', 'Year', 'City', 'Participation Type',
            'Team Name', 'Team Leader', 'Team Members', 'Custom Data', 'Status', 'Created At'
        ])
        
        for r in regs:
            writer.writerow([
                r['registration_id'],
                r['event_title'],
                r['participant_name'],
                r['email'],
                r['mobile'],
                r['college'],
                r['department'],
                r['year'],
                r['city'],
                r['participation_type'],
                r.get('team_name', ''),
                r.get('team_leader', ''),
                json.dumps(r.get('team_members', [])),
                json.dumps(r.get('custom_data', {})),
                r['status'],
                r['created_at']
            ])
            
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={"Content-disposition": "attachment; filename=tesseract26_registrations.csv"}
        )
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
