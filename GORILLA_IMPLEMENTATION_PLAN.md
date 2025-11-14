# GORILLA PORTAL IMPLEMENTATION PLAN
## Complete Transformation Roadmap

**Status**: ✅ Phase 1 Complete - Architecture & Foundation
**Next**: Phase 2 - Backend Functions & Portal Refactoring

---

## 📋 OVERVIEW

This document tracks the transformation of the REDSIS Client Portal into a **Gorilla-style Client Portal** powered entirely by monday.com infrastructure.

### What We're Building

1. **Standalone Client Portal** - External clients access via magic links (NO monday login)
2. **Embedded Monday App** - Views inside monday.com (board view, dashboard widget, settings)
3. **Monday Code Backend** - Serverless functions on monday infrastructure
4. **Monday Storage** - All data persisted in monday boards & storage API

---

## ✅ PHASE 1: ARCHITECTURE & FOUNDATION (COMPLETED)

### 1.1 Monorepo Structure ✅
- [x] Root package.json with workspaces
- [x] `apps/` directory for applications
- [x] `packages/` directory for shared code

### 1.2 Shared Packages ✅

**@portal/types** ✅
- Comprehensive TypeScript types for all entities
- Client, Company, Ticket, Comment, File types
- Monday-specific types (Context, Webhook, etc.)
- Storage key constants

**@portal/monday-sdk** ✅
- GraphQL wrapper (`graphql.ts`)
  - Board & item operations
  - Updates/comments management
  - File/asset handling
  - User operations
- Storage wrapper (`storage.ts`)
  - Key-value storage via monday API
  - Magic link management
  - Portal configuration
  - Client/company mappings
- Context utilities (`context.ts`)
  - Monday SDK context access
  - Session token retrieval
  - Settings management
  - Notifications & dialogs
- Webhook utilities (`webhooks.ts`)
  - Payload parsing
  - Signature verification
  - Event type detection
- File utilities (`files.ts`)
  - Upload/download helpers
  - File validation
  - MIME type detection

### 1.3 Backend Foundation ✅

**Monday Code Functions** ✅
- `generate-magic-link.ts` - Creates secure magic links
- `verify-magic-link.ts` - Exchanges tokens for JWTs
- `webhook-handler.ts` - Processes monday events

**Configuration** ✅
- package.json with dependencies
- TypeScript configuration
- README with deployment instructions

---

## 🚧 PHASE 2: BACKEND COMPLETION (IN PROGRESS)

### 2.1 Remaining Backend Functions

**Files & Assets** 🔲
- [ ] `upload-file.ts` - Handle client file uploads
- [ ] `get-file-url.ts` - Generate secure download URLs
- [ ] Integrate with monday assets API

**Ticket Operations** 🔲
- [ ] `get-tickets.ts` - Retrieve tickets for client
- [ ] `create-ticket.ts` - Create new ticket
- [ ] `update-ticket.ts` - Update ticket details
- [ ] Multi-board support

**Notifications** 🔲
- [ ] `send-notification.ts` - Email notifications
- [ ] SendGrid/SES integration
- [ ] Email templates
- [ ] Notification preferences

**Comments** 🔲
- [ ] `get-comments.ts` - Retrieve ticket comments
- [ ] `create-comment.ts` - Add comment to ticket
- [ ] Internal vs. client comments

### 2.2 Authentication & Authorization

**JWT Handling** 🔲
- [ ] Token generation
- [ ] Token validation middleware
- [ ] Refresh token mechanism
- [ ] Client-to-company mapping

**Security** 🔲
- [ ] Webhook signature verification
- [ ] Rate limiting
- [ ] Input validation
- [ ] XSS/CSRF protection

---

## 🎯 PHASE 3: CLIENT PORTAL REFACTORING

### 3.1 Move & Update Client Portal

**File Organization** 🔲
- [ ] Move `/client-portal/` to `/apps/client-portal/`
- [ ] Update package.json dependencies
- [ ] Reference `@portal/*` packages

**Authentication Refactor** 🔲
- [ ] Replace FastAPI client with monday-code backend
- [ ] Update auth flow to use magic links
- [ ] Remove demo mode (or keep for development)
- [ ] Implement JWT storage & refresh

**API Client Update** 🔲
- [ ] Replace axios client with monday-code functions
- [ ] Update endpoints to monday-code URLs
- [ ] Error handling & retry logic
- [ ] Loading states

### 3.2 Portal Features

**Magic Link Flow** 🔲
- [ ] `/auth/magic` - Magic link landing page
- [ ] Token verification
- [ ] JWT storage
- [ ] Redirect to dashboard

**Tickets** 🔲
- [ ] List view with filtering
- [ ] Detail view with full information
- [ ] Create new ticket form
- [ ] Status indicators
- [ ] Priority badges

**Files** 🔲
- [ ] File upload component
- [ ] File list with download
- [ ] Drag & drop support
- [ ] File type validation
- [ ] Size limits

**Comments** 🔲
- [ ] Comment list component
- [ ] Add comment form
- [ ] Real-time updates (optional)
- [ ] Rich text support (optional)

**Branding** 🔲
- [ ] Fetch config from monday storage
- [ ] Dynamic logo
- [ ] Dynamic colors
- [ ] Company-specific styling

### 3.3 UI Components

**Shared Components** 🔲
- [ ] Move UI components to `@portal/ui` package
- [ ] Button, Card, Badge, Table, etc.
- [ ] Form components
- [ ] Loading states
- [ ] Error states

---

## 🖥️ PHASE 4: EMBEDDED MONDAY APP

### 4.1 Monday App Structure

**New App Directory** 🔲
- [ ] Create `/apps/monday-app/`
- [ ] Next.js configuration
- [ ] Monday SDK integration
- [ ] Shared components from `@portal/ui`

### 4.2 Views

**Board View** 🔲
- [ ] Display client portal link
- [ ] Quick ticket overview
- [ ] Generate magic link button
- [ ] Copy link functionality

**Dashboard Widget** 🔲
- [ ] Ticket statistics
- [ ] Recent activity
- [ ] Client list
- [ ] Quick actions

**Item View** 🔲
- [ ] Client details
- [ ] Associated tickets
- [ ] Generate/send magic link
- [ ] Activity log

**Account Settings** 🔲
- [ ] Portal configuration
- [ ] Branding settings
- [ ] Board mappings
- [ ] Notification settings

### 4.3 Monday Integration

**Context Handling** 🔲
- [ ] Extract user context
- [ ] Extract board/item context
- [ ] Handle theme changes
- [ ] Settings persistence

**GraphQL Operations** 🔲
- [ ] Query tickets from boards
- [ ] Create items
- [ ] Update statuses
- [ ] File attachments

---

## 📊 PHASE 5: ADVANCED FEATURES

### 5.1 Multi-Board Support

**Configuration** 🔲
- [ ] Company-to-boards mapping
- [ ] Board selection UI
- [ ] Aggregate queries
- [ ] Per-board filtering

**Client Database** 🔲
- [ ] Dedicated "Clients" board
- [ ] Client-to-company relations
- [ ] Email column
- [ ] Status tracking

### 5.2 Email Notifications

**Triggers** 🔲
- [ ] Ticket created
- [ ] Status changed
- [ ] Comment added
- [ ] File uploaded
- [ ] Assignment changed

**Templates** 🔲
- [ ] Welcome/magic link email
- [ ] Ticket created email
- [ ] Status update email
- [ ] New comment email
- [ ] Branded templates

### 5.3 Portal Configuration

**Branding** 🔲
- [ ] Logo upload
- [ ] Color picker
- [ ] Custom domain support
- [ ] Email customization

**Preferences** 🔲
- [ ] Notification toggles
- [ ] File upload limits
- [ ] Allowed file types
- [ ] Default ticket board

### 5.4 Analytics (Optional)

**Metrics** 🔲
- [ ] Total tickets
- [ ] Resolution time
- [ ] Client activity
- [ ] Status distribution
- [ ] Priority breakdown

---

## 🚀 PHASE 6: DEPLOYMENT & MARKETPLACE

### 6.1 Monday App Manifest

**monday-app.json** 🔲
- [ ] Update app metadata
- [ ] Configure permissions
- [ ] Define features
- [ ] Set webhook URLs
- [ ] Add icons & screenshots

### 6.2 Deployment Scripts

**Backend** 🔲
- [ ] Monday code deployment script
- [ ] Environment variable setup
- [ ] Function testing

**Portal** 🔲
- [ ] Vercel/Netlify configuration
- [ ] Environment variables
- [ ] Custom domain setup
- [ ] SSL configuration

**Monday App** 🔲
- [ ] Build script
- [ ] monday CLI deployment
- [ ] Version management

### 6.3 Documentation

**For Developers** 🔲
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

**For Users** 🔲
- [ ] Setup instructions
- [ ] Board configuration guide
- [ ] Magic link generation guide
- [ ] FAQ

### 6.4 Marketplace Submission

**Requirements** 🔲
- [ ] App description
- [ ] Screenshots
- [ ] Demo video
- [ ] Support documentation
- [ ] Privacy policy
- [ ] Terms of service

---

## 🏗️ BOARD STRUCTURE REQUIREMENTS

### Clients Board
```
Columns:
- Name (Text)
- Email (Email)
- Company (Connect Boards → Companies)
- Status (Status: Active/Inactive)
- Magic Link Token (Text - hidden)
- Last Login (Date)
- Created Date (Date)
```

### Companies Board
```
Columns:
- Name (Text)
- Logo URL (Link)
- Primary Color (Text)
- Board IDs (Long Text - JSON array)
- Status (Status)
- Created Date (Date)
```

### Tickets Board(s)
```
Columns:
- Name (Text) - Ticket title
- Description (Long Text)
- Client (Connect Boards → Clients)
- Status (Status: Open/In Progress/Waiting/Resolved/Closed)
- Priority (Status: Low/Medium/High/Urgent)
- Assigned To (Person)
- Files (File)
- Created Date (Date)
- Resolved Date (Date)
```

---

## 🔑 ENVIRONMENT VARIABLES

### Monday Code Backend
```bash
MONDAY_API_TOKEN=<your-api-token>
MONDAY_SIGNING_SECRET=<webhook-secret>
JWT_SECRET=<jwt-signing-secret>
PORTAL_BASE_URL=https://portal.yourcompany.com
SENDGRID_API_KEY=<sendgrid-key>
```

### Client Portal (Vercel/Netlify)
```bash
NEXT_PUBLIC_BACKEND_URL=https://monday-code-function-url.com
NEXT_PUBLIC_PORTAL_NAME=Your Company Portal
```

### Monday App
```bash
NEXT_PUBLIC_MONDAY_APP_ID=<app-id>
```

---

## 📦 DEPENDENCIES

### Production
- monday-sdk-js
- jsonwebtoken
- next
- react
- tailwindcss
- zod (validation)

### Development
- typescript
- @mondaycom/apps-cli
- @types/node
- @types/react

---

## 🎯 SUCCESS CRITERIA

### Standalone Portal
- [x] Magic link authentication works
- [x] Clients see only their tickets
- [ ] File upload/download functional
- [ ] Comments work bidirectionally
- [ ] Email notifications sent
- [ ] Branding applied per company

### Embedded App
- [ ] Views load in monday iframe
- [ ] Context properly extracted
- [ ] Actions update monday boards
- [ ] Settings persist correctly

### Backend
- [ ] All functions deployed to monday code
- [ ] Webhooks trigger correctly
- [ ] Storage operations work
- [ ] Authentication secure

### Marketplace Ready
- [ ] Manifest complete
- [ ] Documentation written
- [ ] Testing complete
- [ ] Screenshots/demo ready

---

## 📈 NEXT IMMEDIATE STEPS

1. **Complete Backend Functions**
   - Finish file upload/download
   - Implement ticket CRUD operations
   - Build notification system

2. **Move Client Portal**
   - Relocate to `apps/client-portal`
   - Update dependencies
   - Refactor API calls

3. **Test Magic Link Flow**
   - End-to-end authentication
   - Token storage
   - JWT validation

4. **Build First Embedded View**
   - Simple board view
   - Display magic link
   - Test in monday iframe

---

**Last Updated**: November 13, 2025
**Status**: Phase 1 Complete ✅ | Phase 2 In Progress 🚧
