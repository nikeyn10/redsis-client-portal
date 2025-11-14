# 📱 Monday.com Embedded App Integration Guide

## Overview

This guide explains how to build the REDSIS Client Portal as a **Monday.com embedded app** that lives inside Monday boards. The board itself manages users and clients - no separate authentication system needed.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Monday.com                         │
│  ┌──────────────────────────────────────────┐       │
│  │         Support Tickets Board            │       │
│  │  ┌────────────────────────────────┐      │       │
│  │  │ Item View (ticket clicked)     │      │       │
│  │  │  ┌──────────────────────┐      │      │       │
│  │  │  │   Your React App     │      │      │       │
│  │  │  │   (iframe embedded)  │      │      │       │
│  │  │  └──────────────────────┘      │      │       │
│  │  └────────────────────────────────┘      │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
         ↓ Monday SDK
    ┌────────────────┐
    │ Your Next.js   │
    │ Frontend       │
    └────────────────┘
         ↓ API Calls
    ┌────────────────┐
    │ Backend API    │
    │ (Optional)     │
    └────────────────┘
         ↓ GraphQL
    ┌────────────────┐
    │ Monday.com API │
    └────────────────┘
```

## Key Differences from Standalone Portal

| Standalone Portal | Monday Embedded App |
|-------------------|---------------------|
| Custom authentication (magic links) | Monday handles auth via session tokens |
| Own user database | Users come from board context |
| Separate ticket storage | Tickets ARE board items |
| Deployed independently | Embedded in Monday iframe |
| Direct access via URL | Access via Monday board/item views |

## Step 1: Install Monday SDK

```bash
cd client-portal
npm install monday-sdk-js
```

## Step 2: Create Monday App Manifest

Create `monday-app.json`:

```json
{
  "name": "REDSIS Client Portal",
  "description": "Client support ticket portal embedded in Monday.com",
  "version": "1.0.0",
  "icon": "https://your-domain.com/app-icon.png",
  "permissions": [
    "boards:read",
    "boards:write",
    "account:read",
    "me:read"
  ],
  "features": [
    {
      "type": "ItemView",
      "name": "Ticket Details",
      "url": "https://your-app.vercel.app/embed/ticket",
      "description": "View and manage ticket details"
    },
    {
      "type": "BoardView",
      "name": "Client Dashboard",
      "url": "https://your-app.vercel.app/embed/dashboard",
      "description": "Overview of all client tickets"
    }
  ],
  "settings": {
    "fields": [
      {
        "key": "api_endpoint",
        "type": "text",
        "name": "API Endpoint",
        "description": "Your backend API URL (optional)",
        "default": ""
      }
    ]
  }
}
```

## Step 3: Update Frontend to Use Monday SDK

### Create Monday Context Hook

Create `lib/monday-context.ts`:

```typescript
import mondaySdk from 'monday-sdk-js';
import { useEffect, useState } from 'react';

const monday = mondaySdk();

export interface MondayContext {
  user?: {
    id: number;
    name: string;
    email: string;
    isAdmin: boolean;
  };
  board?: {
    id: number;
    name: string;
  };
  item?: {
    id: number;
    name: string;
  };
  account?: {
    id: number;
    name: string;
  };
}

export function useMondayContext() {
  const [context, setContext] = useState<MondayContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monday.listen('context', (res) => {
      setContext(res.data);
      setLoading(false);
    });

    // Request context on mount
    monday.get('context');
  }, []);

  return { context, loading, monday };
}

export { monday };
```

### Update API Client to Use Monday Session

Update `lib/api/client.ts`:

```typescript
import axios from 'axios';
import { monday } from '../monday-context';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Monday session token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    // Get session token from Monday
    const sessionToken = await monday.get('sessionToken');
    
    if (sessionToken?.data) {
      config.headers.Authorization = `Bearer ${sessionToken.data}`;
    }
  } catch (error) {
    console.error('Failed to get Monday session token:', error);
  }
  
  return config;
});

export default apiClient;
```

## Step 4: Create Embedded Views

### Ticket Item View

Create `app/embed/ticket/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import TicketDetail from '@/components/TicketDetail';
import Loader from '@/components/ui/Loader';

export default function EmbeddedTicketView() {
  const { context, loading, monday } = useMondayContext();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    if (!context?.item?.id) return;

    // Fetch ticket data from Monday board item
    const fetchTicket = async () => {
      const query = `
        query GetItem($itemId: ID!) {
          items(ids: [$itemId]) {
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
      `;

      const response = await monday.api(query, {
        variables: { itemId: context.item.id }
      });

      const item = response.data.items[0];
      
      // Transform Monday item to ticket format
      const columnValues = item.column_values.reduce((acc, col) => {
        acc[col.id] = col.text;
        return acc;
      }, {});

      setTicket({
        id: item.id,
        title: item.name,
        description: columnValues.description || '',
        status: mapStatus(columnValues.status),
        priority: mapPriority(columnValues.priority),
        client_email: columnValues.client_email || context.user?.email,
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    };

    fetchTicket();
  }, [context, monday]);

  if (loading) return <Loader />;
  if (!ticket) return <div>Loading ticket...</div>;

  return (
    <div className="p-4">
      <TicketDetail ticket={ticket} />
    </div>
  );
}

function mapStatus(mondayStatus: string): string {
  const mapping = {
    'Open': 'open',
    'In Progress': 'in_progress',
    'Resolved': 'resolved',
    'Closed': 'closed',
  };
  return mapping[mondayStatus] || 'open';
}

function mapPriority(mondayPriority: string): string {
  const mapping = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Urgent': 'urgent',
  };
  return mapping[mondayPriority] || 'medium';
}
```

### Board Dashboard View

Create `app/embed/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import TicketList from '@/components/TicketList';
import NewTicketForm from '@/components/NewTicketForm';
import Loader from '@/components/ui/Loader';

export default function EmbeddedDashboard() {
  const { context, loading, monday } = useMondayContext();
  const [tickets, setTickets] = useState([]);
  const [showNewTicket, setShowNewTicket] = useState(false);

  useEffect(() => {
    if (!context?.board?.id) return;

    fetchTickets();
  }, [context, monday]);

  const fetchTickets = async () => {
    const query = `
      query GetBoardItems($boardId: ID!) {
        boards(ids: [$boardId]) {
          items_page {
            items {
              id
              name
              column_values {
                id
                text
              }
              created_at
              updated_at
            }
          }
        }
      }
    `;

    const response = await monday.api(query, {
      variables: { boardId: context.board.id }
    });

    const items = response.data.boards[0].items_page.items;
    
    const transformedTickets = items.map(item => {
      const cols = item.column_values.reduce((acc, col) => {
        acc[col.id] = col.text;
        return acc;
      }, {});

      return {
        id: item.id,
        title: item.name,
        description: cols.description || '',
        status: cols.status || 'open',
        priority: cols.priority || 'medium',
        client_email: cols.client_email || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    setTickets(transformedTickets);
  };

  const handleCreateTicket = async (ticketData: any) => {
    const mutation = `
      mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item(
          board_id: $boardId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
        }
      }
    `;

    await monday.api(mutation, {
      variables: {
        boardId: context.board.id,
        itemName: ticketData.title,
        columnValues: JSON.stringify({
          description: ticketData.description,
          priority: { label: ticketData.priority },
          status: { label: 'Open' },
          client_email: context.user?.email || '',
        })
      }
    });

    // Refresh tickets
    fetchTickets();
    setShowNewTicket(false);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Support Tickets</h1>
        <button
          onClick={() => setShowNewTicket(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          New Ticket
        </button>
      </div>

      <TicketList tickets={tickets} />

      {showNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <NewTicketForm
              onSubmit={handleCreateTicket}
              onCancel={() => setShowNewTicket(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Step 5: Board Setup

### Required Columns

Your Monday board should have these columns:

| Column Name | Column ID | Type | Values |
|-------------|-----------|------|--------|
| Item Name | - | Text | Ticket title |
| Description | `description` | Long Text | Ticket details |
| Status | `status` | Status | Open, In Progress, Resolved, Closed |
| Priority | `priority` | Status | Low, Medium, High, Urgent |
| Client Email | `client_email` | Email | Auto-filled from user |
| Portal ID | `portal_id` | Text | Optional - for tracking |
| Created Date | - | Date | Auto |

### Board Configuration

1. Go to Monday.com
2. Create board: "Support Tickets"
3. Add the columns above
4. Set permissions:
   - Team members can see all tickets
   - Clients only see their own tickets (via board permissions)

## Step 6: User Management via Monday

### How It Works

- **Authentication**: Monday handles login/SSO
- **User Identity**: Comes from `monday.get('context')` 
- **Permissions**: Managed via Monday board sharing
- **Client Filtering**: Filter items by `client_email` matching logged-in user

### Example: Client-Specific View

```typescript
// In your embedded view
const { context } = useMondayContext();
const userEmail = context?.user?.email;

// Filter tickets for this client
const clientTickets = allTickets.filter(
  ticket => ticket.client_email === userEmail
);
```

## Step 7: Deploy and Register App

### 1. Deploy to Vercel

```bash
cd client-portal
vercel --prod
```

Note your deployment URL: `https://your-app.vercel.app`

### 2. Register App in Monday

1. Go to Monday.com → Apps Marketplace → Build Apps
2. Click "Create App"
3. Fill in app details:
   - Name: REDSIS Client Portal
   - Description: Support ticket management
   - Upload icon
4. Add Features:
   - **Item View**: `https://your-app.vercel.app/embed/ticket`
   - **Board View**: `https://your-app.vercel.app/embed/dashboard`
5. Set permissions: `boards:read`, `boards:write`, `me:read`
6. Save and publish

### 3. Install App to Board

1. Open your "Support Tickets" board
2. Click "Integrate" → "Apps"
3. Find your app → Install
4. Your embedded views now appear in the board!

## Backend Architecture (Optional)

For this embedded app approach, you might not need a backend at all! The frontend can communicate directly with Monday's API using the SDK.

However, if you want a backend for:
- Complex business logic
- Integration with other services
- Analytics/reporting

Use this simplified version:

```python
# main.py - Minimal backend for Monday App

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONDAY_API_URL = "https://api.monday.com/v2"

async def verify_monday_token(authorization: str = Header(None)):
    """Verify Monday session token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    
    token = authorization.split(" ")[1]
    
    # Verify with Monday API
    async with httpx.AsyncClient() as client:
        response = await client.post(
            MONDAY_API_URL,
            headers={"Authorization": token},
            json={"query": "{ me { id email } }"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Monday token")
        
        return response.json()

@app.get("/")
async def root():
    return {"status": "ok", "app": "REDSIS Monday App Backend"}

@app.post("/proxy/monday")
async def proxy_to_monday(
    query: dict,
    auth = Header(None)
):
    """Proxy GraphQL queries to Monday API"""
    user = await verify_monday_token(auth)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            MONDAY_API_URL,
            headers={"Authorization": auth.split(" ")[1]},
            json=query
        )
        return response.json()
```

## Testing Your Embedded App

### Local Testing

Monday provides a way to test embedded apps locally:

1. Install ngrok: `npm install -g ngrok`
2. Run your Next.js app: `npm run dev`
3. Create tunnel: `ngrok http 3000`
4. Use the ngrok URL in Monday app settings
5. Install app to a test board

### Production Testing

1. Deploy to Vercel
2. Update Monday app URLs
3. Install to production board
4. Test with real users

## Security Considerations

1. **Session Tokens**: Always verify Monday session tokens on the backend
2. **CORS**: Restrict to Monday.com domains and your app domain
3. **Data Access**: Use Monday's permission system to control who sees what
4. **API Rate Limits**: Monday has rate limits - cache data when possible

## Common Patterns

### Pattern 1: Client-Specific Dashboard

```typescript
// Filter tickets by logged-in user
const clientTickets = tickets.filter(
  t => t.column_values.client_email === context.user.email
);
```

### Pattern 2: Admin vs Client Views

```typescript
if (context.user.isAdmin) {
  // Show all tickets
  return <AdminDashboard tickets={allTickets} />;
} else {
  // Show only user's tickets
  return <ClientDashboard tickets={clientTickets} />;
}
```

### Pattern 3: Real-time Updates

```typescript
// Listen for board updates
monday.listen('events', (res) => {
  if (res.type === 'new_items') {
    fetchTickets(); // Refresh
  }
});
```

## Migration from Standalone to Embedded

If you've built the standalone version, here's how to adapt:

1. **Remove auth system** - Delete magic link code, JWT handling
2. **Add Monday SDK** - Install and initialize `monday-sdk-js`
3. **Replace API client** - Use Monday session tokens instead of custom JWT
4. **Update data fetching** - Use Monday API directly instead of custom backend
5. **Create embed routes** - New routes under `/embed/*`
6. **Update navigation** - Use Monday's navigation instead of custom nav

## Next Steps

1. ✅ Install Monday SDK: `npm install monday-sdk-js`
2. ✅ Create Monday context hook
3. ✅ Build embedded views (`/embed/ticket`, `/embed/dashboard`)
4. ✅ Set up board with required columns
5. ✅ Deploy to Vercel
6. ✅ Register app in Monday Developer Portal
7. ✅ Install app to board
8. ✅ Test with real users

---

**Resources:**
- Monday Apps SDK: https://developer.monday.com/apps/docs/introduction
- Apps Framework: https://developer.monday.com/apps/docs/quickstart-react
- API Reference: https://developer.monday.com/api-reference/docs
