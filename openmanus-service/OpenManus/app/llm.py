import math
from typing import Dict, List, Optional, Union

import tiktoken
from openai import (
    APIError,
    AsyncAzureOpenAI,
    AsyncOpenAI,
    AuthenticationError,
    OpenAIError,
    RateLimitError,
)
from openai.types.chat import ChatCompletion, ChatCompletionMessage
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_random_exponential,
)

from app.bedrock import BedrockClient
from app.config import LLMSettings, config
from app.exceptions import TokenLimitExceeded
from app.logger import logger  # Assuming a logger is set up in your app
from app.schema import (
    ROLE_VALUES,
    TOOL_CHOICE_TYPE,
    TOOL_CHOICE_VALUES,
    Message,
    ToolChoice,
)
from anthropic import AsyncAnthropic # Assuming 'anthropic' library is installed
from openai.types.chat.chat_completion_message_tool_call import ChatCompletionMessageToolCall, Function
import json # For formatting arguments
import os # For environment variable access


REASONING_MODELS = ["o1", "o3-mini"]
MULTIMODAL_MODELS = [
    "gpt-4-vision-preview",
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
]


class TokenCounter:
    # Token constants
    BASE_MESSAGE_TOKENS = 4
    FORMAT_TOKENS = 2
    LOW_DETAIL_IMAGE_TOKENS = 85
    HIGH_DETAIL_TILE_TOKENS = 170

    # Image processing constants
    MAX_SIZE = 2048
    HIGH_DETAIL_TARGET_SHORT_SIDE = 768
    TILE_SIZE = 512

    def __init__(self, tokenizer):
        self.tokenizer = tokenizer

    def count_text(self, text: str) -> int:
        """Calculate tokens for a text string"""
        return 0 if not text else len(self.tokenizer.encode(text))

    def count_image(self, image_item: dict) -> int:
        """
        Calculate tokens for an image based on detail level and dimensions

        For "low" detail: fixed 85 tokens
        For "high" detail:
        1. Scale to fit in 2048x2048 square
        2. Scale shortest side to 768px
        3. Count 512px tiles (170 tokens each)
        4. Add 85 tokens
        """
        detail = image_item.get("detail", "medium")

        # For low detail, always return fixed token count
        if detail == "low":
            return self.LOW_DETAIL_IMAGE_TOKENS

        # For medium detail (default in OpenAI), use high detail calculation
        # OpenAI doesn't specify a separate calculation for medium

        # For high detail, calculate based on dimensions if available
        if detail == "high" or detail == "medium":
            # If dimensions are provided in the image_item
            if "dimensions" in image_item:
                width, height = image_item["dimensions"]
                return self._calculate_high_detail_tokens(width, height)

        # Default values when dimensions aren't available or detail level is unknown
        if detail == "high":
            # Default to a 1024x1024 image calculation for high detail
            return self._calculate_high_detail_tokens(1024, 1024)  # 765 tokens
        elif detail == "medium":
            # Default to a medium-sized image for medium detail
            return 1024  # This matches the original default
        else:
            # For unknown detail levels, use medium as default
            return 1024

    def _calculate_high_detail_tokens(self, width: int, height: int) -> int:
        """Calculate tokens for high detail images based on dimensions"""
        # Step 1: Scale to fit in MAX_SIZE x MAX_SIZE square
        if width > self.MAX_SIZE or height > self.MAX_SIZE:
            scale = self.MAX_SIZE / max(width, height)
            width = int(width * scale)
            height = int(height * scale)

        # Step 2: Scale so shortest side is HIGH_DETAIL_TARGET_SHORT_SIDE
        scale = self.HIGH_DETAIL_TARGET_SHORT_SIDE / min(width, height)
        scaled_width = int(width * scale)
        scaled_height = int(height * scale)

        # Step 3: Count number of 512px tiles
        tiles_x = math.ceil(scaled_width / self.TILE_SIZE)
        tiles_y = math.ceil(scaled_height / self.TILE_SIZE)
        total_tiles = tiles_x * tiles_y

        # Step 4: Calculate final token count
        return (
            total_tiles * self.HIGH_DETAIL_TILE_TOKENS
        ) + self.LOW_DETAIL_IMAGE_TOKENS

    def count_content(self, content: Union[str, List[Union[str, dict]]]) -> int:
        """Calculate tokens for message content"""
        if not content:
            return 0

        if isinstance(content, str):
            return self.count_text(content)

        token_count = 0
        for item in content:
            if isinstance(item, str):
                token_count += self.count_text(item)
            elif isinstance(item, dict):
                if "text" in item:
                    token_count += self.count_text(item["text"])
                elif "image_url" in item:
                    token_count += self.count_image(item)
        return token_count

    def count_tool_calls(self, tool_calls: List[dict]) -> int:
        """Calculate tokens for tool calls"""
        token_count = 0
        for tool_call in tool_calls:
            if "function" in tool_call:
                function = tool_call["function"]
                token_count += self.count_text(function.get("name", ""))
                token_count += self.count_text(function.get("arguments", ""))
        return token_count

    def count_message_tokens(self, messages: List[dict]) -> int:
        """Calculate the total number of tokens in a message list"""
        total_tokens = self.FORMAT_TOKENS  # Base format tokens

        for message in messages:
            tokens = self.BASE_MESSAGE_TOKENS  # Base tokens per message

            # Add role tokens
            tokens += self.count_text(message.get("role", ""))

            # Add content tokens
            if "content" in message:
                tokens += self.count_content(message["content"])

            # Add tool calls tokens
            if "tool_calls" in message:
                tokens += self.count_tool_calls(message["tool_calls"])

            # Add name and tool_call_id tokens
            tokens += self.count_text(message.get("name", ""))
            tokens += self.count_text(message.get("tool_call_id", ""))

            total_tokens += tokens

        return total_tokens


class LLM:
    _instances: Dict[str, "LLM"] = {}
    _client_cache: Dict[tuple, object] = {} # Cache clients based on config details

    def __new__(
        cls,
        config_name: str = "default",
        llm_config_override: Optional[LLMSettings] = None, # Allow overriding config for specific instances
        config_type: str = "llm" # Added config_type
    ):
        # Create a unique key for the instance based on config type and name
        instance_key = f"{config_type}:{config_name}"

        if instance_key not in cls._instances:
            instance = super().__new__(cls)
            # Pass llm_config_override and config_type to __init__
            instance.__init__(config_name, llm_config_override, config_type)
            cls._instances[instance_key] = instance
        return cls._instances[instance_key]

    def __init__(
        self,
        config_name: str = "default",
        llm_config_override: Optional[LLMSettings] = None, # Added override parameter
        config_type: str = "llm" # Added config_type
    ):
        # Use a unique attribute for initialization flag per instance
        instance_key = f"{config_type}:{config_name}"
        init_flag = f'_initialized_{instance_key}' # Make flag unique per instance
        if not getattr(self, init_flag, False): # Check instance flag
            
            # 1. Determine base config section (llm or extraction_llm)
            if config_type == "extraction":
                # Use extraction config, falling back to llm config if extraction is None
                base_config_section = config.extraction_llm if config.extraction_llm is not None else config.llm
                logger.info(f"[{instance_key}] Selecting EXTRACTION config section (fallback? {config.extraction_llm is None}).")
            else:
                # Default to standard llm config
                base_config_section = config.llm
                logger.info(f"[{instance_key}] Selecting standard LLM config section.")

            # 2. Get specific config settings (e.g., 'default') from that section
            # Use override if provided, else get from base_config_section
            initial_llm_settings = llm_config_override or base_config_section.get(config_name, base_config_section["default"])
            # Make a copy to avoid modifying the shared config object
            llm_settings = initial_llm_settings.model_copy(deep=True)
            logger.debug(f"[{instance_key}] Initial settings from config section: {llm_settings}")

            # 3. Determine the PROVIDER based on ENV var (with fallback)
            # Check for specific extraction provider override first if config_type is 'extraction'
            env_provider = None
            if config_type == "extraction":
                env_provider = os.getenv("EXTRACTION_LLM_PROVIDER")
            # If no extraction override, or if config_type is 'llm', use the main provider var
            if not env_provider:
                env_provider = os.getenv("OPENMANUS_LLM_PROVIDER", "anthropic") # Default to anthropic
            
            provider = env_provider.lower()
            logger.info(f"[{instance_key}] Determined LLM Provider from ENV: {provider}")

            # 4. OVERRIDE settings based on the determined provider from ENV vars
            provider_api_key = None
            provider_base_url = None
            provider_model_name = None
            provider_api_type = provider # Default api_type to provider name
            provider_api_version = None # Default

            if provider == "deepseek":
                provider_api_key = os.getenv("DEEPSEEK_API_KEY")
                provider_base_url = os.getenv("DEEPSEEK_BASE_URL")
                provider_model_name = os.getenv("DEEPSEEK_MODEL_NAME")
                provider_api_type = "openai" # Use openai type for compatibility
            elif provider == "anthropic":
                provider_api_key = os.getenv("ANTHROPIC_API_KEY")
                provider_model_name = os.getenv("ANTHROPIC_MODEL_NAME")
                # base_url/api_version not typically used by anthropic client in llm.py
            elif provider == "openai":
                provider_api_key = os.getenv("OPENAI_API_KEY")
                provider_base_url = os.getenv("OPENAI_BASE_URL") # Allow override
                provider_model_name = os.getenv("OPENAI_MODEL_NAME")
            # Add other providers like Azure, AWS if needed
            # elif provider == "azure": ...
            else:
                logger.error(f"[{instance_key}] Unsupported LLM_PROVIDER '{provider}' from ENV. Using initial settings from config.")
                # Keep settings loaded initially from config if provider is unknown
                provider_api_key = llm_settings.api_key
                provider_base_url = llm_settings.base_url
                provider_model_name = llm_settings.model
                provider_api_type = llm_settings.api_type
                provider_api_version = llm_settings.api_version
                
            # Apply the determined provider settings to the instance variables
            self.api_key = provider_api_key or llm_settings.api_key # Fallback if env var missing
            self.model = provider_model_name or llm_settings.model
            self.api_type = provider_api_type # Use the determined type
            self.base_url = provider_base_url # Can be None if not applicable (e.g., Anthropic)
            self.api_version = provider_api_version or llm_settings.api_version
            self.max_tokens = llm_settings.max_tokens
            self.temperature = llm_settings.temperature
            self.max_input_tokens = llm_settings.max_input_tokens
            
            logger.info(f"[{instance_key}] Final LLM settings: api_type={self.api_type}, model={self.model}, key_set={bool(self.api_key)}, base_url={self.base_url}, api_version={self.api_version}")

            # Token counting attributes (instance-specific)
            self.total_input_tokens = 0
            self.total_completion_tokens = 0

            # Initialize tokenizer (can be shared if model is the same)
            try:
                # Use the final determined model name for tokenizer
                self.tokenizer = tiktoken.encoding_for_model(self.model) 
            except KeyError:
                self.tokenizer = tiktoken.get_encoding("cl100k_base")
            self.token_counter = TokenCounter(self.tokenizer)

            # 5. Client Initialization with Caching based on FINAL settings
            client_key = (
                self.api_type,
                self.api_key, # Use final key for uniqueness
                self.base_url, # Use final base_url
                self.api_version # Use final api_version
            )

            if client_key not in LLM._client_cache:
                logger.info(f"[{instance_key}] Creating NEW LLM client for key: ({self.api_type}, base_url={self.base_url}, api_version={self.api_version})")
                if self.api_type == "azure":
                    LLM._client_cache[client_key] = AsyncAzureOpenAI(
                        base_url=self.base_url,
                        api_key=self.api_key,
                        api_version=self.api_version,
                    )
                elif self.api_type == "aws":
                    LLM._client_cache[client_key] = BedrockClient()
                elif self.api_type == "anthropic":
                    LLM._client_cache[client_key] = AsyncAnthropic(api_key=self.api_key)
                else: # Default to OpenAI (covers deepseek via compatibility)
                    logger.info(f"[{instance_key}] Creating OpenAI compatible client.")
                    LLM._client_cache[client_key] = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
            else:
                 logger.info(f"[{instance_key}] Reusing cached LLM client for key: ({self.api_type}, base_url={self.base_url}, api_version={self.api_version})")

            self.client = LLM._client_cache[client_key]
            # -------------------------------------- #
            
            setattr(self, init_flag, True) # Set the initialization flag for this specific instance config

    def count_tokens(self, text: str) -> int:
        """Calculate the number of tokens in a text"""
        if not text:
            return 0
        return len(self.tokenizer.encode(text))

    def count_message_tokens(self, messages: List[dict]) -> int:
        return self.token_counter.count_message_tokens(messages)

    def update_token_count(self, input_tokens: int, completion_tokens: int = 0) -> None:
        """Update token counts"""
        # Only track tokens if max_input_tokens is set
        self.total_input_tokens += input_tokens
        self.total_completion_tokens += completion_tokens
        logger.info(
            f"Token usage: Input={input_tokens}, Completion={completion_tokens}, "
            f"Cumulative Input={self.total_input_tokens}, Cumulative Completion={self.total_completion_tokens}, "
            f"Total={input_tokens + completion_tokens}, Cumulative Total={self.total_input_tokens + self.total_completion_tokens}"
        )

    def check_token_limit(self, input_tokens: int) -> bool:
        """Check if token limits are exceeded"""
        if self.max_input_tokens is not None:
            return (self.total_input_tokens + input_tokens) <= self.max_input_tokens
        # If max_input_tokens is not set, always return True
        return True

    def get_limit_error_message(self, input_tokens: int) -> str:
        """Generate error message for token limit exceeded"""
        if (
            self.max_input_tokens is not None
            and (self.total_input_tokens + input_tokens) > self.max_input_tokens
        ):
            return f"Request may exceed input token limit (Current: {self.total_input_tokens}, Needed: {input_tokens}, Max: {self.max_input_tokens})"

        return "Token limit exceeded"

    # --- Reverted format_messages (Minimal) --- #
    def format_messages(
        self, messages: List[Union[dict, Message]], supports_images: bool = False
    ) -> List[dict]:
        formatted_messages = []
        for message in messages:
            if isinstance(message, Message):
                formatted_messages.append(message.to_dict())
            elif isinstance(message, dict):
                formatted_messages.append(message.copy())
            else:
                raise TypeError(f"Unsupported message type: {type(message)}")

        # Basic Image Handling (can be expanded if needed later)
        for msg_dict in formatted_messages:
             if supports_images and msg_dict.get("base64_image"):
                 content_list = msg_dict.get("content", [])
                 if not isinstance(content_list, list):
                     content_list = [{"type": "text", "text": str(content_list)}] if content_list else []
                 content_list.append({
                     "type": "image_url",
                     "image_url": {"url": f"data:image/jpeg;base64,{msg_dict['base64_image']}"}
                 })
                 msg_dict["content"] = content_list
                 if "base64_image" in msg_dict: del msg_dict["base64_image"]
             elif not supports_images and msg_dict.get("base64_image"):
                  if "base64_image" in msg_dict: del msg_dict["base64_image"]

        return formatted_messages
    # --------------------------------------- #

    @retry(
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(6),
        retry=retry_if_exception_type(
            (OpenAIError, Exception, ValueError)
        ),  # Don't retry TokenLimitExceeded
    )
    async def ask(
        self,
        messages: List[Union[dict, Message]],
        system_msgs: Optional[List[Union[dict, Message]]] = None,
        stream: bool = True,
        temperature: Optional[float] = None,
    ) -> str:
        """
        Send a prompt to the LLM and get the response.

        Args:
            messages: List of conversation messages
            system_msgs: Optional system messages to prepend
            stream (bool): Whether to stream the response
            temperature (float): Sampling temperature for the response

        Returns:
            str: The generated response

        Raises:
            TokenLimitExceeded: If token limits are exceeded
            ValueError: If messages are invalid or response is empty
            OpenAIError: If API call fails after retries
            Exception: For unexpected errors
        """
        try:
            supports_images = self.model in MULTIMODAL_MODELS
            if system_msgs:
                system_msgs = self.format_messages(system_msgs, supports_images)
                messages = system_msgs + self.format_messages(messages, supports_images)
            else:
                messages = self.format_messages(messages, supports_images)

            # Calculate input token count
            input_tokens = self.count_message_tokens(messages)

            # Check if token limits are exceeded
            if not self.check_token_limit(input_tokens):
                error_message = self.get_limit_error_message(input_tokens)
                # Raise a special exception that won't be retried
                raise TokenLimitExceeded(error_message)

            params = {
                "model": self.model,
                "messages": messages,
            }

            if self.model in REASONING_MODELS:
                params["max_completion_tokens"] = self.max_tokens
            else:
                params["max_tokens"] = self.max_tokens
                params["temperature"] = (
                    temperature if temperature is not None else self.temperature
                )

            if not stream:
                # Non-streaming request
                response = await self.client.chat.completions.create(
                    **params, stream=False
                )

                if not response.choices or not response.choices[0].message.content:
                    raise ValueError("Empty or invalid response from LLM")

                # Update token counts
                self.update_token_count(
                    response.usage.prompt_tokens, response.usage.completion_tokens
                )

                return response.choices[0].message.content

            # Streaming request, For streaming, update estimated token count before making the request
            self.update_token_count(input_tokens)

            response = await self.client.chat.completions.create(**params, stream=True)

            collected_messages = []
            completion_text = ""
            async for chunk in response:
                chunk_message = chunk.choices[0].delta.content or ""
                collected_messages.append(chunk_message)
                completion_text += chunk_message
                print(chunk_message, end="", flush=True)

            print()  # Newline after streaming
            full_response = "".join(collected_messages).strip()
            if not full_response:
                raise ValueError("Empty response from streaming LLM")

            # estimate completion tokens for streaming response
            completion_tokens = self.count_tokens(completion_text)
            logger.info(
                f"Estimated completion tokens for streaming response: {completion_tokens}"
            )
            self.total_completion_tokens += completion_tokens

            return full_response

        except TokenLimitExceeded:
            # Re-raise token limit errors without logging
            raise
        except ValueError:
            logger.exception(f"Validation error")
            raise
        except OpenAIError as oe:
            logger.exception(f"OpenAI API error")
            if isinstance(oe, AuthenticationError):
                logger.error("Authentication failed. Check API key.")
            elif isinstance(oe, RateLimitError):
                logger.error("Rate limit exceeded. Consider increasing retry attempts.")
            elif isinstance(oe, APIError):
                logger.error(f"API error: {oe}")
            raise
        except Exception:
            logger.exception(f"Unexpected error in ask")
            raise

    @retry(
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(6),
        retry=retry_if_exception_type(
            (OpenAIError, Exception, ValueError)
        ),  # Don't retry TokenLimitExceeded
    )
    async def ask_with_images(
        self,
        messages: List[Union[dict, Message]],
        images: List[Union[str, dict]],
        system_msgs: Optional[List[Union[dict, Message]]] = None,
        stream: bool = False,
        temperature: Optional[float] = None,
    ) -> str:
        """
        Send a prompt with images to the LLM and get the response.

        Args:
            messages: List of conversation messages
            images: List of image URLs or image data dictionaries
            system_msgs: Optional system messages to prepend
            stream (bool): Whether to stream the response
            temperature (float): Sampling temperature for the response

        Returns:
            str: The generated response

        Raises:
            TokenLimitExceeded: If token limits are exceeded
            ValueError: If messages are invalid or response is empty
            OpenAIError: If API call fails after retries
            Exception: For unexpected errors
        """
        try:
            # For ask_with_images, we always set supports_images to True because
            # this method should only be called with models that support images
            if self.model not in MULTIMODAL_MODELS:
                raise ValueError(
                    f"Model {self.model} does not support images. Use a model from {MULTIMODAL_MODELS}"
                )

            # Format messages with image support
            formatted_messages = self.format_messages(messages, supports_images=True)

            # Ensure the last message is from the user to attach images
            if not formatted_messages or formatted_messages[-1]["role"] != "user":
                raise ValueError(
                    "The last message must be from the user to attach images"
                )

            # Process the last user message to include images
            last_message = formatted_messages[-1]

            # Convert content to multimodal format if needed
            content = last_message["content"]
            multimodal_content = (
                [{"type": "text", "text": content}]
                if isinstance(content, str)
                else content
                if isinstance(content, list)
                else []
            )

            # Add images to content
            for image in images:
                if isinstance(image, str):
                    multimodal_content.append(
                        {"type": "image_url", "image_url": {"url": image}}
                    )
                elif isinstance(image, dict) and "url" in image:
                    multimodal_content.append({"type": "image_url", "image_url": image})
                elif isinstance(image, dict) and "image_url" in image:
                    multimodal_content.append(image)
                else:
                    raise ValueError(f"Unsupported image format: {image}")

            # Update the message with multimodal content
            last_message["content"] = multimodal_content

            # Add system messages if provided
            if system_msgs:
                all_messages = (
                    self.format_messages(system_msgs, supports_images=True)
                    + formatted_messages
                )
            else:
                all_messages = formatted_messages

            # Calculate tokens and check limits
            input_tokens = self.count_message_tokens(all_messages)
            if not self.check_token_limit(input_tokens):
                raise TokenLimitExceeded(self.get_limit_error_message(input_tokens))

            # Set up API parameters
            params = {
                "model": self.model,
                "messages": all_messages,
                "stream": stream,
            }

            # Add model-specific parameters
            if self.model in REASONING_MODELS:
                params["max_completion_tokens"] = self.max_tokens
            else:
                params["max_tokens"] = self.max_tokens
                params["temperature"] = (
                    temperature if temperature is not None else self.temperature
                )

            # Handle non-streaming request
            if not stream:
                response = await self.client.chat.completions.create(**params)

                if not response.choices or not response.choices[0].message.content:
                    raise ValueError("Empty or invalid response from LLM")

                self.update_token_count(response.usage.prompt_tokens)
                return response.choices[0].message.content

            # Handle streaming request
            self.update_token_count(input_tokens)
            response = await self.client.chat.completions.create(**params)

            collected_messages = []
            async for chunk in response:
                chunk_message = chunk.choices[0].delta.content or ""
                collected_messages.append(chunk_message)
                print(chunk_message, end="", flush=True)

            print()  # Newline after streaming
            full_response = "".join(collected_messages).strip()

            if not full_response:
                raise ValueError("Empty response from streaming LLM")

            return full_response

        except TokenLimitExceeded:
            raise
        except ValueError as ve:
            logger.error(f"Validation error in ask_with_images: {ve}")
            raise
        except OpenAIError as oe:
            logger.error(f"OpenAI API error: {oe}")
            if isinstance(oe, AuthenticationError):
                logger.error("Authentication failed. Check API key.")
            elif isinstance(oe, RateLimitError):
                logger.error("Rate limit exceeded. Consider increasing retry attempts.")
            elif isinstance(oe, APIError):
                logger.error(f"API error: {oe}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in ask_with_images: {e}")
            raise

    @retry(
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(6),
        retry=retry_if_exception_type(
            (OpenAIError, Exception, ValueError)
        ),
    )
    async def ask_tool(
        self,
        messages: List[Union[dict, Message]],
        system_msgs: Optional[List[Union[dict, Message]]] = None,
        timeout: int = 300,
        tools: Optional[List[dict]] = None,
        tool_choice: TOOL_CHOICE_TYPE = ToolChoice.AUTO,
        temperature: Optional[float] = None,
        **kwargs,
    ) -> ChatCompletionMessage | None:
        try:
            # --- Initial Formatting (Minimal) --- #
            system_content_list = []
            if system_msgs:
                 system_content_list = self.format_messages(system_msgs)
            # IMPORTANT: message_content_list now contains the FULL history up to the point ask_tool is called
            # This includes user prompts, previous assistant turns, tool results, and any agent-added prompts
            message_content_list = self.format_messages(messages)
            initial_messages_history = system_content_list + message_content_list
            # -------------------------------- #

            # --- Token Calculation (Keep as is) --- #
            input_tokens = self.count_message_tokens(initial_messages_history)
            tools_tokens = 0
            if tools:
                for tool in tools:
                    tools_tokens += self.count_tokens(str(tool))
            input_tokens += tools_tokens
            if not self.check_token_limit(input_tokens):
                raise TokenLimitExceeded(self.get_limit_error_message(input_tokens))
            # -------------------------------------- #

            if self.api_type == "anthropic":
                logger.info(f"Formatting messages for Anthropic tool call (model: {self.model})")
                system_prompt_content = None
                anthropic_messages_for_api = []
                skip_next = False

                for i, msg in enumerate(initial_messages_history):
                    if skip_next:
                        skip_next = False
                        logger.debug(f"Skipping message at index {i} due to skip_next flag.")
                        continue

                    role = msg.get('role')
                    logger.debug(f"Processing message {i}: role={role}, content_keys={list(msg.keys())}")

                    if role == 'system':
                        if system_prompt_content is None:
                            content = msg.get('content', '')
                            if isinstance(content, list):
                                 system_prompt_content = " ".join(p.get('text','') for p in content if isinstance(p, dict) and p.get('type')=='text')
                            else:
                                 system_prompt_content = str(content)
                            logger.debug(f"Extracted system prompt: {system_prompt_content[:100]}...")
                        continue # System messages handled separately

                    elif role == 'assistant':
                        has_text_content = bool(msg.get('content'))
                        has_tool_calls = bool(msg.get('tool_calls'))
                        logger.debug(f"Assistant message {i}: has_text={has_text_content}, has_tool_calls={has_tool_calls}")

                        # Check if this assistant turn should be paired with a following tool result
                        is_paired_with_result = False
                        tool_call_id_to_match = None
                        if has_tool_calls and i + 1 < len(initial_messages_history):
                            next_msg = initial_messages_history[i+1]
                            # Ensure tool_calls is a list and access the first element safely
                            current_tool_calls = msg.get('tool_calls')
                            if isinstance(current_tool_calls, list) and len(current_tool_calls) > 0:
                                tool_call_id_to_match = current_tool_calls[0].get('id')
                                if next_msg.get('role') == 'tool' and next_msg.get('tool_call_id') == tool_call_id_to_match:
                                    is_paired_with_result = True
                                    logger.debug(f"Assistant message {i} IS paired with tool result {i+1} (ID: {tool_call_id_to_match})")
                                else:
                                    logger.debug(f"Assistant message {i} has tool calls but is NOT paired with next message {i+1} (role={next_msg.get('role')}, id={next_msg.get('tool_call_id')})")
                            else:
                                logger.warning(f"Assistant message {i} has 'tool_calls' key but it's not a non-empty list: {current_tool_calls}")


                        # Scenario 1: Assistant message with ONLY text content
                        if has_text_content and not has_tool_calls:
                            logger.debug(f"Adding assistant message {i} (text only)")
                            anthropic_messages_for_api.append(msg)

                        # Scenario 2: Assistant message with ONLY tool_calls (Anthropic format requires content list)
                        elif not has_text_content and has_tool_calls:
                            anthropic_tool_use_content = []
                            for tc in msg['tool_calls']:
                                if tc.get('type') == 'function':
                                    func = tc.get('function', {})
                                    try: input_args = json.loads(func.get('arguments', '{}'))
                                    except json.JSONDecodeError: input_args = {}
                                    anthropic_tool_use_content.append({"type": "tool_use", "id": tc.get('id'), "name": func.get('name'), "input": input_args})
                            if anthropic_tool_use_content:
                                logger.debug(f"Adding assistant message {i} (tool_use only)")
                                anthropic_messages_for_api.append({"role": "assistant", "content": anthropic_tool_use_content})
                            else:
                                logger.warning(f"Assistant message {i} had tool_calls but conversion resulted in empty list.")

                            if is_paired_with_result:
                                tool_result_msg = initial_messages_history[i+1]
                                tool_content_result = tool_result_msg.get('content', '')
                                logger.debug(f"Adding converted tool result for ID {tool_call_id_to_match}")
                                anthropic_messages_for_api.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_call_id_to_match, "content": str(tool_content_result)}]})
                                skip_next = True

                        # Scenario 3: Assistant message with BOTH text content AND tool_calls
                        elif has_text_content and has_tool_calls:
                             # Anthropic expects text and tool_use in separate messages in the history
                             # when a tool_result follows.
                             # 1. Add the text part first.
                             logger.debug(f"Adding assistant message {i} (text part of split)")
                             anthropic_messages_for_api.append({"role": "assistant", "content": msg.get('content')})

                             # 2. Convert and add the tool_calls part as a separate assistant message
                             anthropic_tool_use_content = []
                             for tc in msg['tool_calls']:
                                 if tc.get('type') == 'function':
                                     func = tc.get('function', {})
                                     try: input_args = json.loads(func.get('arguments', '{}'))
                                     except json.JSONDecodeError: input_args = {}
                                     anthropic_tool_use_content.append({"type": "tool_use", "id": tc.get('id'), "name": func.get('name'), "input": input_args})

                             if anthropic_tool_use_content:
                                 logger.debug(f"Adding assistant message {i} (tool_use part of split)")
                                 anthropic_messages_for_api.append({"role": "assistant", "content": anthropic_tool_use_content})
                             else:
                                 logger.warning(f"Assistant message {i} had tool_calls but conversion resulted in empty list during split.")


                             # 3. If paired, add the converted tool result message
                             if is_paired_with_result:
                                 tool_result_msg = initial_messages_history[i+1]
                                 tool_content_result = tool_result_msg.get('content', '')
                                 logger.debug(f"Adding converted tool result for ID {tool_call_id_to_match} (after split)")
                                 anthropic_messages_for_api.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": tool_call_id_to_match, "content": str(tool_content_result)}]})
                                 skip_next = True # Skip the original tool result message
                        else:
                            # Assistant message with no content and no tool calls (should usually not happen)
                            logger.warning(f"Skipping assistant message {i} with no content and no tool calls.")


                    elif role == 'tool':
                         # This role should only appear if it wasn't skipped by skip_next
                         # It indicates an "orphan" tool result message that wasn't paired correctly above.
                         logger.warning(f"Found orphan tool message at index {i}, skipping: {msg.get('tool_call_id')}")

                    elif role == 'user':
                        # Append user message if content exists
                        if msg.get('content'):
                             logger.debug(f"Adding user message {i}")
                             anthropic_messages_for_api.append(msg)
                        else:
                            logger.warning(f"Skipping user message {i} with empty content.")
                    else:
                         logger.warning(f"Skipping message {i} with unknown role: {role}")

                # --- Final check for consecutive assistant messages --- #
                final_anthropic_messages = []
                last_role = None
                for msg in anthropic_messages_for_api:
                    current_role = msg.get('role')
                    # Merge consecutive assistant text messages if needed (though the split logic above might prevent this)
                    # if current_role == 'assistant' and last_role == 'assistant' and isinstance(msg.get('content'), str) and isinstance(final_anthropic_messages[-1].get('content'), str):
                    #     final_anthropic_messages[-1]['content'] += "\n" + msg['content']
                    #     logger.debug("Merged consecutive assistant text messages.")
                    # else:
                    final_anthropic_messages.append(msg)
                    last_role = current_role
                anthropic_messages_for_api = final_anthropic_messages
                # -------------------------------------------------- #


                # Determine if the *last* message being sent is a tool result (influences whether 'tools' param should be sent)
                is_last_message_tool_result = anthropic_messages_for_api and \
                                              anthropic_messages_for_api[-1].get('role') == 'user' and \
                                              isinstance(anthropic_messages_for_api[-1].get('content'), list) and \
                                              any(item.get('type') == 'tool_result' for item in anthropic_messages_for_api[-1]['content'] if isinstance(item, dict))
                logger.debug(f"Is the last message being sent a tool result? {is_last_message_tool_result}")

                # Convert OpenAI tools to Anthropic format for the 'tools' parameter
                anthropic_tools_param = []
                if tools and not is_last_message_tool_result: # Only add tools param if NOT just sending a result
                     logger.debug("Converting OpenAI tools to Anthropic format for 'tools' parameter.")
                     for tool in tools:
                         if tool.get('type') == 'function' and 'function' in tool:
                             func_details = tool['function']
                             anthropic_tools_param.append({
                                 "name": func_details.get('name'),
                                 "description": func_details.get('description'),
                                 "input_schema": func_details.get('parameters')
                             })
                else:
                     logger.debug("Skipping 'tools' parameter (either no tools provided or last message is a tool result).")

                # --- Prepare Anthropic parameters explicitly --- #
                anthropic_params = {
                    "model": self.model,
                    "messages": anthropic_messages_for_api, # Use the carefully constructed list
                    "max_tokens": self.max_tokens,
                    "temperature": temperature if temperature is not None else self.temperature,
                    **kwargs, # Add other kwargs first
                }
                if system_prompt_content:
                    anthropic_params["system"] = system_prompt_content

                # Explicitly add 'tools' only if needed
                if anthropic_tools_param:
                    anthropic_params["tools"] = anthropic_tools_param
                # ------------------------------------------------- #

                try:
                    # Log the final parameters being sent
                    log_params_copy = anthropic_params.copy()
                    if 'messages' in log_params_copy: # Shorten messages for logging if too long
                         log_params_copy['messages'] = [str(m)[:200] + ('...' if len(str(m)) > 200 else '') for m in log_params_copy['messages']]
                    logger.debug(f"Anthropic Request Params (Final): {log_params_copy}")

                    response = await self.client.messages.create(**anthropic_params)
                    logger.debug(f"Anthropic Raw Response: {response}")

                    # --- Adapt Anthropic Response ---
                    content_text = None
                    extracted_tool_calls = []
                    if response.content:
                        for block in response.content:
                            if block.type == 'text':
                                content_text = block.text
                            elif block.type == 'tool_use':
                                logger.info(f"Detected Anthropic tool use: ID={block.id}, Name={block.name}, Input={block.input}")
                                # Ensure arguments are always a JSON string for OpenAI compatibility
                                try:
                                     args_str = json.dumps(block.input or {})
                                except TypeError:
                                     args_str = '{}' # Fallback for non-serializable input
                                extracted_tool_calls.append(
                                    ChatCompletionMessageToolCall(
                                        id=block.id, type='function',
                                        function=Function(name=block.name, arguments=args_str)
                                    )
                                )

                    # Update token counts (use actual from response if available)
                    prompt_tokens = response.usage.input_tokens if response.usage else input_tokens # Fallback to estimate
                    completion_tokens = response.usage.output_tokens if response.usage else 0 # No good estimate for completion
                    self.update_token_count(prompt_tokens, completion_tokens)

                    adapted_message = ChatCompletionMessage(
                        role="assistant",
                        content=content_text, # Can be None if only tool calls
                        tool_calls=extracted_tool_calls if extracted_tool_calls else None
                    )
                    logger.debug(f"Adapted Anthropic response: {adapted_message}")
                    return adapted_message
                    # --- End Adapt Anthropic Response ---

                except Exception as anthropic_err:
                    logger.exception(f"Anthropic API call failed") # Log full exception
                    raise # Re-raise the original error for tenacity

            elif self.api_type == "aws":
                logger.info(f"Making API call to Bedrock/AWS with model {self.model}")
                # --- Bedrock Tool Calling Logic ---
                # Bedrock Claude needs specific formatting
                bedrock_params = {
                    "modelId": self.model,
                    "messages": initial_messages_history, # Need to potentially reformat roles/content for Bedrock
                    "inferenceConfig": {
                        "maxTokens": self.max_tokens,
                        "temperature": temperature if temperature is not None else self.temperature,
                    },
                    "toolConfig": {
                         "tools": tools,
                         "toolChoice": {"auto": {}} if tool_choice == ToolChoice.AUTO else {"tool": {"name": tool_choice}} if isinstance(tool_choice, str) else {"any":{}} # Adapt tool_choice
                    } if tools else None
                }
                # Reformat messages for Bedrock Claude 3 (alternating user/assistant)
                # Needs careful handling of tool results similar to Anthropic base API
                raise NotImplementedError("Bedrock tool calling message formatting not yet fully implemented.")
                # response = await self.client.converse(**bedrock_params)
                # Adapt Bedrock response back to ChatCompletionMessage format
                # ... adaptation logic ...
                # return adapted_message
                # --- End Bedrock Tool Calling Logic ---

            else: # OpenAI / Azure
                 logger.info(f"Making API call to {self.api_type} with model {self.model}")
                 openai_params = {
                     "model": self.model,
                     "messages": initial_messages_history,
                     "max_tokens": self.max_tokens,
                     "temperature": temperature if temperature is not None else self.temperature,
                     "timeout": timeout,
                     **kwargs,
                 }
                 if tools:
                     openai_params["tools"] = tools
                     openai_params["tool_choice"] = tool_choice
                 else:
                     # Avoid sending tool_choice if no tools are provided
                      if "tool_choice" in openai_params:
                          del openai_params["tool_choice"]

                 logger.debug(f"OpenAI/Azure Request Params: {openai_params}")
                 response: ChatCompletion = await self.client.chat.completions.create(**openai_params)
                 logger.debug(f"OpenAI/Azure Raw Response: {response}")

                 if not response.choices:
                    raise ValueError("Empty response choices from LLM")

                 # Update token counts
                 if response.usage:
                     self.update_token_count(response.usage.prompt_tokens, response.usage.completion_tokens)
                 else:
                      # Estimate input tokens if usage data is missing
                      self.update_token_count(input_tokens)

                 return response.choices[0].message

        except TokenLimitExceeded:
            logger.error("Token limit exceeded in ask_tool.")
            raise # Re-raise without adding general exception log
        except OpenAIError as oe: # Catch specific OpenAI errors
            logger.exception(f"OpenAI/Azure API error in ask_tool")
            raise
        except Exception as e:
            # Catch other potential errors during formatting or API call
            logger.exception(f"Unexpected error in ask_tool")
            raise
