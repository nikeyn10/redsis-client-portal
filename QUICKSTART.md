# 🎯 REDSIS Client Portal - Monday.com Embedded App

## ✅ What's Been Implemented

Your client portal is now a **Monday.com embedded app** that runs inside Monday boards. Here's what changed:

### Architecture Shift

**Before**: Standalone portal with custom authentication  
**Now**: Embedded app using Monday's authentication and data

### New Components Created

1. **Monday SDK Integration** (`lib/monday-context.ts`)
   - `useMondayContext()` hook to get user/board/item data
   - `executeMondayQuery()` to run GraphQL queries
   - `showMondayNotification()` for in-app messages
   - Session token management

2. **Embedded Ticket View** (`app/embed/ticket/page.tsx`)
   - Displays ticket details from Monday board items
   - Shows comments from Monday updates
   - Allows adding new comments via Monday API
   - Auto-refreshes when item changes

3. **Embedded Dashboard** (`app/embed/dashboard/page.tsx`)
   - Lists all tickets from Monday board
   - Filters tickets by client email
   - Shows stats (total, open, in progress, resolved)
   - Create new tickets directly in Monday board

4. **App Configuration** (`monday-app.json`)
   - Item View for ticket details
   - Board View for dashboard
   - Required permissions configured
   - Settings for column IDs

### How It Works

```
┌─────────────────────────────────────┐
│    User Opens Monday Board          │
│    "Support Tickets"                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Clicks Board View →              │
│    "Client Dashboard"               │
│    (Your embedded app loads)        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Your Next.js App                 │
│    - Gets user context from Monday  │
│    - Fetches board items as tickets │
│    - Filters by client email        │
│    - Displays in your UI            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    User Creates Ticket →            │
│    Creates item in Monday board     │
└─────────────────────────────────────┘
```

## 🚀 Quick Deployment Steps

### 1. Deploy to Vercel (5 minutes)

```bash
cd client-portal
vercel --prod
```

Copy your deployment URL: `https://your-project.vercel.app`

### 2. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add:
- `NEXT_PUBLIC_MONDAY_CLIENT_ID` = `7dd947daa98f280524ee4776df4f723a`
- `NEXT_PUBLIC_MONDAY_APP_ID` = `10672301`
- `MONDAY_CLIENT_SECRET` = `01d1b56957d6b5933960bc1737f284bf`
- `MONDAY_SIGNING_SECRET` = `28968b80743855c26cf8d614e127c3e7`

Then redeploy.

### 3. Create Monday Board (2 minutes)

Create board called "Support Tickets" with columns:

| Column Name | Type | Labels |
|-------------|------|--------|
| Item Name | Default | - |
| Status | Status | Open, In Progress, Resolved, Closed |
| Priority | Status | Low, Medium, High, Critical |
| Long Text | Long Text | (for description) |
| Client Email | Email | - |

### 4. Configure Monday App (3 minutes)

Go to https://monday.com/apps/manage → Your App → Features

**Item View:**
- Name: Ticket Details
- URL: `https://your-project.vercel.app/embed/ticket`

**Board View:**
- Name: Client Dashboard  
- URL: `https://your-project.vercel.app/embed/dashboard`

### 5. Install App to Board (1 minute)

1. Open "Support Tickets" board
2. Click "Integrate" → Find your app → Install
3. Click "+ Add View" → Apps → Client Dashboard
4. Click any item → Apps → Ticket Details

## 🎨 User Experience

### For Admins (Monday Users)

1. Open Monday board
2. See all tickets in standard Monday view
3. Switch to "Client Dashboard" view for client portal UI
4. Click items to see "Ticket Details" view
5. Manage all tickets with Monday's full features

### For Clients (Shared Board Access)

1. Receive board share link from admin
2. Login with their email
3. See only THEIR tickets (filtered by client email)
4. Create new tickets via dashboard
5. View/comment on their existing tickets

## 📊 Data Flow

### Creating a Ticket

1. User clicks "New Ticket" in dashboard
2. Fills form (title, description, priority)
3. App calls Monday GraphQL API:
   ```graphql
   mutation {
     create_item(board_id: "...", item_name: "...", column_values: "{...}")
   }
   ```
4. New item appears in Monday board
5. Dashboard refreshes automatically

### Viewing Tickets

1. Dashboard loads board items via Monday API
2. Filters by `client_email` column matching logged-in user
3. Transforms Monday items to ticket format
4. Displays in table with status/priority badges

### Comments

1. Comments are Monday "updates" on items
2. Fetched via GraphQL `items.updates` field
3. New comments created via `create_update` mutation
4. Synced in real-time with Monday

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `lib/monday-context.ts` | Monday SDK wrapper and hooks |
| `app/embed/ticket/page.tsx` | Item view (ticket detail) |
| `app/embed/dashboard/page.tsx` | Board view (ticket list) |
| `monday-app.json` | App manifest for Monday |
| `.env.local` | App credentials |
| `next.config.js` | Iframe security headers |

## 🎯 Next Steps

1. **Deploy**: Run `vercel --prod` from `client-portal/`
2. **Board Setup**: Create "Support Tickets" board with required columns
3. **App Config**: Update Monday app feature URLs with Vercel URL
4. **Test**: Install app to board and verify
5. **Share**: Add clients to board with viewer permissions

## 📝 Column IDs Reference

The app expects these column IDs in your Monday board:

- `status` - Status column (Open, In Progress, Resolved, Closed)
- `priority` - Priority column (Low, Medium, High, Critical)
- `long_text` - Long Text column (ticket description)
- `client_email` - Email column (client's email)
- `portal_id` - Text column (optional, for reference)

If your column IDs differ, update the mapping in:
- `app/embed/ticket/page.tsx` (line ~45-55)
- `app/embed/dashboard/page.tsx` (line ~55-70)

## 🐛 Troubleshooting

### Blank screen in Monday
- Check browser console for errors
- Verify Vercel URL in app features
- Ensure iframe headers in next.config.js

### Can't create tickets
- Verify board ID is correct
- Check app has `boards:write` permission
- Confirm column IDs match your board

### Seeing all tickets instead of filtered
- Check `client_email` column exists
- Verify user email from Monday context
- Review filtering logic in dashboard

## 📚 Documentation

- **MONDAY_APP_GUIDE.md** - Complete integration guide
- **DEPLOYMENT.md** - Detailed deployment steps
- **BACKEND_QUICKSTART.md** - Optional backend (not needed for basic setup)

## ✨ What You Get

✅ No separate authentication system  
✅ No separate database  
✅ All data lives in Monday  
✅ Uses Monday's permissions  
✅ Real-time sync with board  
✅ Beautiful client portal UI  
✅ Embedded in Monday interface  

---

**Your App Credentials:**
- Client ID: `7dd947daa98f280524ee4776df4f723a`
- App ID: `10672301`

**Ready to deploy!** 🚀

Run: `cd client-portal && vercel --prod`
