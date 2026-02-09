#!/usr/bin/env python3
"""
Final test to verify the backend API works properly with SQLite.
"""
import os
import sys
import time
import tempfile
import subprocess
import signal
import requests
import threading

def test_backend_with_sqlite():
    """Test the backend with SQLite database."""
    print("Testing backend with SQLite database...")
    
    # Create a temporary database file for this test
    temp_db = tempfile.mktemp(suffix='.db')
    sqlite_url = f"sqlite:///{temp_db}"
    
    # Set environment to use SQLite
    env = os.environ.copy()
    env['DATABASE_URL'] = sqlite_url
    
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
    time.sleep(3)
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get("http://127.0.0.1:8000/health")
        assert response.status_code == 200
        print("[OK] Health endpoint works")
        
        # Test sign-up with a unique email
        print("Testing sign-up endpoint...")
        signup_data = {
            "email": "testuser2@example.com",
            "password": "securepassword",
            "name": "Test User 2"
        }
        response = requests.post("http://127.0.0.1:8000/auth/sign-up", json=signup_data)
        assert response.status_code == 200
        token_data = response.json()
        token = token_data['token']
        user_id = token_data['user_id']
        print("[OK] Sign-up endpoint works")
        
        # Test verify endpoint
        print("Testing verify endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://127.0.0.1:8000/auth/verify", headers=headers)
        assert response.status_code == 200
        print("[OK] Verify endpoint works")
        
        # Test tasks endpoint
        print("Testing tasks endpoint...")
        response = requests.get(f"http://127.0.0.1:8000/api/{user_id}/tasks", headers=headers)
        assert response.status_code == 200
        print("[OK] Tasks endpoint works")
        
        # Test creating a task
        print("Testing create task endpoint...")
        task_data = {
            "title": "Test Task",
            "description": "This is a test task",
            "priority": "high",
            "tags": ["test", "important"]
        }
        response = requests.post(f"http://127.0.0.1:8000/api/{user_id}/tasks", 
                                json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        print("[OK] Create task endpoint works")
        
        # Test conversations endpoint
        print("Testing conversations endpoint...")
        response = requests.get(f"http://127.0.0.1:8000/api/{user_id}/conversations", headers=headers)
        assert response.status_code == 200
        print("[OK] Conversations endpoint works")
        
        print("\n[OK] All backend API tests passed!")
        print("The authentication and API calls should now work properly!")
        
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        # Print server output for debugging
        try:
            stdout, stderr = proc.communicate(timeout=1)
            print("Server stdout:", stdout.decode())
            print("Server stderr:", stderr.decode())
        except:
            pass
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
    
    return True

if __name__ == "__main__":
    success = test_backend_with_sqlite()
    if success:
        print("\n[SUCCESS] Backend is now properly configured and working!")
        print("The unauthorized errors should be fixed.")
    else:
        print("\n[FAILURE] Backend tests failed.")
        sys.exit(1)