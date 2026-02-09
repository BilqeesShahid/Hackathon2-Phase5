#!/usr/bin/env python3
"""
Debug script to test the authentication flow and identify the issue.
"""
import os
import sys
import tempfile
import subprocess
import time
import requests

def test_auth_flow():
    """Test the authentication flow step by step."""
    print("Testing authentication flow...")
    
    # Create a temporary database file for this test
    temp_db = tempfile.mktemp(suffix='.db')
    sqlite_url = f"sqlite:///{temp_db}"
    
    # Set environment to use SQLite
    env = os.environ.copy()
    env['DATABASE_URL'] = sqlite_url
    env['BETTER_AUTH_SECRET'] = "0mbJv2O1s7AApOa1TUTKA29VZ376i3zS"  # Use the same secret as in the code
    
    # Start the backend server
    print("Starting backend server...")
    proc = subprocess.Popen([
        sys.executable, "-c", 
        '''
import sys
sys.path.insert(0, "src/backend")
from app.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
        '''
    ], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Wait for server to start
    time.sleep(5)
    
    try:
        # Step 1: Test health endpoint
        print("Step 1: Testing health endpoint...")
        response = requests.get("http://127.0.0.1:8000/health")
        print(f"  Health endpoint: {response.status_code}")
        if response.status_code != 200:
            print(f"  [ERROR] Health endpoint failed: {response.text}")
            return False
        else:
            print("  [OK] Health endpoint works")
        
        # Step 2: Test sign-up
        print("Step 2: Testing sign-up endpoint...")
        signup_data = {
            "email": "debug@example.com",
            "password": "securepassword",
            "name": "Debug User"
        }
        response = requests.post("http://127.0.0.1:8000/auth/sign-up", json=signup_data)
        print(f"  Sign-up endpoint: {response.status_code}")
        if response.status_code != 200:
            print(f"  [ERROR] Sign-up failed: {response.text}")
            return False
        else:
            token_data = response.json()
            token = token_data['token']
            user_id = token_data['user_id']
            print(f"  [OK] Sign-up works, got user_id: {user_id}")
        
        # Step 3: Test verify endpoint
        print("Step 3: Testing verify endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://127.0.0.1:8000/auth/verify", headers=headers)
        print(f"  Verify endpoint: {response.status_code}")
        if response.status_code != 200:
            print(f"  [ERROR] Verify failed: {response.text}")
            return False
        else:
            verify_data = response.json()
            print(f"  [OK] Verify works, user_id: {verify_data['user_id']}")
        
        # Step 4: Test tasks endpoint with the user ID from token
        print("Step 4: Testing tasks endpoint...")
        response = requests.get(f"http://127.0.0.1:8000/api/{user_id}/tasks", headers=headers)
        print(f"  Tasks endpoint: {response.status_code}")
        if response.status_code != 200:
            print(f"  [ERROR] Tasks endpoint failed: {response.text}")
            print(f"  Headers sent: {headers}")
            print(f"  URL accessed: http://127.0.0.1:8000/api/{user_id}/tasks")
            return False
        else:
            tasks_data = response.json()
            print(f"  [OK] Tasks endpoint works, got {len(tasks_data.get('tasks', []))} tasks")
        
        # Step 5: Test conversations endpoint
        print("Step 5: Testing conversations endpoint...")
        response = requests.get(f"http://127.0.0.1:8000/api/{user_id}/conversations", headers=headers)
        print(f"  Conversations endpoint: {response.status_code}")
        if response.status_code != 200:
            print(f"  [ERROR] Conversations endpoint failed: {response.text}")
            print(f"  Headers sent: {headers}")
            print(f"  URL accessed: http://127.0.0.1:8000/api/{user_id}/conversations")
            return False
        else:
            conv_data = response.json()
            print(f"  [OK] Conversations endpoint works, got {len(conv_data.get('conversations', []))} conversations")
        
        print("\n[SUCCESS] All authentication flow tests passed!")
        print("The issue might be with the frontend or with existing data in your main database.")
        return True
        
    except Exception as e:
        print(f"[ERROR] Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Terminate the server
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except:
            try:
                proc.kill()
            except:
                pass

if __name__ == "__main__":
    success = test_auth_flow()
    if success:
        print("\n[SUCCESS] Authentication flow is working correctly!")
    else:
        print("\n[ERROR] Authentication flow has issues.")