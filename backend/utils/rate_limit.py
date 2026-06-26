import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from loguru import logger

# Simple in-memory rate limiter: {ip: [timestamps]}
rate_limit_records = defaultdict(list)

# Limits: 5 requests per 1 hour (3600 seconds)
RATE_LIMIT_CALLS = 5
RATE_LIMIT_WINDOW = 3600

def rate_limiter(request: Request):
    """
    IP-based rate limiter dependency for FastAPI.
    Supports parsing x-forwarded-for headers from reverse proxies (e.g. Render).
    """
    client_ip = "127.0.0.1"
    if request.client:
        client_ip = request.client.host
        
    # Bypass rate limiting for FastAPI unit tests using TestClient
    if client_ip == "testclient":
        return
    
    # Parse real client IP if behind reverse proxy (like Render's gateway)
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
        
    current_time = time.time()
    
    # Clean up timestamps older than the window
    rate_limit_records[client_ip] = [
        t for t in rate_limit_records[client_ip]
        if current_time - t < RATE_LIMIT_WINDOW
    ]
    
    if len(rate_limit_records[client_ip]) >= RATE_LIMIT_CALLS:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. You can only analyze 5 repositories per hour."
        )
        
    rate_limit_records[client_ip].append(current_time)
