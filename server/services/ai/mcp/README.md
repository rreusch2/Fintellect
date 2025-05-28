# MCP-Inspired AI Agent Integration for Fintellect

This directory contains an implementation of Fintellect's AI agent personas, inspired by the Model Context Protocol (MCP) pattern.

## Agent Personas

The integration implements the following agent personas:

- **Thrive** - Expense Optimization Agent
  - Personality: Resourceful, practical, detail-oriented
  - Focus: Finding savings opportunities in user spending

Additional agents to be implemented:
- **Horizon** - Financial Planning Agent
- **Vertex** - Investment Advisor Agent
- **Summit** - Financial Goal Tracking Agent

## Implementation Details

### Architecture

This implementation uses a simplified approach that maintains the spirit of MCP while avoiding external dependencies:

- JavaScript-based agent implementation that uses the Anthropic API directly
- Agent personas defined as prompts to guide the LLM's responses
- Mock financial data for demonstration purposes

### Key Files

- `agent_manager.js` - Core implementation of the agent framework
- `README.md` - Documentation for the implementation

## Usage

The agent implementation is already integrated with the Fintellect backend through API routes. To use it:

1. Access the Thrive agent through the `/api/ai/mcp/thrive` endpoint
2. Send a POST request with a `query` parameter containing the user's question
3. Receive a response with the agent's personalized advice

## Future Enhancements

In the future, this implementation could be extended to:

1. Use a full MCP implementation with MCP servers
2. Add more sophisticated memory mechanisms
3. Implement cross-agent communication
4. Integrate with more data sources beyond Plaid transactions

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)