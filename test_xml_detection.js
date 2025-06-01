#!/usr/bin/env node

// Test XML detection logic with the exact AI output

const testAIResponse = `I'll help you research current market conditions and investment opportunities. Let me create a structured approach:

<create-file path="todo.md">
# Financial Analysis Todo List

**Created:** 2025-01-31
**Request:** Research current market conditions and investment opportunities

## Research Phase
[ ] 1. Search for current global market conditions and economic trends
[ ] 2. Gather data on major market indices (S&P 500, Dow Jones, NASDAQ)
[ ] 3. Research emerging markets and high-growth sectors
[ ] 4. Analyze recent regulatory changes affecting markets
[ ] 5. Collect insights from leading financial analysts and institutions

## Analysis Phase  
[ ] 6. Identify key market trends and economic indicators
[ ] 7. Evaluate investment opportunities in promising sectors
[ ] 8. Assess current market risks and volatility factors
[ ] 9. Compare investment options and expected returns
[ ] 10. Analyze correlation between different asset classes

## Report Generation
[ ] 11. Create comprehensive market research document
[ ] 12. Include data visualizations and trend charts
[ ] 13. Provide actionable investment recommendations
[ ] 14. Summarize key findings and next steps
[ ] 15. Cite all sources and data references

## Final Deliverables
[ ] 16. Executive summary of findings
[ ] 17. Detailed analysis report with supporting data
[ ] 18. Investment strategy recommendations
[ ] 19. Risk assessment and mitigation strategies
[ ] 20. Follow-up action items and monitoring plan
</create-file>

Now let me search for current market data:

<web-search query="current market conditions global economy 2025"></web-search>`;

// Test XML regex patterns
console.log('🔍 Testing XML Detection Patterns...\n');

// Current hasToolCalls logic
function hasToolCalls_Current(text) {
  const xmlRegex = /<([a-zA-Z-]+)([^>]*)>/;
  return xmlRegex.test(text);
}

// Test for specific tool tags
function hasRegisteredToolCalls(text) {
  const registeredTools = ['create-file', 'web-search', 'web-scrape', 'read-file'];
  
  for (const tool of registeredTools) {
    const toolPattern = new RegExp(`<${tool}[^>]*>`);
    if (toolPattern.test(text)) {
      console.log(`✅ Found registered tool: ${tool}`);
      return true;
    }
  }
  return false;
}

// Test complete tool calls (with closing tags)
function hasCompleteToolCalls(text) {
  const registeredTools = ['create-file', 'web-search', 'web-scrape', 'read-file'];
  
  for (const tool of registeredTools) {
    const completePattern = new RegExp(`<${tool}[^>]*>[\\s\\S]*?</${tool}>`, 'g');
    if (completePattern.test(text)) {
      console.log(`✅ Found complete tool call: ${tool}`);
      return true;
    }
  }
  return false;
}

console.log('Test AI Response (first 200 chars):');
console.log('='.repeat(60));
console.log(testAIResponse.substring(0, 200) + '...');
console.log('='.repeat(60));

console.log('\n📊 Testing Detection Methods:\n');

console.log('1. Current hasToolCalls():');
console.log(`   Result: ${hasToolCalls_Current(testAIResponse)}`);

console.log('\n2. hasRegisteredToolCalls():');
console.log(`   Result: ${hasRegisteredToolCalls(testAIResponse)}`);

console.log('\n3. hasCompleteToolCalls():');
console.log(`   Result: ${hasCompleteToolCalls(testAIResponse)}`);

// Check what specific XML tags are found
console.log('\n🔍 Detailed XML Analysis:');
const allXmlTags = testAIResponse.match(/<([a-zA-Z-]+)([^>]*)>/g) || [];
console.log(`Found XML tags: ${allXmlTags.join(', ')}`);

// Test with the exact user scenario
const userScenario = `Research current market conditions and investment opportunities`;

// Simulate shouldExecuteWorkflow
function shouldExecuteWorkflow(userMessage, assistantResponse) {
  // First check XML tool calls
  if (hasToolCalls_Current(assistantResponse)) {
    console.log('[shouldExecuteWorkflow] XML tool calls detected - executing workflow!');
    return true;
  }

  // Check for execution patterns
  const executionPatterns = [
    '🚀 **Starting Research Execution**',
    'Starting Research Execution',
    'begin!',
    'Let\'s begin!',
    'Searching:',
    '🔍 Starting',
    'Scraping',
    'search for',
    'research current market'
  ];

  for (const pattern of executionPatterns) {
    if (assistantResponse.includes(pattern)) {
      console.log(`[shouldExecuteWorkflow] Found execution pattern: ${pattern}`);
      return true;
    }
  }

  // Check trigger words
  const triggers = [
    'research', 'analyze', 'market conditions', 'investment opportunities',
    'financial analysis', 'market trends', 'economic data', 'portfolio',
    'risk assessment', 'trading strategy', 'market research', 'todo list'
  ];

  const combinedText = `${userMessage} ${assistantResponse}`.toLowerCase();
  const triggerMatch = triggers.some(trigger => combinedText.includes(trigger));
  
  if (triggerMatch) {
    console.log('[shouldExecuteWorkflow] Text pattern trigger detected!');
  }
  
  return triggerMatch;
}

console.log('\n📊 Testing shouldExecuteWorkflow():');
const shouldExecute = shouldExecuteWorkflow(userScenario, testAIResponse);
console.log(`   Final Result: ${shouldExecute ? '✅ Should execute' : '❌ Will NOT execute'}`);

console.log('\n🎯 Conclusion:');
if (shouldExecute) {
  console.log('✅ The workflow detection is working correctly!');
  console.log('   If debugging logs still don\'t appear, the issue is elsewhere.');
} else {
  console.log('❌ The workflow detection is failing!');
  console.log('   This explains why executeNexusWorkflow is not running.');
}