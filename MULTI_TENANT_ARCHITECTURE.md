# Multi-Tenant Architecture Guide

## Overview

The RedsisLab Client Portal now supports **multi-company architecture** where each company gets its own dedicated ticket board. This enables complete data isolation and customization per client.

## Architecture

### Board Structure

```
┌─────────────────────────────────────┐
│   User Board (18379351659)          │
│   - User accounts with login        │
│   - Links to companies via dropdown │
└──────────┬──────────────────────────┘
           │
           ├─ dropdown_mkxpsjwd (Company)
           │
           ▼
┌─────────────────────────────────────┐
│   Company Board (18379404757)       │
│   - List of all companies           │
│   - Each has ticket board ID        │
└──────────┬──────────────────────────┘
           │
           ├─ dropdown_mkxpakmh (Board ID)
           │
           ▼
┌─────────────────────────────────────┐
│   Company Ticket Boards (Dynamic)   │
│   - One per company                 │
│   - Isolated ticket data            │
│   - Custom columns per company      │
└─────────────────────────────────────┘
```

### Data Flow

1. **User Login** → User Board authentication
2. **Fetch Company** → Get user's company from `dropdown_mkxpsjwd`
3. **Get Board ID** → Query Company Board for company's ticket board ID (`dropdown_mkxpakmh`)
4. **Load Tickets** → Display tickets from company-specific board
5. **Create Ticket** → Add to company's ticket board

## Key Components

### 1. Management Portal (`/embed/admin`)

**Purpose**: Admin interface embedded in Monday.com for company/board management

**Features**:
- ✅ Create new companies
- ✅ Auto-create ticket boards for each company
- ✅ Set up standard columns (Email, Priority, Description)
- ✅ View all companies and their board IDs
- ✅ Link to company boards in Monday.com

**Access**: Only available inside Monday.com iframe

### 2. Public Client Portal (`/client/dashboard`)

**Purpose**: Customer-facing ticket portal

**Features**:
- ✅ User authentication via User Board
- ✅ Dynamic board routing based on user's company
- ✅ Auto-sync columns from company ticket board
- ✅ Create tickets with user email pre-filled
- ✅ Filter tickets by authenticated user's email

**Access**: Public URL for customer logins

### 3. Login System (`/login`)

**Authentication Flow**:
```javascript
1. User enters email + password
2. Query User Board for credentials
3. If valid:
   a. Get user's company from dropdown_mkxpsjwd
   b. Query Company Board for company's ticket board ID
   c. Store board ID in localStorage
   d. Redirect to /client/dashboard
```

## Monday.com Board Setup

### User Board (18379351659)

| Column ID | Column Name | Type | Purpose |
|-----------|-------------|------|---------|
| `name` | User Name | Name | Full name |
| `email_mkxpm2m0` | Email | Email | Login email |
| `text_mkxpxyrr` | Password | Text | Login password |
| `dropdown_mkxpsjwd` | Company | Dropdown | Link to Company Board |

### Company Board (18379404757)

| Column ID | Column Name | Type | Purpose |
|-----------|-------------|------|---------|
| `name` | Company Name | Name | Company identifier |
| `status` | Status | Status | Active/Deactivated |
| `date4` | Created | Date | Creation date |
| `dropdown_mkxpakmh` | Board ID | Dropdown | Ticket board ID |

### Company Ticket Boards (Dynamic)

Standard columns created automatically:

| Column Name | Type | Purpose |
|-------------|------|---------|
| Name | Name | Ticket title |
| Status | Status | Open/In Progress/Resolved/Closed |
| Client Email | Email | User's email |
| Priority | Status | Low/Medium/High/Urgent |
| Description | Long Text | Ticket details |

**Additional columns can be added per company and will auto-sync to portal**

## Dynamic Column Sync

The portal uses **intelligent column mapping** to adapt to each company's board structure:

```typescript
// Auto-detects column IDs by title
const emailColId = getColumnIdByTitle(columns, 'Client Email') || 
                  getColumnIdByTitle(columns, 'Email') || 
                  'email_mkxpawg3'; // fallback

const statusColId = getColumnIdByTitle(columns, 'Status') || 'status';
const priorityColId = getColumnIdByTitle(columns, 'Priority') || 'color_mkxp805g';
const descriptionColId = getColumnIdByTitle(columns, 'Description') || 'long_text_mkxpgg6q';
```

### How to Add Custom Columns

1. Go to company's ticket board in Monday.com
2. Add new column (e.g., "Department", "Category", etc.)
3. Portal will **automatically detect** the column on next load
4. Use `fetchBoardColumns(boardId)` to get updated schema

### Column Caching

- Columns are cached for **5 minutes** to reduce API calls
- Cache auto-refreshes when creating tickets
- Manual refresh: `clearColumnCache(boardId)`

## Creating a New Company

### Via Management Portal (Recommended)

1. Go to Monday.com → Install RedsisLab Client Portal app
2. Navigate to Admin view
3. Click "New Company"
4. Enter company name
5. System automatically:
   - Creates `{Company Name} - Tickets` board
   - Adds standard columns
   - Stores board ID in Company Board
   - Returns board ID for user assignment

### Manual Setup

```graphql
# 1. Create ticket board
mutation {
  create_board(
    board_name: "Acme Corp - Tickets",
    board_kind: public
  ) {
    id
    name
  }
}

# 2. Add columns to new board
mutation {
  create_column(
    board_id: "NEW_BOARD_ID",
    title: "Client Email",
    column_type: email
  ) {
    id
  }
}

# 3. Create company entry
mutation {
  create_item(
    board_id: "18379404757",
    item_name: "Acme Corp",
    column_values: "{\"dropdown_mkxpakmh\": \"NEW_BOARD_ID\"}"
  ) {
    id
  }
}

# 4. Assign user to company
mutation {
  change_column_value(
    board_id: "18379351659",
    item_id: "USER_ITEM_ID",
    column_id: "dropdown_mkxpsjwd",
    value: "{\"label\": \"Acme Corp\"}"
  ) {
    id
  }
}
```

## User Assignment

### Assigning Users to Companies

1. Open User Board (18379351659)
2. Find user's row
3. Set `Company` dropdown to company name
4. User will now see that company's tickets on login

### Creating New Users

```graphql
mutation {
  create_item(
    board_id: "18379351659",
    item_name: "John Doe",
    column_values: "{
      \"email_mkxpm2m0\": {\"email\": \"john@acmecorp.com\", \"text\": \"john@acmecorp.com\"},
      \"text_mkxpxyrr\": \"securePassword123\",
      \"dropdown_mkxpsjwd\": {\"label\": \"Acme Corp\"}
    }"
  ) {
    id
  }
}
```

## API Reference

### `fetchBoardColumns(boardId: string)`

Fetches column schema for a board with 5-minute caching.

```typescript
const columns = await fetchBoardColumns('18379040651');
// Returns: BoardColumn[]
```

### `getColumnIdByTitle(columns: BoardColumn[], title: string)`

Finds column ID by title (case-insensitive).

```typescript
const emailColId = getColumnIdByTitle(columns, 'Client Email');
// Returns: string | null
```

### `clearColumnCache(boardId?: string)`

Clears cached columns.

```typescript
clearColumnCache('18379040651'); // Clear specific board
clearColumnCache(); // Clear all boards
```

## Environment Variables

```bash
NEXT_PUBLIC_MONDAY_API_TOKEN=your_monday_api_token_here
```

**Required scopes**:
- `boards:read`
- `boards:write`
- `items:read`
- `items:write`

## Deployment

### Vercel Environment Variables

1. Go to Vercel project settings
2. Navigate to Environment Variables
3. Add `NEXT_PUBLIC_MONDAY_API_TOKEN`
4. Redeploy

### Monday.com App Configuration

Update `apps/client-portal/monday-app.json`:

```json
{
  "name": "RedsisLab Client Portal",
  "features": {
    "boardView": {
      "url": "https://your-domain.vercel.app/embed/admin"
    }
  }
}
```

## Security Considerations

### User Authentication
- Passwords stored in plain text in User Board (consider encryption)
- Magic tokens are session-based (localStorage)
- Email validation on login

### Data Isolation
- Each company has dedicated board
- Tickets filtered by user's email
- No cross-company data leakage

### API Token
- Use environment variable, never commit to git
- Rotate token periodically
- Limit token scopes to required permissions

## Troubleshooting

### "No board selected" error
**Cause**: User's company has no ticket board ID set
**Fix**: Create ticket board for company in management portal

### Tickets not showing
**Cause**: User's email doesn't match ticket email
**Fix**: Ensure user's email in User Board matches email in tickets

### Column not found
**Cause**: Board doesn't have expected column
**Fix**: Add column to company's ticket board, or update fallback IDs

### Login fails
**Cause**: Email/password mismatch or user not in User Board
**Fix**: Verify credentials in User Board (18379351659)

## Future Enhancements

- [ ] Webhook-based column sync (real-time)
- [ ] User role management (admin/user)
- [ ] Password encryption/hashing
- [ ] Multi-factor authentication
- [ ] Company-level settings (logo, colors, etc.)
- [ ] Advanced ticket filtering (status, date range, priority)
- [ ] Email notifications
- [ ] File attachments
- [ ] Ticket comments/replies

## Support

For questions or issues, contact RedsisLab support or open an issue in the repository.
