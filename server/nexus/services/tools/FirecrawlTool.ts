import { Tool, ToolResult, AgentContext } from '../ThreadManager';
import { v4 as uuidv4 } from 'uuid';
import { firecrawlConfig } from '../../../config/apis';

export class FirecrawlTool implements Tool {
  name = 'web-scrape';
  description = 'Scrape and extract content from websites using Firecrawl API';

  async execute(parameters: any, context: AgentContext): Promise<ToolResult> {
    const { 
      url, 
      formats = ['markdown', 'html'], 
      includeTags = ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'a'],
      excludeTags = ['script', 'style', 'nav', 'footer'],
      onlyMainContent = true,
      timeout = 30000
    } = parameters;

    if (!firecrawlConfig.apiKey) {
      return {
        id: uuidv4(),
        content: 'Firecrawl API key not configured. Please set FIRECRAWL_API_KEY environment variable.',
        isSuccess: false,
        timestamp: new Date()
      };
    }

    if (!url) {
      return {
        id: uuidv4(),
        content: 'URL parameter is required for web scraping.',
        isSuccess: false,
        timestamp: new Date()
      };
    }

    try {
      const response = await fetch(`${firecrawlConfig.baseUrl}/v1/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlConfig.apiKey}`
        },
        body: JSON.stringify({
          url,
          formats,
          includeTags,
          excludeTags,
          onlyMainContent,
          timeout
        })
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Scraping failed');
      }

      // Format the scraped content
      let formattedContent = `# Web Scraping Results for: ${url}\n\n`;
      
      if (data.data.metadata) {
        formattedContent += `## Page Metadata\n`;
        formattedContent += `**Title:** ${data.data.metadata.title || 'N/A'}\n`;
        formattedContent += `**Description:** ${data.data.metadata.description || 'N/A'}\n`;
        formattedContent += `**Language:** ${data.data.metadata.language || 'N/A'}\n`;
        if (data.data.metadata.keywords) {
          formattedContent += `**Keywords:** ${data.data.metadata.keywords.join(', ')}\n`;
        }
        formattedContent += '\n';
      }

      if (data.data.markdown) {
        formattedContent += `## Content (Markdown)\n\n${data.data.markdown}\n\n`;
      }

      if (data.data.html && formats.includes('html')) {
        formattedContent += `## Raw HTML\n\n\`\`\`html\n${data.data.html.substring(0, 2000)}${data.data.html.length > 2000 ? '...' : ''}\n\`\`\`\n\n`;
      }

      if (data.data.links && data.data.links.length > 0) {
        formattedContent += `## Extracted Links\n\n`;
        data.data.links.slice(0, 10).forEach((link: any, index: number) => {
          formattedContent += `${index + 1}. [${link.text || 'Link'}](${link.href})\n`;
        });
        if (data.data.links.length > 10) {
          formattedContent += `\n... and ${data.data.links.length - 10} more links\n`;
        }
        formattedContent += '\n';
      }

      return {
        id: uuidv4(),
        content: formattedContent,
        isSuccess: true,
        timestamp: new Date(),
        metadata: {
          url,
          title: data.data.metadata?.title,
          contentLength: data.data.markdown?.length || 0,
          linksCount: data.data.links?.length || 0
        }
      };
    } catch (error) {
      return {
        id: uuidv4(),
        content: `Error scraping website: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        timestamp: new Date()
      };
    }
  }
} 