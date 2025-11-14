# 🚀 Quick Start Backend for Monday.com Integration

This is a minimal FastAPI backend to connect your REDSIS Client Portal to Monday.com.

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI app
├── config.py            # Settings
├── monday_client.py     # Monday.com API wrapper
├── requirements.txt     # Dependencies
└── .env                 # Environment variables
```

## 🔧 Installation

```bash
# Create project directory
mkdir redsis-backend
cd redsis-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-jose[cryptography] python-dotenv httpx pydantic

# Create requirements.txt
pip freeze > requirements.txt
```

## 📋 Files

### 1. `requirements.txt`

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-jose[cryptography]==3.3.0
python-dotenv==1.0.0
pydantic==2.5.0
httpx==0.25.0
python-multipart==0.0.6
```

### 2. `.env`

```env
# Monday.com Configuration
MONDAY_API_TOKEN=your_monday_api_token_here
MONDAY_BOARD_ID=your_board_id_here
MONDAY_WORKSPACE_ID=4655994

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-min-32-characters
JWT_ALGORITHM=HS256

# CORS - Frontend URLs
ALLOWED_ORIGINS=http://localhost:3000,https://portal.redsis.com

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

### 3. `config.py`

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Monday.com
    MONDAY_API_TOKEN: str
    MONDAY_BOARD_ID: str
    MONDAY_WORKSPACE_ID: str = "4655994"
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return self.ALLOWED_ORIGINS.split(",")
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 4. `monday_client.py`

```python
import httpx
import json
from typing import Dict, List, Optional, Any
from config import settings

class MondayClient:
    """Simple Monday.com GraphQL API client"""
    
    def __init__(self):
        self.api_url = "https://api.monday.com/v2"
        self.headers = {
            "Authorization": settings.MONDAY_API_TOKEN,
            "Content-Type": "application/json",
        }
    
    async def query(self, query_string: str, variables: Optional[Dict] = None) -> Dict:
        """Execute GraphQL query"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {"query": query_string}
            if variables:
                payload["variables"] = variables
            
            response = await client.post(
                self.api_url,
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    async def get_tickets(self, portal_id: str) -> List[Dict]:
        """Get all tickets for a portal ID"""
        query = '''
        query GetTickets($boardId: ID!) {
          boards(ids: [$boardId]) {
            items_page {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                }
                created_at
                updated_at
              }
            }
          }
        }
        '''
        
        result = await self.query(query, {"boardId": settings.MONDAY_BOARD_ID})
        items = result["data"]["boards"][0]["items_page"]["items"]
        
        # Filter and transform
        tickets = []
        for item in items:
            # Get column values
            cols = {col["id"]: col["text"] for col in item["column_values"]}
            
            # Only include items for this portal
            if cols.get("portal_id") == portal_id:
                tickets.append({
                    "id": item["id"],
                    "title": item["name"],
                    "description": cols.get("description", ""),
                    "status": self._map_status(cols.get("status")),
                    "priority": self._map_priority(cols.get("priority")),
                    "client_id": portal_id,
                    "created_at": item["created_at"],
                    "updated_at": item["updated_at"],
                })
        
        return tickets
    
    async def create_ticket(
        self, 
        title: str, 
        description: str, 
        priority: str,
        portal_id: str,
        client_email: str
    ) -> Dict:
        """Create a new ticket in Monday"""
        mutation = '''
        mutation CreateTicket($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item(
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
            name
            created_at
          }
        }
        '''
        
        # Column values must match your board's column IDs
        column_values = {
            "description": description,
            "portal_id": portal_id,
            "client_email": client_email,
            "status": {"label": "Open"},
            "priority": {"label": priority.capitalize()},
        }
        
        variables = {
            "boardId": settings.MONDAY_BOARD_ID,
            "itemName": title,
            "columnValues": json.dumps(column_values)
        }
        
        result = await self.query(mutation, variables)
        item = result["data"]["create_item"]
        
        return {
            "id": item["id"],
            "title": title,
            "description": description,
            "status": "open",
            "priority": priority,
            "client_id": portal_id,
            "created_at": item["created_at"],
            "updated_at": item["created_at"],
        }
    
    def _map_status(self, monday_status: Optional[str]) -> str:
        """Map Monday status labels to app status"""
        mapping = {
            "Open": "open",
            "In Progress": "in_progress",
            "Resolved": "resolved",
            "Closed": "closed",
        }
        return mapping.get(monday_status, "open")
    
    def _map_priority(self, monday_priority: Optional[str]) -> str:
        """Map Monday priority labels to app priority"""
        mapping = {
            "Low": "low",
            "Medium": "medium",
            "High": "high",
            "Urgent": "urgent",
        }
        return mapping.get(monday_priority, "medium")

# Global instance
monday = MondayClient()
```

### 5. `main.py`

```python
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from jose import jwt, JWTError
import secrets

from config import settings
from monday_client import monday

# ========== FastAPI App ==========
app = FastAPI(title="REDSIS Client Portal API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Models ==========
class CreateTicketRequest(BaseModel):
    title: str
    description: str
    priority: str = "medium"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    portal_id: str

class Ticket(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    client_id: str
    created_at: str
    updated_at: str

# ========== In-Memory Storage (Use Redis in Production) ==========
magic_link_tokens = {}

# ========== Helper Functions ==========
def create_jwt_token(email: str, portal_id: str) -> str:
    """Create JWT token"""
    payload = {
        "sub": email,
        "portal_id": portal_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_token(authorization: str = Header(None)) -> dict:
    """Verify JWT token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ========== Routes ==========

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "message": "REDSIS Client Portal API",
        "workspace": settings.MONDAY_WORKSPACE_ID
    }

@app.post("/auth/send-magic-link")
async def send_magic_link(email: EmailStr):
    """
    Generate magic link for client
    In production: Send via email
    For demo: Return the link
    """
    # Generate portal_id and token
    portal_id = f"portal_{secrets.token_hex(8)}"
    token = secrets.token_urlsafe(32)
    
    # Store token
    magic_link_tokens[f"{portal_id}:{token}"] = {
        "email": email,
        "portal_id": portal_id,
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }
    
    # Build magic link
    magic_link = f"http://localhost:3000/login?portal_id={portal_id}&token={token}"
    
    # TODO: Send email
    # For now, return the link for testing
    return {
        "message": "Magic link generated",
        "magic_link": magic_link,  # Remove in production!
        "email": email
    }

@app.get("/auth/{portal_id}/{token}", response_model=AuthResponse)
async def authenticate_with_magic_link(portal_id: str, token: str):
    """Exchange magic link for JWT"""
    key = f"{portal_id}:{token}"
    
    if key not in magic_link_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired link")
    
    token_data = magic_link_tokens[key]
    
    # Check expiration
    if datetime.utcnow() > token_data["expires_at"]:
        del magic_link_tokens[key]
        raise HTTPException(status_code=401, detail="Link expired")
    
    # Create JWT
    access_token = create_jwt_token(token_data["email"], portal_id)
    
    # Clean up
    del magic_link_tokens[key]
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        portal_id=portal_id
    )

@app.get("/me")
async def get_current_user(user = Depends(verify_token)):
    """Get current user info"""
    return {
        "id": user["portal_id"],
        "email": user["sub"],
        "name": user["sub"].split("@")[0],
        "portal_id": user["portal_id"],
        "client_name": "Demo Client"
    }

@app.get("/tickets/{portal_id}", response_model=List[Ticket])
async def get_tickets(portal_id: str, user = Depends(verify_token)):
    """Get all tickets for portal"""
    
    # Verify user owns this portal
    if user["portal_id"] != portal_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Fetch from Monday
    tickets = await monday.get_tickets(portal_id)
    
    return tickets

@app.post("/ticket", response_model=Ticket)
async def create_ticket(
    ticket: CreateTicketRequest,
    user = Depends(verify_token)
):
    """Create new ticket in Monday"""
    
    # Create in Monday
    new_ticket = await monday.create_ticket(
        title=ticket.title,
        description=ticket.description,
        priority=ticket.priority,
        portal_id=user["portal_id"],
        client_email=user["sub"]
    )
    
    return new_ticket

# ========== Run Server ==========
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
```

## 🚀 Running the Backend

```bash
# 1. Make sure you're in the backend directory with venv activated
cd redsis-backend
source venv/bin/activate

# 2. Set your Monday.com API token in .env
# Get it from: https://monday.com → Avatar → Admin → API

# 3. Set your Monday board ID in .env
# Find it in the board URL: monday.com/boards/1234567890

# 4. Run the server
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

## 📝 Testing the API

```bash
# Test health check
curl http://localhost:8000/

# Generate magic link
curl -X POST http://localhost:8000/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Copy the magic link from response and paste in browser
# Or test token exchange directly:
curl http://localhost:8000/auth/{portal_id}/{token}

# Test getting tickets (use JWT from previous step)
curl http://localhost:8000/tickets/{portal_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔄 Connecting to Your Frontend

Update your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000
```

Now your client portal will communicate with this backend, which fetches/creates tickets in Monday.com!

## ⚠️ Important Notes

1. **Column IDs**: The `column_values` in Monday mutations use column IDs like `description`, `portal_id`, etc. These must match your actual board's column IDs. Check them in Monday's board settings.

2. **Security**: This is a minimal implementation. For production:
   - Use Redis for token storage
   - Add rate limiting
   - Implement proper email service
   - Use environment-specific secrets
   - Add logging and monitoring

3. **Board Setup**: Make sure your Monday board has these columns:
   - `description` (Long Text)
   - `portal_id` (Text)
   - `client_email` (Email)
   - `status` (Status: Open, In Progress, Resolved, Closed)
   - `priority` (Status: Low, Medium, High, Urgent)

## 📚 Next Steps

1. Test the API endpoints
2. Create tickets via API and verify they appear in Monday
3. Update tickets in Monday and verify API returns updated data
4. Implement WebSocket for real-time updates
5. Add email service for magic links
6. Deploy to production

---

**Need help?** Check the Monday.com API docs at https://developer.monday.com/
