# 🚀 Monday.com Integration Guide for REDSIS Client Portal

## Overview

This guide explains how to connect your REDSIS Client Portal to Monday.com boards so that:
- ✅ Tickets created in the portal appear as items in Monday boards
- ✅ Updates in Monday sync back to the portal
- ✅ Clients can only see their own tickets
- ✅ Magic link authentication works through Monday.com

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Client Portal  │ ───► │  Backend API    │ ───► │   Monday.com    │
│   (Next.js)     │      │   (FastAPI)     │      │   GraphQL API   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                         │
        │                         ▼
        │                ┌─────────────────┐
        └────────────────│   Database      │
          JWT Token      │  (PostgreSQL)   │
                         └─────────────────┘
```

### Components Needed:

1. **Frontend** (✅ Already Built) - Your Next.js client portal
2. **Backend API** (🔨 To Build) - FastAPI server that connects Monday.com and your portal
3. **Monday.com Setup** (📋 To Configure) - Boards, columns, and integrations
4. **Database** (Optional) - Cache Monday data and store auth tokens

---

## 📋 Monday.com Board Setup

### Step 1: Create Your Support Tickets Board

1. Go to Monday.com workspace `4655994`
2. Create a new board: **"Client Support Tickets"**
3. Add the following columns:

| Column Name      | Type         | Purpose                    |
|------------------|--------------|----------------------------|
| Ticket ID        | Text         | Unique identifier          |
| Title            | Text         | Ticket subject             |
| Description      | Long Text    | Detailed description       |
| Client Email     | Email        | Client's email             |
| Client Portal ID | Text         | Portal authentication ID   |
| Status           | Status       | open, in_progress, resolved, closed |
| Priority         | Status       | low, medium, high, urgent  |
| Created Date     | Date         | Auto-populated             |
| Last Updated     | Date         | Auto-populated             |

### Step 2: Configure Status Labels

**Status Column Values:**
- 🔵 Open (Blue)
- 🟡 In Progress (Yellow)
- 🟢 Resolved (Green)
- ⚫ Closed (Gray)

**Priority Column Values:**
- ⚪ Low (Gray)
- 🔵 Medium (Blue)
- 🟠 High (Orange)
- 🔴 Urgent (Red)

### Step 3: Get Board ID

1. Open your board in Monday.com
2. Look at the URL: `https://myworkspace.monday.com/boards/1234567890`
3. Note the board ID: `1234567890`

---

## 🔑 Monday.com API Access

### Step 1: Get API Token

1. Go to https://monday.com/
2. Click your avatar → Admin
3. Go to **API** section
4. Click **Generate** or copy existing token
5. Store securely (you'll add this to backend `.env`)

### Step 2: Test API Access

```bash
curl -X POST https://api.monday.com/v2 \
  -H "Authorization: YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ me { name email } }"}'
```

You should get a response with your Monday.com user info.

---

## 🛠️ Backend API Implementation

You need to build a FastAPI backend that bridges the client portal and Monday.com.

### Backend Architecture

```
backend/
├── main.py              # FastAPI app entry point
├── config.py            # Environment configuration
├── models.py            # Database models (optional)
├── schemas.py           # Pydantic models
├── auth/
│   ├── __init__.py
│   ├── jwt.py          # JWT token handling
│   └── magic_link.py   # Magic link generation
├── monday/
│   ├── __init__.py
│   ├── client.py       # Monday.com API client
│   ├── queries.py      # GraphQL queries
│   └── mutations.py    # GraphQL mutations
├── routers/
│   ├── __init__.py
│   ├── auth.py         # Authentication endpoints
│   ├── tickets.py      # Ticket CRUD operations
│   └── webhooks.py     # Monday.com webhooks
└── requirements.txt
```

### Required Python Packages

```txt
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-jose[cryptography]==3.3.0
python-dotenv==1.0.0
pydantic==2.5.0
httpx==0.25.0
python-multipart==0.0.6
websockets==12.0
```

### Environment Variables

```env
# .env
# Monday.com
MONDAY_API_TOKEN=your_monday_api_token_here
MONDAY_BOARD_ID=1234567890
MONDAY_WORKSPACE_ID=4655994

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Application
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,https://portal.redsis.com

# Email (for magic links)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@redsis.com
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@redsis.com

# Frontend URLs
FRONTEND_URL=http://localhost:3000
MAGIC_LINK_URL=http://localhost:3000/login
```

---

## 📝 Backend Code Examples

### 1. Monday.com Client (`monday/client.py`)

```python
import httpx
from typing import Dict, List, Optional, Any
from config import settings

class MondayClient:
    """Client for Monday.com GraphQL API"""
    
    def __init__(self):
        self.api_url = "https://api.monday.com/v2"
        self.headers = {
            "Authorization": settings.MONDAY_API_TOKEN,
            "Content-Type": "application/json",
        }
    
    async def execute_query(self, query: str, variables: Optional[Dict] = None) -> Dict:
        """Execute a GraphQL query"""
        async with httpx.AsyncClient() as client:
            payload = {"query": query}
            if variables:
                payload["variables"] = variables
            
            response = await client.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def get_board_items(
        self, 
        board_id: str,
        portal_id: Optional[str] = None
    ) -> List[Dict]:
        """Get all items from a board, optionally filtered by portal_id"""
        query = """
        query GetBoardItems($boardId: ID!) {
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
        """
        
        result = await self.execute_query(query, {"boardId": board_id})
        items = result["data"]["boards"][0]["items_page"]["items"]
        
        # Filter by portal_id if provided
        if portal_id:
            items = [
                item for item in items 
                if self._get_column_value(item, "portal_id") == portal_id
            ]
        
        return items
    
    async def create_item(
        self,
        board_id: str,
        item_name: str,
        column_values: Dict[str, Any]
    ) -> Dict:
        """Create a new item in Monday board"""
        mutation = """
        mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
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
        """
        
        variables = {
            "boardId": board_id,
            "itemName": item_name,
            "columnValues": json.dumps(column_values)
        }
        
        result = await self.execute_query(mutation, variables)
        return result["data"]["create_item"]
    
    async def update_item(
        self,
        item_id: str,
        column_values: Dict[str, Any]
    ) -> Dict:
        """Update an existing item"""
        mutation = """
        mutation UpdateItem($itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(
            item_id: $itemId,
            board_id: %s,
            column_values: $columnValues
          ) {
            id
          }
        }
        """ % settings.MONDAY_BOARD_ID
        
        variables = {
            "itemId": item_id,
            "columnValues": json.dumps(column_values)
        }
        
        result = await self.execute_query(mutation, variables)
        return result["data"]["change_multiple_column_values"]
    
    def _get_column_value(self, item: Dict, column_id: str) -> Optional[str]:
        """Extract column value from item"""
        for col in item["column_values"]:
            if col["id"] == column_id:
                return col["text"]
        return None
    
    def parse_item_to_ticket(self, item: Dict) -> Dict:
        """Convert Monday item to Ticket format"""
        return {
            "id": item["id"],
            "title": item["name"],
            "description": self._get_column_value(item, "description") or "",
            "status": self._map_status(self._get_column_value(item, "status")),
            "priority": self._map_priority(self._get_column_value(item, "priority")),
            "client_id": self._get_column_value(item, "portal_id"),
            "client_email": self._get_column_value(item, "client_email"),
            "created_at": item["created_at"],
            "updated_at": item["updated_at"],
        }
    
    def _map_status(self, monday_status: Optional[str]) -> str:
        """Map Monday status to app status"""
        mapping = {
            "Open": "open",
            "In Progress": "in_progress",
            "Resolved": "resolved",
            "Closed": "closed",
        }
        return mapping.get(monday_status, "open")
    
    def _map_priority(self, monday_priority: Optional[str]) -> str:
        """Map Monday priority to app priority"""
        mapping = {
            "Low": "low",
            "Medium": "medium",
            "High": "high",
            "Urgent": "urgent",
        }
        return mapping.get(monday_priority, "medium")
```

### 2. Tickets Router (`routers/tickets.py`)

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from monday.client import MondayClient
from auth.jwt import get_current_user
from schemas import Ticket, CreateTicketRequest

router = APIRouter(prefix="/tickets", tags=["tickets"])
monday_client = MondayClient()

@router.get("/{portal_id}", response_model=List[Ticket])
async def get_tickets(
    portal_id: str,
    current_user = Depends(get_current_user)
):
    """Get all tickets for a specific portal/client"""
    
    # Verify user owns this portal_id
    if current_user["portal_id"] != portal_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Fetch items from Monday
    items = await monday_client.get_board_items(
        board_id=settings.MONDAY_BOARD_ID,
        portal_id=portal_id
    )
    
    # Convert to Ticket format
    tickets = [monday_client.parse_item_to_ticket(item) for item in items]
    
    return tickets

@router.post("/ticket", response_model=Ticket)
async def create_ticket(
    ticket: CreateTicketRequest,
    current_user = Depends(get_current_user)
):
    """Create a new ticket in Monday board"""
    
    # Prepare column values for Monday
    column_values = {
        "description": ticket.description,
        "portal_id": current_user["portal_id"],
        "client_email": current_user["email"],
        "status": {"label": "Open"},
        "priority": {"label": ticket.priority.capitalize()},
    }
    
    # Create item in Monday
    monday_item = await monday_client.create_item(
        board_id=settings.MONDAY_BOARD_ID,
        item_name=ticket.title,
        column_values=column_values
    )
    
    # Return formatted ticket
    return {
        "id": monday_item["id"],
        "title": ticket.title,
        "description": ticket.description,
        "status": "open",
        "priority": ticket.priority,
        "client_id": current_user["portal_id"],
        "created_at": monday_item["created_at"],
        "updated_at": monday_item["created_at"],
    }
```

### 3. Authentication Router (`routers/auth.py`)

```python
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from jose import jwt
from typing import Dict
import secrets
from config import settings
from monday.client import MondayClient

router = APIRouter(prefix="/auth", tags=["auth"])
monday_client = MondayClient()

# In-memory storage for magic link tokens (use Redis in production)
magic_link_tokens = {}

@router.post("/send-magic-link")
async def send_magic_link(email: str):
    """Generate and send magic link to client"""
    
    # Find client in Monday board by email
    items = await monday_client.get_board_items(settings.MONDAY_BOARD_ID)
    
    client_item = None
    for item in items:
        if monday_client._get_column_value(item, "client_email") == email:
            client_item = item
            break
    
    if not client_item:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Generate secure token
    portal_id = monday_client._get_column_value(client_item, "portal_id")
    token = secrets.token_urlsafe(32)
    
    # Store token with expiration (1 hour)
    magic_link_tokens[f"{portal_id}:{token}"] = {
        "email": email,
        "portal_id": portal_id,
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }
    
    # Build magic link URL
    magic_link = f"{settings.MAGIC_LINK_URL}?portal_id={portal_id}&token={token}"
    
    # Send email (implement send_email function)
    await send_email(
        to=email,
        subject="Your REDSIS Portal Access Link",
        body=f"Click here to access your portal: {magic_link}"
    )
    
    return {"message": "Magic link sent"}

@router.get("/{portal_id}/{token}")
async def authenticate_magic_link(portal_id: str, token: str):
    """Exchange magic link token for JWT"""
    
    key = f"{portal_id}:{token}"
    
    if key not in magic_link_tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired link")
    
    token_data = magic_link_tokens[key]
    
    # Check expiration
    if datetime.utcnow() > token_data["expires_at"]:
        del magic_link_tokens[key]
        raise HTTPException(status_code=401, detail="Link expired")
    
    # Generate JWT
    jwt_payload = {
        "sub": token_data["email"],
        "portal_id": portal_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    
    access_token = jwt.encode(
        jwt_payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    # Clean up used token
    del magic_link_tokens[key]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "portal_id": portal_id
    }
```

---

## 🔄 Real-time Updates with Webhooks

### Step 1: Create Webhook in Monday.com

```python
# One-time setup script
async def setup_monday_webhook():
    mutation = """
    mutation CreateWebhook($boardId: ID!, $url: String!, $event: WebhookEventType!) {
      create_webhook(
        board_id: $boardId,
        url: $url,
        event: $event
      ) {
        id
      }
    }
    """
    
    # Create webhooks for different events
    events = ["create_item", "change_column_value", "create_update"]
    
    for event in events:
        await monday_client.execute_query(mutation, {
            "boardId": settings.MONDAY_BOARD_ID,
            "url": f"{settings.API_URL}/webhooks/monday",
            "event": event
        })
```

### Step 2: Webhook Endpoint

```python
# routers/webhooks.py
from fastapi import APIRouter, Request
from typing import Dict

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/monday")
async def monday_webhook(request: Request):
    """Receive and process Monday.com webhooks"""
    
    payload = await request.json()
    event_type = payload.get("event", {}).get("type")
    
    if event_type == "create_item":
        # New ticket created - notify via WebSocket
        await broadcast_update({
            "type": "ticket_created",
            "ticket_id": payload["event"]["pulseId"],
        })
    
    elif event_type == "change_column_value":
        # Ticket updated - notify via WebSocket
        await broadcast_update({
            "type": "ticket_updated",
            "ticket_id": payload["event"]["pulseId"],
        })
    
    return {"status": "received"}
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend

```bash
# On your server
git clone your-backend-repo
cd backend
pip install -r requirements.txt

# Set environment variables
export MONDAY_API_TOKEN="your_token"
export MONDAY_BOARD_ID="1234567890"
# ... other vars

# Run with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Step 2: Update Frontend Environment

```env
# client-portal/.env.production
NEXT_PUBLIC_API_URL=https://api.redsis.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.redsis.com
```

### Step 3: Deploy Frontend

```bash
cd client-portal
vercel --prod
```

---

## ✅ Testing Checklist

- [ ] Monday API token works
- [ ] Can fetch board items via GraphQL
- [ ] Can create items in Monday board
- [ ] Magic link generation works
- [ ] JWT authentication works
- [ ] Frontend can fetch tickets
- [ ] Frontend can create tickets
- [ ] Tickets appear in Monday board
- [ ] Updates in Monday sync to portal
- [ ] WebSocket real-time updates work

---

## 📚 Monday.com GraphQL Resources

- **API Documentation**: https://developer.monday.com/api-reference/docs
- **GraphQL Explorer**: https://monday.com/developers/v2/try-it-yourself
- **Community Forum**: https://community.monday.com/

---

## 🎯 Next Steps

1. ✅ **Set up Monday board** with proper columns
2. 🔨 **Build FastAPI backend** using code examples above
3. 🔌 **Test Monday API integration** locally
4. 📧 **Implement email service** for magic links
5. 🚀 **Deploy backend** to production
6. 🔄 **Set up webhooks** for real-time sync
7. ✅ **Test end-to-end** with real Monday data

---

**Need Help?** Check the Monday.com developer docs or reach out to support@redsis.com
