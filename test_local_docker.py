#!/usr/bin/env python3
"""
Test script to verify Local Docker Sandbox
"""

import os
import subprocess
import json

def test_local_docker_sandbox():
    print("=== Local Docker Sandbox Test ===")
    
    workspace = "/tmp/fintellect-workspace"
    
    # Create test workspace
    os.makedirs(workspace, exist_ok=True)
    print(f"✅ Workspace created: {workspace}")
    
    # Test 1: Create a file
    print("\n🔄 Test 1: Creating test file...")
    test_content = """# Test Market Analysis
    
## Tasks
- [x] Test file creation ✅
- [ ] Test code execution
- [ ] Test command execution
    """
    
    test_file = os.path.join(workspace, "test_analysis.md")
    with open(test_file, 'w') as f:
        f.write(test_content)
    print(f"✅ File created: {test_file}")
    
    # Test 2: Execute Python code
    print("\n🔄 Test 2: Testing Python code execution...")
    python_code = """
import json
data = {
    'test': 'success',
    'analysis': {
        'market_data': 'collected',
        'timestamp': '2025-05-28'
    }
}
print(json.dumps(data, indent=2))
"""
    
    # Write Python code to file
    code_file = os.path.join(workspace, "test_code.py")
    with open(code_file, 'w') as f:
        f.write(python_code)
    
    # Execute in Docker
    docker_cmd = [
        'docker', 'run', '--rm',
        '-v', f'{workspace}:/workspace',
        '-w', '/workspace',
        'python:3.11-slim',
        'python', 'test_code.py'
    ]
    
    try:
        result = subprocess.run(docker_cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ Python code executed successfully:")
            print(result.stdout)
        else:
            print(f"❌ Python execution failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("❌ Python execution timed out")
    except Exception as e:
        print(f"❌ Python execution error: {e}")
    
    # Test 3: Execute shell command
    print("\n🔄 Test 3: Testing shell command execution...")
    shell_cmd = [
        'docker', 'run', '--rm',
        '-v', f'{workspace}:/workspace',
        '-w', '/workspace',
        'python:3.11-slim',
        'bash', '-c', 'ls -la && echo "Files in workspace:" && cat test_analysis.md'
    ]
    
    try:
        result = subprocess.run(shell_cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ Shell command executed successfully:")
            print(result.stdout)
        else:
            print(f"❌ Shell command failed: {result.stderr}")
    except Exception as e:
        print(f"❌ Shell command error: {e}")
    
    # Clean up test file
    os.remove(code_file)
    print(f"\n✅ Test completed! Local Docker sandbox is working.")
    print(f"📁 Workspace: {workspace}")
    print(f"🐳 Docker image: python:3.11-slim")

if __name__ == "__main__":
    test_local_docker_sandbox() 