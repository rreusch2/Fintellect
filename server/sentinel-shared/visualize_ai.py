import matplotlib.pyplot as plt
import numpy as np

# Sample data (replace with actual data in production)
companies = ['AAPL', 'MSFT', 'TSLA']
ai_investment = [10.5, 15.2, 8.7]  # Billions USD
growth_rates = [12.3, 18.5, 25.1]  # Percentage

# Create figure with two subplots
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15,6))

# Bar chart for AI Investment
ax1.bar(companies, ai_investment, color=['#1f77b4', '#ff7f0e', '#2ca02c'])
ax1.set_title('AI Investment by Company')
ax1.set_ylabel('Investment (Billion USD)')

# Line chart for Growth Rates
ax2.plot(companies, growth_rates, marker='o', linewidth=2, markersize=10)
ax2.set_title('Company Growth Rates')
ax2.set_ylabel('Growth Rate (%)')

# Correlation plot
plt.figure(figsize=(8,6))
plt.scatter(ai_investment, growth_rates)
for i, company in enumerate(companies):
    plt.annotate(company, (ai_investment[i], growth_rates[i]))
plt.xlabel('AI Investment (Billion USD)')
plt.ylabel('Growth Rate (%)')
plt.title('AI Investment vs Growth Rate Correlation')

plt.tight_layout()
plt.savefig('/app/shared/ai_analysis_charts.png')
print("Charts saved as ai_analysis_charts.png")
