#!/usr/bin/env python3
"""
Simple test to check the tasks endpoint.
"""
import os
import sys
import time
import tempfile
import subprocess
import requests

def test_tasks_endpoint():
    """Test just the tasks endpoint."""
    print("Testing tasks endpoint with SQLite database...")
    
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
    time.sleep(5)
    
    try:
        # Test sign-up with a unique email
        print("Creating user...")
        signup_data = {
            "email": "testuser3@example.com",
            "password": "securepassword",
            "name": "Test User 3"
        }
        response = requests.post("http://127.0.0.1:8000/auth/sign-up", json=signup_data)
        print(f"Sign-up response: {response.status_code}")
        if response.status_code != 200:
            print(f"Sign-up failed: {response.text}")
            return False
            
        token_data = response.json()
        token = token_data['token']
        user_id = token_data['user_id']
        print(f"Created user with ID: {user_id}")
        
        # Test tasks endpoint
        print("Testing tasks endpoint...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"http://127.0.0.1:8000/api/{user_id}/tasks", headers=headers)
        print(f"Tasks endpoint response: {response.status_code}")
        if response.status_code != 200:
            print(f"Tasks endpoint failed: {response.text}")
            print(f"Headers sent: {headers}")
            print(f"URL accessed: http://127.0.0.1:8000/api/{user_id}/tasks")
            return False
        
        print("Tasks endpoint works!")
        return True
        
    except Exception as e:
        print(f"Exception: {e}")
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
    success = test_tasks_endpoint()
    if success:
        print("\n[SUCCESS] Tasks endpoint is working!")
    else:
        print("\n[FAILURE] Tasks endpoint is not working.")