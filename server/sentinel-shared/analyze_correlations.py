import json
import pandas as pd
import numpy as np
from scipy import stats

# Load the processed data
try:
    with open('/app/shared/ai_stocks.json', 'r') as f:
        stock_data = json.load(f)
    with open('/app/shared/fintech_metrics.json', 'r') as f:
        metrics = json.load(f)
except:
    stock_data = {}
    metrics = {}

# Calculate correlations
companies = list(set(stock_data.keys()) & set(metrics.keys()))
ai_scores = [metrics[c].get('ai_adoption_score', 0) for c in companies]
stock_perf = [stock_data[c].get('annual_return', 0) for c in companies]

correlation, p_value = stats.pearsonr(ai_scores, stock_perf)

results = {
    'correlation': correlation,
    'p_value': p_value,
    'sample_size': len(companies)
}

# Save results
with open('/app/shared/correlation_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"Correlation Analysis Results:")
print(f"Correlation coefficient: {correlation:.3f}")
print(f"P-value: {p_value:.3f}")
print(f"Sample size: {len(companies)}")
