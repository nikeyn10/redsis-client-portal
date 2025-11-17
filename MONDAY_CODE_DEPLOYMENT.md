# Monday Code Backend Deployment Guide

## 📋 Overview

This guide walks through deploying the magic link authentication backend to Monday Code.

## 🔧 Prerequisites

1. **Monday.com Account** with admin access to workspace 13302651
2. **Monday Apps CLI** installed globally
3. **Node.js** v18 or higher

## 📦 Installation Steps

### Step 1: Install Monday Apps CLI

```bash
npm install -g @mondaycom/apps-cli
```

Verify installation:
```bash
mapps --version
```

### Step 2: Authenticate with Monday

```bash
mapps auth:login
```

This will open a browser window. Log in with your Monday.com credentials.

### Step 3: Navigate to Backend Directory

```bash
cd apps/backend
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Build TypeScript

```bash
npm run build
```

This compiles TypeScript files in `src/` to JavaScript in `dist/`.

## 🚀 Deployment

### Deploy All Functions

```bash
mapps code:push
```

This deploys all functions defined in `src/index.ts`:
- `generateMagicLink` - Create magic links for users
- `verifyMagicLink` - Validate magic link tokens
- `webhookHandler` - Process Monday webhooks
- `getTickets` - Retrieve user tickets
- `createTicket` - Create new tickets
- `sendNotification` - Send email notifications

### Deploy Single Function

```bash
mapps code:push --function generateMagicLink
```

## ⚙️ Environment Variables

After deployment, configure these environment variables in Monday Code settings:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORTAL_BASE_URL` | Base URL of client portal | `https://portal.redsis.com` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-super-secret-key-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key for emails | Not set |
| `MONDAY_SIGNING_SECRET` | Webhook verification secret | Not set |

### Setting Environment Variables

1. Go to Monday.com → Your Workspace → Apps
2. Find your deployed app
3. Click "Configure"
4. Navigate to "Environment Variables"
5. Add each variable with its value

## 🧪 Testing Magic Links

### Step 1: Test Generation

Call the `generateMagicLink` function:

```bash
curl -X POST https://your-app.monday.com/api/v1/generateMagicLink \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mikehabib@redsis.com",
    "expiresInHours": 24
  }'
```

Expected response:
```json
{
  "magic_link": "https://portal.redsis.com/auth/magic?token=abc123...",
  "expires_at": "2025-11-17T12:00:00.000Z",
  "user_id": "123456789",
  "email": "mikehabib@redsis.com"
}
```

### Step 2: Test Verification

Use the token from the magic link:

```bash
curl -X POST https://your-app.monday.com/api/v1/verifyMagicLink \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123..."
  }'
```

Expected response:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "123456789",
    "email": "mikehabib@redsis.com",
    "name": "mikehabib@redsis.com"
  }
}
```

### Step 3: Test with Portal

1. Copy the magic link URL from Step 1
2. Open in browser
3. Should redirect to authenticated portal dashboard

## 📊 Function Endpoints

After deployment, your functions will be available at:

```
https://[your-app-id].monday.com/api/v1/[function-name]
```

Example:
```
https://abc123.monday.com/api/v1/generateMagicLink
https://abc123.monday.com/api/v1/verifyMagicLink
```

## 🔍 Monitoring & Logs

### View Function Logs

```bash
mapps code:logs --function generateMagicLink
```

### View All Logs

```bash
mapps code:logs
```

### Live Tail Logs

```bash
mapps code:logs --tail
```

## 🔒 Security Checklist

- [ ] `JWT_SECRET` is set to a strong random value (min 32 characters)
- [ ] `PORTAL_BASE_URL` uses HTTPS
- [ ] Magic link expiration is set appropriately (default: 24 hours)
- [ ] Monday.com workspace has proper access controls
- [ ] Function endpoints are not publicly documented

## 🐛 Troubleshooting

### Error: "Authentication failed"

**Solution:** Re-run `mapps auth:login`

### Error: "Function not found"

**Solution:** Ensure function is exported in `src/index.ts`

### Error: "Build failed"

**Solution:** Run `npm run lint` to check TypeScript errors

### Error: "Storage not working"

**Solution:** Verify Monday Code has storage enabled for your app

### Error: "User not found"

**Solution:** Check Users board ID (18379351659) and verify email exists

## 📝 Next Steps

After successful deployment:

1. ✅ Test magic link generation with a real user email
2. ✅ Verify token validation works
3. ✅ Integrate frontend login page with magic link flow
4. ✅ Test end-to-end authentication
5. ✅ Remove old password columns (text_mkxpxyrr, text_mkxpb7j4)

## 🔄 Updating Functions

To update deployed functions:

1. Make changes to TypeScript files in `src/`
2. Run `npm run build`
3. Run `mapps code:push`

Changes are deployed immediately.

## 📚 Additional Resources

- [Monday Apps Documentation](https://developer.monday.com/apps)
- [Monday Code Documentation](https://developer.monday.com/apps/docs/monday-code)
- [Monday GraphQL API](https://developer.monday.com/api-reference)
- [JWT.io](https://jwt.io) - JWT token debugger

## ⚠️ Important Notes

1. **Storage Limits**: Monday Code storage has limits. Clean up expired tokens regularly.
2. **Rate Limits**: Monday API has rate limits. Implement appropriate error handling.
3. **Token Security**: Never expose JWT_SECRET or API tokens in client-side code.
4. **Magic Link Expiration**: Used magic links are automatically deleted after verification.
5. **Session Management**: Active sessions are stored with user ID for quick lookup.

## 🎯 Success Criteria

Deployment is successful when:

- [x] `mapps code:push` completes without errors
- [x] Environment variables are set in Monday Code
- [x] Test magic link generation returns valid URL
- [x] Test verification returns valid JWT token
- [x] Frontend can authenticate users with magic links
- [x] Old password columns can be safely removed
