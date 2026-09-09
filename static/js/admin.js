// TESSERACT '26 ADMIN PORTAL CONTROLLER

let adminState = {
    activeTab: 'regs',
    registrations: [],
    events: [],
    emailLogs: []
};

document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
});

function switchAdminTab(tabName) {
    adminState.activeTab = tabName;
    
    document.getElementById('tab-btn-regs').classList.toggle('active', tabName === 'regs');
    document.getElementById('tab-btn-events').classList.toggle('active', tabName === 'events');
    document.getElementById('tab-btn-emails').classList.toggle('active', tabName === 'emails');

    document.getElementById('admin-tab-regs').style.display = tabName === 'regs' ? 'block' : 'none';
    document.getElementById('admin-tab-events').style.display = tabName === 'events' ? 'block' : 'none';
    document.getElementById('admin-tab-emails').style.display = tabName === 'emails' ? 'block' : 'none';

    if (tabName === 'events') renderEventsControlTable();
    if (tabName === 'emails') loadEmailLogs();
}

function loadAdminData() {
    loadEventsDropdown();
    loadEventsControl();
    loadRegistrations();
}

// -------------------------------------------------------------
// REGISTRATIONS MANAGEMENT
// -------------------------------------------------------------
function loadEventsDropdown() {
    fetch('/api/events?include_closed=1')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                adminState.events = data.events;
                const dropdown = document.getElementById('admin-filter-event');
                dropdown.innerHTML = '<option value="">All Events</option>';
                data.events.forEach(evt => {
                    const opt = document.createElement('option');
                    opt.value = evt.id;
                    opt.innerText = `${evt.title} (${evt.category})`;
                    dropdown.appendChild(opt);
                });
            }
        });
}

function loadRegistrations() {
    const eventId = document.getElementById('admin-filter-event').value;
    const status = document.getElementById('admin-filter-status').value;
    const search = document.getElementById('admin-search-input').value.trim();

    let url = `/api/admin/registrations?`;
    if (eventId) url += `event_id=${encodeURIComponent(eventId)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                adminState.registrations = data.registrations;
                updateMetrics();
                renderRegistrationsTable();
            }
        });
}

let searchDebounce = null;
function handleAdminSearch() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        loadRegistrations();
    }, 300);
}

function updateMetrics() {
    const total = adminState.registrations.length;
    let techCount = 0;
    let nonTechCount = 0;

    adminState.registrations.forEach(r => {
        if (r.event_category === 'TECHNICAL EVENTS') techCount++;
        else nonTechCount++;
    });

    const activeEventsCount = adminState.events.filter(e => e.registration_open).length;

    document.getElementById('metric-total').innerText = total;
    document.getElementById('metric-tech').innerText = techCount;
    document.getElementById('metric-nontech').innerText = nonTechCount;
    document.getElementById('metric-active-events').innerText = activeEventsCount;
}

function renderRegistrationsTable() {
    const tbody = document.getElementById('registrations-tbody');
    tbody.innerHTML = '';

    if (adminState.registrations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No registrations found.
                </td>
            </tr>
        `;
        return;
    }

    adminState.registrations.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color: var(--primary-cyan); font-family: monospace;">${r.registration_id}</strong></td>
            <td>
                <strong style="color: #fff;">${escapeHtml(r.participant_name)}</strong><br>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(r.email)} | ${escapeHtml(r.mobile)}</span>
            </td>
            <td>
                <span style="color: var(--accent-purple); font-weight: 600;">${escapeHtml(r.event_title)}</span><br>
                <span style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(r.event_category)}</span>
            </td>
            <td>
                <span style="color: #fff;">${escapeHtml(r.college)}</span><br>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(r.department)} (${escapeHtml(r.year)})</span>
            </td>
            <td>
                <span style="font-size: 0.8rem; font-weight: 600; color: ${r.participation_type === 'TEAM' ? '#a855f7' : 'var(--text-muted)'};">
                    ${r.participation_type}
                </span>
            </td>
            <td>
                <select class="form-control" style="padding: 2px 6px; font-size: 0.8rem; width: auto;" onchange="updateRegStatus('${r.registration_id}', this.value)">
                    <option value="confirmed" ${r.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewRegDetails('${r.registration_id}')">👁️ View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateRegStatus(regId, newStatus) {
    fetch(`/api/admin/registration/${regId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadRegistrations();
        } else {
            alert('Failed to update status: ' + data.message);
        }
    });
}

function viewRegDetails(regId) {
    const reg = adminState.registrations.find(r => r.registration_id === regId);
    if (!reg) return;

    document.getElementById('modal-reg-id').innerText = reg.registration_id;
    const body = document.getElementById('modal-body-content');

    let teamHtml = '';
    if (reg.participation_type === 'TEAM') {
        teamHtml = `
            <div class="review-section">
                <div class="review-section-title">TEAM DETAILS</div>
                <p><strong>Team Name:</strong> ${escapeHtml(reg.team_name)}</p>
                <p><strong>Team Leader:</strong> ${escapeHtml(reg.team_leader)}</p>
                <p><strong>Team Members:</strong> ${(reg.team_members || []).join(', ') || 'None'}</p>
            </div>
        `;
    }

    let customHtml = '';
    const customKeys = Object.keys(reg.custom_data || {});
    if (customKeys.length > 0) {
        let rows = customKeys.map(k => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(reg.custom_data[k]))}</p>`).join('');
        customHtml = `
            <div class="review-section">
                <div class="review-section-title">EVENT SPECIFIC CUSTOM DATA</div>
                ${rows}
            </div>
        `;
    }

    body.innerHTML = `
        <div class="review-section">
            <div class="review-section-title">PARTICIPANT SUMMARY</div>
            <p><strong>Full Name:</strong> ${escapeHtml(reg.participant_name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(reg.email)}</p>
            <p><strong>Mobile:</strong> ${escapeHtml(reg.mobile)}</p>
            <p><strong>College:</strong> ${escapeHtml(reg.college)}</p>
            <p><strong>Department:</strong> ${escapeHtml(reg.department)}</p>
            <p><strong>Year of Study:</strong> ${escapeHtml(reg.year)}</p>
            <p><strong>City:</strong> ${escapeHtml(reg.city)}</p>
            <p><strong>Registration Status:</strong> <span class="badge-status badge-${reg.status}">${reg.status}</span></p>
            <p><strong>Created At:</strong> ${reg.created_at}</p>
        </div>

        <div class="review-section">
            <div class="review-section-title">EVENT DETAILS</div>
            <p><strong>Event:</strong> ${escapeHtml(reg.event_title)}</p>
            <p><strong>Category:</strong> ${escapeHtml(reg.event_category)}</p>
        </div>

        ${teamHtml}
        ${customHtml}
    `;

    document.getElementById('detail-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

// -------------------------------------------------------------
// EVENT CONTROL & REGISTRATION OPEN TOGGLE
// -------------------------------------------------------------
function loadEventsControl() {
    fetch('/api/events?include_closed=1')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                adminState.events = data.events;
                renderEventsControlTable();
            }
        });
}

function renderEventsControlTable() {
    const tbody = document.getElementById('events-control-tbody');
    tbody.innerHTML = '';

    adminState.events.forEach(evt => {
        const prizesStr = evt.prizes.map(p => `${p.rank}: ${p.amount}`).join(' | ');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color: #fff;">${escapeHtml(evt.title)}</strong></td>
            <td><span style="font-size: 0.75rem; color: var(--text-dim);">${escapeHtml(evt.category)}</span></td>
            <td><span>📍 ${escapeHtml(evt.venue)}</span></td>
            <td><span style="font-size: 0.8rem; color: #fbbf24;">${escapeHtml(prizesStr)}</span></td>
            <td><span>Max ${evt.max_team_size || 4}</span></td>
            <td>
                <label class="switch">
                    <input type="checkbox" ${evt.registration_open ? 'checked' : ''} onchange="toggleEventRegistration('${evt.id}', this.checked)">
                    <span class="slider"></span>
                </label>
                <span style="font-size: 0.8rem; margin-left: 8px; color: ${evt.registration_open ? '#10b981' : '#ef4444'};">
                    ${evt.registration_open ? 'OPEN' : 'CLOSED'}
                </span>
            </td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="configureEventCustomFields('${evt.id}')">⚙️ Config</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleEventRegistration(eventId, isOpen) {
    fetch(`/api/admin/events/${eventId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_open: isOpen })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadEventsControl();
        } else {
            alert('Failed to update event status: ' + data.message);
        }
    });
}

function configureEventCustomFields(eventId) {
    const evt = adminState.events.find(e => e.id === eventId);
    if (!evt) return;

    document.getElementById('modal-reg-id').innerText = `Configure ${evt.title}`;
    const body = document.getElementById('modal-body-content');

    const fieldsJsonStr = JSON.stringify(evt.custom_fields, null, 2);
    const posterList = (evt.poster_urls && evt.poster_urls.length > 0) ? evt.poster_urls : (evt.poster_url ? [evt.poster_url] : []);
    const posterDisplayStr = JSON.stringify(posterList, null, 2);

    const posterPreviewsHtml = posterList.length > 0
        ? `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
            ${posterList.map((p, idx) => `
                <div style="width: 70px; height: 70px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border-cyan); position: relative;">
                    <img src="${encodeURI(p)}" style="width: 100%; height: 100%; object-fit: cover;">
                    <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.65rem; padding: 1px 4px; border-radius: 2px;">#${idx+1}</span>
                </div>
            `).join('')}
           </div>`
        : '<span style="font-size: 0.8rem; color: var(--text-dim);">No posters currently attached.</span>';

    body.innerHTML = `
        <div class="review-section">
            <div class="review-section-title">EDIT VENUE, POSTERS & TEAM LIMIT</div>
            <div class="form-group">
                <label class="form-label">Venue Location</label>
                <input type="text" id="cfg-venue" class="form-control" value="${escapeHtml(evt.venue)}">
            </div>
            <div class="form-group">
                <label class="form-label">Official Event Poster URLs (JSON Array or Comma-Separated)</label>
                <textarea id="cfg-poster-url" class="form-control" rows="3" style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(posterDisplayStr)}</textarea>
                <div style="margin-top: 6px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Current Poster Previews:</span>
                    ${posterPreviewsHtml}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Max Team Members Allowed</label>
                <input type="number" id="cfg-team-limit" class="form-control" value="${evt.max_team_size || 4}">
            </div>
        </div>

        <div class="review-section">
            <div class="review-section-title">CUSTOM REGISTRATION FIELDS (JSON SCHEMA)</div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                Administrators can define custom input fields for this event (e.g. Project Title, Paper Abstract, Gaming ID).
            </p>
            <textarea id="cfg-custom-fields" class="form-control" rows="5" style="font-family: monospace;">${fieldsJsonStr}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveEventConfig('${evt.id}')">Save Changes</button>
        </div>
    `;

    document.getElementById('detail-modal').style.display = 'flex';
}

function saveEventConfig(eventId) {
    const venue = document.getElementById('cfg-venue').value.trim();
    const posterRaw = document.getElementById('cfg-poster-url').value.trim();
    const maxTeam = parseInt(document.getElementById('cfg-team-limit').value);
    const fieldsStr = document.getElementById('cfg-custom-fields').value;

    let parsedFields;
    try {
        parsedFields = JSON.parse(fieldsStr);
    } catch (e) {
        alert('Invalid JSON structure in custom fields textarea.');
        return;
    }

    let parsedPosters = posterRaw;
    try {
        parsedPosters = JSON.parse(posterRaw);
    } catch (e) {
        // If not JSON, leave as string or split by comma
    }

    fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            venue: venue,
            poster_url: typeof parsedPosters === 'object' ? JSON.stringify(parsedPosters) : parsedPosters,
            max_team_size: maxTeam,
            custom_fields: parsedFields
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeModal();
            loadEventsControl();
        } else {
            alert('Failed to save config: ' + data.message);
        }
    });
}

// -------------------------------------------------------------
// EMAIL AUDIT LOGS
// -------------------------------------------------------------
function loadEmailLogs() {
    fetch('/api/admin/emails')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                adminState.emailLogs = data.logs;
                renderEmailLogsTable();
            }
        });
}

function renderEmailLogsTable() {
    const tbody = document.getElementById('email-logs-tbody');
    tbody.innerHTML = '';

    if (adminState.emailLogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No email logs available.
                </td>
            </tr>
        `;
        return;
    }

    adminState.emailLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.id}</td>
            <td><strong style="color: var(--primary-cyan); font-family: monospace;">${log.registration_id}</strong></td>
            <td><span>${escapeHtml(log.recipient_email)}</span></td>
            <td><span>${escapeHtml(log.subject)}</span></td>
            <td><span class="badge-status badge-confirmed">${log.status}</span></td>
            <td><span style="font-size: 0.8rem; color: var(--text-dim);">${log.sent_at}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="previewEmailTemplate(${log.id})">👁️ Preview</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function previewEmailTemplate(logId) {
    const log = adminState.emailLogs.find(l => l.id === logId);
    if (!log) return;

    document.getElementById('modal-reg-id').innerText = `Email Audit — ${log.registration_id}`;
    const body = document.getElementById('modal-body-content');
    body.innerHTML = `
        <div style="background: #ffffff; color: #000; padding: 1rem; border-radius: 8px; max-height: 60vh; overflow-y: auto;">
            ${log.body}
        </div>
    `;
    document.getElementById('detail-modal').style.display = 'flex';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
