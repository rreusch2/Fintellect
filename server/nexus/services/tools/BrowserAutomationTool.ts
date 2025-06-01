import { Tool, ToolResult, AgentContext } from '../ThreadManager';
import { v4 as uuidv4 } from 'uuid';
import { chromium, Browser, Page } from 'playwright';

export class BrowserAutomationTool implements Tool {
  name = 'browser-automation';
  description = 'Automate browser interactions using Playwright for web tasks';
  private browser: Browser | null = null;

  async execute(parameters: any, context: AgentContext): Promise<ToolResult> {
    const { 
      action, 
      url, 
      selector, 
      text, 
      screenshot = false,
      waitFor = 'networkidle',
      timeout = 30000
    } = parameters;

    try {
      // Initialize browser if not already done
      if (!this.browser) {
        this.browser = await chromium.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      const page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      let result = '';
      let screenshotBuffer: Buffer | null = null;

      switch (action) {
        case 'navigate':
          await page.goto(url, { waitUntil: waitFor as any, timeout });
          result = `Successfully navigated to ${url}`;
          break;

        case 'click':
          if (!selector) throw new Error('Selector is required for click action');
          await page.click(selector, { timeout });
          result = `Successfully clicked element: ${selector}`;
          break;

        case 'type':
          if (!selector || !text) throw new Error('Selector and text are required for type action');
          await page.fill(selector, text);
          result = `Successfully typed "${text}" into element: ${selector}`;
          break;

        case 'extract-text':
          if (!selector) throw new Error('Selector is required for extract-text action');
          const extractedText = await page.textContent(selector);
          result = `Extracted text: ${extractedText}`;
          break;

        case 'extract-attribute':
          if (!selector) throw new Error('Selector is required for extract-attribute action');
          const attribute = parameters.attribute || 'href';
          const attributeValue = await page.getAttribute(selector, attribute);
          result = `Extracted ${attribute}: ${attributeValue}`;
          break;

        case 'wait-for-element':
          if (!selector) throw new Error('Selector is required for wait-for-element action');
          await page.waitForSelector(selector, { timeout });
          result = `Element appeared: ${selector}`;
          break;

        case 'scroll':
          const scrollY = parameters.scrollY || 500;
          await page.evaluate((y) => window.scrollBy(0, y), scrollY);
          result = `Scrolled by ${scrollY} pixels`;
          break;

        case 'get-page-info':
          const title = await page.title();
          const currentUrl = page.url();
          const content = await page.content();
          result = `Page Title: ${title}\nURL: ${currentUrl}\nContent Length: ${content.length} characters`;
          break;

        case 'execute-script':
          if (!parameters.script) throw new Error('Script is required for execute-script action');
          const scriptResult = await page.evaluate(parameters.script);
          result = `Script result: ${JSON.stringify(scriptResult)}`;
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Take screenshot if requested
      if (screenshot) {
        screenshotBuffer = await page.screenshot({ 
          fullPage: true,
          type: 'png'
        });
        result += '\n\nScreenshot captured.';
      }

      await page.close();

      return {
        id: uuidv4(),
        content: result,
        isSuccess: true,
        timestamp: new Date(),
        metadata: {
          action,
          url: page.url(),
          screenshot: screenshotBuffer ? `data:image/png;base64,${screenshotBuffer.toString('base64')}` : null
        }
      };
    } catch (error) {
      return {
        id: uuidv4(),
        content: `Browser automation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isSuccess: false,
        timestamp: new Date()
      };
    }
  }

  // Clean up browser instance
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
} 