#!/usr/bin/env python3
"""
Direct test of local sandbox functionality
"""

import subprocess
import os
import json

def test_local_sandbox_direct():
    print("=== Direct Local Sandbox Test ===")
    
    workspace = "/tmp/fintellect-workspace"
    
    # Test 1: Create a file directly using our tool logic
    print("\n🔄 Test 1: Direct file creation...")
    
    test_content = """# Test Financial Analysis Todo

## Market Research
- [ ] Test file creation
- [ ] Test code execution
- [ ] Test command execution

## Results
- File created successfully
"""
    
    # Create file directly in workspace
    os.makedirs(workspace, exist_ok=True)
    test_file = os.path.join(workspace, "direct_test_todo.md")
    
    with open(test_file, 'w') as f:
        f.write(test_content)
    
    print(f"✅ Direct file created: {test_file}")
    
    # Test 2: Execute Python code using our Docker approach
    print("\n🔄 Test 2: Python code execution...")
    
    python_code = """
import json
import datetime

analysis_data = {
    'test': 'successful',
    'timestamp': str(datetime.datetime.now()),
    'market_analysis': {
        'status': 'completed',
        'tools_working': True
    }
}

print("=== ANALYSIS RESULTS ===")
print(json.dumps(analysis_data, indent=2))
"""
    
    # Write Python code to file
    code_file = os.path.join(workspace, "test_analysis.py")
    with open(code_file, 'w') as f:
        f.write(python_code)
    
    # Execute in Docker
    docker_cmd = [
        'docker', 'run', '--rm',
        '-v', f'{workspace}:/workspace',
        '-w', '/workspace',
        'python:3.11-slim',
        'python', 'test_analysis.py'
    ]
    
    try:
        result = subprocess.run(docker_cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ Python code executed successfully:")
            print(result.stdout)
        else:
            print(f"❌ Python execution failed: {result.stderr}")
    except Exception as e:
        print(f"❌ Python execution error: {e}")
    
    # Test 3: List all files in workspace
    print("\n🔄 Test 3: Listing workspace files...")
    
    try:
        files = []
        for root, dirs, filenames in os.walk(workspace):
            for filename in filenames:
                rel_path = os.path.relpath(os.path.join(root, filename), workspace)
                files.append(rel_path)
        
        print(f"✅ Files found in workspace:")
        for file in sorted(files):
            print(f"  - {file}")
            
    except Exception as e:
        print(f"❌ File listing error: {e}")
    
    # Clean up
    os.remove(code_file)
    print(f"\n✅ Local sandbox test completed!")
    print(f"📁 Workspace: {workspace}")
    print(f"🔧 Files should be visible to AI tools now")

if __name__ == "__main__":
    test_local_sandbox_direct() 