# 🚀 VERCEL DEPLOYMENT GUIDE

## Quick Deploy (15 Minutes)

Since you already have a Vercel account and application set up, deployment is super simple!

---

## Step 1: Set Environment Variables in Vercel (5 minutes)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (client-portal)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

### Required Variables
```
NEXT_PUBLIC_MONDAY_API_TOKEN = your_monday_api_token
MONDAY_API_TOKEN = your_monday_api_token
JWT_SECRET = (generate random 64-char string)
PORTAL_BASE_URL = https://your-app.vercel.app
NEXT_PUBLIC_PORTAL_BASE_URL = https://your-app.vercel.app
```

### Board IDs (Already configured in code, but for reference)
```
WORKSPACE_ID = 13302651
USERS_BOARD_ID = 18379351659
SERVICE_PROVIDERS_BOARD_ID = 18379446736
SITES_BOARD_ID = 18380394514
PROJECTS_BOARD_ID = 18380394647
MANAGEMENT_PORTAL_BOARD_ID = 18379040651
```

**Get your Monday API token**: https://redsis.monday.com/ → Your Profile (bottom left) → Developers → API v2 Token

**Generate JWT_SECRET**: Run this in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 2: Deploy to Vercel (2 minutes)

### Option A: Deploy via Git (Recommended)
```bash
# Commit your changes
git add .
git commit -m "Phase 3 complete: Multi-tenant architecture ready"
git push

# Vercel will auto-deploy from your connected repo
```

### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI (if not already)
npm i -g vercel

# Deploy
cd apps/client-portal
vercel --prod
```

### Option C: Manual Deploy
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments"
4. Click "Redeploy" button

---

## Step 3: Deploy Backend to Monday Code (30 minutes)

After Vercel deployment completes, you'll have your live URL (e.g., `https://your-app.vercel.app`)

### Deploy Magic Link Functions

1. Go to: https://redsis.monday.com/
2. Navigate to: **Integrations** → **Monday Code**

#### Function 1: generate-magic-link
- Click "**New Function**"
- Name: `generate-magic-link`
- Upload: `apps/backend/src/generate-magic-link-simple.ts`
- Environment Variables:
  - `PORTAL_BASE_URL` = `https://your-app.vercel.app` (your Vercel URL)
  - `JWT_SECRET` = (same value from Step 1)
- Click "**Save**"
- Copy the function URL

#### Function 2: verify-magic-link
- Click "**New Function**"
- Name: `verify-magic-link`
- Upload: `apps/backend/src/verify-magic-link-simple.ts`
- Environment Variables:
  - `JWT_SECRET` = (same value from Step 1)
- Click "**Save**"
- Copy the function URL

### Update Vercel Environment Variables
Go back to Vercel → Settings → Environment Variables and add:
```
MONDAY_CODE_GENERATE_MAGIC_LINK_URL = https://your-monday-code-url-1
MONDAY_CODE_VERIFY_MAGIC_LINK_URL = https://your-monday-code-url-2
```

**Redeploy** to pick up new env vars:
```bash
vercel --prod
```

---

## Step 4: Configure Monday.com Automations (1 hour)

Go to: https://redsis.monday.com/boards/18380394647 (Projects Board)

Click "**Automate**" (top right) and create these:

### 1. Site Metrics Sync
```
When: An item is created or deleted in Projects board
Then: Count all items connected to each Site
      Update that Site's "Active Projects" number column
```

### 2. Project Metrics Sync
```
When: An item is created or deleted in Management Portal board
Then: Count all items connected to each Project
      Update that Project's "Total Tickets" number column
```

### 3. New Site Setup
```
When: An item is created in Sites board
Then: Create an item in Projects board
      Set name to "Main Project"
      Connect to the new Site
```

### 4. New User Default
```
When: An item is created in Users board
Then: Set "User Type" column to "Email User"
```

### 5. Service Provider Notifications (Optional)
```
When: "Status" column changes in Projects board
Then: Send notification to connected Service Provider
```

---

## Step 5: Test Your Deployment (15 minutes)

### Visit Your Live App
Open: `https://your-app.vercel.app`

### Test Checklist
- [ ] **Magic Link Auth**: Enter email, receive link, click to login
- [ ] **PIN Auth**: Select PIN user, enter 4-digit code, login
- [ ] **Create Site**: Add new site, verify automation creates default project
- [ ] **Create Project**: 
  - Create with "Master Tickets" routing
  - Create with "Dedicated Board" routing
- [ ] **Create Ticket**: Select project, create ticket, verify it routes correctly
- [ ] **Check Metrics**: Verify "Active Projects" and "Total Tickets" update automatically

---

## Verification Commands

### Check Deployment Status
```bash
# View recent deployments
vercel ls

# View deployment logs
vercel logs
```

### Monitor Production
```bash
# Tail production logs
vercel logs --follow
```

---

## Quick Reference

### Your Vercel Project
- **Dashboard**: https://vercel.com/dashboard
- **Live URL**: https://your-app.vercel.app
- **Deployment Logs**: Vercel dashboard → Your Project → Deployments

### Your Monday.com Boards
- **Sites Board**: https://redsis.monday.com/boards/18380394514
- **Projects Board**: https://redsis.monday.com/boards/18380394647
- **Users Board**: https://redsis.monday.com/boards/18379351659
- **Management Portal** (Tickets): https://redsis.monday.com/boards/18379040651

### Monday Code Functions
- **Monday Code**: https://redsis.monday.com/ → Integrations → Monday Code
- `generate-magic-link` function
- `verify-magic-link` function

---

## Troubleshooting

### Build Fails in Vercel
```bash
# Check build locally first
cd apps/client-portal
npm install
npm run build
```

### Environment Variables Not Working
- Make sure to redeploy after adding env vars
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces in values

### Magic Link Not Working
- Verify Monday Code functions deployed successfully
- Check JWT_SECRET matches in Vercel and Monday Code
- Verify PORTAL_BASE_URL is your live Vercel URL

### Automations Not Triggering
- Check automation is "Active" in Monday.com
- Test with manual board changes
- Check Monday.com notification center for errors

---

## Post-Deployment Cleanup (Optional)

After confirming everything works:

### Remove Password Columns
```bash
# Run this script after new auth confirmed working
node -e "
const fetch = require('node-fetch');
const token = 'your_monday_token';

// Delete from Users board
fetch('https://api.monday.com/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': token },
  body: JSON.stringify({
    query: 'mutation { delete_column(board_id: 18379351659, column_id: \"text_mkxpxyrr\") { id } }'
  })
});

// Delete from Service Providers board
fetch('https://api.monday.com/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': token },
  body: JSON.stringify({
    query: 'mutation { delete_column(board_id: 18379446736, column_id: \"text_mkxpb7j4\") { id } }'
  })
});
"
```

---

## Success Criteria ✅

Your deployment is successful when:
- ✅ Vercel build completes without errors
- ✅ App loads at your Vercel URL
- ✅ Magic link authentication works
- ✅ PIN authentication works
- ✅ Sites and Projects can be created
- ✅ Tickets route to correct board based on project settings
- ✅ Metrics update automatically

---

## Support

**Documentation**:
- `START_HERE.md` - Quick start guide
- `PRODUCTION_READY.md` - Complete deployment details
- `DEPLOYMENT_READINESS.md` - Architecture overview

**Monitoring**:
- Vercel logs: `vercel logs --follow`
- Browser console: F12 → Console tab
- Monday.com: Activity log in each board

---

**Estimated Total Time**: 
- Vercel setup: 5 min
- Deploy: 2 min
- Monday Code: 30 min
- Automations: 1 hour
- Testing: 15 min
- **Total: ~2 hours**

🎉 **You're ready to deploy!**
