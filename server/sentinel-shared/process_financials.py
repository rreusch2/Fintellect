import json
import pandas as pd

# Load financial data
try:
    with open('/app/shared/ai_stocks.json', 'r') as f:
        stock_data = json.load(f)
    with open('/app/shared/fintech_metrics.json', 'r') as f:
        metrics = json.load(f)
except:
    stock_data = {}
    metrics = {}

# Calculate automation adoption metrics
def calc_automation_score(company_data):
    score = 0
    if company_data.get('r_and_d_spend', 0) > 1000000:
        score += 10
    if company_data.get('ai_patents', 0) > 50:
        score += 5
    return score

# Process data and save results
results = {
    'automation_scores': {},
    'industry_avg': 0,
    'top_performers': []
}

for ticker, data in stock_data.items():
    results['automation_scores'][ticker] = calc_automation_score(data)

results['industry_avg'] = sum(results['automation_scores'].values()) / len(results['automation_scores'])
results['top_performers'] = sorted(results['automation_scores'].items(), key=lambda x: x[1], reverse=True)[:3]

with open('/app/shared/automation_metrics.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Processed automation adoption metrics saved to automation_metrics.json")
