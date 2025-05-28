#!/usr/bin/env python3
"""
Test script to verify Daytona SDK connection
"""

import os
import sys

def test_daytona_connection():
    print("=== Daytona SDK Connection Test ===")
    
    # Check if API key is available
    api_key = os.getenv('DAYTONA_API_KEY')
    if not api_key:
        print("❌ DAYTONA_API_KEY not found in environment variables")
        return False
    
    print(f"✅ DAYTONA_API_KEY found (length: {len(api_key)})")
    
    try:
        from daytona_sdk import Daytona, DaytonaConfig
        print("✅ Daytona SDK imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import Daytona SDK: {e}")
        return False
    
    try:
        # Configure Daytona client
        config = DaytonaConfig(api_key=api_key)
        daytona = Daytona(config)
        print("✅ Daytona client configured")
        
        # Test creating a sandbox
        print("🔄 Testing sandbox creation...")
        sandbox = daytona.create()
        print(f"✅ Sandbox created successfully! ID: {getattr(sandbox, 'id', 'Unknown')}")
        
        # Test simple code execution
        print("🔄 Testing code execution...")
        response = sandbox.process.code_run('print("Hello from Daytona sandbox!")')
        
        if response.exit_code == 0:
            print(f"✅ Code executed successfully: {response.result}")
        else:
            print(f"❌ Code execution failed: Exit code {response.exit_code}, Result: {response.result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Daytona connection failed: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = test_daytona_connection()
    sys.exit(0 if success else 1) 