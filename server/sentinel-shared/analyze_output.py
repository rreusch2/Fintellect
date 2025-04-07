import re
import pandas as pd
from collections import defaultdict

# Initialize error tracking
errors = defaultdict(int)
success = defaultdict(int)

# Read previous output
with open('/app/shared/terminal_output.txt', 'r') as f:
    output = f.read()

# Parse errors and successes
for line in output.split('\n'):
    if 'Error' in line or 'Traceback' in line:
        errors[line.split(':')[0]] += 1
    elif 'saved' in line.lower():
        success[line.split(':')[0]] += 1

# Calculate KPIs
total_tasks = 6
failed_tasks = len([k for k,v in errors.items() if v > 0])
success_rate = (total_tasks - failed_tasks) / total_tasks * 100

# Generate statistical summary
print(f"Task Success Rate: {success_rate:.1f}%")
print("\nError Analysis:")
for k,v in errors.items():
    print(f"- {k}: {v} errors")
print("\nSuccessful Outputs:")
for k,v in success.items():
    print(f"- {k}: {v} successful operations")
