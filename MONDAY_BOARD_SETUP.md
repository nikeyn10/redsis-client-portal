# Connecting Your Monday Board to the Portal

## 🎯 Overview
This guide shows you how to connect your Monday.com board to the REDSIS Client Portal app.

## 📋 Prerequisites

✅ **Monday.com account** with admin access  
✅ **Board created** for support tickets  
✅ **App installed** in Monday developer portal

---

## Step 1: Set Up Your Monday Board

### Required Columns

Your board must have these columns for the portal to work:

| Column Name | Column Type | Column ID* | Purpose |
|-------------|-------------|-----------|---------|
| Item Name | Name (built-in) | `name` | Ticket title |
| Status | Status | `status` | Ticket status (Open, In Progress, Resolved, Closed) |
| Priority | Status | `priority` | Priority level (Low, Medium, High, Urgent) |
| Client Email | Email | `client_email` | Client's email address for filtering |
| Description | Long Text | `description` or `long_text` | Detailed ticket description |

**Column ID* = The internal ID Monday uses (usually lowercase of name with underscores)

### How to Add Columns:

1. Open your Monday board
2. Click **"+ Add Column"** on the right
3. For each required column:
   - Choose the correct **Type** from the table above
   - Name it exactly as shown (or customize in app settings)
   - Click **Create**

### Status Column Labels:
Set up these status labels (Monday → Column Settings → Labels):
- 🟢 **Open** (new tickets)
- 🟡 **In Progress** (being worked on)
- 🔵 **Resolved** (fixed, awaiting client)
- ⚫ **Closed** (completed)

### Priority Column Labels:
- 🟢 **Low**
- 🟡 **Medium** 
- 🟠 **High**
- 🔴 **Urgent**

---

## Step 2: Install the App in Monday

### Option A: From Developer Portal (Testing)

1. Go to: https://monday.com/developers/apps
2. Click **"Create App"**
3. Choose **"Build from Scratch"**
4. Enter app details:
   - **App Name:** REDSIS Client Portal
   - **Description:** Client support ticket portal
   - **Category:** Productivity

5. **Add Features:**
   
   **Board View Feature:**
   - Type: `Board View`
   - Name: `Client Dashboard`
   - URL: `https://monday-vibe-portal.vercel.app/embed/dashboard`
   - Description: Dashboard of all tickets
   
   **Item View Feature:**
   - Type: `Item View`
   - Name: `Ticket Details`
   - URL: `https://monday-vibe-portal.vercel.app/embed/ticket`
   - Description: Individual ticket view

6. **Add OAuth Scopes:**
   - `me:read`
   - `boards:read`
   - `boards:write`
   - `updates:read`
   - `updates:write`

7. Click **"Save"**
8. Click **"Install"** to add to your workspace

### Option B: Upload monday-app.json (Advanced)

If Monday supports app manifest upload:
1. Use the `monday-app.json` file from your project
2. Upload it in the developer portal
3. Review and confirm settings

---

## Step 3: Add the App to Your Board

### Add Board View:

1. Open your support tickets board
2. Click **"+ Add View"** at the top
3. Select **"Apps"**
4. Find **"REDSIS Client Portal"** or **"Client Dashboard"**
5. Click to add it
6. The dashboard will appear showing all tickets from the board

### Add Item View (Optional):

1. Click on any item/ticket in your board
2. In the item detail panel, look for **"Apps"** section
3. Click **"Add app"**
4. Select **"Ticket Details"**
5. This shows ticket details when you open individual items

---

## Step 4: Configure Column Mapping (If Needed)

If you used different column names, update the app settings:

1. In Monday, go to **Apps** → **Installed Apps**
2. Find **REDSIS Client Portal**
3. Click **Settings**
4. Update these values to match YOUR column IDs:
   - Client Email Column: `your_email_column_id`
   - Description Column: `your_description_column_id`
   - Priority Column: `your_priority_column_id`
   - Status Column: `your_status_column_id`

### How to Find Column IDs:
1. Open your board
2. Click on a column header → **Settings**
3. Look for **"Column ID"** (usually shown in developer mode)
4. Or use the default: lowercase name with underscores (e.g., "Client Email" → `client_email`)

---

## Step 5: Test the Integration

### Test Board View:

1. Switch to the **"Client Dashboard"** view in your board
2. You should see:
   - ✅ All items from the board listed as tickets
   - ✅ Ability to create new tickets
   - ✅ Status and priority badges
   - ✅ Search and filter functionality

### Test Creating a Ticket:

1. Click **"+ New Ticket"** in the portal
2. Fill in:
   - Title
   - Description
   - Priority
3. Click **"Create"**
4. Check that a new item appears in your Monday board

### Test Client Email Filtering:

1. Add your email to the `client_email` column on some items
2. The portal should filter to show only items with your email (if not admin)

---

## 🎨 Customization Options

### Board Settings:

You can customize how the portal interacts with your board:

**Automation Ideas:**
- Auto-send magic links when new tickets are created
- Notify clients when status changes to "Resolved"
- Auto-close tickets after 7 days in "Resolved" status

**Additional Columns (Optional):**
- `assigned_to` - Who's working on the ticket
- `due_date` - Deadline for resolution
- `tags` - Categorization
- `portal_link` - Store magic link for client access

---

## 📊 Understanding Board IDs

Your **Board ID** is needed for magic links. Find it:

1. Open your board in Monday.com
2. Look at the URL:
   ```
   https://redsis.monday.com/boards/18379040651
                                    ^^^^^^^^^^^
                                    This is your Board ID
   ```
3. Use this ID in magic link templates

**Current Board ID:** `18379040651` (from your testing)

---

## 🔗 Generating Client Magic Links

### Manual Magic Link Template:
```
https://monday-vibe-portal.vercel.app/login?token=UNIQUE_TOKEN&email=CLIENT_EMAIL&boardId=YOUR_BOARD_ID
```

### Example:
```
https://monday-vibe-portal.vercel.app/login?token=ticket-123-2025&email=client@example.com&boardId=18379040651
```

### Automation Recipe:

**When:** Item is created with Client Email  
**Then:** Create text in "Portal Link" column:
```
https://monday-vibe-portal.vercel.app/login?token={item.id}-{today}&email={item.client_email}&boardId=18379040651
```

**Then:** Send email to `{item.client_email}`:
```
Subject: Your Support Ticket Portal Access

Hi there,

Access your support tickets here:
{item.Portal Link}

This link is unique to you and shows all your tickets.

Best regards,
REDSIS Support
```

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Board has all required columns (Status, Priority, Client Email, Description)
- [ ] App is installed in Monday workspace
- [ ] Board View appears when you add it to your board
- [ ] Creating a ticket from portal creates Monday item
- [ ] Client email filtering works correctly
- [ ] Magic links redirect to client portal
- [ ] Clients see only their tickets

---

## 🆘 Troubleshooting

### Portal shows "Not Embedded in Monday.com"
- ✅ Check that you're accessing via Board View, not direct URL
- ✅ Verify app URLs are correct in Monday developer portal
- ✅ Clear browser cache and reload

### Board View shows blank/loading forever
- ✅ Check browser console for errors (F12)
- ✅ Verify Monday API permissions are granted
- ✅ Check that boardId is being passed in URL

### Can't create tickets
- ✅ Verify OAuth scopes include `boards:write`
- ✅ Check column IDs match between portal and board
- ✅ Ensure status/priority labels exist on board

### Client can't see their tickets
- ✅ Verify `client_email` column exists and has data
- ✅ Check email matches exactly (case-sensitive)
- ✅ Ensure boardId in magic link is correct

---

## 🚀 Next Steps

1. **Set up your Monday board** with required columns
2. **Install the app** from developer portal
3. **Add Board View** to see the dashboard
4. **Test creating tickets** from the portal
5. **Configure magic link automation** for clients
6. **Send test link** to yourself to verify client portal

---

## 📞 Support

If you need help:
- Check the browser console for error messages (F12)
- Verify all column names/IDs are correct
- Review the `CLIENT_PORTAL_ACCESS.md` for magic link setup
- Check Monday API permissions in developer portal

**Your portal is ready to use!** Just follow the steps above to connect your board. 🎉
