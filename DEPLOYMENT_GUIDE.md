# Deployment Guide

Complete deployment instructions for all components of the Gorilla Portal.

---

## Prerequisites

### Required Accounts
- ✅ Monday.com account (with API access)
- ✅ Vercel account (or alternative hosting)
- ✅ SendGrid account (for emails)
- ✅ Domain name (for custom portal URL)

### Required Tools
```bash
# Node.js and npm
node --version  # v18.0.0 or higher
npm --version   # v9.0.0 or higher

# Monday Apps CLI
npm install -g @mondaycom/apps-cli

# Vercel CLI (optional)
npm install -g vercel
```

---

## 1. Monday.com Setup

### 1.1 Create Boards

**Create Clients Board:**
```
Board Name: "Portal Clients"
Columns:
- Name (Text)
- Email (Email)
- Company (Connect Boards → Companies)
- Status (Status: Active, Inactive)
- Magic Link Token (Text) - mark as hidden
- Last Login (Date)
- Created Date (Date)
```

**Create Companies Board:**
```
Board Name: "Portal Companies"
Columns:
- Name (Text)
- Logo URL (Link)
- Primary Color (Text)
- Board IDs (Long Text)
- Status (Status: Active, Inactive)
- Created Date (Date)
```

**Create Tickets Board:**
```
Board Name: "Support Tickets"
Columns:
- Name (Text)
- Description (Long Text)
- Client (Connect Boards → Clients)
- Status (Status: Open, In Progress, Waiting, Resolved, Closed)
- Priority (Status: Low, Medium, High, Urgent)
- Assigned To (Person)
- Files (File)
- Created Date (Date)
- Resolved Date (Date)
```

### 1.2 Get API Token

1. Go to https://monday.com/developers/apps
2. Create new app or use existing
3. Click "OAuth & Permissions"
4. Generate API token with scopes:
   - `boards:read`
   - `boards:write`
   - `account:read`
   - `me:read`
5. Save token securely

### 1.3 Configure Webhooks

1. In your monday app settings
2. Add webhook URL (will be monday-code function URL)
3. Subscribe to events:
   - `create_item`
   - `change_column_value`
   - `change_status_column_value`
   - `create_update`

---

## 2. Backend Deployment (Monday Code)

### 2.1 Install Dependencies

```bash
cd apps/backend
npm install
```

### 2.2 Configure Environment Variables

Create `.env` file:
```bash
MONDAY_API_TOKEN=your_monday_api_token
MONDAY_SIGNING_SECRET=your_webhook_secret
JWT_SECRET=your_jwt_secret_key
PORTAL_BASE_URL=https://portal.yourcompany.com
DEFAULT_BOARD_ID=your_default_tickets_board_id
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourcompany.com
FROM_NAME=Your Company Support
```

### 2.3 Build Functions

```bash
npm run build
```

### 2.4 Deploy to Monday Code

```bash
# Login to monday CLI
mapps auth:login

# Initialize monday code project (first time only)
mapps code:init

# Deploy functions
npm run deploy

# Or manually:
mapps code:push
```

### 2.5 Note Function URLs

After deployment, monday will provide URLs for each function:
```
https://your-account.monday-code.com/generate-magic-link
https://your-account.monday-code.com/verify-magic-link
https://your-account.monday-code.com/get-tickets
https://your-account.monday-code.com/create-ticket
https://your-account.monday-code.com/webhook-handler
https://your-account.monday-code.com/send-notification
```

Save these URLs - you'll need them for portal configuration.

---

## 3. Client Portal Deployment

### 3.1 Update Configuration

Update `apps/client-portal/.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-account.monday-code.com
NEXT_PUBLIC_PORTAL_NAME=Your Company Support Portal
```

### 3.2 Build Portal

```bash
cd apps/client-portal
npm install
npm run build
```

### 3.3 Deploy to Vercel

**Option A: Vercel CLI**
```bash
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com
2. Import your git repository
3. Set root directory: `apps/client-portal`
4. Add environment variables
5. Deploy

**Option C: Other Platforms**
```bash
# For Netlify
npm run build
netlify deploy --prod --dir=.next

# For custom server
npm run build
npm start
```

### 3.4 Configure Custom Domain

1. In Vercel dashboard, go to Settings → Domains
2. Add your domain: `portal.yourcompany.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: portal
   Value: cname.vercel-dns.com
   ```
4. Wait for SSL certificate provisioning

---

## 4. Monday App Deployment

### 4.1 Update App Manifest

Edit `apps/monday-app/monday-app.json`:
```json
{
  "name": "Your Portal Name",
  "description": "Client support portal",
  "version": "1.0.0",
  "icon": "https://your-domain.com/app-icon.png",
  "developer": {
    "name": "Your Company",
    "email": "support@yourcompany.com",
    "url": "https://yourcompany.com"
  },
  "permissions": [
    "boards:read",
    "boards:write",
    "account:read",
    "me:read",
    "storage:read",
    "storage:write"
  ],
  "features": [
    {
      "type": "BoardView",
      "name": "Client Portal",
      "url": "https://your-monday-app.vercel.app/board-view",
      "icon": "https://your-domain.com/board-icon.png"
    },
    {
      "type": "DashboardWidget",
      "name": "Portal Dashboard",
      "url": "https://your-monday-app.vercel.app/dashboard",
      "icon": "https://your-domain.com/dashboard-icon.png"
    },
    {
      "type": "ItemView",
      "name": "Client Details",
      "url": "https://your-monday-app.vercel.app/item-view",
      "icon": "https://your-domain.com/item-icon.png"
    }
  ],
  "webhooks": {
    "enabled": true,
    "url": "https://your-account.monday-code.com/webhook-handler",
    "events": [
      "change_column_value",
      "create_item",
      "change_status",
      "create_update"
    ]
  }
}
```

### 4.2 Build Monday App

```bash
cd apps/monday-app
npm install
npm run build
```

### 4.3 Deploy App Views

Deploy the Next.js app to Vercel (same as portal):
```bash
vercel --prod
```

### 4.4 Submit to Monday Marketplace

```bash
# Push app to monday
mapps app:push

# Validate app
mapps app:validate

# Submit for review
mapps app:submit
```

---

## 5. SendGrid Configuration

### 5.1 Create SendGrid Account

1. Sign up at https://sendgrid.com
2. Verify your email
3. Create API key with "Mail Send" permissions

### 5.2 Verify Sender Domain

1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Follow DNS configuration steps
4. Wait for verification

### 5.3 Create Email Templates (Optional)

1. Go to Email API → Dynamic Templates
2. Create templates for:
   - Magic link
   - Ticket created
   - Status changed
   - New comment
3. Note template IDs for use in code

---

## 6. Testing

### 6.1 Test Backend Functions

```bash
# Test magic link generation
curl -X POST https://your-account.monday-code.com/generate-magic-link \
  -H "Authorization: YOUR_MONDAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "123", "email": "test@example.com"}'

# Test magic link verification
curl -X POST https://your-account.monday-code.com/verify-magic-link \
  -H "Content-Type: application/json" \
  -d '{"token": "abc123..."}'
```

### 6.2 Test Client Portal

1. Generate magic link for test client
2. Open link in browser
3. Verify authentication works
4. Test ticket creation
5. Test file upload
6. Test comments

### 6.3 Test Embedded App

1. Install app in your monday workspace
2. Add board view to a board
3. Verify context loads correctly
4. Test magic link generation
5. Test dashboard widget

### 6.4 Test Webhooks

1. Create test item in monday
2. Check webhook handler logs
3. Verify email notification sent
4. Update item status
5. Check notification received

---

## 7. Monitoring & Maintenance

### 7.1 Monday Code Logs

```bash
# View function logs
mapps code:logs --function=webhook-handler

# View all logs
mapps code:logs
```

### 7.2 Vercel Logs

1. Go to Vercel dashboard
2. Select your deployment
3. Click "Logs" tab
4. Filter by function, time, etc.

### 7.3 SendGrid Stats

1. Go to SendGrid dashboard
2. View email delivery stats
3. Check bounce/spam rates
4. Monitor API usage

### 7.4 Error Tracking

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- DataDog for infrastructure monitoring

---

## 8. Production Checklist

### Security
- [ ] All API keys stored as environment variables
- [ ] JWT secret is strong and unique
- [ ] Webhook signature verification enabled
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints

### Performance
- [ ] Monday API calls optimized (batching, caching)
- [ ] Portal images optimized
- [ ] CDN configured for static assets
- [ ] Database queries indexed
- [ ] Response times monitored

### Reliability
- [ ] Error handling in all functions
- [ ] Fallback for failed email sends
- [ ] Retry logic for API calls
- [ ] Proper logging throughout
- [ ] Health check endpoints

### User Experience
- [ ] Loading states for all actions
- [ ] Error messages user-friendly
- [ ] Success confirmations shown
- [ ] Mobile responsive
- [ ] Accessibility compliance

### Documentation
- [ ] User guide published
- [ ] Admin setup guide created
- [ ] API documentation complete
- [ ] Troubleshooting guide available
- [ ] Video tutorials recorded

---

## 9. Rollback Procedure

### If Backend Deployment Fails

```bash
# Rollback to previous version
mapps code:rollback --version=previous

# Or specify version
mapps code:rollback --version=1.0.0
```

### If Portal Deployment Fails

```bash
# Vercel rollback
vercel rollback

# Or redeploy previous commit
git checkout <previous-commit>
vercel --prod
```

### If Monday App Breaks

```bash
# Unpublish app
mapps app:unpublish

# Fix issues and redeploy
mapps app:push
```

---

## 10. Scaling Considerations

### For High Traffic

1. **Monday API Rate Limits**
   - Implement request queuing
   - Use webhooks instead of polling
   - Cache frequently accessed data

2. **Backend Functions**
   - monday code auto-scales
   - Monitor cold start times
   - Optimize function size

3. **Portal Hosting**
   - Use Vercel Edge Network
   - Enable ISR for static pages
   - Implement CDN for assets

4. **Email Sending**
   - Batch notifications when possible
   - Use SendGrid's bulk send API
   - Implement email queue

---

## Support

For deployment issues:
- Check logs first
- Review this guide
- Contact: support@yourcompany.com

---

**Last Updated**: November 13, 2025
