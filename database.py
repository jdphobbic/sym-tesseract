import sqlite3
import json
import secrets
import string
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'tesseract.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            venue TEXT NOT NULL,
            prizes TEXT NOT NULL,
            registration_open INTEGER NOT NULL DEFAULT 1,
            max_team_size INTEGER DEFAULT 4,
            custom_fields TEXT DEFAULT '[]',
            poster_url TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Ensure columns exist if db was created earlier
    cursor.execute("PRAGMA table_info(events)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'poster_url' not in columns:
        cursor.execute("ALTER TABLE events ADD COLUMN poster_url TEXT DEFAULT NULL")
    if 'description' not in columns:
        cursor.execute("ALTER TABLE events ADD COLUMN description TEXT DEFAULT ''")
    if 'rules' not in columns:
        cursor.execute("ALTER TABLE events ADD COLUMN rules TEXT DEFAULT ''")
    
    # Registrations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            registration_id TEXT UNIQUE NOT NULL,
            event_id TEXT NOT NULL,
            participant_name TEXT NOT NULL,
            email TEXT NOT NULL,
            mobile TEXT NOT NULL,
            college TEXT NOT NULL,
            department TEXT NOT NULL,
            year TEXT NOT NULL,
            city TEXT NOT NULL,
            participation_type TEXT NOT NULL DEFAULT 'INDIVIDUAL',
            team_name TEXT,
            team_leader TEXT,
            team_members TEXT,
            custom_data TEXT DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events (id)
        )
    ''')
    
    # Email logs table for tracking notifications
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            registration_id TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            status TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    seed_events(conn)
    conn.close()

def seed_events(conn):
    cursor = conn.cursor()
    
    # Remove deprecated ID alias if present
    cursor.execute("DELETE FROM events WHERE id = 'decode-the-arms'")
    
    initial_events = [
        # TECHNICAL EVENTS
        {
            "id": "circuit-debugging",
            "title": "Circuit Debugging",
            "category": "TECHNICAL EVENTS",
            "venue": "MPMC Lab",
            "description": "Test your analytical skills and circuit acumen. Locate, identify, and troubleshoot intentional hardware faults and anomalies in electronic and logic circuits.",
            "rules": "Max 3 members per team. Round 1: Written screening on circuit concepts. Round 2: Hands-on debugging on breadboards with multimeters & components. Speed and proper circuit operation determine the winner.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹2,000"},
                {"rank": "2nd Prize", "amount": "₹1,000"}
            ]),
            "registration_open": 1,
            "max_team_size": 3,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/circuit debugging 1.jpeg",
                "/static/images/posters/circuit debugging 2.jpeg"
            ])
        },
        {
            "id": "tech-debate",
            "title": "Tech Debate",
            "category": "TECHNICAL EVENTS",
            "venue": "F101",
            "description": "A battle of technical wit, rhetoric, and critical reasoning. Debate on emerging technologies, AI impact, and engineering controversies with logical arguments.",
            "rules": "2 members per team. Debate topics provided on the spot with prep time. Structured rounds of opening statements, rebuttals, and jury questions.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹2,000"},
                {"rank": "2nd Prize", "amount": "₹1,000"}
            ]),
            "registration_open": 1,
            "max_team_size": 2,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/tech debate 1.jpeg",
                "/static/images/posters/tech debate 2.jpeg"
            ])
        },
        {
            "id": "project-expo",
            "title": "Project Expo",
            "category": "TECHNICAL EVENTS",
            "venue": "Comm Lab",
            "description": "Showcase your cutting-edge working hardware prototypes, IoT devices, robotics systems, embedded systems, and software engineering projects.",
            "rules": "Up to 4 members per team. Working model demonstration and project summary required. Judged on innovation, practical feasibility, and presentation clarity.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹2,000"},
                {"rank": "2nd Prize", "amount": "₹1,000"}
            ]),
            "registration_open": 1,
            "max_team_size": 4,
            "custom_fields": json.dumps([
                {"id": "project_title", "label": "Project Title", "type": "text", "required": True},
                {"id": "project_domain", "label": "Project Domain / Stack", "type": "text", "required": False}
            ]),
            "poster_url": json.dumps([
                "/static/images/posters/project expo 1.jpeg",
                "/static/images/posters/project expo 2.jpeg"
            ])
        },
        {
            "id": "paper-presentation",
            "title": "Paper Presentation",
            "category": "TECHNICAL EVENTS",
            "venue": "Microwave Lab",
            "description": "Present original research papers, innovative concepts, and analytical findings in front of an expert panel of academicians.",
            "rules": "Up to 3 members per team. PPT presentation (8 mins presentation + 2 mins Q&A). Standard IEEE format encouraged.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹2,000"},
                {"rank": "2nd Prize", "amount": "₹1,000"}
            ]),
            "registration_open": 1,
            "max_team_size": 3,
            "custom_fields": json.dumps([
                {"id": "paper_title", "label": "Paper Title", "type": "text", "required": True},
                {"id": "paper_abstract", "label": "Brief Abstract", "type": "textarea", "required": False}
            ]),
            "poster_url": json.dumps([
                "/static/images/posters/paper presentation.jpeg",
                "/static/images/posters/paper presentation 2.jpeg"
            ])
        },
        {
            "id": "tech-quiz",
            "title": "Tech Quiz",
            "category": "TECHNICAL EVENTS",
            "venue": "DSP Lab",
            "description": "High-energy multi-round quiz testing your depth in electronics, computing, engineering milestones, science, and global tech trivia.",
            "rules": "2 members per team. Written preliminary screening round followed by live on-stage finals with buzzer and rapid-fire rounds.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹2,000"},
                {"rank": "2nd Prize", "amount": "₹1,000"}
            ]),
            "registration_open": 1,
            "max_team_size": 2,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/tech quiz 1.jpeg",
                "/static/images/posters/tech quiz 2.jpeg",
                "/static/images/posters/tech quiz 3.jpeg",
                "/static/images/posters/tech quiz 4.jpeg"
            ])
        },

        # NON-TECHNICAL EVENTS
        {
            "id": "men-on-ramp",
            "title": "Men on Ramp",
            "category": "NON-TECHNICAL EVENTS",
            "venue": "APJ Abdul Kalam",
            "description": "Showcase confidence, personality, attitude, styling, and stage presence in a premier runway fashion contest.",
            "rules": "Individual participation (1 member). Themed walkthrough, self-introduction, and jury interaction rounds.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹5,000"},
                {"rank": "2nd Prize", "amount": "₹3,000"}
            ]),
            "registration_open": 1,
            "max_team_size": 1,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/men on ramp.jpeg"
            ])
        },
        {
            "id": "ipl-auction",
            "title": "IPL Auction",
            "category": "NON-TECHNICAL EVENTS",
            "venue": "MPMC Lab",
            "description": "Strategic cricket squad bidding war. Manage your allocated virtual auction purse to build the ultimate balanced IPL team.",
            "rules": "Up to 3 members per team. Auction guidelines, player ratings, and purse limits announced at event start.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹1,000"},
                {"rank": "2nd Prize", "amount": "₹500"}
            ]),
            "registration_open": 1,
            "max_team_size": 3,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/ipl auction.jpeg"
            ])
        },
        {
            "id": "channel-surfing",
            "title": "Channel Surfing",
            "category": "NON-TECHNICAL EVENTS",
            "venue": "ECE Dept, S201",
            "description": "Spontaneous acting and performance challenge. Switch roles, genres, accents, and emotions instantaneously when the judges switch channels!",
            "rules": "Up to 5 members per team. Adaptability, humor, and team coordination are prime judging factors.",
            "prizes": json.dumps([
                {"rank": "Winner", "amount": "₹700"},
                {"rank": "Runner", "amount": "₹300"}
            ]),
            "registration_open": 1,
            "max_team_size": 5,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/chanell surfing.jpeg"
            ])
        },
        {
            "id": "connection",
            "title": "Connection",
            "category": "NON-TECHNICAL EVENTS",
            "venue": "ECE Dept, S201",
            "description": "Visual clue hunt! Connect multiple unrelated images, movie stills, and audio hints to discover hidden tech terms, titles, and words.",
            "rules": "2 members per team. Multi-round visual clue elimination.",
            "prizes": json.dumps([
                {"rank": "Winner", "amount": "₹700"},
                {"rank": "Runner", "amount": "₹300"}
            ]),
            "registration_open": 1,
            "max_team_size": 2,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/connections.png"
            ])
        },
        {
            "id": "decode-the-ams",
            "title": "Decode the AMS",
            "category": "NON-TECHNICAL EVENTS",
            "venue": "E101 – ECE Dept",
            "description": "Campus-wide cryptic treasure and clue hunt. Crack riddles and logic ciphers to unmask the final destination.",
            "rules": "2 members per team. Timed cipher solving across designated checkpoints.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹700"},
                {"rank": "2nd Prize", "amount": "₹300"}
            ]),
            "registration_open": 1,
            "max_team_size": 2,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/decode-the-ams.jpg"
            ])
        },
        {
            "id": "e-sports",
            "title": "E-Sports",
            "category": "NON-TECHNICAL EVENTS",
            "venue": "S201 – ECE Dept",
            "description": "High-intensity mobile gaming tournament featuring Free Fire and FC showdowns.",
            "rules": "Squad and solo tournament brackets. Standard competition rules enforced.",
            "prizes": json.dumps([
                {"rank": "Free Fire - 1st Prize", "amount": "₹700"},
                {"rank": "Free Fire - 2nd Prize", "amount": "₹400"},
                {"rank": "FC - 1st Prize", "amount": "₹500"}
            ]),
            "registration_open": 1,
            "max_team_size": 4,
            "custom_fields": json.dumps([
                {"id": "gaming_id", "label": "Gaming ID / In-Game Name", "type": "text", "required": True},
                {
                    "id": "esports_game",
                    "label": "Game Category",
                    "type": "select",
                    "options": ["Free Fire", "FC"],
                    "required": True
                }
            ]),
            "poster_url": json.dumps([
                "/static/images/posters/e sports.jpeg"
            ])
        },
        {
            "id": "console",
            "title": "Console Clash",
            "category": "NON-TECHNICAL EVENTS",
            "venue": "S201 – ECE Dept",
            "description": "Head-to-head console tournament on controllers with instant knockout arcade matches.",
            "rules": "Individual 1v1 knockout bracket matches.",
            "prizes": json.dumps([
                {"rank": "1st Prize", "amount": "₹500"}
            ]),
            "registration_open": 1,
            "max_team_size": 1,
            "custom_fields": json.dumps([]),
            "poster_url": json.dumps([
                "/static/images/posters/console clash.jpeg"
            ])
        },

        # STALLS & EXHIBITS
        {
            "id": "stall",
            "title": "Stalls & Food Exhibits",
            "category": "STALLS & EXHIBITS",
            "venue": "Campus Courtyard & Quadrangle",
            "description": "Commercial, fun, craft, and food stalls setup on campus. Run your own venture during the symposium day!",
            "rules": "Up to 4 members per stall. Space, standard table, and electrical connection provided. Register your stall venture early!",
            "prizes": json.dumps([
                {"rank": "Category", "amount": "Food, Gaming & Commercial Stalls"}
            ]),
            "registration_open": 1,
            "max_team_size": 4,
            "custom_fields": json.dumps([
                {"id": "stall_name", "label": "Stall / Venture Name", "type": "text", "required": True},
                {
                    "id": "stall_category",
                    "label": "Stall Type",
                    "type": "select",
                    "options": ["Food & Beverages", "Gaming & Entertainment Stalls", "Handmade & Art Crafts", "Tech Project / Hardware Display", "Other Commercial Stall"],
                    "required": True
                },
                {"id": "stall_requirements", "label": "Power / Table / Space Requirements", "type": "textarea", "required": False}
            ]),
            "poster_url": json.dumps([
                "/static/images/posters/stall.jpeg"
            ])
        }
    ]
    
    for evt in initial_events:
        cursor.execute('''
            INSERT INTO events (id, title, category, venue, prizes, registration_open, max_team_size, custom_fields, poster_url, description, rules)
            VALUES (:id, :title, :category, :venue, :prizes, :registration_open, :max_team_size, :custom_fields, :poster_url, :description, :rules)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                category=excluded.category,
                venue=excluded.venue,
                prizes=excluded.prizes,
                custom_fields=excluded.custom_fields,
                poster_url=excluded.poster_url,
                description=excluded.description,
                rules=excluded.rules
        ''', evt)
    
    conn.commit()

def generate_unique_registration_id(conn):
    alphabet = string.ascii_uppercase + string.digits
    cursor = conn.cursor()
    while True:
        suffix = ''.join(secrets.choice(alphabet) for _ in range(6))
        reg_id = f"TES26-{suffix}"
        cursor.execute("SELECT id FROM registrations WHERE registration_id = ?", (reg_id,))
        if not cursor.fetchone():
            return reg_id

def _parse_event_dict(row):
    if not row:
        return None
    evt = dict(row)
    evt['prizes'] = json.loads(evt['prizes']) if isinstance(evt['prizes'], str) else (evt['prizes'] or [])
    evt['custom_fields'] = json.loads(evt['custom_fields']) if isinstance(evt['custom_fields'], str) else (evt['custom_fields'] or [])
    evt['registration_open'] = bool(evt['registration_open'])
    evt['description'] = evt.get('description') or ''
    evt['rules'] = evt.get('rules') or ''
    
    # Parse poster_url / poster_urls
    raw_posters = evt.get('poster_url')
    poster_list = []
    if raw_posters:
        try:
            parsed = json.loads(raw_posters)
            if isinstance(parsed, list):
                poster_list = [str(p).strip() for p in parsed if p]
            elif isinstance(parsed, str):
                poster_list = [parsed.strip()]
        except (json.JSONDecodeError, TypeError):
            if ',' in raw_posters:
                poster_list = [p.strip() for p in raw_posters.split(',') if p.strip()]
            else:
                poster_list = [raw_posters.strip()]
                
    evt['poster_urls'] = poster_list
    evt['poster_url'] = poster_list[0] if len(poster_list) > 0 else None
    return evt

def get_all_events(conn, include_closed=True):
    cursor = conn.cursor()
    if include_closed:
        cursor.execute("SELECT * FROM events ORDER BY category DESC, title ASC")
    else:
        cursor.execute("SELECT * FROM events WHERE registration_open = 1 ORDER BY category DESC, title ASC")
    rows = cursor.fetchall()
    
    events = [_parse_event_dict(r) for r in rows]
    return events

def get_event_by_id(conn, event_id):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    row = cursor.fetchone()
    return _parse_event_dict(row)

def update_event_status(conn, event_id, registration_open):
    cursor = conn.cursor()
    cursor.execute("UPDATE events SET registration_open = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (1 if registration_open else 0, event_id))
    conn.commit()
    return cursor.rowcount > 0

def update_event(conn, event_id, venue=None, prizes=None, max_team_size=None, custom_fields=None, poster_url=None):
    cursor = conn.cursor()
    updates = []
    params = []
    
    if venue is not None:
        updates.append("venue = ?")
        params.append(venue)
    if prizes is not None:
        updates.append("prizes = ?")
        params.append(json.dumps(prizes) if isinstance(prizes, list) else prizes)
    if max_team_size is not None:
        updates.append("max_team_size = ?")
        params.append(int(max_team_size))
    if custom_fields is not None:
        updates.append("custom_fields = ?")
        params.append(json.dumps(custom_fields) if isinstance(custom_fields, list) else custom_fields)
    if poster_url is not None:
        updates.append("poster_url = ?")
        params.append(poster_url)
        
    if not updates:
        return False
        
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(event_id)
    
    query = f"UPDATE events SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    return cursor.rowcount > 0

def create_registration(conn, data):
    reg_id = generate_unique_registration_id(conn)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO registrations (
            registration_id, event_id, participant_name, email, mobile,
            college, department, year, city, participation_type,
            team_name, team_leader, team_members, custom_data, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        reg_id,
        data['event_id'],
        data['participant_name'],
        data['email'],
        data['mobile'],
        data['college'],
        data['department'],
        data['year'],
        data['city'],
        data.get('participation_type', 'INDIVIDUAL'),
        data.get('team_name', ''),
        data.get('team_leader', ''),
        json.dumps(data.get('team_members', [])) if isinstance(data.get('team_members'), list) else data.get('team_members', '[]'),
        json.dumps(data.get('custom_data', {})) if isinstance(data.get('custom_data'), dict) else data.get('custom_data', '{}'),
        data.get('status', 'confirmed')
    ))
    conn.commit()
    
    return get_registration_by_reg_id(conn, reg_id)

def get_registration_by_reg_id(conn, reg_id):
    cursor = conn.cursor()
    cursor.execute('''
        SELECT r.*, e.title as event_title, e.category as event_category, e.venue as event_venue
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.registration_id = ?
    ''', (reg_id,))
    row = cursor.fetchone()
    if not row:
        return None
    reg = dict(row)
    reg['team_members'] = json.loads(reg['team_members']) if reg['team_members'] else []
    reg['custom_data'] = json.loads(reg['custom_data']) if reg['custom_data'] else {}
    return reg

def get_all_registrations(conn, event_id=None, search=None, status=None):
    cursor = conn.cursor()
    query = '''
        SELECT r.*, e.title as event_title, e.category as event_category
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE 1=1
    '''
    params = []
    
    if event_id:
        query += " AND r.event_id = ?"
        params.append(event_id)
    if status:
        query += " AND r.status = ?"
        params.append(status)
    if search:
        query += " AND (r.registration_id LIKE ? OR r.participant_name LIKE ? OR r.email LIKE ? OR r.college LIKE ? OR r.mobile LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s, s])
        
    query += " ORDER BY r.created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    result = []
    for r in rows:
        item = dict(r)
        item['team_members'] = json.loads(item['team_members']) if item['team_members'] else []
        item['custom_data'] = json.loads(item['custom_data']) if item['custom_data'] else {}
        result.append(item)
    return result

def update_registration_status(conn, reg_id, new_status):
    cursor = conn.cursor()
    cursor.execute("UPDATE registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE registration_id = ?", (new_status, reg_id))
    conn.commit()
    return cursor.rowcount > 0

def log_email(conn, reg_id, recipient, subject, body, status):
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO email_logs (registration_id, recipient_email, subject, body, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (reg_id, recipient, subject, body, status))
    conn.commit()

def get_email_logs(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100")
    rows = cursor.fetchall()
    return [dict(r) for r in rows]
