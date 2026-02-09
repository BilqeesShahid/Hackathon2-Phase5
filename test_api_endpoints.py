"""
Test script to verify API endpoints and their correct structure
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
USER_ID = "c0678ed0-c2cb-4e3d-8091-6123fa7602ef"  # The user ID from the error logs
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMDY3OGVkMC1jMmNiLTRlM2QtODA5MS02MTIzZmE3NjAyZWYiLCJlbWFpbCI6ImJpbHFlZXNzaGFoaWQwMkBnbWFpbC5jb20iLCJleHAiOjE3NzA5MzQ5NTAsImlhdCI6MTc3MDMzMDE1MH0.gEjwQxAmpwtl-HQZjSV1ghX_VpJfOSxLXBQGZvusvR4"  # Bilqees Shahid's auth token

def test_endpoints():
    print("Testing API endpoints...")

    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Content-Type": "application/json"
    }

    # Test different endpoint variations
    endpoints_to_test = [
        f"{BASE_URL}/api/{USER_ID}/tasks",  # Single /api
        f"{BASE_URL}/api/api/{USER_ID}/tasks",  # Double /api
        f"{BASE_URL}/{USER_ID}/tasks",  # No /api prefix
    ]

    for endpoint in endpoints_to_test:
        print(f"\nTesting: {endpoint}")
        try:
            response = requests.get(endpoint, headers=headers)
            print(f"  Status: {response.status_code}")
            print(f"  Response: {response.text[:200]}...")  # First 200 chars
        except Exception as e:
            print(f"  Error: {str(e)}")

    # Also test the root API to see what endpoints are available
    print(f"\nTesting API root: {BASE_URL}/docs")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print("  API documentation available - check the routes")
    except Exception as e:
        print(f"  Error accessing docs: {str(e)}")

    print(f"\nTesting API root: {BASE_URL}")
    try:
        response = requests.get(f"{BASE_URL}")
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:500]}...")
    except Exception as e:
        print(f"  Error accessing root: {str(e)}")

if __name__ == "__main__":
    test_endpoints()