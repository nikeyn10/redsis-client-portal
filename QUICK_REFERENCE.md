# 🚀 Quick Reference - RedsisLab Multi-Tenant Portal

## ✨ NEW FEATURES (January 2025)

### 📎 File Upload
- **Location**: New Ticket Form + Ticket Comments
- **Max Size**: 10MB per file
- **Types**: PDF, DOC, Images, Excel, Text
- **Restriction**: Disabled on closed tickets

### 📊 Export Features
- **Individual Tickets**: PDF (text) + Excel (CSV) from ticket detail
- **All Tickets**: PDF (report) + Excel (CSV) from dashboard
- **Auto-generated filenames** with date stamps

### 📈 Metrics Dashboard
Four stat cards on client dashboard:
1. **Total Tickets** - Overall count
2. **Open Tickets** - Active tickets (green)
3. **Closed Tickets** - Resolved tickets (blue)
4. **Avg Response Time** - Hours (yellow)

### 📚 New Documentation
- [CLIENT_PORTAL_ENHANCEMENTS.md](./CLIENT_PORTAL_ENHANCEMENTS.md) - Full feature guide
- [FEATURE_IMPLEMENTATION_SUMMARY.md](./FEATURE_IMPLEMENTATION_SUMMARY.md) - Visual summary

---

## 🌐 Live URLs

**Portal**: https://monday-vibe-portal-hg7r9rfa9-mike-habibs-projects.vercel.app

| Endpoint | Use |
|----------|-----|
| `/login` | Customer login |
| `/client/dashboard` | Customer tickets |
| `/embed/admin` | Company management (Monday.com) |

---

## 📋 Monday.com Boards

| Board | ID | Purpose |
|-------|----|----|
| User Board | `18379351659` | User accounts & login |
| Company Board | `18379404757` | Companies & board routing |
| Ticket Boards | Dynamic | One per company |

---

## 🔑 Critical Columns

### User Board (18379351659)
- `name` - User name
- `email_mkxpm2m0` - Login email
- `text_mkxpxyrr` - Password
- `dropdown_mkxpsjwd` - Company (links to Company Board)

### Company Board (18379404757)
- `name` - Company name
- `status` - Active/Deactivated
- `dropdown_mkxpakmh` - **Ticket Board ID** (routing)

### Ticket Boards (Dynamic)
- `name` - Ticket title
- `status` - Open/In Progress/Resolved/Closed
- Email column - User's email (dynamic ID)
- Priority column - Low/Medium/High/Urgent (dynamic ID)
- Description column - Long text (dynamic ID)

---

## ⚡ Quick Tasks

### Create Company
1. Open Company Board in Monday.com
2. Open "Company Management" view
3. Click "New Company"
4. Enter name → Creates board automatically

### Add User
1. Open User Board (18379351659)
2. Add item with:
   - Name
   - Email
   - Password
   - Company (from dropdown)

### Test Login
1. Go to `/login`
2. Enter user email + password
3. System finds company → loads their board

---

## 🐛 Quick Fixes

**Login fails**: Check User Board for exact email/password

**No tickets show**: Verify company has Board ID in `dropdown_mkxpakmh`

**Can't create company**: Check Monday API token has `boards:write` scope

**Blank management portal**: Must open from Monday.com iframe

---

## 📊 Vercel Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Check environment variables
vercel env ls
```

---

## 🎯 Architecture Flow

```
User Login
    ↓
User Board (18379351659)
    ↓ (dropdown_mkxpsjwd)
Company Board (18379404757)
    ↓ (dropdown_mkxpakmh)
Company Ticket Board (Dynamic ID)
    ↓
Dashboard with Tickets
```

---

## 📚 Documentation Files

- `DEPLOYMENT.md` - Deployment info (this deployment)
- `SETUP_GUIDE.md` - Step-by-step setup
- `MULTI_TENANT_ARCHITECTURE.md` - System architecture
- `IMPLEMENTATION_COMPLETE.md` - Feature list

---

## ✅ Health Check

Run diagnostics:
```bash
export NEXT_PUBLIC_MONDAY_API_TOKEN="your_token"
node test-architecture.js
```

Should show:
- ✅ Users with companies
- ✅ Companies with board IDs
- ✅ Boards accessible

---

**Status**: ✅ **DEPLOYED & LIVE**  
**Updated**: November 14, 2025
