# Phase 3 Implementation Plan - READY TO EXECUTE

**Workspace ID**: 13302651 ("Redix Central Hub")  
**Status**: ✅ ALL APPROVALS RECEIVED - READY TO PROCEED  
**Date**: November 16, 2025  
**Environment**: Sample data only (no production risk)

---

## Executive Summary

All 6 critical questions have been answered. The workspace reorganization is approved and ready for implementation with the following key decisions:

### ✅ Approved Architecture

1. **Authentication**: Magic links (primary) + 4-digit PIN (fallback for store/vendor users)
2. **Ticket System**: Hybrid - Master Tickets board + optional per-project dedicated boards
3. **Testing**: Direct implementation in workspace 13302651 (sample data only)
4. **Downtime**: Not a concern (system not running)
5. **Backup**: Comprehensive export required before any destructive actions
6. **Board Deletions**: Approved for 5 test boards after explicit confirmation

---

## Updated Requirements Based on User Decisions

### Authentication System Changes

**NEW REQUIREMENT**: Dual authentication support

**Users Board Updates**:
- ❌ DELETE: `text_mkxpxyrr` (Password - plain text)
- ❌ DELETE: `dropdown_mkxrn759` (First Name)
- ❌ DELETE: `dropdown_mkxr9kyr` (Last Name)
- ✅ ADD: `dropdown_user_type` (User Type: "Email User" / "PIN User")
- ✅ ADD: `text_pin` (4-digit PIN for non-email users, hidden)
- 🔄 MODIFY: `dropdown_mkxpsjwd` → Connect Boards (Company relationship)

**Service Providers Board Updates**:
- ❌ DELETE: `text_mkxpb7j4` (Password - plain text)
- ✅ ADD: `dropdown_user_type` (User Type: "Email User" / "PIN User")
- ✅ ADD: `text_pin` (4-digit PIN for non-email users, hidden)

**Authentication Logic**:
```
IF user_type === "Email User":
    → Send magic link to email
    → User clicks link to authenticate
    → JWT token generated

ELSE IF user_type === "PIN User":
    → Display PIN input field
    → Validate 4-digit PIN against board
    → JWT token generated
```

---

### Ticket Architecture Changes

**NEW REQUIREMENT**: Hybrid ticket system

**Projects Board Additional Columns**:
- ✅ ADD: `dropdown_ticket_board_type` (Ticket Board Type: "Global" / "Dedicated")
- ✅ ADD: `text_ticket_board_id` (Ticket Board ID - stores board ID if dedicated)

**Master Tickets Board**:
- Renamed from "Management Portal" → "Master Tickets"
- All existing columns retained
- ✅ ADD: `connect_boards_project` (Project)
- ✅ ADD: `connect_boards_company` (Company)
- ✅ ADD: `connect_boards_site` (Site)
- ✅ ADD: `connect_boards_assignee` (Assigned To - Service Providers)
- ✅ ADD: `text_source_board_id` (Source Board ID - if mirrored from dedicated board)
- ✅ ADD: `text_source_item_id` (Source Item ID - if mirrored from dedicated board)

**Ticket Creation Workflow**:
```
1. User creates ticket for Project X
2. Check Project X's "Ticket Board Type":
   
   IF "Global":
       → Create ticket on Master Tickets board
       → Link to Project X via Connect Boards
   
   ELSE IF "Dedicated":
       → Get Ticket Board ID from Project X
       → Create ticket on dedicated board
       → Automation mirrors ticket to Master Tickets board
       → Store source_board_id and source_item_id for tracking
```

**Automation Requirements** (to be configured in Monday.com):
- When item created on dedicated project board → Create mirrored item on Master Tickets
- When item updated on dedicated board → Update mirrored item on Master Tickets
- Sync fields: Status, Priority, Description, Client Email, Assigned Service Provider

---

## Phase 3 Implementation Steps (Revised)

### Step 0: Comprehensive Backup (NEW - REQUIRED FIRST)

**Duration**: 30 minutes  
**Risk**: None - read-only operation

**Tasks**:
1. Create `backup-workspace.js` script
2. Export all boards to JSON:
   - Service Providers [18379446736]
   - Project Creator [18379404757]
   - Users [18379351659]
   - Management Portal [18379040651]
   - Chase [18380268500]
   - Chedraui [18380098330]
   - VOI [18379880102]
   - Redsis [18379873697]
   - RSI [18379754041]

3. For each board, export:
   - Board metadata (name, description, state)
   - Column definitions (id, title, type, settings)
   - Groups (id, title, position)
   - Items (id, name, column_values)
   - Automations (if API accessible)
   - Views (if API accessible)

4. Save to `/backups/workspace-13302651-backup-YYYY-MM-DD/`

**Output Files**:
- `boards.json` - All board structures
- `columns.json` - All column definitions
- `items.json` - All items with data
- `automations.json` - Automation configurations
- `views.json` - Board views
- `full-backup.json` - Complete workspace snapshot

**Validation**:
- [ ] All 9 boards exported successfully
- [ ] All column IDs captured
- [ ] All items with data backed up
- [ ] Backup files readable and valid JSON

---

### Step 1: Security Fixes (CRITICAL)

**Duration**: 1-2 hours  
**Risk**: 🔴 HIGH - Breaking changes to authentication

**Phase 1A: Add New Authentication Columns**

1. Users Board [18379351659]:
   - Add `dropdown_user_type` (Email User / PIN User)
   - Add `text_pin` (4-digit, hidden)
   - Set all existing users to "Email User" type

2. Service Providers Board [18379446736]:
   - Add `dropdown_user_type` (Email User / PIN User)
   - Add `text_pin` (4-digit, hidden)
   - Set all existing providers to "Email User" type

**Phase 1B: Deploy Magic Link Backend**

1. Deploy to Monday Code:
   - `/apps/backend/src/generate-magic-link.ts`
   - `/apps/backend/src/verify-magic-link.ts`

2. Test magic link generation for 1 user

3. Generate magic links for all 5 existing users

4. Send onboarding emails

**Phase 1C: Update Authentication Code**

1. Update `/app/api/auth/login/route.ts`:
   - Check `user_type` field
   - IF "Email User" → Magic link flow
   - IF "PIN User" → PIN validation flow
   - Remove password validation

2. Update login UI:
   - Add user type selector or auto-detect
   - Show email input OR PIN input based on type

**Phase 1D: Remove Password Columns (After Testing)**

1. Verify all users can authenticate via new methods
2. Delete Users.Password column (`text_mkxpxyrr`)
3. Delete ServiceProviders.Password column (`text_mkxpb7j4`)

**Validation**:
- [ ] Magic link authentication works
- [ ] PIN authentication works
- [ ] No plain text passwords in any board
- [ ] All users can log in

---

### Step 2: Test Board Cleanup

**Duration**: 15 minutes  
**Risk**: 🟢 LOW - Test boards only, no production data

**Tasks**:

1. **Get explicit user approval for deletion** (REQUIRED):
   - [ ] User confirms deletion of Chase [18380268500]
   - [ ] User confirms deletion of Chedraui [18380098330]
   - [ ] User confirms deletion of VOI [18379880102]
   - [ ] User confirms deletion of Redsis [18379873697]
   - [ ] User confirms deletion of RSI [18379754041]

2. Create `delete-test-boards.js` script

3. For each board:
   - Verify already backed up in Step 0
   - Check for automations (should be none)
   - Delete via Monday.com API

4. Clean orphaned dropdown values in Companies board

**Validation**:
- [ ] Only 4 boards remain in workspace
- [ ] Backups confirmed safe
- [ ] No broken references

---

### Step 3: New Board Creation

**Duration**: 1.5 hours  
**Risk**: 🟢 LOW - Additive only

**Task 3A: Create Sites Board**

Columns:
1. Name (Name) - Required
2. Status (Status) - Required
3. Company (Connect Boards → Companies) - Required
4. Address (Text)
5. City (Text) - Required
6. State/Province (Text)
7. Country (Dropdown: USA, Mexico, Canada, etc.)
8. Site Type (Dropdown: Office, Warehouse, Retail, Manufacturing, Remote)
9. Contact Name (Text)
10. Contact Email (Email)
11. Contact Phone (Phone)
12. Projects (Connect Boards → Projects)

Groups:
- Active Sites
- Inactive Sites

**Task 3B: Create Projects Board**

Columns:
1. Name (Name) - Required
2. Status (Status) - Required
3. Company (Connect Boards → Companies) - Required
4. Site (Connect Boards → Sites)
5. Start Date (Date)
6. End Date (Date)
7. Project Manager (People)
8. Budget (Numbers)
9. Description (Long Text)
10. Tickets (Connect Boards → Master Tickets)
11. Assigned Service Providers (Connect Boards → Service Providers)
12. **Ticket Board Type** (Dropdown: "Global" / "Dedicated") - NEW
13. **Ticket Board ID** (Text) - NEW

Groups:
- Active Projects
- Completed Projects
- On Hold

**Task 3C: Update Existing Boards**

1. **Rename Boards**:
   - "Project Creator" → "Companies"
   - "Management Portal" → "Master Tickets"

2. **Companies Board [18379404757]** - Add columns:
   - Company ID (Text)
   - Domain (Text)
   - Logo URL (Link)
   - Sites (Connect Boards → Sites)
   - Projects (Connect Boards → Projects)
   - Company Users (Connect Boards → Users)

3. **Master Tickets Board [18379040651]** - Add columns:
   - Company (Connect Boards → Companies)
   - Project (Connect Boards → Projects)
   - Site (Connect Boards → Sites)
   - Assigned To (Connect Boards → Service Providers)
   - Source Board ID (Text) - for mirrored tickets
   - Source Item ID (Text) - for mirrored tickets

4. **Delete redundant columns** (after new ones added):
   - Companies: Delete Board ID dropdown, Create Board button, Company dropdown
   - Users: Already deleted First/Last Name in Step 1

**Script**: `create-boards-and-columns.js`

**Validation**:
- [ ] Sites board created with 12 columns
- [ ] Projects board created with 13 columns
- [ ] Board IDs documented
- [ ] Companies board has 13 columns total
- [ ] Master Tickets board has 13 columns total
- [ ] All Connect Boards columns functional

---

### Step 4: Data Migration

**Duration**: 1 hour  
**Risk**: 🟡 MEDIUM - Data transformation

**Task 4A: Migrate User → Company Relationships**

Script: `migrate-user-company-relationships.js`

For each user in Users board:
1. Get current company from dropdown (`dropdown_mkxpsjwd`)
2. Find matching company in Companies board by name
3. Create Connect Boards relationship
4. Validate relationship created
5. After all migrated, delete dropdown column

**Task 4B: Create Default Projects**

Script: `create-default-projects.js`

For each company in Companies board:
1. Create project: "{Company Name} - Default Project"
2. Set Company relationship via Connect Boards
3. Set Ticket Board Type to "Global"
4. Set Status to "Active"

**Task 4C: Link Existing Tickets to Projects**

For existing tickets on Master Tickets board:
1. Identify company (via client email domain or manual mapping)
2. Link to company's default project
3. Set Company relationship

**Validation**:
- [ ] All 5 users linked to companies via Connect Boards
- [ ] All companies have default projects
- [ ] All existing tickets linked to projects
- [ ] Old dropdown columns deleted
- [ ] No broken relationships

---

### Step 5: Code Updates

**Duration**: 4-5 hours  
**Risk**: 🔴 HIGH - Application won't work without these

**File 1: `/app/api/auth/login/route.ts`**

Changes:
```typescript
// Remove password validation
// Add user type detection
// Implement magic link flow for Email Users
// Implement PIN validation for PIN Users
// Change company lookup from dropdown to Connect Boards
// Update board ID resolution: User → Company → Default Project → Tickets
```

**File 2: `/app/client/dashboard/page.tsx`**

Changes:
```typescript
// Update ticket loading to check Project's ticket board type
// IF Global → load from Master Tickets
// IF Dedicated → load from Project's ticket board ID
// Update board ID resolution from localStorage
```

**File 3: `/app/embed/admin/page.tsx`**

Changes:
```typescript
// Update company creation to use new Connect Boards structure
// Remove "Create Board" button functionality
// Add Projects board management UI
// Add Sites board management UI
// Add ticket board type selection for projects
```

**File 4: `/lib/board-columns.ts`**

Changes:
```typescript
// Update fallback column IDs
// Add Connect Boards column handling
// Add hybrid ticket board resolution
```

**File 5: `/lib/auth.ts`**

Changes:
```typescript
// Add magic link token generation
// Add PIN validation utilities
// Add JWT utilities with user_type support
```

**File 6: `/apps/client-portal/app/(public)/login/page.tsx`** (NEW)

Changes:
```typescript
// Add user type selector or auto-detection
// Show email input for Email Users
// Show PIN input for PIN Users
// Update form submission logic
```

**Validation**:
- [ ] Login flow works for Email Users
- [ ] Login flow works for PIN Users
- [ ] Dashboard loads tickets correctly (Global projects)
- [ ] Dashboard loads tickets correctly (Dedicated projects)
- [ ] New ticket creation works
- [ ] Management portal functional
- [ ] No console errors

---

### Step 6: Automation Setup (Monday.com UI)

**Duration**: 1 hour  
**Risk**: 🟢 LOW - Optional enhancement

**Required Automations** (for dedicated project boards):

**Automation 1: Mirror New Tickets**
```
When item is created in [Dedicated Project Board]
→ Create item in Master Tickets board
→ Copy: Name, Status, Priority, Description, Client Email
→ Set: Source Board ID, Source Item ID, Project relationship
```

**Automation 2: Sync Ticket Updates**
```
When status changes in [Dedicated Project Board]
→ Find item in Master Tickets where Source Item ID matches
→ Update: Status, Priority
```

**Automation 3: Sync Assignments**
```
When Service Provider assigned in [Dedicated Project Board]
→ Find item in Master Tickets where Source Item ID matches
→ Update: Assigned To
```

**Note**: These automations need to be created manually for each dedicated project board, or use Monday.com's integration recipes if available.

---

### Step 7: Final Audit & Documentation

**Duration**: 1 hour  
**Risk**: None

**Task 7A: Generate Audit Report**

Script: `generate-audit-report.js`

Output: `PHASE_3_AUDIT_REPORT.md`

Contents:
1. Final board structure (all 6 boards)
2. Complete column listing with IDs
3. All relationships documented
4. Authentication flow diagram
5. Ticket routing logic
6. Before/After comparison
7. Data migration summary
8. Code changes summary

**Task 7B: Update Architecture Documentation**

Update `CURRENT_APPLICATION_ARCHITECTURE.md`:
- New board structure
- Updated column IDs
- New authentication flows (magic link + PIN)
- Hybrid ticket architecture
- Updated data flow diagrams
- New API endpoints

**Task 7C: Create Handoff Package**

Package for GitHub Copilot agent:
- `PHASE_3_AUDIT_REPORT.md`
- Updated `CURRENT_APPLICATION_ARCHITECTURE.md`
- `board-column-reference.json` (all board IDs and column IDs)
- `authentication-guide.md` (magic link + PIN implementation)
- `ticket-routing-guide.md` (hybrid architecture explanation)

---

## Execution Order

```
STEP 0: Backup (30 min)
    ↓ [REQUIRED - Cannot proceed without backup]
STEP 1: Security Fixes (1-2 hours)
    ↓ [Add columns → Test → Remove passwords]
STEP 2: Delete Test Boards (15 min)
    ↓ [Requires explicit approval]
STEP 3: Create New Boards (1.5 hours)
    ↓ [Sites, Projects, Update Companies/Tickets]
STEP 4: Migrate Data (1 hour)
    ↓ [Relationships, Default Projects]
STEP 5: Update Code (4-5 hours)
    ↓ [Auth, Dashboard, Admin, Column mapping]
STEP 6: Setup Automations (1 hour)
    ↓ [Manual in Monday.com UI]
STEP 7: Audit & Documentation (1 hour)
    ↓ [Reports for user and Copilot agent]
COMPLETE ✅
```

**Total Time**: 9.5 - 12 hours

---

## Safety Checkpoints

### Before Step 1 (Security)
- [ ] Step 0 backup complete and verified
- [ ] Backend magic link functions ready
- [ ] Test email infrastructure working

### Before Step 2 (Deletions)
- [ ] User explicitly approves each board deletion
- [ ] Backup verified for all 5 test boards
- [ ] No automations reference test boards

### Before Step 4 (Migration)
- [ ] New boards created successfully
- [ ] All Connect Boards columns functional
- [ ] Backup point created

### Before Step 5 (Code)
- [ ] Data migration validated
- [ ] All relationships intact
- [ ] Git branch created for code changes

---

## Rollback Plan

**If any step fails**:

1. **Stop immediately**
2. **Do NOT proceed to next step**
3. **Review error logs**
4. **Restore from backup if needed**:
   - Use Step 0 backup files
   - Manually restore deleted columns
   - Restore deleted boards (if possible via Monday.com support)
5. **Fix issue**
6. **Re-run failed step**
7. **Validate before continuing**

---

## Success Metrics

After Phase 3 completion:

- ✅ 0 plain text passwords in workspace
- ✅ 6 boards total (was 9, deleted 5 test boards, added 2 new)
- ✅ All relationships via Connect Boards (no string matching)
- ✅ 100% data preservation (5 users, companies, tickets)
- ✅ Magic link authentication working
- ✅ PIN authentication working for non-email users
- ✅ Hybrid ticket system operational
- ✅ Master Tickets board as central source of truth
- ✅ Code updated and tested
- ✅ Complete audit report generated
- ✅ Documentation updated for handoff

---

## Next Action

**READY TO PROCEED**: All approvals received

**User must provide**:
1. ✅ Final confirmation to begin Phase 3
2. ✅ Explicit approval for deletion of 5 test boards (list board names)

**Once approved, I will**:
1. Create Step 0 backup script
2. Execute backup
3. Show backup results
4. Await approval to continue to Step 1

**Estimated total project time**: 9.5 - 12 hours  
**Can pause between steps**: Yes  
**Rollback available**: Yes (via backups)

---

**STATUS**: 🟢 READY TO EXECUTE - Awaiting final go-ahead
