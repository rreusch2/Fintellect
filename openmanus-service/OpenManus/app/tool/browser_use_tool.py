import asyncio
import base64
import json
from typing import Generic, Optional, TypeVar, Any

from browser_use import Browser as BrowserUseBrowser
from browser_use import BrowserConfig
from browser_use.browser.context import BrowserContext, BrowserContextConfig
from browser_use.dom.service import DomService
from pydantic import Field, field_validator
from pydantic_core.core_schema import ValidationInfo

from app.config import config
from app.llm import LLM
from app.logger import logger
from app.tool.base import BaseTool, ToolResult
from app.tool.web_search import WebSearch


_BROWSER_DESCRIPTION = """\
A powerful browser automation tool that allows interaction with web pages through various actions.
* This tool provides commands for controlling a browser session, navigating web pages, and extracting information
* It maintains state across calls, keeping the browser session alive until explicitly closed
* Use this when you need to browse websites, fill forms, click buttons, extract content, or perform web searches
* Each action requires specific parameters as defined in the tool's dependencies

Key capabilities include:
* Navigation: Go to specific URLs, go back, search the web, or refresh pages
* Interaction: Click elements, input text, select from dropdowns, send keyboard commands
* Scrolling: Scroll up/down by pixel amount or scroll to specific text
* Content extraction: Extract and analyze content from web pages based on specific goals
* Tab management: Switch between tabs, open new tabs, or close tabs

Note: When using element indices, refer to the numbered elements shown in the current browser state.
"""

Context = TypeVar("Context")


class BrowserUseTool(BaseTool, Generic[Context]):
    name: str = "browser_use"
    description: str = _BROWSER_DESCRIPTION
    parameters: dict = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": [
                    "go_to_url",
                    "click_element",
                    "input_text",
                    "scroll_down",
                    "scroll_up",
                    "scroll_to_text",
                    "send_keys",
                    "get_dropdown_options",
                    "select_dropdown_option",
                    "go_back",
                    "web_search",
                    "wait",
                    "extract_content",
                    "switch_tab",
                    "open_tab",
                    "close_tab",
                ],
                "description": "The browser action to perform",
            },
            "url": {
                "type": "string",
                "description": "URL for 'go_to_url' or 'open_tab' actions",
            },
            "index": {
                "type": "integer",
                "description": "Element index for 'click_element', 'input_text', 'get_dropdown_options', or 'select_dropdown_option' actions",
            },
            "text": {
                "type": "string",
                "description": "Text for 'input_text', 'scroll_to_text', or 'select_dropdown_option' actions",
            },
            "scroll_amount": {
                "type": "integer",
                "description": "Pixels to scroll (positive for down, negative for up) for 'scroll_down' or 'scroll_up' actions",
            },
            "tab_id": {
                "type": "integer",
                "description": "Tab ID for 'switch_tab' action",
            },
            "query": {
                "type": "string",
                "description": "Search query for 'web_search' action",
            },
            "goal": {
                "type": "string",
                "description": "Extraction goal for 'extract_content' action",
            },
            "keys": {
                "type": "string",
                "description": "Keys to send for 'send_keys' action",
            },
            "seconds": {
                "type": "integer",
                "description": "Seconds to wait for 'wait' action",
            },
        },
        "required": ["action"],
        "dependencies": {
            "go_to_url": ["url"],
            "click_element": ["index"],
            "input_text": ["index", "text"],
            "switch_tab": ["tab_id"],
            "open_tab": ["url"],
            "scroll_down": ["scroll_amount"],
            "scroll_up": ["scroll_amount"],
            "scroll_to_text": ["text"],
            "send_keys": ["keys"],
            "get_dropdown_options": ["index"],
            "select_dropdown_option": ["index", "text"],
            "go_back": [],
            "web_search": ["query"],
            "wait": ["seconds"],
            "extract_content": ["goal"],
        },
    }

    lock: asyncio.Lock = Field(default_factory=asyncio.Lock)
    browser: Optional[BrowserUseBrowser] = Field(default=None, exclude=True)
    context: Optional[BrowserContext] = Field(default=None, exclude=True)
    dom_service: Optional[DomService] = Field(default=None, exclude=True)
    web_search_tool: WebSearch = Field(default_factory=WebSearch, exclude=True)

    tool_context: Optional[Context] = Field(default=None, exclude=True)

    llm: Optional[LLM] = Field(default_factory=LLM)

    @field_validator("parameters", mode="before")
    def validate_parameters(cls, v: dict, info: ValidationInfo) -> dict:
        if not v:
            raise ValueError("Parameters cannot be empty")
        return v

    async def _ensure_browser_initialized(self) -> BrowserContext:
        if self.browser is None:
            browser_config_kwargs = {"headless": True, "disable_security": True}

            if config.browser_config:
                from browser_use.browser.browser import ProxySettings

                if config.browser_config.proxy and config.browser_config.proxy.server:
                    browser_config_kwargs["proxy"] = ProxySettings(
                        server=config.browser_config.proxy.server,
                        username=config.browser_config.proxy.username,
                        password=config.browser_config.proxy.password,
                    )

                browser_attrs = [
                    "headless",
                    "disable_security",
                    "extra_chromium_args",
                    "chrome_instance_path",
                    "wss_url",
                    "cdp_url",
                ]

                for attr in browser_attrs:
                    value = getattr(config.browser_config, attr, None)
                    if value is not None:
                        if attr == 'headless':
                             if value is False:
                                 browser_config_kwargs[attr] = False
                        elif not isinstance(value, list) or value:
                             browser_config_kwargs[attr] = value

            self.browser = BrowserUseBrowser(BrowserConfig(**browser_config_kwargs))

        if self.context is None:
            context_config = BrowserContextConfig()

            if (
                config.browser_config
                and hasattr(config.browser_config, "new_context_config")
                and config.browser_config.new_context_config
            ):
                context_config = config.browser_config.new_context_config

            if not hasattr(context_config, 'default_navigation_timeout') or context_config.default_navigation_timeout is None:
                 logger.info("Setting default navigation timeout to 90000ms.")
                 context_config.default_navigation_timeout = 90000

            self.context = await self.browser.new_context(context_config)
            self.dom_service = DomService(await self.context.get_current_page())

        return self.context

    async def execute(
        self,
        action: str,
        url: Optional[str] = None,
        index: Optional[int] = None,
        text: Optional[str] = None,
        scroll_amount: Optional[int] = None,
        tab_id: Optional[int] = None,
        query: Optional[str] = None,
        goal: Optional[str] = None,
        keys: Optional[str] = None,
        seconds: Optional[int] = None,
        **kwargs,
    ) -> ToolResult:
        async with self.lock:
            output_message = ""
            error_message: Optional[str] = None
            base64_image_data: Optional[str] = None

            try:
                context = await self._ensure_browser_initialized()
                max_content_length = getattr(config.browser_config, "max_content_length", 2000)

                if action == "go_to_url":
                    if not url: error_message = "URL is required for 'go_to_url' action"
                    else:
                        page = await context.get_current_page()
                        await page.goto(url)
                        await page.wait_for_load_state()
                        output_message = f"Navigated to {url}"

                elif action == "go_back":
                    await context.go_back()
                    page = await context.get_current_page()
                    await page.wait_for_load_state()
                    output_message = "Navigated back"

                elif action == "refresh":
                    await context.refresh_page()
                    page = await context.get_current_page()
                    await page.wait_for_load_state()
                    output_message = "Refreshed current page"

                elif action == "web_search":
                    if not query: error_message = "Query is required for 'web_search' action"
                    else:
                        return await self.web_search_tool.execute(query=query, fetch_content=False, num_results=5)

                elif action == "click_element":
                    if index is None: error_message = "Index is required for 'click_element' action"
                    else:
                        element = await context.get_dom_element_by_index(index)
                        if not element: error_message = f"Element with index {index} not found"
                        else:
                            download_path = await context._click_element_node(element)
                            page = await context.get_current_page()
                            try:
                                await page.wait_for_load_state(timeout=5000)
                            except Exception:
                                logger.warning("Timeout waiting for load state after click, proceeding anyway.")
                                await asyncio.sleep(1)

                            output_message = f"Clicked element at index {index}"
                            if download_path: output_message += f" - Download started: {download_path}"

                elif action == "input_text":
                    if index is None or not text: error_message = "Index and text are required for 'input_text' action"
                    else:
                        element = await context.get_dom_element_by_index(index)
                        if not element: error_message = f"Element with index {index} not found"
                        else:
                            await context._input_text_element_node(element, text)
                            await asyncio.sleep(0.5)
                            output_message = f"Input '{text}' into element at index {index}"

                elif action == "select_dropdown_option":
                    if index is None or not text: error_message = "Index and text are required for 'select_dropdown_option' action"
                    else:
                        element = await context.get_dom_element_by_index(index)
                        if not element: error_message = f"Element with index {index} not found"
                        else:
                            page = await context.get_current_page()
                            await page.select_option(element.xpath, label=text)
                            await asyncio.sleep(0.5)
                            output_message = f"Selected option '{text}' from dropdown at index {index}"

                elif action == "scroll_down" or action == "scroll_up":
                    direction = 1 if action == "scroll_down" else -1
                    amount = scroll_amount if scroll_amount is not None else context.config.browser_window_size["height"]
                    await context.execute_javascript(f"window.scrollBy(0, {direction * amount});")
                    output_message = f"Scrolled {'down' if direction > 0 else 'up'} by {amount} pixels"

                elif action == "scroll_to_text":
                    if not text: error_message = "Text is required for 'scroll_to_text' action"
                    else:
                        page = await context.get_current_page()
                        try:
                            locator = page.get_by_text(text, exact=False)
                            await locator.scroll_into_view_if_needed()
                            output_message = f"Scrolled to text: '{text}'"
                        except Exception as e: error_message = f"Failed to scroll to text: {str(e)}"

                elif action == "send_keys":
                    if not keys: error_message = "Keys are required for 'send_keys' action"
                    else:
                        page = await context.get_current_page()
                        await page.keyboard.press(keys)
                        await asyncio.sleep(0.5)
                        output_message = f"Sent keys: {keys}"

                elif action == "get_dropdown_options":
                     if index is None: error_message = "Index is required for 'get_dropdown_options' action"
                     else:
                         element = await context.get_dom_element_by_index(index)
                         if not element: error_message = f"Element with index {index} not found"
                         else:
                             page = await context.get_current_page()
                             options = await page.evaluate(
                                 """
                                 (xpath) => {
                                     const select = document.evaluate(xpath, document, null,
                                         XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                     if (!select) return null;
                                     return Array.from(select.options).map(opt => ({
                                         text: opt.text,
                                         value: opt.value,
                                         index: opt.index
                                     }));
                                 }
                             """,
                                 element.xpath,
                             )
                             output_message = f"Dropdown options: {options}"

                elif action == "extract_content":
                     if not goal: error_message = "Goal is required for 'extract_content' action"
                     else:
                        current_state_result = await self.get_current_state(context)
                        if current_state_result.error:
                             return ToolResult(error=f"Failed to get page state for extraction: {current_state_result.error}")
                        state_data = json.loads(current_state_result.output)
                        page_context = f"Current URL: {state_data.get('url', 'N/A')}\nCurrent Title: {state_data.get('title', 'N/A')}\nVisible Elements/Content:\n{state_data.get('interactive_elements', 'N/A')}"
                        messages = [
                            {
                                "role": "system",
                                "content": (
                                    "You are an expert web page analyzer. Your task is to extract specific information from the provided web page context based on the user's goal. "
                                    "Carefully analyze the 'Page Context' provided by the user. "
                                    "You MUST call the provided `extract_content` function to return the extracted data."
                                )
                            },
                            {
                                "role": "user", 
                                "content": f"Page Context:\n---\n{page_context}\n---\nExtraction Goal: {goal}"
                            }
                        ]
                        extraction_function = {
                            "type": "function",
                            "function": {
                                "name": "extract_content",
                                "description": "Extract specific information from a webpage based on a goal",
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "extracted_content": {
                                            "type": "object",
                                            "description": "The content extracted from the page according to the goal",
                                            "properties": {
                                                "text": {
                                                    "type": "string",
                                                    "description": "Text content extracted from the page",
                                                },
                                                "metadata": {
                                                    "type": "object",
                                                    "description": "Additional metadata about the extracted content",
                                                    "properties": {
                                                        "source": {
                                                            "type": "string",
                                                            "description": "Source of the extracted content",
                                                        }
                                                    },
                                                },
                                            },
                                        }
                                    },
                                    "required": ["extracted_content"],
                                },
                            },
                        }
                        logger.info("Using extraction-specific LLM for content analysis.")
                        extraction_llm = LLM(config_type="extraction") 
                        response = await extraction_llm.ask_tool(
                            messages, 
                            tools=[extraction_function],
                            tool_choice="required",
                        )
                        
                        if response and response.tool_calls:
                            try:
                                args_str = response.tool_calls[0].function.arguments
                                args = json.loads(args_str if args_str else '{}')
                            except json.JSONDecodeError:
                                 args = {}
                                 logger.warning(f"Failed to decode JSON arguments from extraction tool call: {args_str}")
                                 
                            extracted_content = args.get("extracted_content", {})
                            output_text = json.dumps(extracted_content, indent=2)
                            output_message = f"Extracted content based on goal '{goal}':\n{output_text}\n"
                            return ToolResult(output=output_message, base64_image=current_state_result.base64_image)
                        else:
                             logger.warning(f"Extraction LLM call did not result in a tool call. Response: {response}")
                             return ToolResult(output="Extraction failed: LLM did not return the expected tool call.")

                elif action == "switch_tab":
                    if tab_id is None: error_message = "Tab ID is required for 'switch_tab' action"
                    else:
                        await context.switch_to_tab(tab_id)
                        page = await context.get_current_page()
                        await page.wait_for_load_state()
                        output_message = f"Switched to tab {tab_id}"

                elif action == "open_tab":
                    if not url: error_message = "URL is required for 'open_tab' action"
                    else:
                        await context.create_new_tab(url)
                        await context.get_current_page().wait_for_load_state()
                        output_message = f"Opened new tab with {url}"

                elif action == "close_tab":
                    await context.close_current_tab()
                    await asyncio.sleep(0.5)
                    await context.get_current_page().wait_for_load_state()
                    output_message = "Closed current tab"

                elif action == "wait":
                    seconds_to_wait = seconds if seconds is not None else 3
                    await asyncio.sleep(seconds_to_wait)
                    output_message = f"Waited for {seconds_to_wait} seconds"

                else:
                    error_message = f"Unknown action: {action}"

            except Exception as e:
                logger.exception(f"Browser action '{action}' failed unexpectedly.")
                error_message = f"Browser action '{action}' failed: {str(e)}"

            final_state_result = await self.get_current_state(context if 'context' in locals() else None)
            base64_image_data = final_state_result.base64_image

            if error_message:
                final_output = f"Action '{action}' Failed: {error_message}\n\nFinal State:\n{final_state_result.output}"
                return ToolResult(error=error_message, output=final_output, base64_image=base64_image_data)
            else:
                final_output = f"Action '{action}' completed: {output_message}\n\nFinal State:\n{final_state_result.output}"
                return ToolResult(output=final_output, base64_image=base64_image_data)

    async def get_current_state(
        self,
        context: Optional[BrowserContext] = None
    ) -> ToolResult:
        screenshot_b64: Optional[str] = None
        dom_output_str = ""
        error_str: Optional[str] = None
        try:
            ctx = context or self.context
            if not ctx:
                error_str = "Browser context not initialized"
            else:
                state = await ctx.get_state()
                
                viewport_height = 0
                if hasattr(state, "viewport_info") and state.viewport_info:
                    viewport_height = state.viewport_info.height
                elif hasattr(ctx, "config") and hasattr(ctx.config, "browser_window_size"):
                    viewport_height = ctx.config.browser_window_size.get("height", 0)

                page = await ctx.get_current_page()
                await page.bring_to_front()
                await page.wait_for_load_state('domcontentloaded', timeout=5000)

                try:
                    screenshot_bytes = await page.screenshot(
                        full_page=True,
                        animations="disabled",
                        type="jpeg",
                        quality=80
                    )
                    screenshot_b64 = base64.b64encode(screenshot_bytes).decode("utf-8")
                except Exception as ss_err:
                    logger.error(f"Failed to take screenshot during get_current_state: {ss_err}")

                state_info = {
                    "url": state.url,
                    "title": state.title,
                    "tabs": [tab.model_dump() for tab in state.tabs],
                    "help": "[0], [1], [2], etc., represent clickable indices corresponding to the elements listed. Clicking on these indices will navigate to or interact with the respective content behind them.",
                    "interactive_elements": (
                        state.element_tree.clickable_elements_to_string()
                        if state.element_tree else ""
                    ),
                    "scroll_info": {
                        "pixels_above": getattr(state, "pixels_above", 0),
                        "pixels_below": getattr(state, "pixels_below", 0),
                        "total_height": getattr(state, "pixels_above", 0) + getattr(state, "pixels_below", 0) + viewport_height,
                    },
                    "viewport_height": viewport_height,
                }
                dom_output_str = json.dumps(state_info, indent=4, ensure_ascii=False)
        except Exception as e:
            logger.exception("Error getting current browser state")
            error_str = f"Failed to get browser state: {str(e)}"

        return ToolResult(output=dom_output_str, base64_image=screenshot_b64, error=error_str)

    async def cleanup(self):
        async with self.lock:
            if self.context is not None:
                await self.context.close()
                self.context = None
                self.dom_service = None
            if self.browser is not None:
                await self.browser.close()
                self.browser = None

    def __del__(self):
        if self.browser is not None or self.context is not None:
            try:
                asyncio.run(self.cleanup())
            except RuntimeError:
                loop = asyncio.new_event_loop()
                loop.run_until_complete(self.cleanup())
                loop.close()

    @classmethod
    def create_with_context(cls, context: Context) -> "BrowserUseTool[Context]":
        tool = cls()
        tool.tool_context = context
        return tool
