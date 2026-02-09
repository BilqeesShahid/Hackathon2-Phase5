#!/usr/bin/env python3
"""
Test script to verify backend API endpoints are working properly.
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'backend'))

import requests
import threading
import time
from app.main import app
from uvicorn import Config, Server

def start_test_server():
    """Start the FastAPI server in a separate thread for testing."""
    config = Config(app=app, host="127.0.0.1", port=8000, log_level="info")
    server = Server(config=config)
    
    # Start server in a thread
    thread = threading.Thread(target=server.run)
    thread.daemon = True
    thread.start()
    return server, thread

def test_api_endpoints():
    """Test the API endpoints to make sure they're working."""
    print("Starting test server...")
    server, thread = start_test_server()
    
    # Wait a moment for the server to start
    time.sleep(2)
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get("http://127.0.0.1:8000/health")
        print(f"Health endpoint: {response.status_code} - {response.json()}")
        
        # Test root endpoint
        print("Testing root endpoint...")
        response = requests.get("http://127.0.0.1:8000/")
        print(f"Root endpoint: {response.status_code} - {response.json()['message']}")
        
        # Test sign-up endpoint
        print("Testing sign-up endpoint...")
        signup_data = {
            "email": "testuser@example.com",
            "password": "securepassword",
            "name": "Test User"
        }
        response = requests.post("http://127.0.0.1:8000/auth/sign-up", json=signup_data)
        print(f"Sign-up endpoint: {response.status_code}")
        if response.status_code == 200:
            token_data = response.json()
            print(f"  Token received: {token_data['token'][:20]}...")
            token = token_data['token']
            
            # Test verify endpoint with the token
            print("Testing verify endpoint...")
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get("http://127.0.0.1:8000/auth/verify", headers=headers)
            print(f"Verify endpoint: {response.status_code} - {response.json()['email']}")
            
            # Test tasks endpoint with the token
            print("Testing tasks endpoint...")
            response = requests.get(f"http://127.0.0.1:8000/api/{token_data['user_id']}/tasks", headers=headers)
            print(f"Tasks endpoint: {response.status_code}")
            if response.status_code == 200:
                tasks_data = response.json()
                print(f"  Retrieved {len(tasks_data.get('tasks', []))} tasks")
            
        else:
            print(f"  Sign-up failed: {response.text}")
        
    except Exception as e:
        print(f"Error testing API endpoints: {e}")
    finally:
        # Stop the server
        print("Stopping test server...")
        # Note: Uvicorn doesn't have a clean shutdown method in this context
        # The thread will terminate when the program exits

if __name__ == "__main__":
    test_api_endpoints()