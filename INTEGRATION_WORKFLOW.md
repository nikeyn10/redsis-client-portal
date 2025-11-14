# 🔄 Complete Integration Workflow: Monday.com ↔️ Client Portal

This document shows the **complete flow** of how data moves between Monday.com, your backend, and the client portal.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT PORTAL                            │
│                    (Next.js Frontend)                        │
│  - Login page receives magic link                           │
│  - Dashboard shows tickets from Monday                      │
│  - Users create new tickets                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │ WebSocket (real-time)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                               │
│                   (FastAPI Server)                           │
│  - Authenticates users                                      │
│  - Fetches tickets from Monday                             │
│  - Creates tickets in Monday                               │
│  - Sends WebSocket updates                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ GraphQL API
                      │ Webhooks
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONDAY.COM                                │
│                 (Data Source)                                │
│  - Stores all ticket data in boards                        │
│  - Sends webhooks on updates                               │
│  - Team manages tickets                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Data Flow

### Flow 1: User Accesses Portal

```
1. Client receives email: "Access your support portal"
   
2. Email contains magic link:
   https://portal.redsis.com/login?portal_id=abc123&token=xyz789
   
3. User clicks link → Frontend loads login page
   
4. Frontend calls backend:
   GET /auth/abc123/xyz789
   
5. Backend validates token:
   - Checks token exists and not expired
   - Generates JWT token
   - Returns: { access_token: "jwt...", portal_id: "abc123" }
   
6. Frontend stores JWT in localStorage
   
7. Frontend redirects to /dashboard
```

### Flow 2: Dashboard Loads Tickets

```
1. Dashboard component mounts
   
2. Frontend calls backend:
   GET /tickets/abc123
   Headers: { Authorization: "Bearer jwt..." }
   
3. Backend verifies JWT:
   - Extracts portal_id from JWT
   - Validates portal_id matches request
   
4. Backend calls Monday.com GraphQL:
   query {
     boards(ids: ["1234567890"]) {
       items_page {
         items {
           id
           name
           column_values { id, text }
           created_at
           updated_at
         }
       }
     }
   }
   
5. Monday returns all board items:
   [
     {
       id: "item_123",
       name: "Website Login Issue",
       column_values: [
         { id: "description", text: "Can't log in..." },
         { id: "portal_id", text: "abc123" },
         { id: "status", text: "Open" },
         { id: "priority", text: "High" }
       ],
       created_at: "2024-10-06T10:00:00Z"
     },
     ...
   ]
   
6. Backend filters by portal_id:
   - Only returns items where column "portal_id" = "abc123"
   - Transforms Monday format to Ticket format
   
7. Backend returns to frontend:
   [
     {
       id: "item_123",
       title: "Website Login Issue",
       description: "Can't log in...",
       status: "open",
       priority: "high",
       client_id: "abc123",
       created_at: "2024-10-06T10:00:00Z",
       updated_at: "2024-10-06T10:00:00Z"
     }
   ]
   
8. Frontend displays tickets in TicketList component
```

### Flow 3: User Creates New Ticket

```
1. User clicks "New Ticket" button
   
2. Modal opens with NewTicketForm
   
3. User fills form:
   - Title: "Email not working"
   - Description: "I'm not receiving emails..."
   - Priority: "high"
   
4. User clicks "Create Ticket"
   
5. Frontend calls backend:
   POST /ticket
   Headers: { Authorization: "Bearer jwt..." }
   Body: {
     title: "Email not working",
     description: "I'm not receiving emails...",
     priority: "high"
   }
   
6. Backend verifies JWT and extracts user info:
   - email: "client@example.com"
   - portal_id: "abc123"
   
7. Backend calls Monday.com GraphQL:
   mutation {
     create_item(
       board_id: "1234567890",
       item_name: "Email not working",
       column_values: {
         description: "I'm not receiving emails...",
         portal_id: "abc123",
         client_email: "client@example.com",
         status: { label: "Open" },
         priority: { label: "High" }
       }
     ) {
       id
       name
       created_at
     }
   }
   
8. Monday creates item and returns:
   {
     id: "item_456",
     name: "Email not working",
     created_at: "2024-10-06T14:30:00Z"
   }
   
9. Backend returns to frontend:
   {
     id: "item_456",
     title: "Email not working",
     description: "I'm not receiving emails...",
     status: "open",
     priority: "high",
     client_id: "abc123",
     created_at: "2024-10-06T14:30:00Z",
     updated_at: "2024-10-06T14:30:00Z"
   }
   
10. Frontend adds ticket to list immediately (optimistic update)
    
11. Frontend closes modal
```

### Flow 4: Team Updates Ticket in Monday

```
1. Team member in Monday.com:
   - Opens ticket "Email not working"
   - Changes status from "Open" to "In Progress"
   - Adds internal note
   
2. Monday triggers webhook:
   POST https://api.redsis.com/webhooks/monday
   Body: {
     event: {
       type: "change_column_value",
       pulseId: "item_456",
       columnId: "status",
       value: { label: "In Progress" }
     }
   }
   
3. Backend receives webhook:
   - Parses event
   - Identifies ticket was updated
   
4. Backend broadcasts via WebSocket:
   {
     type: "ticket_updated",
     ticket_id: "item_456",
     portal_id: "abc123"
   }
   
5. Frontend receives WebSocket message:
   - Refreshes ticket list
   - Shows toast notification: "Ticket updated"
   
6. User sees updated status in real-time
```

---

## 🔐 Authentication Flow Detail

### Magic Link Generation

```python
# Backend generates magic link
portal_id = "client_abc123"  # Unique per client
token = secrets.token_urlsafe(32)  # Random secure token

# Store temporarily
magic_links[f"{portal_id}:{token}"] = {
    "email": "client@example.com",
    "expires_at": datetime.now() + timedelta(hours=1)
}

# Send email with link
magic_link = f"https://portal.redsis.com/login?portal_id={portal_id}&token={token}"
```

### JWT Token Exchange

```python
# Frontend calls: GET /auth/{portal_id}/{token}

# Backend validates
if magic_link_exists and not_expired:
    # Generate JWT
    jwt_payload = {
        "sub": "client@example.com",
        "portal_id": "client_abc123",
        "exp": datetime.now() + timedelta(hours=24)
    }
    
    jwt_token = jwt.encode(jwt_payload, SECRET_KEY)
    
    # Return to frontend
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "portal_id": "client_abc123"
    }
```

### Subsequent Requests

```python
# Frontend includes JWT in all requests
Headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}

# Backend validates JWT
payload = jwt.decode(token, SECRET_KEY)
# payload = { "sub": "client@example.com", "portal_id": "client_abc123", ... }

# Use portal_id to filter data
tickets = get_monday_items(portal_id="client_abc123")
```

---

## 📊 Monday.com Board Structure

### Required Columns

| Column ID       | Column Name      | Type      | Values                                    |
|-----------------|------------------|-----------|-------------------------------------------|
| `name`          | Ticket           | Item Name | (Auto - ticket title)                     |
| `description`   | Description      | Long Text | Full ticket details                       |
| `portal_id`     | Portal ID        | Text      | `client_abc123` (identifies client)       |
| `client_email`  | Client Email     | Email     | `client@example.com`                      |
| `status`        | Status           | Status    | Open, In Progress, Resolved, Closed       |
| `priority`      | Priority         | Status    | Low, Medium, High, Urgent                 |
| `created_at`    | Created          | Date      | (Auto)                                    |
| `updated_at`    | Last Updated     | Date      | (Auto)                                    |

### Example Board Item

```json
{
  "id": "item_123",
  "name": "Website Login Issue",
  "column_values": [
    {
      "id": "description",
      "text": "Unable to log into the website using my credentials. Getting 'invalid password' error even though password is correct.",
      "value": "\"Unable to log into...\""
    },
    {
      "id": "portal_id",
      "text": "client_abc123",
      "value": "\"client_abc123\""
    },
    {
      "id": "client_email",
      "text": "john@company.com",
      "value": "{\"email\":\"john@company.com\"}"
    },
    {
      "id": "status",
      "text": "Open",
      "value": "{\"index\":0,\"label\":\"Open\"}"
    },
    {
      "id": "priority",
      "text": "High",
      "value": "{\"index\":2,\"label\":\"High\"}"
    }
  ],
  "created_at": "2024-10-06T10:00:00Z",
  "updated_at": "2024-10-06T10:00:00Z"
}
```

---

## 🔄 Real-Time Updates

### WebSocket Connection

```typescript
// Frontend establishes WebSocket
const ws = new WebSocket('ws://api.redsis.com/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  if (update.type === 'ticket_updated') {
    // Refresh ticket list
    fetchTickets();
  }
};
```

### Backend Broadcasting

```python
# When webhook received from Monday
@app.post("/webhooks/monday")
async def monday_webhook(event: WebhookEvent):
    # Parse event
    ticket_id = event.pulseId
    portal_id = await get_portal_id_for_ticket(ticket_id)
    
    # Broadcast to connected clients
    await websocket_manager.broadcast(portal_id, {
        "type": "ticket_updated",
        "ticket_id": ticket_id
    })
```

---

## 📝 Data Mapping

### Monday → Frontend

```python
def monday_item_to_ticket(item):
    return {
        "id": item["id"],
        "title": item["name"],
        "description": get_column_value(item, "description"),
        "status": map_status(get_column_value(item, "status")),
        "priority": map_priority(get_column_value(item, "priority")),
        "client_id": get_column_value(item, "portal_id"),
        "created_at": item["created_at"],
        "updated_at": item["updated_at"]
    }

def map_status(monday_status):
    return {
        "Open": "open",
        "In Progress": "in_progress",
        "Resolved": "resolved",
        "Closed": "closed"
    }.get(monday_status, "open")
```

### Frontend → Monday

```python
def ticket_to_monday_columns(ticket):
    return {
        "description": ticket.description,
        "portal_id": current_user.portal_id,
        "client_email": current_user.email,
        "status": {"label": "Open"},
        "priority": {"label": ticket.priority.capitalize()}
    }
```

---

## ✅ Complete Setup Checklist

### Monday.com Setup
- [ ] Create "Client Support Tickets" board
- [ ] Add all required columns (description, portal_id, status, priority, etc.)
- [ ] Configure status labels (Open, In Progress, Resolved, Closed)
- [ ] Configure priority labels (Low, Medium, High, Urgent)
- [ ] Get API token from Monday.com
- [ ] Note board ID from URL

### Backend Setup
- [ ] Create FastAPI project
- [ ] Install dependencies (fastapi, uvicorn, httpx, jose, etc.)
- [ ] Create `.env` with Monday API token and board ID
- [ ] Implement Monday GraphQL client
- [ ] Create auth endpoints (magic link, JWT)
- [ ] Create ticket endpoints (list, create)
- [ ] Test API with Postman/curl
- [ ] Deploy to production server

### Frontend Setup (Already Done!)
- [ ] ✅ Next.js app created
- [ ] ✅ All components built
- [ ] ✅ API client configured
- [ ] Update `.env.local` with backend URL
- [ ] Test in development
- [ ] Deploy to Vercel

### Integration Testing
- [ ] Generate magic link via API
- [ ] Click magic link and verify login
- [ ] View tickets from Monday board
- [ ] Create new ticket via portal
- [ ] Verify ticket appears in Monday
- [ ] Update ticket in Monday
- [ ] Verify update shows in portal (may need refresh)
- [ ] Set up webhooks for real-time updates

---

## 🎯 Summary

Your REDSIS Client Portal is **already 100% built** on the frontend! To connect it to Monday.com:

1. **Set up Monday board** with proper columns (15 minutes)
2. **Build FastAPI backend** using provided code (2-4 hours)
3. **Test integration** locally (30 minutes)
4. **Deploy both** to production (1 hour)

**Total time: ~4-6 hours** to have a fully functional portal pulling data from Monday.com!

---

**Questions?** Check the Monday.com API docs or reach out for support!
