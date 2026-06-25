import httpx
from loguru import logger
from core.config import get_settings
from core.exceptions import APIError

settings = get_settings()

class AIService:
    """Service to interact with the local Ollama LLM instance."""
    
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model

    async def generate_response(self, prompt: str, system_prompt: str = None) -> str:
        """
        Sends a generation request to the Ollama server.
        Uses /api/generate endpoint with streaming disabled.
        """
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt
            
        logger.info(f"Sending prompt to Ollama model {self.model} at {self.base_url}")
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload)
                
                if response.status_code != 200:
                    logger.error(f"Ollama returned status code {response.status_code}: {response.text}")
                    raise APIError(f"Ollama server error: {response.status_code}")
                    
                data = response.json()
                return data.get("response", "")
                
        except httpx.RequestError as exc:
            logger.error(f"Failed to connect to Ollama server: {exc}")
            raise APIError("Could not reach Ollama server. Make sure it is running locally.")
