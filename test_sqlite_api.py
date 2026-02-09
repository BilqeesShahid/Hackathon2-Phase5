#!/usr/bin/env python3
"""
Quick test to verify the SQLite database works with the auth endpoints.
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'backend'))

# Override the DATABASE_URL to use SQLite before importing anything else
os.environ['DATABASE_URL'] = 'sqlite:///./test_todo_app.db'

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
    print("Starting test server with SQLite database...")
    server, thread = start_test_server()
    
    # Wait a moment for the server to start
    time.sleep(3)  # Give more time for startup
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get("http://127.0.0.1:8000/health")
        print(f"Health endpoint: {response.status_code} - {response.json()}")
        
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
            user_id = token_data['user_id']
            
            # Test verify endpoint with the token
            print("Testing verify endpoint...")
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get("http://127.0.0.1:8000/auth/verify", headers=headers)
            print(f"Verify endpoint: {response.status_code} - {response.json()['email']}")
            
            # Test tasks endpoint with the token
            print("Testing tasks endpoint...")
            response = requests.get(f"http://127.0.0.1:8000/api/{user_id}/tasks", headers=headers)
            print(f"Tasks endpoint: {response.status_code}")
            if response.status_code == 200:
                tasks_data = response.json()
                print(f"  Retrieved {len(tasks_data.get('tasks', []))} tasks")
                
            # Test chat endpoints
            print("Testing chat endpoint...")
            chat_data = {
                "message": "Hello, can you help me create a task?",
                "conversation_id": None
            }
            response = requests.post(f"http://127.0.0.1:8000/api/{user_id}/chat", 
                                   json=chat_data, headers=headers)
            print(f"Chat endpoint: {response.status_code}")
            if response.status_code == 200:
                chat_response = response.json()
                print(f"  Chat response received, conversation ID: {chat_response['conversation_id'][:10]}...")
                
            # Test conversations endpoint
            print("Testing conversations endpoint...")
            response = requests.get(f"http://127.0.0.1:8000/api/{user_id}/conversations", headers=headers)
            print(f"Conversations endpoint: {response.status_code}")
            if response.status_code == 200:
                conv_data = response.json()
                print(f"  Retrieved {len(conv_data.get('conversations', []))} conversations")
                
        else:
            print(f"  Sign-up failed: {response.status_code} - {response.text}")
        
    except Exception as e:
        print(f"Error testing API endpoints: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Test completed. Server will shut down when script exits.")

if __name__ == "__main__":
    test_api_endpoints()