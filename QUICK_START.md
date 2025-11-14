# ⚡ QUICK START GUIDE

**Get your Gorilla Portal running in 30 minutes!**

---

## 📋 Prerequisites Checklist

Before you start, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Monday.com account with API access
- [ ] Git repository initialized
- [ ] 30 minutes of focused time ⏰

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies (5 minutes)

```bash
# Navigate to project root
cd "Monday Vibe Project"

# Install all workspace dependencies
npm install
npm install --workspaces

# Verify installation
npm run lint --workspaces --if-present
```

**Expected output**: Dependencies installed for root, packages/types, packages/monday-sdk, apps/backend

---

### Step 2: Move Client Portal (2 minutes)

```bash
# Move existing client portal to apps/
mv client-portal apps/client-portal

# Verify the move
ls apps/client-portal
```

**You should see**: `app/`, `components/`, `lib/`, `package.json`, etc.

---

### Step 3: Update Client Portal Dependencies (3 minutes)

Edit `apps/client-portal/package.json` and add:

```json
{
  "dependencies": {
    "@portal/types": "*",
    "@portal/monday-sdk": "*",
    // ... existing dependencies
  }
}
```

Then install:
```bash
cd apps/client-portal
npm install
```

---

### Step 4: Configure Monday.com (10 minutes)

**A. Get API Token:**
1. Go to https://monday.com/developers/apps
2. Create new app or select existing
3. Go to OAuth & Permissions
4. Generate token with scopes: `boards:read`, `boards:write`, `account:read`
5. Copy token

**B. Create Boards:**

**Clients Board:**
```
Name: Portal Clients
Columns:
- Name (Text)
- Email (Email)
- Company (Connect Boards)
- Status (Status: Active, Inactive)
- Created Date (Date)
```

**Tickets Board:**
```
Name: Support Tickets
Columns:
- Name (Text)
- Description (Long Text)
- Client (Connect Boards → Portal Clients)
- Status (Status: Open, In Progress, Resolved)
- Priority (Status: Low, Medium, High, Urgent)
- Created Date (Date)
```

**C. Note Board IDs:**
- Click board → Look at URL: `monday.com/boards/123456789`
- Save these IDs - you'll need them

---

### Step 5: Configure Backend Environment (3 minutes)

Create `apps/backend/.env`:

```bash
MONDAY_API_TOKEN=your_token_from_step_4
JWT_SECRET=your-super-secret-key-change-this-to-something-random
DEFAULT_BOARD_ID=your_tickets_board_id_from_step_4
PORTAL_BASE_URL=http://localhost:3000
SENDGRID_API_KEY=skip-for-now
```

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 6: Test Backend Functions Locally (5 minutes)

```bash
cd apps/backend

# Build backend
npm run build

# Test that it compiles without errors
# (Errors are expected until monday-code deployment)
```

**Note**: You can't run these locally yet - they need monday-code infrastructure. We'll deploy in Step 8.

---

### Step 7: Update Client Portal API Calls (2 minutes)

Create `apps/client-portal/.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_PORTAL_NAME=Your Company Support Portal
```

**Note**: After deploying backend, you'll update this with the real monday-code URL.

---

### Step 8: Deploy Backend to Monday Code (Optional - 10 minutes)

```bash
# Install monday CLI
npm install -g @mondaycom/apps-cli

# Login
mapps auth:login

# Navigate to backend
cd apps/backend

# Initialize project (first time only)
mapps code:init

# Deploy
npm run deploy
```

**After deployment**, monday will give you function URLs:
```
https://your-account.monday-code.com/generate-magic-link
https://your-account.monday-code.com/verify-magic-link
https://your-account.monday-code.com/get-tickets
...
```

Save these URLs!

---

### Step 9: Test the Portal Locally (5 minutes)

```bash
cd apps/client-portal

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

**Test these flows:**
1. Demo mode button should work
2. Dashboard should load (might be empty)
3. Create ticket form should appear
4. UI components should render

---

## ✅ Success Criteria

You've successfully set up the portal if:
- [ ] No TypeScript errors in terminal
- [ ] Portal loads at localhost:3000
- [ ] Demo mode authenticates
- [ ] Dashboard page renders
- [ ] No console errors in browser

---

## 🐛 Troubleshooting

### "Cannot find module '@portal/types'"
**Solution**: Run `npm install --workspaces` from project root

### "Module not found" errors in portal
**Solution**: 
```bash
cd apps/client-portal
npm install
```

### Backend deployment fails
**Solution**: 
1. Verify you're logged in: `mapps auth:status`
2. Check API token has correct permissions
3. Ensure you're in apps/backend directory

### Portal shows connection errors
**Solution**: Backend isn't deployed yet - use demo mode for now

---

## 📚 What to Read Next

Now that you're set up:
1. **NEXT_STEPS.md** - Detailed next actions
2. **GORILLA_IMPLEMENTATION_PLAN.md** - Full roadmap
3. **DEPLOYMENT_GUIDE.md** - Production deployment

---

## 🎯 Your 30-Minute Checkpoint

At this point, you should have:
- ✅ All dependencies installed
- ✅ Client portal moved to apps/
- ✅ Monday.com boards created
- ✅ API token configured
- ✅ Backend ready to deploy (or deployed)
- ✅ Portal running locally

**Next**: Start customizing the portal and building embedded monday views!

---

## 💪 Power User Tips

**Speed up development:**
```bash
# Run portal and watch for changes
npm run dev:portal

# Lint all code
npm run lint:all

# Build everything
npm run build:all
```

**Clean slate:**
```bash
# Remove all node_modules
npm run clean

# Reinstall everything
npm install --workspaces
```

**VS Code setup:**
```bash
# Recommended extensions:
# - ESLint
# - Prettier
# - TypeScript + JavaScript
```

---

## 🆘 Need Help?

**Check these resources in order:**
1. This QUICK_START.md
2. NEXT_STEPS.md
3. DEPLOYMENT_GUIDE.md
4. README.md

**Still stuck?**
- Review error messages carefully
- Check monday.com developer docs
- Verify all environment variables are set
- Ensure API token has correct permissions

---

## 🎉 You're Ready!

You've completed the quick start! The foundation is solid and ready for building.

**Recommended next steps:**
1. Test magic link authentication end-to-end
2. Create a test client in monday Clients board
3. Generate a magic link
4. Test the full portal flow

**Happy building!** 🚀
