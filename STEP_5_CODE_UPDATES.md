# Step 5: Code Updates - Implementation Plan

**Status:** In Progress  
**Date:** November 16, 2025

---

## 📋 Files to Update

### High Priority (Critical Path)

1. **✅ Configuration**
   - ✅ `lib/monday-config.ts` - CREATED - Single source of truth for all board IDs

2. **🔄 Dashboard Components**
   - `apps/client-portal/app/client/dashboard/page.tsx` - Update to use Sites/Projects
   - `apps/client-portal/components/portal/TicketOverview.tsx` - Update board references

3. **🔄 Management Components**
   - `apps/client-portal/components/portal/CompanyManagement.tsx` - Replace with SiteManagement
   - `apps/client-portal/components/portal/UserManagement.tsx` - Add multi-tenant filtering
   - `apps/client-portal/components/portal/PortalSettings.tsx` - Update board configs

4. **🔄 Ticket Components**
   - `apps/client-portal/components/NewTicketForm.tsx` - Add project selection + hybrid routing

5. **🔄 Authentication**
   - `lib/auth.ts` - Add magic link + PIN support
   - Create new auth components for dual method

6. **🔄 Admin Pages**
   - `apps/client-portal/app/embed/admin/page.tsx` - Update to Sites/Projects

### Medium Priority

7. **Environment Configuration**
   - Update `.env` files with new board IDs
   - Add magic link backend URLs

8. **API Client**
   - `lib/api/client.ts` - Update default board references

### Low Priority (Nice to Have)

9. **Testing Scripts**
   - Update test scripts to use new boards
   - Archive old board test scripts

---

## 🎯 Implementation Strategy

### Phase 1: Configuration & Setup (30 min)
- [x] Create `lib/monday-config.ts` with all board/column IDs
- [ ] Update environment variables
- [ ] Create TypeScript types for new structure

### Phase 2: Core Components (1 hour)
- [ ] Create `SiteManagement.tsx` component
- [ ] Create `ProjectManagement.tsx` component
- [ ] Update `TicketOverview.tsx` for hybrid architecture
- [ ] Update `NewTicketForm.tsx` for project-based routing

### Phase 3: Dashboard Updates (30 min)
- [ ] Update dashboard to query Sites/Projects
- [ ] Add multi-tenant filtering
- [ ] Update ticket display logic

### Phase 4: Authentication (45 min)
- [ ] Add magic link generation UI
- [ ] Add PIN authentication UI
- [ ] Update login flow for dual method
- [ ] Add user type detection

### Phase 5: Testing & Validation (15 min)
- [ ] Test all CRUD operations
- [ ] Validate multi-tenant isolation
- [ ] Test hybrid ticket routing
- [ ] Verify authentication flows

---

## 📊 Progress Tracking

| Component | Status | Time Estimate | Actual Time |
|-----------|--------|---------------|-------------|
| Configuration | ✅ Complete | 10 min | 10 min |
| Site Management | 🔄 Pending | 20 min | - |
| Project Management | 🔄 Pending | 20 min | - |
| Ticket Components | 🔄 Pending | 20 min | - |
| Dashboard | 🔄 Pending | 15 min | - |
| Authentication | 🔄 Pending | 30 min | - |
| Admin Pages | 🔄 Pending | 15 min | - |
| Environment | 🔄 Pending | 10 min | - |
| Testing | 🔄 Pending | 20 min | - |

**Total Estimated:** 2h 40min  
**Completed:** 10 min  
**Remaining:** 2h 30min

---

## 🔧 Key Changes Required

### 1. Replace Company/Project Creator with Sites

**Before:**
```typescript
const COMPANY_BOARD_ID = '18379404757'; // Project Creator
```

**After:**
```typescript
import { BOARD_IDS } from '@/lib/monday-config';
const SITES_BOARD_ID = BOARD_IDS.SITES; // '18380394514'
```

### 2. Add Multi-Tenant Project Support

**New Logic:**
```typescript
// Get user's site
const userSite = await getUserSite(userId);

// Filter projects by site
const projects = await getProjects({
  siteId: userSite.id
});
```

### 3. Hybrid Ticket Routing

**New Logic:**
```typescript
// Check project's ticket board configuration
const project = await getProject(projectId);

if (project.ticket_board_type === 'Dedicated Board') {
  // Route to dedicated board
  targetBoardId = project.ticket_board_id;
} else {
  // Route to Master Tickets board
  targetBoardId = MASTER_TICKETS_BOARD_ID;
}
```

### 4. Dual Authentication

**New Flow:**
```typescript
// Check user type
if (user.user_type === 'Email User') {
  // Generate magic link
  const magicLink = await generateMagicLink(user.email);
  // Send via email
} else if (user.user_type === 'PIN User') {
  // Prompt for PIN
  const pin = await promptForPIN();
  // Validate PIN
  const valid = await validatePIN(user.id, pin);
}
```

---

## 📦 New Components to Create

### SiteManagement.tsx
```typescript
// CRUD operations for Sites board
- List all sites
- Create new site
- Edit site details
- Link to projects
- Assign site manager
- Assign primary service provider
```

### ProjectManagement.tsx
```typescript
// CRUD operations for Projects board
- List projects for a site
- Create new project
- Edit project details
- Configure ticket board type
- Assign project manager
- Assign service provider
```

### MagicLinkAuth.tsx
```typescript
// Magic link authentication component
- Email input
- Generate magic link
- Send notification
- Handle magic link verification
```

### PINAuth.tsx
```typescript
// PIN authentication component
- 4-digit PIN input
- Validate against user record
- Handle authentication
```

---

## ⚠️ Breaking Changes

### API Endpoints
- Company endpoints → Site endpoints
- Add project filtering to all queries
- Ticket creation requires projectId

### Data Structure
- Replace `companyId` with `siteId` + `projectId`
- Add `ticketBoardType` to project queries
- User type now determines auth method

### Environment Variables
```
# Old (remove)
NEXT_PUBLIC_COMPANY_BOARD_ID=18379404757

# New (add)
NEXT_PUBLIC_SITES_BOARD_ID=18380394514
NEXT_PUBLIC_PROJECTS_BOARD_ID=18380394647
NEXT_PUBLIC_MASTER_TICKETS_BOARD_ID=<to be created>
MAGIC_LINK_BACKEND_URL=<Monday Code URL>
```

---

## ✅ Success Criteria

Code updates complete when:
- [ ] All hardcoded board IDs replaced with config references
- [ ] Site and Project management components working
- [ ] Multi-tenant filtering implemented
- [ ] Hybrid ticket routing functional
- [ ] Dual authentication working
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Documentation updated

---

## 🚀 Next Steps After Code Updates

1. Step 6: Configure Monday.com automations
2. Step 7: Run final audit and create handoff document
3. Deploy to production
4. Archive old boards

---

*This document tracks code update progress for Phase 3 implementation.*
