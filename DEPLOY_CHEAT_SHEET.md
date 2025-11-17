# ⚡ DEPLOYMENT CHEAT SHEET

**Status**: 98% Complete | **Time to Live**: 2 hours

---

## 1️⃣ Vercel Environment Variables (5 min)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these:
```
NEXT_PUBLIC_MONDAY_API_TOKEN = eyJhbGc... (from Monday.com)
MONDAY_API_TOKEN = eyJhbGc... (same as above)
JWT_SECRET = (run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PORTAL_BASE_URL = https://your-app.vercel.app
NEXT_PUBLIC_PORTAL_BASE_URL = https://your-app.vercel.app
```

Get Monday token: https://redsis.monday.com/ → Profile → Developers → API

---

## 2️⃣ Deploy to Vercel (2 min)

```bash
git add .
git commit -m "Phase 3 complete"
git push
```

Vercel auto-deploys! ✅

---

## 3️⃣ Monday Code Backend (30 min)

**Go to**: https://redsis.monday.com/ → Integrations → Monday Code

### Function 1: generate-magic-link
- Upload: `apps/backend/src/generate-magic-link-simple.ts`
- Env vars:
  - `PORTAL_BASE_URL` = https://your-app.vercel.app
  - `JWT_SECRET` = (same from step 1)
- Copy URL

### Function 2: verify-magic-link  
- Upload: `apps/backend/src/verify-magic-link-simple.ts`
- Env vars:
  - `JWT_SECRET` = (same from step 1)
- Copy URL

---

## 4️⃣ Update Vercel (2 min)

Back to: **Vercel → Settings → Environment Variables**

Add:
```
MONDAY_CODE_GENERATE_MAGIC_LINK_URL = https://... (from step 3)
MONDAY_CODE_VERIFY_MAGIC_LINK_URL = https://... (from step 3)
```

Redeploy:
```bash
vercel --prod
```

---

## 5️⃣ Automations (1 hour)

**Go to**: https://redsis.monday.com/boards/18380394647 → Automate

Create 5 automations:

1. **Site Metrics**: When Projects changes → Count → Update Site's Active Projects
2. **Project Metrics**: When Tickets changes → Count → Update Project's Total Tickets  
3. **New Site**: When Site created → Create "Main Project" linked to it
4. **New User**: When User created → Set User Type to "Email User"
5. **Notifications**: When Project status changes → Notify Service Provider

---

## 6️⃣ Test (15 min)

Open: **https://your-app.vercel.app**

Test:
- ✅ Magic link login
- ✅ PIN login
- ✅ Create site
- ✅ Create project
- ✅ Create ticket
- ✅ Verify metrics update

---

## 🎉 DONE!

Your multi-tenant workspace is live!

**Monitor**: `vercel logs --follow`

**Support**: See `VERCEL_DEPLOYMENT.md` for detailed troubleshooting

---

**Boards**:
- Sites: https://redsis.monday.com/boards/18380394514
- Projects: https://redsis.monday.com/boards/18380394647
- Users: https://redsis.monday.com/boards/18379351659
