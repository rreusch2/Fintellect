import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { anthropic } from '../config/anthropic.js';

// Get the directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Interface for MCP agent responses
 */
class MCPAgentManager {
  static #instance;
  #initialized = false;
  
  constructor() {
    this.#initialized = false;
  }

  /**
   * Get singleton instance of the MCPAgentManager
   */
  static getInstance() {
    if (!MCPAgentManager.#instance) {
      MCPAgentManager.#instance = new MCPAgentManager();
    }
    return MCPAgentManager.#instance;
  }

  /**
   * Initialize the MCP agent manager
   */
  async initialize() {
    if (this.#initialized) return;
    
    try {
      console.log('MCP Agent Manager initialized');
      this.#initialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP Agent Manager:', error);
      throw error;
    }
  }

  /**
   * Generate a response from the Thrive agent persona
   */
  async generateThriveResponse(query, userData) {
    // Mock financial data for the user
    const userFinancialData = {
      subscriptions: [
        { name: "Netflix", cost: 15.99, lastUsed: "2023-01-15" },
        { name: "Spotify", cost: 9.99, lastUsed: "2023-02-01" },
        { name: "Amazon Prime", cost: 14.99, lastUsed: "2023-02-10" },
        { name: "Gym Membership", cost: 50.00, lastUsed: "2022-11-30" },
      ],
      recurringBills: [
        { name: "Internet", cost: 89.99, provider: "Comcast" },
        { name: "Phone", cost: 75.00, provider: "T-Mobile" },
        { name: "Insurance", cost: 150.00, provider: "State Farm" },
      ],
      spendingCategories: {
        "Food": 800,
        "Transportation": 300,
        "Entertainment": 200,
        "Shopping": 400,
      }
    };

    // Thrive persona definition
    const thrivePersona = `
      You are Thrive, the resourceful and practical Expense Optimization Agent for Fintellect.
      
      PERSONALITY TRAITS:
      - Resourceful and ingenious
      - Practical and grounded
      - Detail-oriented and observant
      - Enthusiastic about efficiency
      - Supportive and encouraging
      
      COMMUNICATION STYLE:
      - Friendly and direct with actionable advice
      - Use concrete, specific examples
      - Make clear before/after comparisons
      - Balance quick wins with sustainable habits
      - Celebrate small victories
      
      When responding to user queries:
      - Always start with a brief, personalized greeting
      - Provide specific, actionable recommendations with estimated savings
      - End with encouragement and a follow-up suggestion
    `;

    try {
      // Format user's financial data as string
      const financialDataText = JSON.stringify(userFinancialData, null, 2);
      
      // Create prompt for LLM
      const prompt = `${thrivePersona}
      
      USER FINANCIAL DATA:
      ${financialDataText}
      
      USER QUERY:
      ${query}
      
      Respond as Thrive, the Expense Optimization Agent. Maintain your persona and provide specific, actionable advice.`;
      
      // Call Anthropic API
      const messages = [
        { role: 'user', content: prompt }
      ];
      
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: messages,
      });
      
      return {
        result: response.content[0].text,
        metadata: {
          agent: "thrive",
          user_id: userData.id
        }
      };
    } catch (error) {
      console.error('Error generating Thrive response:', error);
      throw error;
    }
  }

  /**
   * Express middleware for handling Thrive agent requests
   */
  handleThriveRequest() {
    return async (req, res) => {
      try {
        const { query } = req.body;
        const user = req.user;

        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }

        if (!this.#initialized) {
          await this.initialize();
        }

        const result = await this.generateThriveResponse(query, user);
        return res.json(result);
      } catch (error) {
        console.error('Error in Thrive agent:', error);
        return res.status(500).json({ 
          error: 'Agent execution failed',
          message: error.message 
        });
      }
    };
  }
}

// Export the singleton instance
const mcpAgentManager = MCPAgentManager.getInstance();

export { mcpAgentManager };