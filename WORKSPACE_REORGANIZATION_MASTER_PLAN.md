# Monday.com Workspace Reorganization - Master Plan & Execution Guide

**Workspace ID**: 13302651 ("Redix Central Hub")  
**Project**: Multi-Tenant Client Portal Transformation  
**Created**: November 16, 2025  
**Status**: 📋 Phase 2 Complete - Awaiting User Approval for Phase 3

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Phase 1: Analysis (COMPLETED)](#phase-1-analysis-completed)
3. [Phase 2: Proposal (COMPLETED)](#phase-2-proposal-completed)
4. [Phase 3: Implementation (PENDING APPROVAL)](#phase-3-implementation-pending-approval)
5. [Phase 4: Validation (FUTURE)](#phase-4-validation-future)
6. [Current State Reference](#current-state-reference)
7. [Target State Reference](#target-state-reference)
8. [Decision Log](#decision-log)
9. [Execution Checklist](#execution-checklist)
10. [Rollback Procedures](#rollback-procedures)

---

## Project Overview

### Objective
Transform the Monday.com workspace from a development/testing environment into a production-ready multi-tenant external portal with proper security, data relationships, and architectural best practices.

### Scope
- **Security**: Remove plain text password storage, implement magic link authentication
- **Architecture**: Establish proper multi-tenant board structure with Connect Boards relationships
- **Cleanup**: Archive/delete 5 test company boards (Chase, Chedraui, VOI, Redsis, RSI)
- **Enhancement**: Add Sites and Projects boards for comprehensive business tracking
- **Code Updates**: Modify authentication, dashboard, and management portal code

### Success Criteria
- ✅ No plain text passwords in any board
- ✅ All relationships use Connect Boards (not dropdowns)
- ✅ Test boards removed from workspace
- ✅ Magic link authentication working
- ✅ Multi-tenant architecture fully functional
- ✅ All existing users and data preserved

---

## Phase 1: Analysis (COMPLETED)

### Deliverables
✅ **workspace-analysis.js** - Comprehensive Monday.com workspace analyzer script  
✅ **workspace-analysis-report.json** - Complete analysis of 9 boards, 4 detailed analyses, 8 issues identified  
✅ **Console report** - Human-readable analysis output

### Key Findings

**Boards Discovered: 9 Total**

| Category | Board Name | ID | Items | Status |
|----------|-----------|-----|-------|--------|
| SERVICE_PROVIDERS | Service Providers | 18379446736 | 3 | ✅ Target |
| COMPANIES | Project Creator | 18379404757 | 5 | ✅ Target |
| USERS | Users | 18379351659 | 5 | ✅ Target |
| TICKETS | Management Portal | 18379040651 | 5 | ✅ Target |
| OTHER | Chase | 18380268500 | ? | 🧪 Test |
| OTHER | Chedraui | 18380098330 | ? | 🧪 Test |
| OTHER | VOI | 18379880102 | ? | 🧪 Test |
| OTHER | Redsis | 18379873697 | ? | 🧪 Test |
| OTHER | RSI | 18379754041 | ? | 🧪 Test |

**Critical Issues Identified: 8**

1. 🔴 **CRITICAL**: Plain text password in Service Providers board (`text_mkxpb7j4`)
2. 🔴 **CRITICAL**: Plain text password in Users board (`text_mkxpxyrr`)
3. 🟡 **MEDIUM**: Project Creator uses Dropdown for Board ID (should be Connect Boards)
4. 🟡 **MEDIUM**: Users board has duplicate name fields (Name + First Name + Last Name dropdowns)
5. 🟡 **MEDIUM**: Management Portal uses Status column for priority (should use Priority type)
6. 🟡 **MEDIUM**: No Sites board (missing for multi-tenant architecture)
7. 🟡 **MEDIUM**: No Projects board (missing for work tracking)
8. 🟡 **MEDIUM**: 5 test company boards polluting workspace structure

### Phase 1 Timeline
- **Started**: November 16, 2025
- **Completed**: November 16, 2025
- **Duration**: ~2 hours

---

## Phase 2: Proposal (COMPLETED)

### Deliverables
✅ **WORKSPACE_REORGANIZATION_PROPOSAL.md** - 37-section detailed change proposal  
✅ **Target architecture design** - Multi-tenant board structure  
✅ **Migration strategy** - Step-by-step data preservation plan  
✅ **Risk assessment** - High/Medium/Low risk categorization  
✅ **Approval checklist** - Required user decisions

### Proposed Changes Summary

#### A. Board Deletions (5 boards)
| Board | ID | Reason |
|-------|-----|--------|
| Chase | 18380268500 | Test board - no production data |
| Chedraui | 18380098330 | Test board - no production data |
| VOI | 18379880102 | Test board - no production data |
| Redsis | 18379873697 | Test board - no production data |
| RSI | 18379754041 | Test board - no production data |

**Safety Requirements**:
- Export all data before deletion
- Verify no automations reference these boards
- Confirm test data only

#### B. Board Modifications (4 boards)

**B1. Service Providers [18379446736]**
- ❌ DELETE: Password column (`text_mkxpb7j4`)
- ✅ ADD: Magic link authentication support

**B2. Users [18379351659]**
- ❌ DELETE: Password column (`text_mkxpxyrr`)
- ❌ DELETE: First Name dropdown (`dropdown_mkxrn759`)
- ❌ DELETE: Last Name dropdown (`dropdown_mkxr9kyr`)
- 🔄 MODIFY: Company dropdown → Connect Boards
- ✅ ADD: Company (Connect Boards) column
- ✅ ADD: Password Hash column (hidden, bcrypt)

**B3. Project Creator [18379404757] → "Companies"**
- 🔄 RENAME: "Project Creator" → "Companies"
- ❌ DELETE: Board ID dropdown (`dropdown_mkxpakmh`)
- ❌ DELETE: Create Board button (`button_mkxpx5k6`)
- ❌ DELETE: Company dropdown (`dropdown_mkxrwmpq`)
- ✅ ADD: Company ID (text)
- ✅ ADD: Domain (text)
- ✅ ADD: Logo URL (link)
- ✅ ADD: Sites (Connect Boards)
- ✅ ADD: Projects (Connect Boards)
- ✅ ADD: Company Users (Connect Boards)

**B4. Management Portal [18379040651] → "Tickets (Default)"**
- 🔄 RENAME: "Management Portal" → "Tickets (Default)"
- ✅ ADD: Company (Connect Boards)
- ✅ ADD: Project (Connect Boards)
- ✅ ADD: Site (Connect Boards)
- ✅ ADD: Assigned To (Connect Boards → Service Providers)
- 🔄 MODIFY: priority (Status → Priority type)

#### C. New Boards (2 boards)

**C1. Sites Board [NEW]**

Purpose: Track company locations (offices, warehouses, retail stores)

| Column | Type | Required |
|--------|------|----------|
| Name | Name | ✅ |
| Status | Status | ✅ |
| Company | Connect Boards | ✅ |
| Address | Text | ❌ |
| City | Text | ✅ |
| State/Province | Text | ❌ |
| Country | Dropdown | ✅ |
| Site Type | Dropdown | ❌ |
| Contact Name | Text | ❌ |
| Contact Email | Email | ❌ |
| Contact Phone | Phone | ❌ |
| Projects | Connect Boards | ❌ |

**C2. Projects Board [NEW]**

Purpose: Track work projects, installations, initiatives

| Column | Type | Required |
|--------|------|----------|
| Name | Name | ✅ |
| Status | Status | ✅ |
| Company | Connect Boards | ✅ |
| Site | Connect Boards | ❌ |
| Start Date | Date | ❌ |
| End Date | Date | ❌ |
| Project Manager | People | ❌ |
| Budget | Numbers | ❌ |
| Description | Long Text | ❌ |
| Tickets | Connect Boards | ❌ |
| Assigned Service Providers | Connect Boards | ❌ |

### Phase 2 Timeline
- **Started**: November 16, 2025
- **Completed**: November 16, 2025
- **Duration**: ~1 hour

---

## Phase 3: Implementation (PENDING APPROVAL)

### Prerequisites
- [ ] User approval on all proposed changes
- [ ] Answers to 6 critical questions (see Decision Log)
- [ ] Backup of all board data completed
- [ ] Maintenance window scheduled (2-4 hours)
- [ ] Backend magic link functions deployed to Monday Code

### Sub-Phases

#### Phase 3A: Security Fixes (CRITICAL - Do First)
**Duration**: 1-2 hours  
**Risk**: 🔴 HIGH - Breaking changes to authentication

**Tasks**:
1. Deploy backend magic link functions
   - `/apps/backend/src/generate-magic-link.ts`
   - `/apps/backend/src/verify-magic-link.ts`
2. Test magic link generation
3. Generate magic links for all existing users (5 users)
4. Send onboarding emails
5. Delete password column from Users board (`text_mkxpxyrr`)
6. Delete password column from Service Providers board (`text_mkxpb7j4`)
7. Update `/app/api/auth/login/route.ts` to use magic links
8. Test login flow end-to-end

**Rollback Plan**:
- Keep password columns for 1 week during migration
- Support dual auth (password OR magic link)
- Delete password columns only after all users migrated

**Validation**:
- [ ] All 5 users can log in via magic link
- [ ] Service providers can access portal
- [ ] No plain text passwords visible in boards
- [ ] Authentication API returns correct board ID

---

#### Phase 3B: Test Board Cleanup
**Duration**: 30 minutes  
**Risk**: 🟢 LOW - Test boards only

**Tasks**:
1. Export data from 5 test boards
   - Chase [18380268500]
   - Chedraui [18380098330]
   - VOI [18379880102]
   - Redsis [18379873697]
   - RSI [18379754041]
2. Verify exports complete (CSV format)
3. Delete boards via Monday.com API
4. Clean up orphaned dropdown values in Companies board

**Script**: `delete-test-boards.js` (to be created)

**Validation**:
- [ ] 5 boards no longer appear in workspace
- [ ] Exports saved to `/exports/` directory
- [ ] Companies board dropdown cleaned

---

#### Phase 3C: New Board Creation
**Duration**: 1 hour  
**Risk**: 🟢 LOW - Additive only, no existing data affected

**Tasks**:
1. Create Sites board with full column structure
2. Create Projects board with full column structure
3. Add Connect Boards columns to Companies board
4. Add Connect Boards columns to Tickets board
5. Document new board IDs in code

**Script**: `create-new-boards.js` (to be created)

**Validation**:
- [ ] Sites board created with 12 columns
- [ ] Projects board created with 11 columns
- [ ] Board IDs captured and documented
- [ ] All Connect Boards columns functional

---

#### Phase 3D: Data Migration
**Duration**: 2-3 hours  
**Risk**: 🟡 MEDIUM - Affects existing users and companies

**Tasks**:
1. Create migration script (`migrate-relationships.js`)
2. For each user in Users board:
   - Extract company name from dropdown
   - Find matching company in Companies board
   - Create Connect Boards relationship
   - Validate link created
3. For each company in Companies board:
   - Create default project in Projects board
   - Link company to project via Connect Boards
   - Migrate any existing ticket board references
4. Test authentication flow with new structure
5. Validate all relationships
6. Delete old dropdown columns (after validation)

**Data Affected**:
- 5 users: mikehabib@redsis.com, cgiraldo@redsis.com, nmartinez@redsis.com, bromero@redsis.com, soporte@redsis.com
- 5 companies: Redsis, RSI, VOI, Chedraui, Chase (will be 4 after test cleanup)

**Validation**:
- [ ] All users linked to companies via Connect Boards
- [ ] All companies have default projects
- [ ] Authentication flow works with new relationships
- [ ] No broken links or orphaned data

---

#### Phase 3E: Code Updates
**Duration**: 3-4 hours  
**Risk**: 🔴 HIGH - Application won't work without these changes

**Files to Update**:

1. **`/app/api/auth/login/route.ts`**
   - Remove password validation
   - Add magic link verification
   - Change company lookup from dropdown to Connect Boards
   - Update board ID resolution (User → Company → Project → Tickets)

2. **`/app/client/dashboard/page.tsx`**
   - Update ticket loading to use new relationships
   - Update board ID resolution from localStorage

3. **`/app/embed/admin/page.tsx`**
   - Update company creation to use new board structure
   - Remove "Create Board" button functionality
   - Add Projects board management
   - Add Sites board management

4. **`/lib/board-columns.ts`**
   - Update fallback column IDs for new structure
   - Add Connect Boards column handling

5. **`/lib/auth.ts`**
   - Add magic link token generation utilities
   - Add JWT utilities for magic links

**Validation**:
- [ ] Login flow works end-to-end
- [ ] Dashboard loads tickets correctly
- [ ] New ticket creation works
- [ ] Management portal company creation works
- [ ] All existing functionality preserved

---

### Phase 3 Success Criteria
- ✅ All security issues resolved (no plain text passwords)
- ✅ Test boards removed
- ✅ New boards created and functional
- ✅ All data migrated successfully
- ✅ Code updated and tested
- ✅ Zero data loss
- ✅ Application fully functional

### Phase 3 Timeline (Estimated)
- **Total Duration**: 7.5 - 10.5 hours
- **Recommended Schedule**: Single maintenance window on weekend
- **Fallback**: Phased rollout over 2 weekends

---

## Phase 4: Validation (FUTURE)

### Deliverables (To Be Created)
- [ ] Post-implementation validation report
- [ ] Updated CURRENT_APPLICATION_ARCHITECTURE.md
- [ ] Final board structure documentation
- [ ] Updated API documentation
- [ ] Migration completion summary

### Validation Tests
1. **Authentication Testing**
   - [ ] Magic link generation works
   - [ ] Magic link verification works
   - [ ] User can log in and access correct board
   - [ ] Service provider authentication works

2. **Multi-Tenant Testing**
   - [ ] Each company has separate data
   - [ ] Users see only their company's tickets
   - [ ] Cross-company data isolation verified

3. **Relationship Testing**
   - [ ] User → Company links work
   - [ ] Company → Projects links work
   - [ ] Company → Sites links work
   - [ ] Project → Tickets links work
   - [ ] Ticket → Service Provider assignments work

4. **Functional Testing**
   - [ ] Create new company
   - [ ] Create new user
   - [ ] Create new ticket
   - [ ] Assign service provider
   - [ ] Export tickets
   - [ ] All dashboard metrics accurate

5. **Performance Testing**
   - [ ] Dashboard loads in < 2 seconds
   - [ ] Ticket creation in < 1 second
   - [ ] No N+1 query issues
   - [ ] Column caching working

### Documentation Updates Required
1. Update `CURRENT_APPLICATION_ARCHITECTURE.md`:
   - New board structure
   - Updated column IDs
   - New authentication flow
   - Updated data flow diagrams

2. Create new documentation:
   - Multi-tenant setup guide
   - Magic link authentication guide
   - Board relationship diagram
   - Admin user manual

---

## Current State Reference

### Board Structure (As of Phase 1)

```
Current Workspace (13302651)
├── Service Providers [18379446736]
│   ├── 7 columns (incl. password ⚠️)
│   └── 3 items
├── Project Creator [18379404757]
│   ├── 9 columns (incl. Board ID dropdown)
│   └── 5 items (Redsis, RSI, VOI, Chedraui, Chase)
├── Users [18379351659]
│   ├── 8 columns (incl. password ⚠️, duplicate names)
│   └── 5 items
├── Management Portal [18379040651]
│   ├── 8 columns
│   └── 5 items
└── Test Boards (5)
    ├── Chase [18380268500]
    ├── Chedraui [18380098330]
    ├── VOI [18379880102]
    ├── Redsis [18379873697]
    └── RSI [18379754041]
```

### Critical Column IDs (Current)

**Users Board [18379351659]**:
- `name` - Name
- `email_mkxpm2m0` - User Email
- `text_mkxpxyrr` - Password (⚠️ plain text)
- `dropdown_mkxpsjwd` - Company (string match)
- `dropdown_mkxrn759` - First Name (redundant)
- `dropdown_mkxr9kyr` - Last Name (redundant)

**Project Creator [18379404757]**:
- `name` - Name (company name)
- `dropdown_mkxpakmh` - Board ID (stores as string)
- `button_mkxpx5k6` - Create Board button
- `text_mkxqv75c` - Main Contact Name
- `email_mkxqs6z4` - Main Contact Email
- `phone_mkxqb808` - Main Contact Phone
- `dropdown_mkxrwmpq` - Company (redundant)

**Management Portal [18379040651]**:
- `name` - Ticket title
- `email_mkxpawg3` - client_email
- `color_mkxp805g` - priority (Status type)
- `long_text_mkxpgg6q` - Description Of Problem
- `file_mkxqyqg0` - Attachments
- `dropdown_mkxrzw2w` - Machine Type

**Service Providers [18379446736]**:
- `name` - Name
- `email_mkxpawg3` - Email
- `text_mkxpb7j4` - Password (⚠️ plain text)
- `phone_mkxpec5j` - Phone
- `dropdown_mkxpdbxw` - Specialization
- `numeric_mkxp72jc` - Assigned Tickets

### Current Authentication Flow

```
1. User enters email/password on /login
2. Query Users Board [18379351659] for all users
3. Find user by email match (case-insensitive)
4. Compare plain text passwords (⚠️)
5. Extract company name from dropdown_mkxpsjwd
6. Query Project Creator [18379404757] for all companies
7. Find company by name match
8. Extract board ID from dropdown_mkxpakmh
9. Store in localStorage: magic_token, client_email, client_board_id
10. Redirect to /client/dashboard
11. Dashboard loads tickets from client_board_id
12. Filter tickets by client_email (client-side ⚠️)
```

### Current Data Relationships (String-Based)

```
Users.Company (dropdown text)
    ↓ (string match in code)
ProjectCreator.Name
    ↓
ProjectCreator.Board_ID (dropdown label)
    ↓ (stored in localStorage)
Tickets.Board
    ↓
Filter by: Tickets.client_email === Users.email (client-side)
```

---

## Target State Reference

### Board Structure (After Phase 3)

```
Target Workspace (13302651)
├── Companies [18379404757] (renamed)
│   ├── 13 columns (Connect Boards relationships)
│   └── 4+ items (test companies removed)
├── Users [18379351659]
│   ├── 5 columns (passwords removed, Connect Boards added)
│   └── 5+ items
├── Service Providers [18379446736]
│   ├── 6 columns (password removed)
│   └── 3+ items
├── Sites [NEW_ID]
│   ├── 12 columns
│   └── Items as created
├── Projects [NEW_ID]
│   ├── 11 columns
│   └── Items as created
└── Tickets (Default) [18379040651] (renamed)
    ├── 13 columns (relationships added)
    └── 5+ items
```

### Target Column IDs (To Be Determined in Phase 3C)

**Users Board** (modified):
- `name` - Name
- `email_mkxpm2m0` - User Email
- `connect_boards_company` - Company (Connect Boards) [NEW]
- `text_password_hash` - Password Hash (hidden) [NEW, optional]

**Companies Board** (renamed from Project Creator):
- `name` - Name
- `status` - Status
- `text_company_id` - Company ID [NEW]
- `text_domain` - Domain [NEW]
- `text_logo_url` - Logo URL [NEW]
- `text_mkxqv75c` - Main Contact Name
- `email_mkxqs6z4` - Main Contact Email
- `phone_mkxqb808` - Main Contact Phone
- `connect_boards_sites` - Sites [NEW]
- `connect_boards_projects` - Projects [NEW]
- `connect_boards_users` - Company Users [NEW]

**Sites Board** (new):
- All columns TBD in Phase 3C

**Projects Board** (new):
- All columns TBD in Phase 3C

**Tickets Board** (modified):
- All existing columns retained
- `connect_boards_company` - Company [NEW]
- `connect_boards_project` - Project [NEW]
- `connect_boards_site` - Site [NEW]
- `connect_boards_assignee` - Assigned To [NEW]

### Target Authentication Flow (Magic Links)

```
1. User enters email on /login
2. System generates magic link token (crypto.randomBytes)
3. Send email with magic link
4. User clicks link: /login?token={token}
5. Verify token via /api/auth/verify-magic-link
6. Query Users Board for user by email
7. Extract company via Connect Boards relationship
8. Query Company → Projects via Connect Boards
9. Get default project's ticket board ID
10. Generate JWT with user info + board ID
11. Store JWT in httpOnly cookie (secure)
12. Redirect to /client/dashboard
13. Dashboard loads tickets from board ID (server-filtered by email)
```

### Target Data Relationships (Connect Boards)

```
Users.Company (Connect Boards)
    ↓ (native Monday.com relationship)
Companies Board
    ↓
Companies.Projects (Connect Boards)
    ↓ (native Monday.com relationship)
Projects Board
    ↓
Projects.Tickets (Connect Boards)
    ↓ (native Monday.com relationship)
Tickets Board
    ↓
Filter by: Server-side query with email filter

Additional Relationships:
Companies → Sites (Connect Boards)
Companies → Users (Connect Boards, reverse)
Tickets → Service Providers (Connect Boards)
Projects → Service Providers (Connect Boards)
```

---

## Decision Log

### Questions Requiring User Approval

#### Q1: Test Board Deletion
**Question**: Confirm these 5 boards (Chase, Chedraui, VOI, Redsis, RSI) are test data and safe to delete?

**Decision**: [ ] PENDING  
**User Response**: _______________  
**Date Decided**: _______________

---

#### Q2: Authentication Method
**Question**: Approve magic link as primary authentication method (replacing passwords)?

**Decision**: [✅] APPROVED  
**User Response**: Use magic link authentication as the primary login method. Add a 4-digit PIN fallback ONLY for store users or vendor users who don't have email access.  
**Date Decided**: November 16, 2025

**Implementation Details**:
- Primary: Magic link authentication (email-based)
- Fallback: 4-digit PIN for users without email access (store/vendor users)
- Required columns in Users board:
  - Email (for magic link users)
  - PIN (text, 4-digit, for non-email users)
  - User Type (dropdown: Email User / PIN User)

---

#### Q3: Ticket Architecture
**Question**: Prefer central tickets board (Option A) or per-project ticket boards (Option B)?

**Decision**: [✅] APPROVED - HYBRID ARCHITECTURE  
**User Response**: Hybrid architecture combining both approaches  
**Date Decided**: November 16, 2025

**Implementation Details**:
1. **Master Tickets Board** (Universal) - Central source of truth for internal management
2. **Per-Project Dedicated Boards** (Optional) - Projects can have their own ticket boards

**Projects Board Requirements**:
- `Ticket Board Type` (Dropdown): "Global" or "Dedicated"
- `Ticket Board ID` (Text): Stores dedicated board ID if applicable

**Workflow**:
- Projects with "Global" type → tickets created on Master Tickets board
- Projects with "Dedicated" type → tickets created on project-specific board
- Automations/integrations mirror essential fields from dedicated boards → Master board
- Master board remains single source of truth for reporting and management

**Benefits**:
- Flexibility for clients needing isolated boards
- Central visibility for internal teams
- Automated synchronization ensures consistency

---

#### Q4: Testing Strategy
**Question**: Create duplicate workspace for testing first, or apply changes directly to production?

**Decision**: [✅] APPROVED - DIRECT IMPLEMENTATION  
**User Response**: Workspace 13302651 contains ONLY sample data (no production data). Apply changes directly to this workspace.  
**Date Decided**: November 16, 2025

**Safety Rules**:
1. ✅ Show proposed plan before applying changes
2. ⚠️ Do NOT delete boards without explicit approval
3. ✅ May delete columns after confirming:
   - Not part of automations
   - Do not break internal references
4. ✅ Provide full audit report after structural changes
5. ✅ Export full backup before any destructive actions

**Note**: User will manually validate final structure before moving model to production workspace

---

#### Q5: Migration Downtime
**Question**: Acceptable to have portal offline for 2-4 hours during migration?

**Decision**: [✅] APPROVED - NO CONCERN  
**User Response**: System is not running yet, so downtime is not an issue  
**Preferred Window**: N/A - Can proceed anytime  
**Date Decided**: November 16, 2025

---

#### Q6: Data Backup
**Question**: Should we export ALL board data before any changes as safety measure?

**Decision**: [✅] APPROVED - COMPREHENSIVE BACKUP  
**User Response**: Yes. Before any destructive action, export: Board structure, Column IDs, Automations, Views, Item ID mappings  
**Date Decided**: November 16, 2025

**Required Backup Contents**:
1. ✅ Board structure (schemas)
2. ✅ Column IDs (all column metadata)
3. ✅ Automations (if accessible via API)
4. ✅ Views (board views configuration)
5. ✅ Item ID mappings (all items with IDs)
6. ✅ Full reference snapshot

**Backup Format**: JSON + CSV exports
**No deletion without backup**: Hard requirement

---

### User Responses Received (From Previous Messages)

#### User Response 1
**Message**: "1. THese are for testing purposes 2. Yes 3. Both"

**Interpretation**:
1. ✅ Test boards confirmed - safe to delete
2. ✅ Security fixes approved (both Users and Service Providers)
3. ⚠️ "Both" unclear - needs clarification

**Follow-up Questions Needed**:
- Q3: "Both" options for ticket architecture? Or both security + architecture?
- Q4-Q6: Still need answers

---

## Execution Checklist

### Pre-Implementation (Before Phase 3)

**User Approvals**:
- [ ] Q1: Test board deletion approved
- [ ] Q2: Authentication method chosen
- [ ] Q3: Ticket architecture chosen (A or B)
- [ ] Q4: Testing strategy chosen
- [ ] Q5: Downtime window scheduled
- [ ] Q6: Backup strategy confirmed

**Technical Preparation**:
- [ ] Backend magic link functions deployed to Monday Code
- [ ] Monday.com API token verified and valid
- [ ] Development environment set up
- [ ] All board exports completed (if approved)
- [ ] Git branch created for code changes
- [ ] Maintenance mode page prepared (if needed)

**Communication**:
- [ ] Users notified of upcoming changes
- [ ] Maintenance window communicated
- [ ] Backup administrator assigned
- [ ] Rollback plan reviewed

---

### Phase 3A: Security Fixes

- [ ] Deploy magic link backend functions
- [ ] Test magic link generation
- [ ] Generate magic links for 5 existing users
- [ ] Send onboarding emails
- [ ] Verify all users received emails
- [ ] Wait for user testing period (24-48 hours recommended)
- [ ] Delete Users.Password column (`text_mkxpxyrr`)
- [ ] Delete ServiceProviders.Password column (`text_mkxpb7j4`)
- [ ] Update authentication API route
- [ ] Test login flow
- [ ] Verify no errors in production

**Validation Checks**:
- [ ] All users can log in via magic link
- [ ] Service providers can log in
- [ ] No plain text passwords in any board
- [ ] Authentication returns correct data

---

### Phase 3B: Test Board Cleanup

- [ ] Create `delete-test-boards.js` script
- [ ] Export Chase board data
- [ ] Export Chedraui board data
- [ ] Export VOI board data
- [ ] Export Redsis board data
- [ ] Export RSI board data
- [ ] Verify all exports complete
- [ ] Delete Chase board [18380268500]
- [ ] Delete Chedraui board [18380098330]
- [ ] Delete VOI board [18379880102]
- [ ] Delete Redsis board [18379873697]
- [ ] Delete RSI board [18379754041]
- [ ] Clean Companies board dropdown
- [ ] Verify boards deleted

**Validation Checks**:
- [ ] Only 4 boards remain in workspace
- [ ] Exports saved to safe location
- [ ] No broken references

---

### Phase 3C: New Board Creation

- [ ] Create `create-new-boards.js` script
- [ ] Create Sites board
- [ ] Add all 12 columns to Sites board
- [ ] Create default groups in Sites board
- [ ] Document Sites board ID
- [ ] Create Projects board
- [ ] Add all 11 columns to Projects board
- [ ] Create default groups in Projects board
- [ ] Document Projects board ID
- [ ] Add Connect Boards columns to Companies board
- [ ] Add Connect Boards columns to Tickets board
- [ ] Update code with new board IDs
- [ ] Test all new columns functional

**Validation Checks**:
- [ ] Sites board fully functional
- [ ] Projects board fully functional
- [ ] Connect Boards columns working
- [ ] Board IDs documented

---

### Phase 3D: Data Migration

- [ ] Create `migrate-relationships.js` script
- [ ] Backup all current data
- [ ] Migrate user → company relationships (5 users)
- [ ] Verify all user links created
- [ ] Create default projects for companies
- [ ] Link companies → projects
- [ ] Test authentication with new structure
- [ ] Validate all relationships intact
- [ ] Delete old dropdown columns (after validation)
- [ ] Final relationship verification

**Validation Checks**:
- [ ] All 5 users linked to companies
- [ ] All companies have projects
- [ ] Authentication works
- [ ] No broken links
- [ ] No data loss

---

### Phase 3E: Code Updates

**File 1: `/app/api/auth/login/route.ts`**
- [ ] Remove password validation logic
- [ ] Add magic link verification
- [ ] Change company lookup to Connect Boards
- [ ] Update board ID resolution
- [ ] Add error handling
- [ ] Test locally

**File 2: `/app/client/dashboard/page.tsx`**
- [ ] Update ticket loading logic
- [ ] Update board ID resolution
- [ ] Test locally

**File 3: `/app/embed/admin/page.tsx`**
- [ ] Update company creation
- [ ] Remove Create Board button
- [ ] Add Projects management
- [ ] Add Sites management
- [ ] Test in Monday.com iframe

**File 4: `/lib/board-columns.ts`**
- [ ] Update fallback column IDs
- [ ] Add Connect Boards handling
- [ ] Test column mapping

**File 5: `/lib/auth.ts`**
- [ ] Add magic link utilities
- [ ] Add JWT utilities
- [ ] Test token generation

**Deployment**:
- [ ] Create pull request
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to Vercel
- [ ] Verify deployment successful

**Validation Checks**:
- [ ] Login flow works
- [ ] Dashboard loads correctly
- [ ] Ticket creation works
- [ ] Management portal functional
- [ ] No console errors

---

### Post-Implementation (Phase 4)

- [ ] Run full validation test suite
- [ ] Monitor error logs for 24 hours
- [ ] Collect user feedback
- [ ] Document any issues
- [ ] Create Phase 4 validation report
- [ ] Update CURRENT_APPLICATION_ARCHITECTURE.md
- [ ] Update API documentation
- [ ] Archive this master plan

---

## Rollback Procedures

### If Phase 3A Fails (Security)

**Scenario**: Magic links not working, users cannot log in

**Rollback Steps**:
1. Re-add password columns to Users and Service Providers boards
2. Re-populate passwords from backup
3. Revert authentication code to previous version
4. Redeploy application
5. Test password login working
6. Communicate to users

**Data Required**:
- Backup of password column data (from Phase 1 export)
- Previous version of `/app/api/auth/login/route.ts`

**Time Required**: 30 minutes

---

### If Phase 3B Fails (Board Deletion)

**Scenario**: Accidentally deleted wrong board or data needed

**Rollback Steps**:
1. ❌ **Cannot rollback** - Deleted boards cannot be recovered
2. Restore from CSV exports (if available)
3. Manually recreate boards
4. Re-import data

**Prevention**:
- Triple-check board IDs before deletion
- Export data first (mandatory)
- Verify board name matches before deletion

---

### If Phase 3C Fails (New Boards)

**Scenario**: New boards created incorrectly or with errors

**Rollback Steps**:
1. Delete incorrectly created boards
2. Fix creation script
3. Re-run board creation
4. No existing data affected (additive only)

**Time Required**: 15 minutes

---

### If Phase 3D Fails (Data Migration)

**Scenario**: Relationships broken, data corrupted

**Rollback Steps**:
1. Delete new Connect Boards relationships
2. Re-add dropdown columns
3. Restore dropdown data from backup
4. Revert code to use dropdowns
5. Redeploy application

**Data Required**:
- Complete board export from Phase 1
- Previous version of authentication code

**Time Required**: 1-2 hours

---

### If Phase 3E Fails (Code Updates)

**Scenario**: Application broken, errors in production

**Rollback Steps**:
1. Revert Git commit to previous version
2. Redeploy previous version to Vercel
3. Verify application working
4. Fix code issues locally
5. Re-test before next deployment

**Time Required**: 10-15 minutes (Vercel rollback is fast)

---

### Emergency Full Rollback

**Scenario**: Complete failure, need to restore to Phase 1 state

**Steps**:
1. Revert all code changes (Git reset)
2. Restore all board data from exports
3. Delete any new boards created
4. Remove any new columns added
5. Restore dropdown columns
6. Redeploy previous application version
7. Test all functionality
8. Document what went wrong
9. Revise plan before retry

**Data Required**:
- Complete workspace backup (all boards as CSV)
- Git commit hash from before Phase 3
- Previous Vercel deployment URL

**Time Required**: 2-4 hours

---

## Progress Tracking

### Overall Status

| Phase | Status | Start Date | End Date | Duration |
|-------|--------|------------|----------|----------|
| Phase 1: Analysis | ✅ COMPLETE | Nov 16, 2025 | Nov 16, 2025 | ~2 hours |
| Phase 2: Proposal | ✅ COMPLETE | Nov 16, 2025 | Nov 16, 2025 | ~1 hour |
| Phase 3: Implementation | ⏳ PENDING | TBD | TBD | 7.5-10.5 hours |
| Phase 4: Validation | ⏹️ NOT STARTED | TBD | TBD | 2-3 hours |

### Phase 3 Sub-Status

| Sub-Phase | Status | Assigned To | Notes |
|-----------|--------|-------------|-------|
| 3A: Security | ⏹️ NOT STARTED | TBD | Requires magic link deployment |
| 3B: Cleanup | ⏹️ NOT STARTED | TBD | Requires user approval |
| 3C: New Boards | ⏹️ NOT STARTED | TBD | Requires board IDs from 3B |
| 3D: Migration | ⏹️ NOT STARTED | TBD | Requires 3C complete |
| 3E: Code | ⏹️ NOT STARTED | TBD | Requires 3D complete |

---

## Risk Register

| Risk ID | Description | Impact | Probability | Mitigation |
|---------|-------------|--------|-------------|------------|
| R1 | Board deletion is permanent | 🔴 HIGH | 🟢 LOW | Export all data first, verify board IDs |
| R2 | Users cannot log in after password removal | 🔴 HIGH | 🟡 MEDIUM | Dual auth support, gradual migration |
| R3 | Data relationships break | 🟡 MEDIUM | 🟡 MEDIUM | Comprehensive testing, easy rollback |
| R4 | Code changes introduce bugs | 🟡 MEDIUM | 🟡 MEDIUM | Thorough testing, Git rollback ready |
| R5 | Monday.com API rate limits hit | 🟢 LOW | 🟡 MEDIUM | Add delays between API calls |
| R6 | User data lost during migration | 🔴 HIGH | 🟢 LOW | Full backup before any changes |
| R7 | Application downtime exceeds window | 🟡 MEDIUM | 🟡 MEDIUM | Phased rollout option available |
| R8 | Connect Boards relationships malfunction | 🟡 MEDIUM | 🟢 LOW | Test thoroughly in duplicate workspace |

---

## Contact Information

**Project Lead**: AI Assistant (GitHub Copilot)  
**Workspace Owner**: User (mikehabib@redsis.com assumed)  
**Workspace ID**: 13302651  
**Workspace Name**: Redix Central Hub

**Support Resources**:
- Monday.com API Documentation: https://developer.monday.com/api-reference
- Monday.com Support: support@monday.com
- Next.js Documentation: https://nextjs.org/docs

---

## Appendix

### A. Scripts to Be Created

1. **workspace-analysis.js** ✅ CREATED
2. **delete-test-boards.js** - Board deletion script
3. **create-new-boards.js** - Sites and Projects board creation
4. **migrate-relationships.js** - Dropdown to Connect Boards migration
5. **generate-magic-links.js** - Bulk magic link generation for users
6. **export-all-boards.js** - Complete workspace backup

### B. Documentation to Be Updated

1. **CURRENT_APPLICATION_ARCHITECTURE.md** - Complete rewrite after Phase 3
2. **Monday_API_Integration_Guide.md** - New (if not exists)
3. **Multi_Tenant_Setup_Guide.md** - New
4. **Authentication_Flow_Guide.md** - New

### C. Reference Files

- **WORKSPACE_REORGANIZATION_PROPOSAL.md** - Detailed 37-section proposal
- **workspace-analysis-report.json** - Phase 1 analysis results
- **Workspace_Boards_Columns.md** - Original schema reference

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Nov 16, 2025 | Initial master plan created | AI Assistant |

---

**END OF MASTER PLAN**

**Next Action**: Await user response to 6 critical questions (see Decision Log), then proceed to Phase 3A.
