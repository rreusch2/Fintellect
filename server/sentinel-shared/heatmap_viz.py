import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# Sample data for fintech automation adoption across sectors
sectors = ['Banking', 'Insurance', 'Payments', 'Wealth Management', 'Lending']
metrics = ['AI Adoption', 'Process Automation', 'Digital Transformation', 'API Integration']

# Generate sample data matrix
data = np.random.uniform(0.3, 0.9, size=(len(sectors), len(metrics)))

# Create heatmap
plt.figure(figsize=(12, 8))
sns.heatmap(data, 
            xticklabels=metrics,
            yticklabels=sectors,
            annot=True,
            fmt='.2f',
            cmap='YlOrRd')

plt.title('Fintech Automation Adoption Across Sectors')
plt.tight_layout()
plt.savefig('/app/shared/fintech_heatmap.png')
plt.close()
print("Heatmap visualization saved as fintech_heatmap.png")
