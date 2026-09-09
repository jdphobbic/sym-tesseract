import unittest
import json
import os
import re

from app import app
import database

class TestTesseractRegistrationSystem(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        with app.app_context():
            database.init_db()

    def test_01_seed_events_data_precision(self):
        """Verify seeded event data against explicit prompt rules"""
        conn = database.get_db()
        events = database.get_all_events(conn, include_closed=True)
        conn.close()

        self.assertEqual(len(events), 13, "Should seed exactly 13 events (including Stalls & Food Exhibits)")
        
        # Check stall event
        stall_evt = next((e for e in events if e['id'] == 'stall'), None)
        self.assertIsNotNone(stall_evt, "Stall event should be present")
        self.assertIn('/static/images/posters/stall.jpeg', stall_evt['poster_urls'])

        # Check multi-poster events (e.g. tech-quiz has 4 posters)
        tech_quiz = next(e for e in events if e['id'] == 'tech-quiz')
        self.assertEqual(len(tech_quiz['poster_urls']), 4, "Tech Quiz should have 4 posters")

        # 1. Men on Ramp check
        men_on_ramp = next(e for e in events if e['id'] == 'men-on-ramp')
        self.assertEqual(men_on_ramp['venue'], 'APJ Abdul Kalam')
        self.assertEqual(men_on_ramp['prizes'][0]['amount'], '₹5,000')
        self.assertEqual(men_on_ramp['prizes'][1]['amount'], '₹3,000')

        # 2. IPL Auction check (STRICT RULE: ₹1,000 ONLY, NO ₹21,000 or ₹500)
        ipl_auction = next(e for e in events if e['id'] == 'ipl-auction')
        self.assertEqual(len(ipl_auction['prizes']), 1, "IPL Auction must have ONLY 1 prize")
        self.assertEqual(ipl_auction['prizes'][0]['amount'], '₹1,000')

        # Ensure strings '21,000' and '500' are NOT in IPL Auction prize list
        ipl_json = json.dumps(ipl_auction)
        self.assertNotIn('21,000', ipl_json)
        self.assertNotIn('₹500', ipl_json)

        # 3. Check no event timings or coordinator contacts anywhere in DB seed
        for evt in events:
            evt_str = json.dumps(evt).lower()
            self.assertNotIn('timing', evt_str)
            self.assertNotIn('coordinator', evt_str)
            self.assertNotIn('phone', evt_str)

    def test_02_registration_validation(self):
        """Test server validation logic for participant fields"""
        # Invalid Name (numbers in name)
        res = self.app.post('/api/register', json={
            "event_id": "tech-quiz",
            "participant_name": "John123",
            "email": "john@example.com",
            "mobile": "9876543210",
            "college": "AMS College",
            "department": "ECE",
            "year": "3rd Year",
            "city": "Chennai"
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn('participant_name', data['errors'])

        # Invalid Email format
        res = self.app.post('/api/register', json={
            "event_id": "tech-quiz",
            "participant_name": "John Doe",
            "email": "invalid-email",
            "mobile": "9876543210",
            "college": "AMS College",
            "department": "ECE",
            "year": "3rd Year",
            "city": "Chennai"
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn('email', data['errors'])

        # Invalid Mobile number (alphabetic or non-10 digit)
        res = self.app.post('/api/register', json={
            "event_id": "tech-quiz",
            "participant_name": "John Doe",
            "email": "john@example.com",
            "mobile": "98765abcde",
            "college": "AMS College",
            "department": "ECE",
            "year": "3rd Year",
            "city": "Chennai"
        })
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn('mobile', data['errors'])

    def test_03_successful_registration_and_id_format(self):
        """Test successful registration submission, custom fields, and non-sequential Registration ID format"""
        payload = {
            "event_id": "project-expo",
            "participant_name": "Anita Sharma",
            "email": "anita@example.com",
            "mobile": "9876543210",
            "college": "Aalim Muhammed Salegh College of Engineering",
            "department": "ECE",
            "year": "4th Year",
            "city": "Chennai",
            "participation_type": "TEAM",
            "team_name": "Cyber Innovators",
            "team_leader": "Anita Sharma",
            "team_members": ["Rohan Kumar", "Priya V"],
            "custom_data": {
                "project_title": "AI Autonomous Robotics System",
                "project_domain": "Embedded Systems"
            }
        }
        res = self.app.post('/api/register', json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        
        reg = data['registration']
        reg_id = reg['registration_id']
        
        # Verify Non-sequential Registration ID format: TES26-XXXXXX (6 alphanumeric chars)
        self.assertTrue(re.match(r'^TES26-[A-Z0-9]{6}$', reg_id), f"ID '{reg_id}' does not match format TES26-XXXXXX")
        self.assertEqual(reg['participant_name'], "Anita Sharma")
        self.assertEqual(reg['custom_data']['project_title'], "AI Autonomous Robotics System")

        # Verify email log creation
        conn = database.get_db()
        logs = database.get_email_logs(conn)
        conn.close()
        self.assertGreaterEqual(len(logs), 1)
        self.assertEqual(logs[0]['registration_id'], reg_id)
        self.assertNotIn('timing', logs[0]['body'].lower())

    def test_04_admin_registration_control_toggle(self):
        """Test admin toggling registration_open to False disables registration for that event"""
        event_id = "circuit-debugging"
        
        # Authenticate admin
        login_res = self.app.post('/api/admin/login', json={"username": "admin", "password": "Helloworld"})
        self.assertEqual(login_res.status_code, 200)

        # 1. Admin turns OFF registration
        res = self.app.put(f'/api/admin/events/{event_id}/status', json={"registration_open": False})
        self.assertEqual(res.status_code, 200)

        # 2. Attempt registration -> Should fail with 403
        payload = {
            "event_id": event_id,
            "participant_name": "David Miller",
            "email": "david@example.com",
            "mobile": "9123456789",
            "college": "Test College",
            "department": "ECE",
            "year": "2nd Year",
            "city": "Chennai"
        }
        res = self.app.post('/api/register', json=payload)
        self.assertEqual(res.status_code, 403)
        self.assertIn("REGISTRATION CLOSED", res.get_json()['message'])

        # 3. Admin turns ON registration back
        res = self.app.put(f'/api/admin/events/{event_id}/status', json={"registration_open": True})
        self.assertEqual(res.status_code, 200)

    def test_05_admin_csv_export(self):
        """Test CSV export endpoint with admin authentication"""
        # Authenticate admin
        login_res = self.app.post('/api/admin/login', json={"username": "admin", "password": "Helloworld"})
        self.assertEqual(login_res.status_code, 200)

        res = self.app.get('/api/admin/export')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'text/csv')
        self.assertIn('Registration ID', res.data.decode('utf-8'))

    def test_06_admin_auth_security(self):
        """Test admin login authentication security requirements"""
        # 1. Unauthenticated request to admin API should fail
        with self.app.session_transaction() as sess:
            sess.clear()
        res = self.app.get('/api/admin/registrations')
        self.assertEqual(res.status_code, 401)

        # 2. Wrong credentials
        res = self.app.post('/api/admin/login', json={"username": "admin", "password": "wrong"})
        self.assertEqual(res.status_code, 401)

        # 3. Correct credentials (admin:Helloworld)
        res = self.app.post('/api/admin/login', json={"username": "admin", "password": "Helloworld"})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['success'])

if __name__ == '__main__':
    unittest.main()
