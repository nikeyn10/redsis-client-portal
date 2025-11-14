# Portal Management - Complete Guide

## Overview

The Portal Management interface is a comprehensive admin control center that embeds directly in Monday.com as a board view. It provides complete management capabilities for your client portal application.

## Access

**Within Monday.com:**
1. Open the "Client Portal" board (ID: 18379040651)
2. Click "Views" in the top menu
3. Select "Portal Management" from the board views
4. The full management interface will load embedded in Monday

**Direct URL (for testing):**
```
https://monday-vibe-portal-hg7r9rfa9-mike-habibs-projects.vercel.app/embed/portal
```

## Features

### 1. Overview Tab
**Purpose:** High-level dashboard with key metrics

**Metrics Displayed:**
- Total Companies
- Active Users  
- Open Tickets
- Average Response Time
- Recent Activity feed

**Quick Actions:**
- Jump to Companies management
- Jump to Users management
- Jump to Tickets overview

### 2. Companies Tab
**Purpose:** Manage all client companies and their ticket boards

**Capabilities:**
- View all companies in a table
- See board link status (linked/not linked)
- Create new companies programmatically
- Link boards created via Monday automation
- Quick access to company ticket boards

**Two Workflows Supported:**
1. **Portal Creation:** Click "New Company" to create company + board + columns automatically
2. **Monday Automation:** Use button_mkxpx5k6 in Monday.com to create boards, then link them here

**Stats:**
- Total companies count
- Companies with boards linked
- Companies missing board links

### 3. Users Tab
**Purpose:** Manage client portal users and access

**Capabilities:**
- View all users with email, company, status
- Create new users
- Assign users to companies
- Set user passwords
- Track user creation dates

**User Creation:**
- Email (required)
- Password (required)  
- Company assignment (required)
- Auto-sets status to "Active"

**Stats:**
- Total users
- Active users
- Companies served

### 4. Tickets Tab
**Purpose:** Aggregate view of ALL tickets across ALL companies

**Capabilities:**
- View tickets from all company boards in one place
- Filter by status (Open/Closed)
- See priority levels
- Track creation dates
- Quick link to ticket in Monday board

**Metrics:**
- Total tickets across all boards
- Open tickets count
- Closed tickets count
- Companies with tickets

**Ticket Information Displayed:**
- Ticket name/title
- Company name
- Client email
- Status with icon indicators
- Priority with color coding
- Creation date
- Direct link to Monday board

### 5. Analytics Tab
**Purpose:** Performance metrics and insights (coming soon)

**Planned Features:**
- Ticket trend charts
- Resolution rate graphs
- Response time analytics
- User activity metrics

### 6. Settings Tab
**Purpose:** Configure portal-wide settings

**Configurable Settings:**
- Portal name
- Portal URL (read-only)
- User Board ID (read-only)
- Company Board ID (read-only)
- Enable/disable notifications
- Enable/disable file uploads
- Maximum file size for uploads

## Board Configuration

### Required Boards

**1. User Board (ID: 18379351659)**
- Stores client portal users
- Columns: Email, Password, Company (dropdown), Status

**2. Company Board (ID: 18379404757)**
- Stores all companies
- Columns: 
  - Name
  - Status
  - `dropdown_mkxpakmh` (Board ID link)
  - `button_mkxpx5k6` (Create Board automation)

**3. Company Ticket Boards (Dynamic)**
- Each company has its own ticket board
- Board ID stored in `dropdown_mkxpakmh` column
- Standard columns: Client Email, Priority, Description, Status, Files

## Workflows

### Creating a New Company (Portal Method)

1. Go to Companies tab
2. Click "New Company"
3. Enter company name
4. Click "Create Company"
5. System automatically:
   - Creates new ticket board
   - Adds standard columns
   - Creates company entry
   - Links board ID

### Creating a Company (Monday Automation Method)

1. In Monday.com Company Board
2. Add new company row
3. Click `button_mkxpx5k6` to trigger automation
4. Monday creates the ticket board
5. Copy board ID from URL
6. In Portal Management:
   - Go to Companies tab
   - Find the company
   - Click "Link Board"
   - Paste board ID
   - Click "Link Board"

### Creating a New User

1. Go to Users tab
2. Click "New User"
3. Fill in:
   - Email address
   - Password
   - Select company
4. Click "Create User"
5. User can now log in to client portal

### Viewing All Tickets

1. Go to Tickets tab
2. See aggregated view of all tickets
3. Use stats to see open vs closed
4. Click external link icon to view in Monday
5. Monitor across all companies

## Integration Points

### Client Portal (Public Login)
- **URL:** `/login`
- Users log in with email/password
- Routed to their company's ticket board
- Can create tickets, view status, add comments

### Embedded Views
- **Ticket View:** `/embed/ticket` - Individual ticket details
- **Dashboard View:** `/embed/dashboard` - Ticket overview
- **Portal Management:** `/embed/portal` - Full admin interface

### Monday.com Boards
- User Board: Authentication data
- Company Board: Company + Board ID mapping
- Ticket Boards: One per company, dynamically created

## Best Practices

1. **Company Creation:**
   - Use portal creation for consistency
   - Use Monday automation if you have custom workflows
   - Always link board IDs promptly

2. **User Management:**
   - Assign users to companies immediately
   - Use strong passwords
   - Monitor user status regularly

3. **Ticket Monitoring:**
   - Check Tickets tab daily for overview
   - Use Monday boards for detailed work
   - Track response times via Analytics

4. **Security:**
   - Manage API tokens in Vercel environment
   - Restrict portal management to admins only
   - Review user access regularly

## Deployment

The portal is deployed on Vercel:
- Production URL: https://monday-vibe-portal-hg7r9rfa9-mike-habibs-projects.vercel.app
- Monday.com App: Registered as board view
- Environment: Set in Vercel dashboard

## Troubleshooting

**"No board selected" error:**
- Check `dropdown_mkxpakmh` column has board ID
- Verify board ID is correct
- Use "Link Board" feature to fix

**User can't log in:**
- Verify user exists in User Board
- Check company assignment
- Ensure company has board linked

**Tickets not showing:**
- Confirm board ID in Company Board
- Check board permissions
- Verify API token has access

## Support

For issues or questions:
- Check board configurations
- Verify environment variables
- Review Monday API permissions
- Contact: mikehabib@redsis.com
