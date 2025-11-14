# Monday Code Backend

Backend serverless functions running on monday.com infrastructure.

## Functions

### Authentication
- `generate-magic-link` - Creates magic links for client access
- `verify-magic-link` - Validates and exchanges magic links for JWT tokens

### Webhooks
- `webhook-handler` - Processes monday.com webhook events

### Tickets
- `get-tickets` - Retrieves tickets for a client
- `create-ticket` - Creates new ticket
- `update-ticket` - Updates ticket status/details

### Files
- `upload-file` - Handles file uploads to monday
- `get-file-url` - Generates secure file download URLs

### Notifications
- `send-notification` - Sends email notifications to clients

## Deployment

```bash
# Install monday CLI
npm install -g @mondaycom/apps-cli

# Login
mapps auth:login

# Deploy functions
npm run deploy
```

## Environment Variables

Set these in monday code settings:

- `MONDAY_SIGNING_SECRET` - For webhook verification
- `SENDGRID_API_KEY` - For sending emails
- `JWT_SECRET` - For signing authentication tokens
- `PORTAL_BASE_URL` - Base URL of the client portal
