# Quick Setup Guide - Multi-Tenant Client Portal

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Monday.com account with API access
- Vercel account (or any Next.js hosting)
- Node.js 18+ installed

### Step 1: Verify Board Structure

Run the architecture test to verify your Monday.com setup:

```bash
# Set your Monday.com API token
export NEXT_PUBLIC_MONDAY_API_TOKEN="your_token_here"

# Run test
node test-architecture.js
```

**Expected output:**
```
✅ Found X users in User Board
✅ Found X companies in Company Board
✅ Company boards accessible with correct columns
```

If you see errors, follow the manual setup below.

---

## 📋 Manual Board Setup

### Board 1: User Board (ID: 18379351659)

**Purpose**: Store user accounts and login credentials

| Column | Column ID | Type | Required |
|--------|-----------|------|----------|
| Name | `name` | Name | ✅ |
| Email | `email_mkxpm2m0` | Email | ✅ |
| Password | `text_mkxpxyrr` | Text | ✅ |
| Company | `dropdown_mkxpsjwd` | Dropdown | ✅ |

**Setup Steps:**
1. Open Monday.com
2. Go to board ID `18379351659` (or create new board named "Users")
3. Add columns with exact names above
4. For "Company" dropdown: Link to Company Board (see below)

**Sample User:**
```
Name: John Doe
Email: john@acmecorp.com
Password: demo123
Company: Acme Corp (from dropdown)
```

---

### Board 2: Company Board (ID: 18379404757)

**Purpose**: Store companies and their ticket board IDs

| Column | Column ID | Type | Required |
|--------|-----------|------|----------|
| Name | `name` | Name | ✅ |
| Status | `status` | Status | ✅ |
| Created | `date4` | Date | Optional |
| Board ID | `dropdown_mkxpakmh` | Dropdown | ✅ |

**Setup Steps:**
1. Go to board ID `18379404757` (or create "Companies")
2. Add columns with exact names
3. For "Board ID" column: Create dropdown with board IDs as options

**Sample Company:**
```
Name: Acme Corp
Status: Active
Created: 2024-01-15
Board ID: 18379500123 (ticket board ID from dropdown)
```

---

### Board 3: Company Ticket Boards (Dynamic)

**Purpose**: One board per company to store their tickets

**Standard Columns** (auto-created by portal):
- Name (ticket title)
- Status (Open/In Progress/Resolved/Closed)
- Client Email (user's email)
- Priority (Low/Medium/High/Urgent)
- Description (long text)

**Manual Creation** (if not using portal):
1. Create board: "Acme Corp - Tickets"
2. Add columns above
3. Copy board ID (from URL: monday.com/boards/[BOARD_ID])
4. Add board ID to Company Board → Board ID column

---

## 🔧 Environment Setup

### Local Development

Create `.env.local` in `apps/client-portal/`:

```bash
NEXT_PUBLIC_MONDAY_API_TOKEN="your_monday_api_token_here"
```

Get your token:
1. Monday.com → Profile → Developers
2. Create new API token
3. Required scopes: `boards:read`, `boards:write`, `items:read`, `items:write`

### Vercel Deployment

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variable:
   - Key: `NEXT_PUBLIC_MONDAY_API_TOKEN`
   - Value: Your Monday.com API token
4. Deploy

---

## 👥 Creating Your First Company

### Option 1: Using Management Portal (Recommended)

1. **Deploy app to Vercel** (or host locally)
2. **In Monday.com**:
   - Go to Company Board (18379404757)
   - Click "+ View"
   - Add "Board View"
   - Set URL: `https://your-domain.vercel.app/embed/admin`
3. **Open the Board View in Monday.com**
4. **Click "New Company"**
5. **Enter company name** (e.g., "Acme Corporation")
6. **Click "Create Company"**

✅ System automatically creates ticket board and sets up columns!

### Option 2: Manual Creation

1. **Create ticket board**:
   ```
   Monday.com → Create Board → "Acme Corp - Tickets"
   ```

2. **Add columns**:
   - Client Email (Email type)
   - Priority (Status type)
   - Description (Long Text type)

3. **Get board ID**:
   - Open board
   - Copy from URL: `monday.com/boards/[BOARD_ID]`

4. **Add to Company Board**:
   - Go to Company Board (18379404757)
   - Add row: "Acme Corp"
   - Set Status: "Active"
   - Set Board ID: [BOARD_ID from step 3]

5. **Create user in User Board**:
   - Name: John Doe
   - Email: john@acme.com
   - Password: demo123
   - Company: Acme Corp (select from dropdown)

---

## 🧪 Testing the System

### Test 1: Architecture Verification

```bash
node test-architecture.js
```

Should show:
- ✅ Users with companies assigned
- ✅ Companies with board IDs
- ✅ Ticket boards accessible

### Test 2: Login Flow

1. Go to: `https://your-domain.vercel.app/login`
2. Enter user credentials
3. Should redirect to dashboard
4. Check browser console for:
   ```
   ✅ Found company ticket board: 18379500123 for Acme Corp
   ```

### Test 3: Ticket Creation

1. Click "New Ticket"
2. Fill form:
   - Title: "Test ticket"
   - Description: "Testing the system"
   - Priority: Medium
3. Click "Create"
4. Verify in Monday.com:
   - Go to company's ticket board
   - Should see new ticket
   - Email should be auto-filled

---

## 🐛 Troubleshooting

### "No board selected" Error

**Cause**: User's company doesn't have a ticket board

**Fix**:
1. Check User Board → User's Company column
2. Find that company in Company Board
3. Ensure Board ID column is set
4. Create board if missing

### Login Fails

**Cause**: Email/password mismatch

**Fix**:
1. Open User Board (18379351659)
2. Find user row
3. Verify Email and Password columns
4. Ensure values match exactly (case-sensitive)

### Tickets Not Showing

**Cause**: Email mismatch

**Fix**:
1. Check user's email in User Board
2. Check ticket's "Client Email" column
3. Must match exactly
4. Create ticket through portal (auto-fills email)

### Column Not Found

**Cause**: Board missing expected column

**Fix**:
1. Open company's ticket board
2. Add missing column (e.g., "Client Email")
3. Portal will auto-detect on next load
4. Or use management portal to recreate board

---

## 📱 Monday.com App Installation

### Configure Monday App

1. **Update `monday-app.json`**:
   ```json
   {
     "name": "RedsisLab Client Portal",
     "features": {
       "boardView": {
         "url": "https://your-domain.vercel.app/embed/admin",
         "height": 800
       }
     }
   }
   ```

2. **Install in Monday.com**:
   ```bash
   cd apps/client-portal
   mapps code:push
   ```

3. **Add to Company Board**:
   - Go to Company Board
   - Click "+ View"
   - Select "RedsisLab Client Portal"
   - Management interface loads!

---

## 🎯 Usage Workflow

### For Administrators

1. **Add New Company**:
   - Open management portal in Monday.com
   - Click "New Company"
   - System creates everything automatically

2. **Add New User**:
   - Go to User Board
   - Create new item
   - Fill: Name, Email, Password
   - Select Company from dropdown
   - User can now login!

### For Customers

1. **Login**:
   - Go to portal URL
   - Enter email + password
   - System finds their company board

2. **View Tickets**:
   - Automatically filtered by email
   - Shows only their tickets

3. **Create Ticket**:
   - Click "New Ticket"
   - Fill form
   - Email auto-populated
   - Goes to their company's board

---

## 🔒 Security Checklist

- [ ] API token stored in environment variables (not committed)
- [ ] User passwords in separate column (consider encryption)
- [ ] Tickets filtered by email (no cross-company access)
- [ ] Monday.com board permissions configured
- [ ] Vercel environment variables secured
- [ ] HTTPS enabled on production

---

## 📊 Monitoring

### Key Metrics to Watch

1. **User Activity**:
   - Login success/failure rates
   - Active users per company

2. **Ticket Volume**:
   - Tickets created per company
   - Response times

3. **System Health**:
   - API rate limits
   - Error rates
   - Column cache hit rate

### Console Logs

Development mode shows detailed logs:
```
🔍 Dynamic column mapping: {...}
📧 User email: john@acme.com
📋 Board ID: 18379500123
✅ Ticket created successfully
```

---

## 🚀 Next Steps

1. ✅ Complete board setup
2. ✅ Deploy to Vercel
3. ✅ Create test company
4. ✅ Create test user
5. ✅ Test login → ticket creation flow
6. ✅ Install Monday.com app
7. 🔜 Train administrators
8. 🔜 Onboard customers

---

## 📚 Additional Resources

- **Architecture Docs**: `MULTI_TENANT_ARCHITECTURE.md`
- **Implementation Details**: `IMPLEMENTATION_COMPLETE.md`
- **Test Script**: `test-architecture.js`
- **Monday.com API**: https://developer.monday.com/api-reference

---

## 💬 Support

Need help? Check:
1. Run `node test-architecture.js` for diagnostics
2. Check browser console for detailed errors
3. Review Monday.com board structures
4. Verify environment variables

---

**You're ready to launch! 🎉**

Start with creating one test company and user, then scale up as needed.
