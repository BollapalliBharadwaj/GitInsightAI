import httpx
from loguru import logger
from core.config import get_settings
from core.exceptions import APIError

settings = get_settings()

class AIService:
    """Service to interact with the local Ollama LLM instance or cloud APIs (Gemini, Groq, OpenAI)."""
    
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model

    async def generate_response(self, prompt: str, system_prompt: str = None) -> str:
        """
        Sends a generation request to the selected LLM provider.
        Checks for configured API keys in order: Gemini, Groq, OpenAI, and falls back to Ollama.
        """
        # 1. Gemini Cloud Provider
        if settings.gemini_api_key:
            return await self._generate_gemini(prompt, system_prompt)
            
        # 2. Groq Cloud Provider
        if settings.groq_api_key:
            return await self._generate_groq(prompt, system_prompt)
            
        # 3. OpenAI Cloud Provider
        if settings.openai_api_key:
            return await self._generate_openai(prompt, system_prompt)
            
        # 4. Fallback to Local Ollama
        return await self._generate_ollama(prompt, system_prompt)

    def _map_groq_model(self) -> str:
        model_name = self.model.lower()
        if "llama3.1" in model_name or "llama-3.1" in model_name:
            return "llama-3.1-8b-instant"
        return "llama-3.3-70b-versatile"

    async def _generate_gemini(self, prompt: str, system_prompt: str = None) -> str:
        # Use gemini-1.5-flash by default
        model = "gemini-1.5-flash"
        # Clean API key of any leading/trailing spaces or quotes
        api_key = settings.gemini_api_key.strip().strip('"').strip("'")
        url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={api_key}"
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }
            
        logger.info(f"Sending prompt to Gemini API model {model}")
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code != 200:
                    logger.error(f"Gemini API returned status code {response.status_code}: {response.text}")
                    raise APIError(f"Gemini API error: {response.status_code}")
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                return ""
        except httpx.RequestError as exc:
            logger.error(f"Failed to connect to Gemini API: {exc}")
            raise APIError("Could not reach Gemini API. Check your network or API key.")

    async def _generate_groq(self, prompt: str, system_prompt: str = None) -> str:
        model = self._map_groq_model()
        url = "https://api.groq.com/openai/v1/chat/completions"
        api_key = settings.groq_api_key.strip().strip('"').strip("'")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2
        }
        
        logger.info(f"Sending prompt to Groq API model {model}")
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"Groq API returned status code {response.status_code}: {response.text}")
                    raise APIError(f"Groq API error: {response.status_code}")
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
                return ""
        except httpx.RequestError as exc:
            logger.error(f"Failed to connect to Groq API: {exc}")
            raise APIError("Could not reach Groq API. Check your network or API key.")

    async def _generate_openai(self, prompt: str, system_prompt: str = None) -> str:
        model = "gpt-4o-mini"
        url = "https://api.openai.com/v1/chat/completions"
        api_key = settings.openai_api_key.strip().strip('"').strip("'")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2
        }
        
        logger.info(f"Sending prompt to OpenAI API model {model}")
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    logger.error(f"OpenAI API returned status code {response.status_code}: {response.text}")
                    raise APIError(f"OpenAI API error: {response.status_code}")
                data = response.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
                return ""
        except httpx.RequestError as exc:
            logger.error(f"Failed to connect to OpenAI API: {exc}")
            raise APIError("Could not reach OpenAI API. Check your network or API key.")

    async def _generate_ollama(self, prompt: str, system_prompt: str = None) -> str:
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
