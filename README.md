Client Portal for Monday.com

A comprehensive client support portal powered entirely by monday.com infrastructure - offering both **standalone guest access** and **embedded monday.com app** functionality.

## 🎯 Overview

This project provides a **Gorilla Client Portal**-like experience for monday.com users:

- **Standalone Client Portal**: External clients access tickets via magic links (NO monday account required)
- **Embedded Monday App**: Views inside monday.com boards, dashboards, and settings
- **Monday Code Backend**: Serverless functions hosted on monday's infrastructure
- **Monday Storage**: All data persisted using monday boards & storage API

### Key Features

✅ Magic link authentication (no passwords)
✅ Client-specific ticket views
✅ File upload/download via monday assets
✅ Two-way comments (clients ↔ internal team)
✅ Email notifications on updates
✅ Multi-board support per client/company
✅ White-label branding configuration
✅ Real-time status tracking
✅ Embedded views in monday.com

---

## 📁 Project Structure

```
monday-vibe-project/
├── apps/
│   ├── client-portal/          # Standalone Next.js portal
│   ├── monday-app/             # Embedded monday.com app
│   └── backend/                # Monday code functions
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── monday-sdk/             # Monday API wrappers
│   └── ui/                     # Shared UI components
│
├── package.json                # Monorepo workspace config
└── GORILLA_IMPLEMENTATION_PLAN.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Monday.com account
- Monday Apps CLI: `npm install -g @mondaycom/apps-cli`

### Installation

```bash
# Clone the repository
git clone <your-repo>
cd monday-vibe-project

# Install all dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### Development

```bash
# Run client portal
npm run dev:portal

# Run monday app (embedded views)
npm run dev:monday-app

# Build backend functions
npm run build:backend
```

---

## 📦 Workspace Packages

### @portal/types

Comprehensive TypeScript definitions for:
- Client, Company, Ticket, Comment, File entities
- Authentication & JWT types
- Monday.com specific types (Context, Webhooks, GraphQL)
- API request/response types

### @portal/monday-sdk

Unified SDK for monday.com operations:
- **GraphQL**: Items, boards, updates, files, users
- **Storage**: Key-value storage via monday API
- **Context**: Access monday context in embedded views
- **Webhooks**: Parse and handle webhook events
- **Files**: Upload/download file helpers

### @portal/ui (Planned)

Shared React components:
- Buttons, Cards, Forms, Tables
- Loading & error states
- Branded component variants

---

## 🏗️ Apps

### Client Portal (`apps/client-portal`)

**Standalone Next.js Application**

External clients access via magic link:
```
https://portal.yourcompany.com/auth/magic?token=abc123...
```

**Routes:**
- `/auth/magic` - Magic link verification
- `/dashboard` - Client dashboard
- `/tickets` - Ticket list
- `/tickets/[id]` - Ticket detail
- `/tickets/new` - Create ticket

**Features:**
- Magic link authentication
- JWT-based sessions
- Ticket CRUD operations
- File upload/download
- Comments system
- Branded UI per company

### Monday App (`apps/monday-app`)

**Embedded Monday.com Views**

Runs inside monday.com iframe:

**Board View:**
```
https://monday-app.yourcompany.com/board-view
```
Display client portal link, generate magic links

**Dashboard Widget:**
```
https://monday-app.yourcompany.com/dashboard
```
Ticket statistics, recent activity

**Item View:**
```
https://monday-app.yourcompany.com/item-view
```
Client details, ticket history

**Account Settings:**
```
https://monday-app.yourcompany.com/settings
```
Portal configuration, branding, board mappings

### Backend (`apps/backend`)

**Monday Code Serverless Functions**

Hosted on monday.com infrastructure:

**Functions:**
- `generate-magic-link` - Create secure magic links
- `verify-magic-link` - Exchange token for JWT
- `webhook-handler` - Process monday events
- `get-tickets` - Retrieve client tickets
- `create-ticket` - Create new ticket
- `upload-file` - Handle file uploads
- `send-notification` - Email notifications

---

## 🗄️ Monday Board Structure

### Clients Board

```
Board: "Portal Clients"
Columns:
├── Name (Text) - Client full name
├── Email (Email) - Login email
├── Company (Connect Boards) → Companies Board
├── Status (Status) - Active/Inactive
├── Magic Link Token (Text) - Current token (hidden)
├── Last Login (Date)
└── Created Date (Date)
```

### Companies Board

```
Board: "Portal Companies"
Columns:
├── Name (Text) - Company name
├── Logo URL (Link) - Company logo
├── Primary Color (Text) - Hex color code
├── Board IDs (Long Text) - JSON array of ticket board IDs
├── Status (Status) - Active/Inactive
└── Created Date (Date)
```

### Tickets Board(s)

```
Board: "Support Tickets" (can have multiple per company)
Columns:
├── Name (Text) - Ticket title
├── Description (Long Text)
├── Client (Connect Boards) → Clients Board
├── Status (Status) - Open/In Progress/Waiting/Resolved/Closed
├── Priority (Status) - Low/Medium/High/Urgent
├── Assigned To (Person)
├── Files (File)
├── Created Date (Date)
└── Resolved Date (Date)
```

---

## ⚙️ Configuration

### Environment Variables

**Backend (Monday Code):**
```bash
MONDAY_API_TOKEN=your_api_token
MONDAY_SIGNING_SECRET=your_webhook_secret
JWT_SECRET=your_jwt_secret
PORTAL_BASE_URL=https://portal.yourcompany.com
SENDGRID_API_KEY=your_sendgrid_key
```

**Client Portal:**
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-monday-code-url.com
NEXT_PUBLIC_PORTAL_NAME=Your Company Portal
```

**Monday App:**
```bash
NEXT_PUBLIC_MONDAY_APP_ID=your_app_id
```

### Monday App Manifest

Update `monday-app.json`:

```json
{
  "name": "Your Portal Name",
  "permissions": [
    "boards:read",
    "boards:write",
    "account:read",
    "me:read"
  ],
  "features": [
    {
      "type": "BoardView",
      "url": "https://your-app-url.com/board-view"
    }
  ]
}
```

---

## 🚢 Deployment

### Backend to Monday Code

```bash
# Login to monday CLI
mapps auth:login

# Deploy backend functions
cd apps/backend
npm run deploy
```

### Client Portal to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy portal
cd apps/client-portal
vercel --prod
```

### Monday App

```bash
# Deploy monday app
cd apps/monday-app
mapps app:push
```

---

## 🔐 Authentication Flow

### Magic Link Generation

1. Admin clicks "Generate Magic Link" in monday
2. Backend function creates secure token
3. Token stored in monday storage with client mapping
4. Magic link sent via email: `https://portal.com/auth/magic?token=...`

### Client Authentication

1. Client clicks magic link
2. Token verified against monday storage
3. JWT issued for client session
4. Token stored in localStorage
5. Client redirected to dashboard

### JWT Structure

```json
{
  "sub": "123456",        // Client ID
  "email": "client@example.com",
  "company_id": "789",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## 📧 Email Notifications

### Webhook → Notification Flow

1. Monday board event (status change, new comment, etc.)
2. Webhook sent to backend function
3. Function determines if client notification needed
4. Email template populated with ticket data
5. Email sent via SendGrid/SES
6. Client receives notification

### Email Templates

- **Magic Link**: Welcome email with portal access
- **Ticket Created**: Confirmation of new ticket
- **Status Changed**: Update on ticket progress
- **New Comment**: Internal team response notification
- **File Uploaded**: New file attachment notification

---

## 🎨 Branding & White-Label

### Configuration Storage

Branding stored in monday storage per company:

```json
{
  "company_id": "123",
  "logo_url": "https://...",
  "primary_color": "#0073ea",
  "secondary_color": "#ffffff",
  "portal_name": "Acme Support Portal"
}
```

### Dynamic Theming

Portal reads configuration on load and applies:
- Logo in header
- Color scheme (CSS variables)
- Custom portal name
- Favicon

---

## 🧪 Testing

### Unit Tests

```bash
# Test shared packages
npm test --workspace=packages/types
npm test --workspace=packages/monday-sdk
```

### Integration Tests

```bash
# Test backend functions
npm test --workspace=apps/backend
```

### E2E Tests

```bash
# Test client portal
cd apps/client-portal
npm run test:e2e
```

---

## 📚 API Documentation

### Backend Functions

#### Generate Magic Link

```http
POST /generate-magic-link
Authorization: Bearer <monday-api-token>

{
  "clientId": "123456",
  "email": "client@example.com",
  "expiresInHours": 24
}

Response:
{
  "success": true,
  "data": {
    "magic_link": "https://portal.com/auth/magic?token=...",
    "expires_at": "2025-11-14T12:00:00Z"
  }
}
```

#### Verify Magic Link

```http
POST /verify-magic-link

{
  "token": "abc123..."
}

Response:
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "token_type": "Bearer",
    "client_id": "123456",
    "email": "client@example.com",
    "expires_in": 86400
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

**Magic link not working:**
- Check token hasn't expired
- Verify monday storage connection
- Check JWT_SECRET environment variable

**Files not uploading:**
- Verify monday API token has file permissions
- Check file size limits
- Verify file column exists on board

**Webhooks not triggering:**
- Verify webhook URL is correct
- Check MONDAY_SIGNING_SECRET
- Ensure webhook events are configured

---

## 🛣️ Roadmap

See [GORILLA_IMPLEMENTATION_PLAN.md](./GORILLA_IMPLEMENTATION_PLAN.md) for detailed roadmap.

### Current Status

- ✅ Phase 1: Architecture & Foundation
- 🚧 Phase 2: Backend Completion
- 📋 Phase 3: Client Portal Refactoring
- 📋 Phase 4: Embedded Monday App
- 📋 Phase 5: Advanced Features
- 📋 Phase 6: Deployment & Marketplace

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

[Your License Here]

---

## 🆘 Support

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues]
- **Email**: support@yourcompany.com

---

## 🙏 Acknowledgments

- Inspired by Gorilla Client Portal
- Built on monday.com platform
- Powered by Next.js and TypeScript

---

**Built with ❤️ for monday.com**
