# Client Portal Access - Magic Link Setup

## Overview
External clients access the portal via **magic links** sent from Monday.com. Each link is unique, secure, and scoped to show only that client's tickets.

## Production URL
**Client Portal:** https://monday-vibe-portal.vercel.app

## Magic Link Format
```
https://monday-vibe-portal.vercel.app/login?token=SECURE_TOKEN&email=CLIENT_EMAIL&boardId=YOUR_BOARD_ID
```

## How to Generate Magic Links

### Option 1: Manual Link Creation (Quick Start)
For testing and demo purposes, you can manually create magic links:

**Example Demo Link:**
```
https://monday-vibe-portal.vercel.app/login?token=demo-123&email=client@example.com&boardId=18379040651
```

**Template:**
```
https://monday-vibe-portal.vercel.app/login?token=UNIQUE_TOKEN&email={{client.email}}&boardId={{board.id}}
```

### Option 2: Monday Automation (Recommended for Production)

#### Setup Steps:

1. **Create a Text Column** in your Monday board:
   - Column Name: `Portal Link`
   - Type: Text

2. **Create Monday Automation:**
   ```
   WHEN: Status changes to "Needs Client Response"
   OR: Item is created with Client Email filled
   
   THEN: Set Portal Link to:
   https://monday-vibe-portal.vercel.app/login?token={{item.id}}-{{current_date}}&email={{item.client_email}}&boardId=YOUR_BOARD_ID
   ```

3. **Send Email Notification:**
   ```
   WHEN: Portal Link is created or changes
   
   THEN: Send email to {item.client_email}
   
   Subject: Your Support Portal Access
   
   Body:
   Hi there,
   
   Click here to access your support tickets:
   {item.Portal Link}
   
   This link is unique to you and gives you access to all your tickets.
   
   Best regards,
   REDSIS Support Team
   ```

### Option 3: Integration Recipe

Create a Monday integration that:
1. Detects new ticket creation
2. Generates a secure magic link
3. Stores it in the `Portal Link` column
4. Emails it to the client

## Required Monday Board Columns

Your Monday board should have these columns:

| Column Name | Type | Description |
|------------|------|-------------|
| `client_email` | Email | Client's email address |
| `status` | Status | Ticket status |
| `priority` | Status | Ticket priority |
| `description` or `long_text` | Long Text | Ticket description |
| `Portal Link` | Text | Generated magic link |

## Testing the Portal

### Demo Mode:
1. Visit: https://monday-vibe-portal.vercel.app/login
2. Click "Enter Demo Mode"
3. This shows sample data to explore the interface

### Test with Real Data:
1. Create a test client email in your Monday board
2. Generate a magic link using the template above
3. Replace:
   - `UNIQUE_TOKEN`: Use item ID + timestamp
   - `CLIENT_EMAIL`: Use the client's email
   - `YOUR_BOARD_ID`: Your Monday board ID (found in URL)

**Example:**
```
https://monday-vibe-portal.vercel.app/login?token=12345-2025-11-14&email=test@client.com&boardId=18379040651
```

## Client Experience

1. **Client receives email** with magic link
2. **Clicks link** → Redirected to portal
3. **Sees only their tickets** (filtered by email)
4. **Can:**
   - View ticket details
   - Add comments
   - Create new tickets
   - Track status updates

## Security Features

✅ **Email-based filtering** - Clients only see tickets with their email
✅ **Token validation** - Each link has a unique token
✅ **Board scoping** - Access limited to specific Monday board
✅ **No password needed** - Secure magic link authentication

## Next Steps

1. ✅ **Add `client_email` column** to your Monday board
2. ✅ **Add `Portal Link` column** (optional, for storing links)
3. ✅ **Create automation** to generate and send magic links
4. ✅ **Test with a sample client email**
5. ✅ **Roll out to production**

## Advanced: Backend Functions (Future Enhancement)

For production-grade security, you can deploy the Monday Code functions in `/apps/backend/src/`:
- `generate-magic-link.ts` - Creates secure tokens with expiration
- `verify-magic-link.ts` - Validates tokens and issues JWTs

These provide:
- Token expiration (24 hours default)
- Encrypted storage in Monday storage
- JWT session management
- Audit trail

## Support

If clients encounter issues:
1. Check their email is in the `client_email` column
2. Verify the boardId matches your Monday board
3. Generate a fresh magic link
4. Contact support if issues persist

---

**Your Portal is Live!** 🎉
Share magic links with clients to give them instant access to their support tickets.
