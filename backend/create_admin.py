#!/usr/bin/env python3
"""
Create a test admin user for HostelOps
"""

import sys
import os

# Set Python path
sys.path.insert(0, '/home/sakti/hostelOps/backend')
os.chdir('/home/sakti/hostelOps/backend')

# Import after setting path
from app.core.security import hash_password
from app import models
from app.db.database import Base, engine, _get_engine, _get_session_local

def create_admin():
    """Create a test admin user"""

    # Get engine and session
    _engine = _get_engine()
    SessionLocal = _get_session_local()

    # Create all tables
    Base.metadata.create_all(bind=_engine)

    db = SessionLocal()

    try:
        # Check if admin already exists
        existing_admin = db.query(models.User).filter(
            models.User.email == "admin@test.com"
        ).first()

        if existing_admin:
            print("❌ Admin user already exists!")
            print(f"📧 Email: {existing_admin.email}")
            print(f"👤 Username: {existing_admin.username}")
            return False

        # Create admin user
        admin = models.User(
            username="admin",
            email="admin@test.com",
            password=hash_password("admin123"),
            role=models.UserRoleEnum.admin,
            status=models.UserStatusEnum.active,
            auth_provider="local",
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("✅ Admin user created successfully!\n")
        print("=" * 50)
        print("📧 Email:    admin@test.com")
        print("🔑 Password: admin123")
        print("👤 Username: admin")
        print("🎯 Role:     admin")
        print("✨ Status:   active")
        print("=" * 50)
        print("\nUse these credentials to log in and access:")
        print("  - Admin Dashboard: /dashboard/admin")
        print("  - User Approvals: /admin/approvals")
        print("  - System Management")

        return True

    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_admin()
    sys.exit(0 if success else 1)
