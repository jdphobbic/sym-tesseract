import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import database

def build_confirmation_email_html(reg_data):
    """
    Generates a high-end responsive HTML email template for registration confirmation.
    STRICT DIRECTIVE: NO EVENT TIMING IS INCLUDED.
    """
    participant_name = reg_data.get('participant_name', 'Participant')
    reg_id = reg_data.get('registration_id', 'N/A')
    event_title = reg_data.get('event_title', reg_data.get('event_id', 'TESSERACT Event'))
    college = reg_data.get('college', 'N/A')
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #090a0f;
                color: #e2e8f0;
                margin: 0;
                padding: 20px;
            }}
            .email-card {{
                max-width: 600px;
                margin: 0 auto;
                background: #111422;
                border: 1px solid #00f3ff33;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 0 30px rgba(0, 243, 255, 0.15);
            }}
            .header {{
                text-align: center;
                border-bottom: 1px solid #1e293b;
                padding-bottom: 20px;
                margin-bottom: 25px;
            }}
            .logo-text {{
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 3px;
                background: linear-gradient(135deg, #00f3ff 0%, #7000ff 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0;
            }}
            .subtitle {{
                color: #94a3b8;
                font-size: 14px;
                margin-top: 5px;
                letter-spacing: 1px;
            }}
            .status-badge {{
                display: inline-block;
                background: rgba(16, 185, 129, 0.15);
                color: #10b981;
                border: 1px solid #10b98144;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 20px;
            }}
            .detail-box {{
                background: #0d0f19;
                border: 1px solid #1e293b;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px dashed #1e293b;
            }}
            .detail-row:last-child {{
                border-bottom: none;
            }}
            .label {{
                color: #94a3b8;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            .val {{
                color: #ffffff;
                font-size: 15px;
                font-weight: 600;
                text-align: right;
            }}
            .highlight-val {{
                color: #00f3ff;
                font-family: monospace;
                font-size: 18px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #1e293b;
                color: #64748b;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="email-card">
            <div class="header">
                <div class="logo-text">TESSERACT ’26</div>
                <div class="subtitle">National Level Symposium</div>
                <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                    Department of Electronics and Communication Engineering<br>
                    Aalim Muhammed Salegh College of Engineering
                </div>
            </div>

            <div style="text-align: center;">
                <div class="status-badge">✓ Registration Successful</div>
                <h2 style="color: #ffffff; margin-top: 0;">Welcome, {participant_name}!</h2>
                <p style="color: #cbd5e1; font-size: 14px;">
                    Your registration for TESSERACT ’26 has been successfully confirmed.
                </p>
            </div>

            <div class="detail-box">
                <div class="detail-row">
                    <span class="label">Registration ID</span>
                    <span class="val highlight-val">{reg_id}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Participant Name</span>
                    <span class="val">{participant_name}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Selected Event</span>
                    <span class="val" style="color: #a855f7;">{event_title}</span>
                </div>
                <div class="detail-row">
                    <span class="label">College / Institution</span>
                    <span class="val">{college}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Event Date</span>
                    <span class="val">12 September 2026</span>
                </div>
                <div class="detail-row">
                    <span class="label">Organized By</span>
                    <span class="val">ECE Dept, AMS Engineering College</span>
                </div>
            </div>

            <div style="text-align: center; color: #94a3b8; font-size: 13px; margin: 20px 0;">
                Please save your Registration ID (<strong>{reg_id}</strong>) or bring your digital badge pass on event day.
            </div>

            <div class="footer">
                &copy; 2026 TESSERACT ’26 — Department of ECE | Aalim Muhammed Salegh College of Engineering<br>
                This is an automated registration confirmation email.
            </div>
        </div>
    </body>
    </html>
    """
    return html

def send_confirmation_email(conn, reg_data):
    """
    Sends email if SMTP environment variables are configured, or logs the email content safely.
    Subject: TESSERACT ’26 — Registration Confirmation
    """
    recipient = reg_data.get('email')
    reg_id = reg_data.get('registration_id')
    subject = "TESSERACT ’26 — Registration Confirmation"
    html_content = build_confirmation_email_html(reg_data)

    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')

    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"TESSERACT '26 <{smtp_user}>"
            msg['To'] = recipient
            msg.attach(MIMEText(html_content, 'html'))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, recipient, msg.as_string())

            database.log_email(conn, reg_id, recipient, subject, html_content, "SENT")
            return {"success": True, "method": "SMTP", "message": "Email sent via SMTP"}
        except Exception as e:
            database.log_email(conn, reg_id, recipient, subject, html_content, f"FAILED: {str(e)}")
            return {"success": False, "method": "SMTP", "error": str(e)}
    else:
        # SMTP credentials not configured yet; store clean backend structure & log
        database.log_email(conn, reg_id, recipient, subject, html_content, "LOGGED (SMTP Not Configured)")
        return {
            "success": True,
            "method": "LOGGED",
            "message": "Email simulation logged cleanly (SMTP credentials can be added in ENV)"
        }
