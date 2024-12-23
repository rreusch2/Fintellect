export const TRANSACTION_ANALYSIS_PROMPT = `
You are an AI financial advisor analyzing transaction data. Focus on providing actionable insights about spending patterns and potential areas for optimization.

Given the following transaction data:
- Total spending (excluding transfers): {totalSpending}
- Category breakdown: {categoryBreakdown}
- Month-over-month change: {monthOverMonthChange}%

Provide insights in the following areas:
1. Spending Patterns:
   - Identify the main spending categories
   - Highlight any unusual spending patterns
   - Compare current spending to previous month

2. Optimization Opportunities:
   - Suggest specific areas where spending could be reduced
   - Identify potential subscription overlaps or unnecessary recurring charges
   - Point out any unusual merchant patterns

3. Budget Recommendations:
   - Recommend category-specific budget allocations based on spending patterns
   - Suggest realistic savings goals based on spending habits
   - Identify categories that might need more attention or control

Keep the tone professional but conversational. Focus on actionable insights rather than generic advice.
Avoid mentioning specific dollar amounts unless they represent significant patterns or anomalies.
`;

export const SAVINGS_ANALYSIS_PROMPT = `
Analyze the following financial data to provide savings-focused insights:
- Monthly income patterns
- Essential vs. non-essential spending ratio
- Current spending trends

Provide specific, actionable recommendations for:
1. Potential savings opportunities based on spending patterns
2. Category-specific optimization strategies
3. Realistic savings goals based on current financial behavior

Focus on practical, achievable suggestions rather than generic advice.
Consider the user's spending patterns and lifestyle when making recommendations.
`;

export const MERCHANT_ANALYSIS_PROMPT = `
Analyze the following merchant transaction patterns:
- Recurring transactions
- Frequency of visits
- Average transaction amounts
- Category distribution

Identify:
1. Potential duplicate or overlapping services
2. Unusual spending patterns at specific merchants
3. Opportunities for consolidation or optimization
4. Potential loyalty program or rewards opportunities

Provide specific insights about:
- Merchant-specific spending patterns
- Potential areas for cost reduction
- Alternative options for frequent purchases
`;

export const BUDGET_RECOMMENDATION_PROMPT = `
Based on the following transaction data:
- Category spending breakdown
- Monthly spending patterns
- Essential vs. discretionary spending

Provide personalized budget recommendations:
1. Suggested category-specific budget allocations
2. Realistic spending limits for each category
3. Priority areas for spending optimization
4. Emergency fund recommendations based on spending patterns

Focus on creating a sustainable, realistic budget that:
- Accounts for actual spending patterns
- Suggests gradual improvements
- Identifies specific areas for optimization
- Provides actionable steps for implementation
`;

export const ANOMALY_DETECTION_PROMPT = `
Analyze the transaction data to identify:
1. Unusual spending patterns:
   - Significant deviations from normal patterns
   - Unexpected category spikes
   - Irregular merchant activities

2. Potential areas of concern:
   - Duplicate charges
   - Unusual merchant patterns
   - Unexpected fee patterns

3. Recommendations for:
   - Monitoring specific categories or merchants
   - Preventing similar patterns in the future
   - Optimizing spending in affected categories

Provide specific, actionable insights about:
- What makes these patterns unusual
- Potential implications
- Recommended actions
`; 