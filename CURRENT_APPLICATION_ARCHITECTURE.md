# Current Application Architecture & System Status

## 1. App Overview

### What the App Does
This is a **multi-tenant client support portal** built on top of Monday.com infrastructure. The application enables companies to provide their external clients with a branded, secure interface to submit and track support tickets without requiring Monday.com accounts. The system operates in two modes:

1. **Standalone Client Portal**: A public-facing Next.js web application where clients access tickets via email/password authentication or magic link authentication
2. **Embedded Monday.com App**: Administrative views that run inside Monday.com's iframe, allowing internal teams to manage companies, generate magic links, and configure the portal

### Who Uses It

**External Clients (End Users)**
- Submit support tickets
- View ticket status and history
- Export ticket reports (PDF/CSV)
- Access portal via magic links or login credentials

**Internal Support Teams**
- Manage tickets within Monday.com boards
- Assign and update ticket status
- Respond via Monday.com updates
- Monitor ticket metrics

**System Administrators**
- Create and configure companies
- Set up company-specific ticket boards
- Generate magic links for client access
- Configure board structure and columns
- Manage user-company assignments

### Main Business Workflows

**Client Ticket Submission Flow**
1. Client authenticates via login or magic link
2. System identifies client's company and associated ticket board
3. Client creates ticket with title, description, and priority
4. Ticket is created in company's Monday.com board
5. Client email is auto-populated in ticket
6. Notifications are sent (planned feature)

**Multi-Tenant Company Setup Flow**
1. Admin creates company in management portal
2. System auto-creates dedicated ticket board for company
3. Standard columns (Email, Priority, Description) are added
4. Board ID is stored in Company board
5. Users are assigned to company via dropdown
6. Each company's data remains isolated

**User Authentication Flow**
1. User enters email/password on login page
2. System queries User Board (18379351659) for credentials
3. On successful auth, retrieves user's company from dropdown
4. Queries Company Board (18379404757) for company's ticket board ID
5. Stores board ID and auth token in localStorage
6. Redirects to dashboard with filtered view

---

## 2. Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **Runtime**: React 18.2.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.3.0 with custom IBACS/RedsisLab design system
- **Forms**: @tailwindcss/forms
- **State Management**: Jotai 2.6.0 (atomic state)
- **Icons**: Lucide React 0.294.0
- **Validation**: Zod 3.22.4
- **Monday SDK**: monday-sdk-js 0.5.6

### Backend
- **Planned Runtime**: Monday Code (serverless functions on Monday.com infrastructure)
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **HTTP Client**: node-fetch 3.3.2
- **Current State**: Backend functions defined but not yet deployed to Monday Code

### Database(s)
- **Primary Storage**: Monday.com boards (accessed via GraphQL API)
  - No traditional database; all persistence via Monday.com boards
  - Board structure acts as relational tables
  - Column values store entity attributes
  - Connect Boards columns implement relationships
  
- **Access Method**: 
  - Direct Monday.com GraphQL API v2 (2023-10)
  - Custom Next.js API routes proxy requests
  - No ORM; manual GraphQL query construction
  - Column caching layer (5-minute TTL)

### Other
- **Real-time**: Socket.io-client 4.5.4 (WebSocket, currently unused)
- **HTTP Client**: Axios 1.6.0
- **Deployment**: Vercel (configured via vercel.json)
- **Build Tool**: Next.js built-in (Turbopack available)
- **Package Manager**: npm workspaces (monorepo structure)
- **External Services**:
  - SendGrid (email notifications - configured but not implemented)
  - Monday.com API (core dependency)

---

## 3. User Roles & Permissions

### External Client
**Identification**: Authenticated via User Board with email/password or magic token
**Can See**:
- Own tickets only (filtered by email match)
- Company-specific ticket board
- Ticket metrics dashboard (open/closed counts, avg response time)

**Can Do**:
- Create new tickets
- View ticket details
- Export tickets to PDF/Excel
- Update own profile (via Monday.com board indirectly)

**Cannot Do**:
- See other clients' tickets
- Access Monday.com directly
- Modify ticket status (read-only on status/priority)
- Access admin management portal

### Internal Team Member (Monday.com User)
**Identification**: Monday.com account with board access
**Can See**:
- All tickets across all companies (if board permissions allow)
- Client information
- Company configurations

**Can Do**:
- Update ticket status and priority
- Assign tickets to team members
- Add internal notes/updates
- Manage board structure
- Configure automations

**Cannot Do** (assumed):
- Access external client portal directly
- Modify multi-tenant structure without admin rights

### System Administrator (Monday.com Admin)
**Identification**: Monday.com account with admin privileges
**Can See**:
- All companies and their configurations
- All ticket boards across all companies
- User-company mappings
- Management portal dashboard

**Can Do**:
- Create new companies (programmatically or manually)
- Set up company ticket boards
- Configure board columns
- Generate magic links
- Link existing boards to companies
- Assign users to companies
- Access embedded admin views in Monday.com

**Cannot Do**:
- Currently limited by Monday.com API token permissions

**Assumption**: Role-based access control relies on Monday.com's native permissions; no custom RBAC layer implemented in the application itself.

---

## 4. Modules & Features

### Client Portal Module
**Purpose**: Public-facing interface for clients to manage support tickets

**Key Directories/Files**:
- `/apps/client-portal/app/(public)/login/page.tsx` - Login screen
- `/apps/client-portal/app/client/dashboard/page.tsx` - Main dashboard
- `/apps/client-portal/app/client/tickets/` - Ticket views
- `/apps/client-portal/components/TicketList.tsx` - Ticket display
- `/apps/client-portal/components/NewTicketForm.tsx` - Ticket creation
- `/apps/client-portal/lib/api/client.ts` - API client (currently targets FastAPI, not yet implemented)

**Features**:
- Email/password authentication with company-aware routing
- Magic link authentication (backward compatible)
- Dynamic board column detection and mapping
- Ticket CRUD operations
- Dashboard with metrics (total, open, closed, avg response time)
- Export to PDF/Excel
- IBACS/RedsisLab branded UI

**Interactions**:
- Calls Next.js API routes (`/api/auth/login`, `/api/tickets`, `/api/board-columns`)
- API routes proxy to Monday.com GraphQL API
- Caches board columns for performance

### Management Portal Module
**Purpose**: Admin interface for company and board management

**Key Directories/Files**:
- `/apps/client-portal/app/embed/admin/page.tsx` - Company management
- `/apps/client-portal/app/embed/layout.tsx` - Embedded view wrapper
- `/apps/client-portal/lib/monday-context.ts` - Monday SDK integration

**Features**:
- Create companies with auto-generated ticket boards
- Link existing boards to companies
- View all companies and board IDs
- Dashboard statistics (total companies, linked boards, missing boards)
- Two workflow support: portal creation vs Monday automation

**Interactions**:
- Runs inside Monday.com iframe
- Uses monday-sdk-js for context and API calls
- Directly creates boards and items via GraphQL mutations
- Updates Company Board (18379404757) with board mappings

### Authentication Module
**Purpose**: User identity and session management

**Key Directories/Files**:
- `/apps/client-portal/app/api/auth/login/route.ts` - Login handler
- `/apps/client-portal/lib/auth.ts` - JWT utilities
- `/apps/client-portal/lib/api/client.ts` - Token storage
- `/apps/backend/src/generate-magic-link.ts` - Magic link generation (not deployed)
- `/apps/backend/src/verify-magic-link.ts` - Magic link verification (not deployed)

**Features**:
- Email/password authentication against User Board
- Magic link token generation and verification (planned)
- JWT token encoding/decoding
- LocalStorage-based session persistence
- Token expiry checking

**Interactions**:
- Queries User Board (18379351659) for credentials
- Queries Company Board (18379404757) for ticket board ID
- Stores auth state in localStorage
- Redirects based on auth status

### Board Management Module
**Purpose**: Dynamic board schema handling and column mapping

**Key Directories/Files**:
- `/apps/client-portal/lib/board-columns.ts` - Column fetching and caching
- `/apps/client-portal/app/api/board-columns/route.ts` - Column API

**Features**:
- Dynamic column detection by title (case-insensitive)
- 5-minute column schema caching
- Column value formatting based on type
- Fallback column IDs for robustness

**Interactions**:
- Called before ticket operations
- Enables multi-tenant flexibility (different boards can have different schemas)
- Reduces API calls via caching

### Ticketing Module
**Purpose**: Core ticket management functionality

**Key Directories/Files**:
- `/apps/client-portal/app/api/tickets/route.ts` - Ticket CRUD API
- `/apps/client-portal/components/TicketList.tsx` - Display component
- `/apps/client-portal/components/TicketDetail.tsx` - Detail view
- `/apps/backend/src/create-ticket.ts` - Backend ticket creation (not deployed)
- `/apps/backend/src/get-tickets.ts` - Backend ticket retrieval (not deployed)

**Features**:
- Create tickets with dynamic column mapping
- Fetch tickets filtered by client email
- Status and priority management
- Ticket detail view with history
- Export functionality

**Interactions**:
- Uses Board Management Module for column schema
- Filters tickets by client email column
- Maps priority levels to Monday.com status labels

### Backend Functions Module (Planned)
**Purpose**: Serverless functions for advanced features

**Key Directories/Files**:
- `/apps/backend/src/generate-magic-link.ts`
- `/apps/backend/src/verify-magic-link.ts`
- `/apps/backend/src/webhook-handler.ts`
- `/apps/backend/src/send-notification.ts`

**Status**: Code written but not deployed to Monday Code

**Planned Features**:
- Magic link generation with crypto tokens
- JWT issuance and validation
- Webhook event processing
- Email notifications via SendGrid
- File upload/download handling

**Planned Interactions**:
- Would replace some Next.js API routes
- Would handle webhooks from Monday.com
- Would integrate with SendGrid for notifications

---

## 5. Screens / Pages / Routes

### Public Routes

**`/login` (`/apps/client-portal/app/(public)/login/page.tsx`)**
- **Purpose**: Client authentication entry point
- **Main Actions**: 
  - Email/password form submission
  - Magic link token processing (query params)
  - Redirect to dashboard on success
- **Key Flows**: User credential validation → Company lookup → Board ID retrieval → LocalStorage auth storage

**`/` (Root)**
- **Purpose**: Landing page
- **Assumption**: Likely redirects to login or dashboard based on auth state

### Authenticated Client Routes

**`/client/dashboard` (`/apps/client-portal/app/client/dashboard/page.tsx`)**
- **Purpose**: Main client interface
- **Main Actions**:
  - View ticket metrics
  - Create new tickets (modal)
  - Export tickets
  - Logout
- **Key Flows**: Load board columns → Fetch tickets → Filter by email → Render stats and list

**`/client/tickets/[id]` (`/apps/client-portal/app/client/tickets/[id]/page.tsx`)**
- **Purpose**: Individual ticket detail view
- **Main Actions**: View ticket details, status, comments
- **Assumption**: Based on file structure

### Embedded Monday.com Routes

**`/embed/admin` (`/apps/client-portal/app/embed/admin/page.tsx`)**
- **Purpose**: Company and board management (admin-only)
- **Main Actions**:
  - Create new companies with ticket boards
  - Link existing boards to companies
  - View company statistics
- **Key Flows**: 
  - Create company → Create board → Add columns → Link board ID → Refresh list
  - Manual linking → Enter board ID → Update Company Board

**`/embed/dashboard` (`/apps/client-portal/app/embed/dashboard/`)**
- **Purpose**: Ticket statistics widget for Monday.com dashboards
- **Assumption**: Based on directory structure

**`/embed/portal` (`/apps/client-portal/app/embed/portal/`)**
- **Purpose**: Client portal access within Monday.com
- **Assumption**: Based on directory structure

**`/embed/ticket` (`/apps/client-portal/app/embed/ticket/`)**
- **Purpose**: Ticket detail view within Monday.com
- **Assumption**: Based on directory structure

### API Routes (Server-Side)

**`/api/auth/login` (POST)**
- **Purpose**: Authenticate client and retrieve board ID
- **Returns**: User object with token, board ID, company name

**`/api/board-columns` (GET)**
- **Purpose**: Fetch board column schema
- **Query Params**: `boardId`
- **Returns**: Column definitions (id, title, type)

**`/api/tickets` (GET, POST)**
- **Purpose**: Retrieve all tickets for a board or create new ticket
- **GET Query Params**: `boardId`
- **POST Body**: `{ boardId, itemName, columnValues }`
- **Returns**: Tickets array or created ticket

---

## 6. Data Flow

### How Data Enters the System

**Manual Ticket Creation (Client Portal)**
1. Client fills NewTicketForm (title, description, priority)
2. Form submission calls `handleCreateTicket` in dashboard
3. Dynamic column IDs fetched from board schema
4. GraphQL mutation via `/api/tickets` POST
5. Ticket created in company-specific Monday.com board
6. Email column auto-populated with client's email

**User Registration (Manual)**
1. Admin manually creates item in User Board (18379351659)
2. Sets email, password, and company dropdown
3. User can then log in via portal

**Company Setup (Programmatic)**
1. Admin clicks "New Company" in management portal
2. System creates ticket board via GraphQL mutation
3. Adds standard columns (Email, Priority, Description)
4. Creates company entry in Company Board (18379404757)
5. Links board ID via dropdown column

### How Data Moves Through Layers

**Frontend → API Route → Monday.com → Frontend**

**Example: Fetching Tickets**
1. **Frontend**: `loadTickets()` in dashboard component
2. **Browser Fetch**: `GET /api/tickets?boardId=123`
3. **Next.js API Route**: `/app/api/tickets/route.ts` receives request
4. **GraphQL Query Construction**: Builds query with board ID and column projection
5. **Monday.com API Call**: Sends to `https://api.monday.com/v2` with auth token
6. **Response Processing**: Parses items and column values
7. **Data Transformation**: Maps Monday.com structure to `Ticket` type
8. **JSON Response**: Returns to frontend
9. **Frontend State Update**: Sets tickets in React state
10. **Email Filtering**: Client-side filter by `clientEmail === userEmail`
11. **Rendering**: TicketList component displays filtered tickets

**Authentication Data Flow**
1. **Form Submit**: Email/password from login page
2. **API Route**: `/api/auth/login` validates credentials
3. **User Board Query**: Fetches all users, matches email/password
4. **Company Lookup**: Extracts company name from user's dropdown column
5. **Company Board Query**: Finds company item by name
6. **Board ID Extraction**: Gets ticket board ID from company's dropdown column
7. **Response**: Returns user object with board ID
8. **LocalStorage**: Stores `magic_token`, `client_email`, `client_board_id`, `user_name`, `user_company`
9. **Redirect**: Navigate to `/client/dashboard`
10. **Dashboard Load**: Reads board ID from localStorage, fetches tickets

### Where Key Business Logic Lives

**Client-Side (React Components)**
- Ticket filtering by email (`/app/client/dashboard/page.tsx`)
- Metrics calculation (total, open, closed, avg response time)
- Export to PDF/Excel logic
- Form validation (basic)

**Server-Side (Next.js API Routes)**
- Authentication logic (`/app/api/auth/login/route.ts`)
- GraphQL query construction
- Monday.com API integration
- Error handling and response formatting

**Monday.com Infrastructure**
- Data persistence (boards as tables)
- Relationships (Connect Boards columns)
- Status workflows (Monday.com automations, if configured)
- Permissions (Monday.com board-level permissions)

**Backend Functions (Not Yet Deployed)**
- Magic link token generation and verification
- JWT signing and validation
- Webhook event processing
- Email notification triggering

**Column Mapping Logic**
- Dynamic column detection (`/lib/board-columns.ts`)
- Fallback column IDs for resilience
- Column value formatting based on type

---

## 7. APIs & Integrations

### Main Internal API Endpoints

**Authentication**
- `POST /api/auth/login` - Email/password authentication
- (Planned) `POST /api/auth/magic` - Magic link verification
- (Planned) `POST /api/auth/refresh` - Token refresh

**Tickets**
- `GET /api/tickets?boardId={id}` - List all tickets for a board
- `POST /api/tickets` - Create new ticket
  - Body: `{ boardId, itemName, columnValues }`

**Board Metadata**
- `GET /api/board-columns?boardId={id}` - Fetch board column schema

**Planned Endpoints (from `/lib/api/client.ts`)**
- `GET /me` - Get current user profile
- `POST /ticket` - Create ticket (alternative endpoint)
- `GET /tickets/{portalId}` - Get tickets by portal ID
- `GET /clients` - List all clients

### External APIs & Services

**Monday.com GraphQL API v2**
- **URL**: `https://api.monday.com/v2`
- **Authentication**: Bearer token in `Authorization` header
- **API Version**: `2023-10`
- **Used For**:
  - Querying board items (users, companies, tickets)
  - Creating items (tickets, companies)
  - Creating boards
  - Adding columns to boards
  - Updating column values
  - Fetching board schemas
- **Rate Limiting**: Subject to Monday.com's rate limits (not explicitly handled)
- **Error Handling**: GraphQL errors logged and thrown

**Monday.com SDK (monday-sdk-js)**
- **Used For**:
  - Getting iframe context (user, board, item)
  - Executing GraphQL queries from embedded views
  - Showing Monday.com notifications
  - Requesting session tokens
- **Used In**: Embedded admin views (`/embed/*`)

**SendGrid Email API (Configured, Not Implemented)**
- **Used For**: Email notifications (planned)
- **Environment Variables**: 
  - `SENDGRID_API_KEY`
  - `FROM_EMAIL`
  - `FROM_NAME`
- **Endpoints Defined** (not deployed):
  - Magic link emails
  - Ticket status change notifications
  - New comment notifications

**WebSocket (Configured, Not Used)**
- **Library**: socket.io-client 4.5.4
- **Environment Variable**: `NEXT_PUBLIC_WEBSOCKET_URL`
- **Status**: Imported but no active implementation found

---

## 8. Database & Persistence

### Main Tables/Collections/Entities

**Users Board (ID: 18379351659)**
| Column ID | Column Name | Type | Purpose |
|-----------|-------------|------|---------|
| `name` | Name | Name | Full name of user |
| `status` | Status | Status | User account status |
| `date4` | Date | Date | Creation/modification date |
| `email_mkxpm2m0` | User Email | Email | Login email (unique identifier) |
| `text_mkxpxyrr` | Password | Text | Plain text password (⚠️ security concern) |
| `dropdown_mkxpsjwd` | Company | Dropdown | References company name (not ID) |
| `dropdown_mkxrn759` | First Name | Dropdown | User's first name |
| `dropdown_mkxr9kyr` | Last Name | Dropdown | User's last name |

**Relationships**: 
- Company dropdown links to Project Creator board by name (string match, not foreign key)

**Used For**: Client authentication, user-company mapping

---

**Project Creator Board (ID: 18379404757)** *(formerly "Company Board")*
| Column ID | Column Name | Type | Purpose |
|-----------|-------------|------|---------|
| `name` | Name | Name | Company/project name |
| `status` | Status | Status | Active/Deactivated |
| `date4` | Date | Date | Creation timestamp |
| `dropdown_mkxpakmh` | Board ID | Dropdown | Ticket board ID (stores as label, not relation) |
| `button_mkxpx5k6` | Create Board | Button | Automation trigger to create ticket board |
| `text_mkxqv75c` | Main Contact Name | Text | Primary contact person |
| `email_mkxqs6z4` | Main Contact Email | Email | Primary contact email |
| `phone_mkxqb808` | Main Contact Phone | Phone | Primary contact phone |
| `dropdown_mkxrwmpq` | Company | Dropdown | Company reference/categorization |

**Relationships**: 
- Board ID column stores the ID of company's ticket board (as string in dropdown)
- Referenced by Users Board's Company dropdown (by name)
- Main Contact Email may link to Users Board (manual relationship)

**Used For**: Multi-tenant configuration, board ID lookup, company contact management

---

**Management Portal Board (ID: 18379040651)** *(Default Ticket Board)*

Standard columns for ticket management:

| Column ID | Column Name | Type | Purpose |
|-----------|-------------|------|---------|
| `name` | Name | Name | Ticket title |
| `status` | Status | Status | Open/In Progress/Resolved/Closed |
| `date4` | Date | Date | Creation/modification date |
| `email_mkxpawg3` | client_email | Email | Client's email (filter key) |
| `color_mkxp805g` | priority | Status | Low/Medium/High/Urgent |
| `long_text_mkxpgg6q` | Description Of Problem | Long Text | Ticket details |
| `file_mkxqyqg0` | Attachments | File | File attachments |
| `dropdown_mkxrzw2w` | Machine Type | Dropdown | Equipment/machine classification |

**Additional columns can be added per company**

**Relationships**: 
- client_email matches Users Board email (manual join in code)
- No formal foreign key; filtering done in application layer

**Used For**: Ticket storage and management (default board)

---

**Service Providers Board (ID: 18379446736)** *(NEW)*

| Column ID | Column Name | Type | Purpose |
|-----------|-------------|------|---------|
| `name` | Name | Name | Service provider name |
| `status` | Status | Status | Provider status |
| `email_mkxpawg3` | Email | Email | Provider email |
| `phone_mkxpec5j` | Phone | Phone | Provider phone |
| `text_mkxpb7j4` | Password | Text | Provider login password (⚠️ security concern) |
| `dropdown_mkxpdbxw` | Specialization | Dropdown | Provider specialty/expertise |
| `numeric_mkxp72jc` | Assigned Tickets | Numeric | Count of assigned tickets |

**Relationships**: 
- Email may be used for provider authentication
- Assigned Tickets likely updated via automation

**Used For**: Service provider management, ticket assignment tracking

---

### Important Relationships & Constraints

**User → Project Creator → Ticket Board (Pseudo-Relational Chain)**
```
Users.Company (dropdown) → ProjectCreator.Name (text match)
ProjectCreator.Board_ID (dropdown label) → Management_Portal.ID (board identifier)
Users.User_Email → Ticket.client_email (text match for filtering)
```

**New Workflow: Service Provider Assignment** (assumed)
```
Ticket → Service_Provider (via automation or manual assignment)
Service_Provider.Assigned_Tickets (numeric counter)
```

**Constraints Observed**:
- No database-level foreign keys (Monday.com doesn't support SQL constraints)
- Referential integrity maintained by application logic
- Company/project names must be unique for Users → Project Creator lookup to work
- Board IDs stored as strings in dropdown labels
- Email matching is case-sensitive in code (`.toLowerCase()` used in auth)
- Service providers have separate authentication (assumed, based on password column)

**Assumptions**: 
- Deleting a project/company doesn't cascade delete tickets (manual cleanup required)
- Renaming a project breaks user associations (users still reference old name)
- Service providers may have portal access (separate authentication path)
- "Machine Type" suggests equipment-based ticketing (e.g., technical support)
- "Create Board" button triggers Monday.com automation to generate new ticket boards

---

### Column ID Patterns

**Dynamic Column Detection**:
- System uses `getColumnIdByTitle()` to find columns by name
- Fallback hardcoded IDs used if title match fails
- Example: Email column can be "Client Email", "Email", or fallback to `email_mkxpawg3`

**Hardcoded Column IDs (Fallbacks)**:
- `email_mkxpm2m0` - Users Board email ("User Email")
- `text_mkxpxyrr` - Users Board password
- `dropdown_mkxpsjwd` - Users Board company
- `dropdown_mkxrn759` - Users Board first name (NEW)
- `dropdown_mkxr9kyr` - Users Board last name (NEW)
- `dropdown_mkxpakmh` - Project Creator board ticket board ID
- `button_mkxpx5k6` - Project Creator "Create Board" button (NEW)
- `text_mkxqv75c` - Project Creator main contact name (NEW)
- `email_mkxqs6z4` - Project Creator main contact email (NEW)
- `phone_mkxqb808` - Project Creator main contact phone (NEW)
- `dropdown_mkxrwmpq` - Project Creator company dropdown (NEW)
- `email_mkxpawg3` - Ticket client_email / Service Provider email
- `color_mkxp805g` - Ticket priority
- `long_text_mkxpgg6q` - Ticket "Description Of Problem"
- `file_mkxqyqg0` - Ticket attachments (NEW)
- `dropdown_mkxrzw2w` - Ticket machine type (NEW)
- `phone_mkxpec5j` - Service Provider phone (NEW)
- `text_mkxpb7j4` - Service Provider password (NEW)
- `dropdown_mkxpdbxw` - Service Provider specialization (NEW)
- `numeric_mkxp72jc` - Service Provider assigned tickets (NEW)

---

## 9. Known Issues & Risks (from code signals)

### TODO/FIXME Comments

**From `/apps/client-portal/lib/api/client.ts`:**
- `TODO: Add single ticket endpoint to backend` (line 179)
- `TODO: Implement in backend` (comment system, lines 205, 221)

**From `/apps/backend/src/create-ticket.ts`:**
- `TODO: Trigger email notification` (line 117)

**Interpretation**: Comment system and notifications are planned but not implemented

---

### Deprecated Patterns

**Plain Text Password Storage**
- Locations: 
  - Users Board (`text_mkxpxyrr` column)
  - Service Providers Board (`text_mkxpb7j4` column)
- Risk: **CRITICAL SECURITY ISSUE**
- Passwords stored in plain text in Monday.com boards
- Visible to anyone with board read access
- No hashing or encryption
- Affects both client users AND service providers

**Recommendation**: Implement bcrypt hashing before production for both user types

---

**FastAPI References in Dead Code**
- `/lib/api/client.ts` targets `http://localhost:8000` (FastAPI backend)
- But current implementation uses Next.js API routes
- FastAPI backend appears to have been replaced
- Code not removed, creating confusion

---

**Session Storage via LocalStorage**
- Location: Multiple files using `localStorage.setItem('magic_token', ...)`
- Risk: Vulnerable to XSS attacks
- No httpOnly cookies
- Tokens persist across sessions
- No secure flag for HTTPS-only

**Recommendation**: Migrate to httpOnly cookies with secure flag

---

### Obvious Security Concerns

**Authentication & Authorization**

1. **No Password Hashing**
   - Severity: CRITICAL
   - Impact: Complete credential exposure
   
2. **Client-Side Filtering Only**
   - Location: `/client/dashboard/page.tsx`
   - Tickets filtered by email in browser
   - API returns ALL tickets for a board
   - Malicious client could see other clients' tickets by removing filter

3. **API Token Exposure**
   - `NEXT_PUBLIC_MONDAY_API_TOKEN` in environment variables
   - Exposed in client-side bundle
   - Anyone can make Monday.com API calls with full permissions

4. **No Rate Limiting**
   - Login endpoint has no brute force protection
   - Monday.com API calls unlimited
   - Potential for abuse

5. **Missing CSRF Protection**
   - API routes don't validate origin
   - Vulnerable to cross-site requests

**Validation**

6. **No Input Sanitization**
   - User input passed directly to GraphQL queries
   - Potential for GraphQL injection
   - No HTML escaping in displayed content (XSS risk)

7. **Weak Email Validation**
   - Only HTML5 `type="email"` validation
   - No backend email format verification

**Secrets Handling**

8. **Environment Variable Fallbacks**
   - Example: `JWT_SECRET || 'your-secret-key-change-this'`
   - Default secrets in code
   - Risk if `.env` file missing

9. **API Tokens in Client-Side Code**
   - `/lib/board-columns.ts` uses `NEXT_PUBLIC_MONDAY_API_TOKEN`
   - Visible in browser DevTools
   - Should be server-side only

**Session Management**

10. **No Session Invalidation**
    - Logout only clears localStorage
    - Tokens never invalidated server-side
    - Old tokens remain valid until expiry

11. **No Token Rotation**
    - Refresh token mechanism not implemented
    - Long-lived tokens increase exposure window

---

### Performance Risks

**N+1 Query Patterns**

1. **Company Lookup in Authentication**
   - Location: `/api/auth/login/route.ts`
   - Fetches all users (query 1)
   - Then fetches all companies (query 2)
   - Could be optimized with GraphQL field projection

2. **Ticket Loading**
   - Fetches all tickets for a board
   - Filters client-side by email
   - Should use Monday.com filtering in GraphQL query

**Heavy Operations in Hot Paths**

3. **Column Schema Fetching**
   - Every dashboard load fetches board columns
   - 5-minute cache helps but still refetches frequently
   - Could be cached longer or in CDN

4. **Metrics Calculation**
   - Average response time calculated on every render
   - No memoization
   - Recalculates even when tickets haven't changed

5. **Export Operations**
   - PDF/Excel export processes all tickets in-browser
   - Could timeout for large datasets
   - No pagination

**API Rate Limits**

6. **Monday.com Rate Limiting**
   - No rate limit handling in code
   - Will fail silently if limits hit
   - Complexity limit for GraphQL not checked

7. **Uncached Requests**
   - Board column fetching happens on every ticket create
   - Could cache for duration of user session

---

### Additional Code Smells

**Typo in API Route**
- `/api/board-columns/route.ts` line 7: `method: 'POS,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,eT'`
- Should be `'POST'`
- Critical bug preventing API from working

**Hardcoded Board IDs**
- Workspace ID: `13302651`
- Users Board ID: `18379351659`
- Project Creator Board ID: `18379404757` (formerly "Company Board")
- Management Portal Board ID: `18379040651` (default ticket board)
- Service Providers Board ID: `18379446736` (NEW)
- Not configurable; tied to specific Monday.com account

**Missing Error Boundaries**
- No React error boundaries
- Errors crash entire app
- No graceful degradation

---

## 10. UX / Navigation Notes

### How Users Navigate the App

**External Clients**
1. **Entry Point**: `/login` page
2. **Post-Auth Landing**: `/client/dashboard` (automatic redirect)
3. **Navigation Elements**: 
   - "New Ticket" button in header
   - Ticket cards clickable to detail view (assumed)
   - Logout button in header
   - Export buttons (PDF/Excel)
4. **Modal Overlays**: New ticket form opens as modal, not new page
5. **No breadcrumbs or multi-level navigation**

**Internal Admins (Embedded Views)**
1. **Entry Point**: Monday.com board → Add View → RedsisLab Client Portal app
2. **Admin Dashboard**: `/embed/admin` for company management
3. **Navigation**: Likely tabs or sidebar within Monday.com iframe
4. **External Links**: "View Board" links open Monday.com in new tab

---

### Inconsistent Patterns Detected

**Routing Strategy Inconsistency**
- Route groups used: `(auth)` and `(public)`
- But actual auth pages are in `(public)/login`
- `(auth)/dashboard` exists but seems unused
- Client routes not in a route group

**API Client Confusion**
- `/lib/api/client.ts` defines FastAPI-style API client
- But actual implementation uses Next.js API routes
- Two different auth flows defined (magic link vs email/password)
- Magic link code exists but not fully wired up

**Component Location Inconsistency**
- UI components in `/components/ui/`
- Business components in `/components/`
- Some components in `/apps/client-portal/components/`
- Portal-specific components in `/components/portal/`

**Authentication State Management**
- Some code uses localStorage directly
- Other code uses helper functions (`getAuthToken()`)
- No centralized auth context/hook
- Auth state not in React state (only localStorage)

**Styling Approach**
- Tailwind utility classes used extensively
- Custom CSS variables defined in `globals.css`
- Inline styles for dynamic theming (`style={{ backgroundColor: 'var(...)' }}`)
- Some hardcoded color values mixed in

**Error Handling**
- Some errors shown via `alert()` (modal dialogs)
- Some errors logged to console only
- No toast notification system
- Inconsistent error message formats

---

## 11. Constraints & Invariants

### Things That Must NOT Change

**Monday.com Board Structure**
- **Workspace ID**: `13302651`
  - All boards exist in this workspace
  
- **Users Board ID**: `18379351659`
  - Changing this breaks authentication
  - All login logic depends on this ID
  
- **Project Creator Board ID**: `18379404757`
  - Changing breaks multi-tenancy
  - Board ID lookups fail without this
  
- **Management Portal Board ID**: `18379040651`
  - Default ticket board for the system
  
- **Service Providers Board ID**: `18379446736`
  - New board for provider management
  
- **Critical Column IDs**:
  - `email_mkxpm2m0` (Users email - "User Email")
  - `text_mkxpxyrr` (Users password)
  - `dropdown_mkxpsjwd` (Users company)
  - `dropdown_mkxpakmh` (Project Creator board ID)
  - `email_mkxpawg3` (Ticket client_email / Service Provider email)
  - `color_mkxp805g` (Ticket priority)
  - `long_text_mkxpgg6q` (Ticket description)
  - If these column IDs change, system breaks

**API Contracts**
- **Monday.com GraphQL API Version**: `2023-10`
  - Hardcoded in multiple places
  - Different version may break queries
  
- **Environment Variable Names**:
  - `MONDAY_API_TOKEN`
  - `NEXT_PUBLIC_MONDAY_API_TOKEN`
  - Renaming breaks deployment

**Data Formats**
- **Board ID Storage**: Must be string in dropdown label, not actual Connect Boards relation
- **Email Matching**: Case-insensitive via `.toLowerCase()` in auth
- **Company Linking**: By name (string), not by board item ID

---

### Strong Assumptions the Code Relies On

**User-Project-Board Chain**
1. Project/company names are unique across Project Creator Board
2. User's company dropdown matches exactly one project name
3. Project has a board ID set in `dropdown_mkxpakmh`
4. Board ID is a valid Monday.com board
5. Ticket board has a "client_email" column (`email_mkxpawg3`)
6. Service providers exist in separate board with own authentication
7. "Machine Type" column suggests equipment-specific ticketing

**Authentication Assumptions**
1. Users Board contains email/password columns ("User Email" and "Password")
2. Service Providers Board also contains email/password columns
3. Passwords are stored as plain text for both user types (⚠️)
4. Email addresses are unique per user/provider
5. LocalStorage is available and persistent
6. Two separate authentication paths: clients and service providers (assumed)

**Ticket Filtering Assumptions**
1. All tickets for a board are safe to fetch
2. Client email column contains exact match of user's email
3. Column titles don't change after creation
4. Status values are consistent ("open", "in_progress", etc.)

**Monday.com API Assumptions**
1. API token has permissions for all operations
2. Rate limits won't be hit
3. GraphQL queries under complexity limit
4. Boards are public (not private)

**Embedded View Assumptions**
1. App runs inside Monday.com iframe
2. monday-sdk-js works in iframe context
3. Monday.com provides context (user, board, etc.)
4. Parent window allows iframe communication

---

## 12. Improvement Opportunities (high-level only)

### Architecture Improvements

**Implement Server-Side Ticket Filtering**
- Move email filtering from client to server
- Prevent unauthorized access to other clients' tickets
- Add GraphQL query filters instead of fetching all items

**Centralize Authentication State**
- Create React Context for auth state
- Remove direct localStorage access in components
- Implement useAuth hook for consistent state management

**Separate Public and Admin Apps**
- Client portal and admin portal are tightly coupled
- Split into separate Next.js apps or workspaces
- Improves security boundary and deployment independence

**Implement API Gateway Pattern**
- All Monday.com API calls currently happen from multiple locations
- Centralize through dedicated API service layer
- Enables request logging, rate limiting, caching

**Use Monday.com Connect Boards Properly**
- Company Board should use Connect Boards column to link to User Board
- Board ID should be actual relation, not dropdown label
- Enables Monday.com's native relationship features

---

### Technical Debt Hotspots

**Replace Plain Text Passwords**
- Priority: **CRITICAL**
- Implement bcrypt hashing
- Create migration script for existing users
- Add password reset flow

**Fix API Token Exposure**
- Move `NEXT_PUBLIC_MONDAY_API_TOKEN` to server-side only
- Use Next.js API routes exclusively for Monday.com calls
- Implement token rotation mechanism

**Resolve FastAPI Dead Code**
- Remove unused `/lib/api/client.ts` code
- Update or remove comments referencing FastAPI backend
- Clarify architecture decision in documentation

**Complete Backend Functions Deployment**
- Deploy Monday Code functions
- Wire up magic link flow end-to-end
- Implement webhook handlers
- Enable SendGrid notifications

**Fix Column API Route Typo**
- Correct `method: 'POS...'` to `method: 'POST'`
- Add tests to prevent similar issues

**Implement Server-Side Sessions**
- Replace localStorage tokens with httpOnly cookies
- Add session store (Redis or Monday.com storage)
- Implement CSRF protection

---

### Safety/Ease of Future Changes

**Add TypeScript Strict Mode**
- Enable `"strict": true` in tsconfig.json
- Fix type safety issues
- Reduce runtime errors

**Implement Comprehensive Error Handling**
- Add React Error Boundaries
- Create centralized error logger
- Implement user-friendly error messages
- Add retry logic for transient failures

**Add E2E Testing**
- No tests found in codebase
- Playwright or Cypress for critical flows
- Prevent regression on auth, ticket creation

**Improve Column Mapping Resilience**
- Make fallback column IDs configurable
- Add admin UI to map columns
- Store mapping in Monday.com storage or config file

**Extract Hardcoded Board IDs**
- Move to environment variables or config file
- Support multiple Monday.com accounts
- Enable testing with separate boards

**Add Monitoring and Logging**
- Implement structured logging (Winston, Pino)
- Add performance monitoring (Vercel Analytics)
- Set up error tracking (Sentry)
- Create health check endpoints

**Implement Rate Limiting**
- Add rate limiting to public API routes
- Handle Monday.com API rate limits gracefully
- Implement request queuing

**Cache Strategy Improvements**
- Increase column cache duration or use CDN
- Implement SWR (stale-while-revalidate) pattern
- Cache ticket data client-side

**Documentation**
- Add API documentation (OpenAPI/Swagger)
- Create sequence diagrams for key flows
- Document Monday.com board setup process
- Add inline code comments for complex logic

---

## Summary

This application is a **functional multi-tenant client support portal** built on Monday.com's infrastructure with a Next.js frontend. The core architecture is sound for its intended purpose, but several **critical security issues** must be addressed before production use, particularly around password storage and API token exposure.

The system demonstrates good understanding of Monday.com's GraphQL API and implements clever workarounds for multi-tenancy, but would benefit from:
1. Completing the backend serverless function deployment
2. Implementing proper authentication security
3. Adding comprehensive error handling and testing
4. Resolving the architectural confusion between planned FastAPI backend and current Next.js API routes

The codebase shows signs of rapid iteration with planned features partially implemented. The extensive documentation (28 markdown files) suggests good intentions for knowledge transfer, though the code itself could use more inline documentation for complex business logic.

**Current State**: MVP-ready for internal testing, but not production-ready for external clients due to security concerns.

**Next Priority**: Address security issues in section 9 before any production deployment.
