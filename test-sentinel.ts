import { sentinelAgent } from './server/services/ai/agents/SentinelAgent';

// Test function
async function testSentinel() {
  try {
    console.log("Creating test preference...");
    
    // Create a test preference
    const preference = await sentinelAgent.updateUserPreferences(1, {
      topics: ["fintech", "cryptocurrency"],
      keywords: ["blockchain", "investment", "market trends"],
      assetClasses: ["equities", "crypto"],
      specificAssets: {
        tickers: ["AAPL", "MSFT", "GOOGL"]
      },
      dataSources: {
        newsApis: true,
        marketData: true
      },
      analysisTypes: {
        sentiment: true,
        trendAnalysis: true
      },
      isActive: true
    });
    
    console.log(`Created preference with ID: ${preference.id}`);
    
    // Run research
    console.log("Running research...");
    const results = await sentinelAgent.performResearch(1, preference.id);
    
    console.log("Research complete!");
    console.log("Generated insights:", results.map(r => r.title).join(", "));
    
    // Log the first result in detail
    if (results.length > 0) {
      console.log("\nFirst insight:");
      console.log("Title:", results[0].title);
      console.log("Summary:", results[0].summary);
      console.log("Analysis:", results[0].content.analysis);
    }
  } catch (error) {
    console.error("Error in test:", error);
  }
}

// Run the test
testSentinel();