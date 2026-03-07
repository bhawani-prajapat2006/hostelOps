"""Email service using Brevo (formerly Sendinblue) HTTP API."""

import requests
from app.core.config import settings


def send_password_reset_email(to_email: str, username: str, reset_link: str) -> bool:
    """Send a password reset email via Brevo transactional API.

    Returns True if sent successfully, False otherwise.
    """
    if not settings.BREVO_API_KEY:
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json",
    }
    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [{"email": to_email, "name": username}],
        "subject": "HostelOps — Password Reset",
        "htmlContent": f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Hi {username},</p>
            <p>You requested a password reset for your HostelOps account.</p>
            <p>Click the link below to reset your password (valid for 1 hour):</p>
            <p><a href="{reset_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>— HostelOps Team</p>
        </body>
        </html>
        """,
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        return resp.status_code in (200, 201)
    except Exception:
        return False


def send_complaint_status_email(
    to_email: str, username: str, complaint_title: str,
    old_status: str, new_status: str,
) -> bool:
    """Notify a student when their complaint status changes."""
    if not settings.BREVO_API_KEY:
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json",
    }
    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [{"email": to_email, "name": username}],
        "subject": f"HostelOps — Complaint Update: {complaint_title}",
        "htmlContent": f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Complaint Status Updated</h2>
            <p>Hi {username},</p>
            <p>Your complaint <strong>"{complaint_title}"</strong> has been updated:</p>
            <p><strong>{old_status}</strong> → <strong>{new_status}</strong></p>
            <br>
            <p>— HostelOps Team</p>
        </body>
        </html>
        """,
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        return resp.status_code in (200, 201)
    except Exception:
        return False
