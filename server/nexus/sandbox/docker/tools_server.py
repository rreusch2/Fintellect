#!/usr/bin/env python3

import os
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import httpx
from tavily import TavilyClient
import requests

# Initialize FastAPI app
app = FastAPI(title="Financial Analysis Tools Server", version="1.0.0")

# Models for request/response
class WebSearchRequest(BaseModel):
    query: str
    num_results: int = 10

class WebScrapeRequest(BaseModel):
    urls: str  # comma-separated URLs

class CreateFileRequest(BaseModel):
    path: str
    content: str

class ToolResponse(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None

# Initialize clients
def get_tavily_client():
    api_key = os.getenv('TAVILY_API_KEY')
    if not api_key:
        raise ValueError("TAVILY_API_KEY not found in environment")
    return TavilyClient(api_key=api_key)

def get_firecrawl_config():
    api_key = os.getenv('FIRECRAWL_API_KEY')
    if not api_key:
        raise ValueError("FIRECRAWL_API_KEY not found in environment")
    return {
        'api_key': api_key,
        'base_url': 'https://api.firecrawl.dev'
    }

# Ensure workspace directory exists
os.makedirs('/workspace', exist_ok=True)

@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "Financial Analysis Tools Server is running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/web-search")
async def web_search(request: WebSearchRequest):
    """Search the web using Tavily API"""
    try:
        client = get_tavily_client()
        
        # Execute search
        response = client.search(
            query=request.query,
            max_results=min(request.num_results, 20),
            include_images=True,
            include_answer=True,
            search_depth="advanced"
        )
        
        # Format response
        results_count = len(response.get('results', []))
        
        return ToolResponse(
            success=True,
            output=json.dumps({
                'query': request.query,
                'results_count': results_count,
                'answer': response.get('answer', ''),
                'results': response.get('results', []),
                'images': response.get('images', [])
            }, ensure_ascii=False)
        )
        
    except Exception as e:
        return ToolResponse(
            success=False,
            error=f"Web search failed: {str(e)}"
        )

@app.post("/web-scrape")
async def web_scrape(request: WebScrapeRequest):
    """Scrape web pages using Firecrawl API"""
    try:
        config = get_firecrawl_config()
        
        # Parse URLs
        urls = [url.strip() for url in request.urls.split(',') if url.strip()]
        if not urls:
            return ToolResponse(
                success=False,
                error="No valid URLs provided"
            )
        
        # Scrape each URL
        scraped_data = []
        successful_scrapes = 0
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for url in urls:
                try:
                    # Add protocol if missing
                    if not (url.startswith('http://') or url.startswith('https://')):
                        url = 'https://' + url
                    
                    headers = {
                        "Authorization": f"Bearer {config['api_key']}",
                        "Content-Type": "application/json"
                    }
                    
                    payload = {
                        "url": url,
                        "formats": ["markdown"]
                    }
                    
                    response = await client.post(
                        f"{config['base_url']}/v1/scrape",
                        json=payload,
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        title = data.get("data", {}).get("metadata", {}).get("title", "")
                        content = data.get("data", {}).get("markdown", "")
                        
                        scraped_data.append({
                            'url': url,
                            'title': title,
                            'content': content,
                            'success': True
                        })
                        successful_scrapes += 1
                    else:
                        scraped_data.append({
                            'url': url,
                            'error': f"HTTP {response.status_code}",
                            'success': False
                        })
                        
                except Exception as e:
                    scraped_data.append({
                        'url': url,
                        'error': str(e),
                        'success': False
                    })
        
        # Save results to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"/workspace/scrape_results_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(scraped_data, f, ensure_ascii=False, indent=2)
        
        return ToolResponse(
            success=True,
            output=json.dumps({
                'urls_scraped': len(urls),
                'successful_scrapes': successful_scrapes,
                'failed_scrapes': len(urls) - successful_scrapes,
                'results_file': filename,
                'scraped_data': scraped_data
            }, ensure_ascii=False)
        )
        
    except Exception as e:
        return ToolResponse(
            success=False,
            error=f"Web scraping failed: {str(e)}"
        )

@app.post("/create-file")
async def create_file(request: CreateFileRequest):
    """Create a file in the workspace"""
    try:
        # Ensure path is within workspace
        if not request.path.startswith('/workspace'):
            request.path = f"/workspace/{request.path.lstrip('/')}"
        
        # Create directory if needed
        directory = os.path.dirname(request.path)
        os.makedirs(directory, exist_ok=True)
        
        # Write file
        with open(request.path, 'w', encoding='utf-8') as f:
            f.write(request.content)
        
        # Get file size
        file_size = os.path.getsize(request.path)
        
        return ToolResponse(
            success=True,
            output=f"File created successfully: {request.path} ({file_size} bytes)"
        )
        
    except Exception as e:
        return ToolResponse(
            success=False,
            error=f"File creation failed: {str(e)}"
        )

if __name__ == "__main__":
    print("Starting Financial Analysis Tools Server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001) 