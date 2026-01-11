#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Chinese Chess Game
Tests all authentication, game, and shop endpoints
"""

import requests
import sys
import json
from datetime import datetime
import time
import uuid

class ChineseChessAPITester:
    def __init__(self, base_url="https://chess-strategy-8.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_user_email = f"test_{int(time.time())}@example.com"
        self.test_username = f"TestUser_{int(time.time())}"
        
    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})
    
    def make_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}"
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Status {response.status_code}, expected {expected_status}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                return False, error_msg
                
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"
    
    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.make_request('GET', 'health')
        if success and isinstance(response, dict) and response.get('status') == 'healthy':
            self.log_test("Health Check", True)
            return True
        else:
            self.log_test("Health Check", False, str(response))
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        data = {
            "username": self.test_username,
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        
        success, response = self.make_request('POST', 'auth/register', data, expected_status=200)
        
        if success and isinstance(response, dict) and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, str(response))
            return False
    
    def test_user_login(self):
        """Test user login"""
        data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        
        success, response = self.make_request('POST', 'auth/login', data, expected_status=200)
        
        if success and isinstance(response, dict) and 'token' in response:
            self.token = response['token']
            self.log_test("User Login", True)
            return True
        else:
            self.log_test("User Login", False, str(response))
            return False
    
    def test_get_profile(self):
        """Test get user profile"""
        success, response = self.make_request('GET', 'auth/profile')
        
        if success and isinstance(response, dict) and response.get('username') == self.test_username:
            self.log_test("Get Profile", True)
            return True
        else:
            self.log_test("Get Profile", False, str(response))
            return False
    
    def test_get_rooms(self):
        """Test get rooms list"""
        success, response = self.make_request('GET', 'rooms')
        
        if success and isinstance(response, list):
            self.log_test("Get Rooms", True)
            return True
        else:
            self.log_test("Get Rooms", False, str(response))
            return False
    
    def test_create_room(self):
        """Test create room"""
        data = {
            "name": f"Test Room {int(time.time())}",
            "time_control": 600,
            "is_ranked": True
        }
        
        success, response = self.make_request('POST', 'rooms', data, expected_status=200)
        
        if success and isinstance(response, dict) and response.get('name') == data['name']:
            self.log_test("Create Room", True)
            return response['id']  # Return room ID for cleanup
        else:
            self.log_test("Create Room", False, str(response))
            return None
    
    def test_get_leaderboard(self):
        """Test get leaderboard"""
        success, response = self.make_request('GET', 'leaderboard?limit=10')
        
        if success and isinstance(response, list):
            self.log_test("Get Leaderboard", True)
            return True
        else:
            self.log_test("Get Leaderboard", False, str(response))
            return False
    
    def test_get_shop_packages(self):
        """Test get shop packages"""
        success, response = self.make_request('GET', 'shop/packages')
        
        if success and isinstance(response, list) and len(response) > 0:
            # Check if packages have required fields
            first_package = response[0]
            required_fields = ['id', 'name', 'coins', 'price', 'description']
            has_all_fields = all(field in first_package for field in required_fields)
            
            if has_all_fields:
                self.log_test("Get Shop Packages", True)
                return True
            else:
                self.log_test("Get Shop Packages", False, "Missing required fields in package")
                return False
        else:
            self.log_test("Get Shop Packages", False, str(response))
            return False
    
    def test_create_ai_game(self):
        """Test create AI game"""
        success, response = self.make_request('POST', 'games/ai/create', expected_status=200)
        
        if success and isinstance(response, dict) and 'id' in response and 'board' in response:
            self.log_test("Create AI Game", True)
            return response['id']  # Return game ID for further testing
        else:
            self.log_test("Create AI Game", False, str(response))
            return None
    
    def test_ai_game_move(self, game_id):
        """Test making a move in AI game"""
        if not game_id:
            self.log_test("AI Game Move", False, "No game ID provided")
            return False
        
        # Try to make a valid opening move (soldier forward)
        data = {
            "game_id": game_id,
            "from_pos": [6, 0],  # Red soldier
            "to_pos": [5, 0]     # Move forward
        }
        
        success, response = self.make_request('POST', f'games/ai/{game_id}/move', data, expected_status=200)
        
        if success and isinstance(response, dict) and 'board' in response:
            self.log_test("AI Game Move", True)
            return True
        else:
            self.log_test("AI Game Move", False, str(response))
            return False
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        success, response = self.make_request('POST', 'auth/login', data, expected_status=401)
        
        if not success:  # We expect this to fail with 401
            self.log_test("Invalid Login (Expected Failure)", True)
            return True
        else:
            self.log_test("Invalid Login (Expected Failure)", False, "Should have failed with 401")
            return False
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, response = self.make_request('GET', 'auth/profile', expected_status=401)
        
        # Restore token
        self.token = original_token
        
        if not success:  # We expect this to fail with 401
            self.log_test("Unauthorized Access (Expected Failure)", True)
            return True
        else:
            self.log_test("Unauthorized Access (Expected Failure)", False, "Should have failed with 401")
            return False
    
    def cleanup_room(self, room_id):
        """Clean up created room"""
        if room_id:
            success, response = self.make_request('DELETE', f'rooms/{room_id}', expected_status=200)
            if success:
                print(f"🧹 Cleaned up room {room_id}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Chinese Chess API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test authentication flow
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
        
        if not self.test_user_login():
            print("❌ Login failed - stopping tests")
            return False
        
        if not self.test_get_profile():
            print("❌ Profile access failed - stopping tests")
            return False
        
        # Test game features
        self.test_get_rooms()
        room_id = self.test_create_room()
        self.test_get_leaderboard()
        self.test_get_shop_packages()
        
        # Test AI game
        game_id = self.test_create_ai_game()
        if game_id:
            # Wait a moment for game to be ready
            time.sleep(1)
            self.test_ai_game_move(game_id)
        
        # Test error cases
        self.test_invalid_login()
        self.test_unauthorized_access()
        
        # Cleanup
        if room_id:
            self.cleanup_room(room_id)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['error']}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = ChineseChessAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())