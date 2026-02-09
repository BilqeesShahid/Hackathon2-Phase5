#!/usr/bin/env python3
"""
Simple test script to verify authentication is working properly.
"""
import asyncio
import json
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from app.db.init import init_db
from app.models.user import User
from sqlmodel import Session, select
from app.routers.auth import create_jwt_token
from app.db.config import engine

def test_database_and_auth():
    print("Testing database initialization...")
    
    # Initialize database
    init_db()
    print("[OK] Database initialized successfully")
    
    # Create a test user directly in the database
    with Session(engine) as session:
        # Check if test user already exists
        existing_user = session.exec(select(User).where(User.email == "test@example.com")).first()
        if existing_user:
            print(f"[OK] Found existing test user: {existing_user.email}")
            test_user = existing_user
        else:
            # Create a new test user
            test_user = User(
                email="test@example.com",
                name="Test User"
            )
            session.add(test_user)
            session.commit()
            session.refresh(test_user)
            print(f"[OK] Created new test user: {test_user.email}")
        
        # Create a JWT token for the test user
        token = create_jwt_token(test_user.id, test_user.email)
        print(f"[OK] Generated JWT token for user: {test_user.id}")
        print(f"Token: {token[:20]}...")
    
    # Now test that we can decode the token
    from jose import jwt
    import os
    
    BETTER_AUTH_SECRET = os.environ.get("BETTER_AUTH_SECRET", "0mbJv2O1s7AApOa1TUTKA29VZ376i3zS")
    
    try:
        payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=["HS256"])
        print(f"[OK] Successfully decoded token")
        print(f"  User ID: {payload.get('sub')}")
        print(f"  Email: {payload.get('email')}")
        print(f"  Expiration: {payload.get('exp')}")
    except Exception as e:
        print(f"[ERROR] Failed to decode token: {e}")
        return False
    
    print("\n[OK] All authentication tests passed!")
    return True

if __name__ == "__main__":
    test_database_and_auth()