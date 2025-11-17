# Monday.com Workspace Reorganization - Phase 2 Proposal

**Workspace ID**: 13302651 ("Redix Central Hub")  
**Generated**: November 16, 2025  
**Status**: ⚠️ AWAITING USER APPROVAL - NO CHANGES APPLIED YET

---

## Executive Summary

This proposal outlines specific changes to transform the current Monday.com workspace from a **development/testing environment** into a **production-ready multi-tenant portal infrastructure**. The changes focus on:

1. **Security**: Removing plain text password storage
2. **Architecture**: Implementing proper multi-tenant board structure
3. **Cleanup**: Archiving/deleting 5 test company boards
4. **Relationships**: Establishing Connect Boards columns for proper data integrity

---

## Current State (Phase 1 Analysis Results)

### Boards Discovered (9 total)

**TARGET BOARDS (4)** - Core application infrastructure:
- ✅ Service Providers [18379446736] - 7 columns, 3 items
- ✅ Project Creator [18379404757] - 9 columns, 5 items
- ✅ Users [18379351659] - 8 columns, 5 items
- ✅ Management Portal [18379040651] - 8 columns, 5 items

**TEST BOARDS (5)** - Company-specific boards created for testing:
- 🧪 Chase [18380268500]
- 🧪 Chedraui [18380098330]
- 🧪 VOI [18379880102]
- 🧪 Redsis [18379873697]
- 🧪 RSI [18379754041]

### Critical Issues Identified

1. **🔴 CRITICAL - Plain Text Passwords**:
   - Users Board: `text_mkxpxyrr` column stores passwords as plain text
   - Service Providers Board: `text_mkxpb7j4` column stores passwords as plain text

2. **🟡 MEDIUM - Weak Data Relationships**:
   - Project Creator uses **Dropdown** for Board ID instead of **Connect Boards**
   - Users Board uses **Dropdown** for Company instead of **Connect Boards**
   - No formal foreign key relationships

3. **🟡 MEDIUM - Missing Boards**:
   - No **Companies** board (using repurposed "Project Creator")
   - No **Sites** board (for company locations)
   - No **Projects** board (for work tracking)

4. **🟡 MEDIUM - Test Data Pollution**:
   - 5 company boards exist from testing
   - These appear in Project Creator's Board ID dropdown
   - Test data mixed with production structure

---

## Proposed Changes - Multi-Tenant Architecture

### Target Data Model

```
COMPANIES BOARD
    ├── USERS BOARD (via Connect Boards)
    ├── SITES BOARD (via Connect Boards)
    └── PROJECTS BOARD (via Connect Boards)
            └── TICKETS BOARD (via Connect Boards)

SERVICE_PROVIDERS BOARD
    └── TICKETS BOARD (via Connect Boards for assignments)
```

---

## SECTION A: BOARD DELETIONS (Test Cleanup)

### Boards to DELETE

| Board Name | Board ID | Reason for Deletion | Risk Assessment |
|------------|----------|---------------------|-----------------|
| Chase | 18380268500 | Test/development board | ⚠️ Check for live tickets |
| Chedraui | 18380098330 | Test/development board | ⚠️ Check for live tickets |
| VOI | 18379880102 | Test/development board | ⚠️ Check for live tickets |
| Redsis | 18379873697 | Test/development board | ⚠️ Check for live tickets |
| RSI | 18379754041 | Test/development board | ⚠️ Check for live tickets |

**Pre-Deletion Safety Checks**:
1. ✅ Confirm no active automations reference these boards
2. ✅ Confirm no Connect Boards columns point to these boards
3. ⚠️ **REQUIRED**: Export all items from each board before deletion
4. ⚠️ **REQUIRED**: Verify these are test data, not production companies

**Deletion Impact**:
- Project Creator's `dropdown_mkxpakmh` (Board ID) will have orphaned dropdown values
- These dropdown labels will need manual cleanup after board deletion
- No code changes required (app doesn't reference these specific board IDs)

**User Approval Required**: 
- [ ] Confirm these 5 boards contain ONLY test data
- [ ] Confirm deletion is approved
- [ ] Confirm backup/export is not needed (or has been completed)

---

## SECTION B: BOARD MODIFICATIONS

### B1. Service Providers Board [18379446736]

**CRITICAL CHANGE - Password Column Removal**

| Action | Column ID | Column Name | Column Type | Reason |
|--------|-----------|-------------|-------------|--------|
| **DELETE** | `text_mkxpb7j4` | Password | Text | Plain text password storage - CRITICAL security risk |

**Alternative Authentication Approach**:
- Option 1: Remove password column entirely, use Monday.com native user permissions
- Option 2: Implement OAuth/SSO integration
- Option 3: Use magic link authentication (existing code in backend)
- **Recommended**: Option 3 - Magic links (code already exists)

**Safety Analysis**:
- ⚠️ **BREAKING CHANGE**: If service providers currently log in via this password, authentication will break
- Current auth flow unclear (no code found for service provider login)
- May need migration period with dual auth support

**Dependencies to Check**:
- [ ] Verify if service providers currently use password login
- [ ] Check for automations using password column
- [ ] Check for integrations reading password column

**User Decision Required**:
- [ ] Approve password column deletion
- [ ] Confirm service provider authentication strategy

---

### B2. Users Board [18379351659]

**CRITICAL CHANGE - Password Column Removal + Relationship Fixes**

| Action | Column ID | Column Name | Column Type | Reason |
|--------|-----------|-------------|-------------|--------|
| **DELETE** | `text_mkxpxyrr` | Password | Text | Plain text password storage - CRITICAL security risk |
| **DELETE** | `dropdown_mkxrn759` | First Name | Dropdown | Redundant - name already in Name column |
| **DELETE** | `dropdown_mkxr9kyr` | Last Name | Dropdown | Redundant - name already in Name column |
| **MODIFY** | `dropdown_mkxpsjwd` | Company | Dropdown → **Connect Boards** | Change to proper relationship |
| **ADD** | `connect_boards_new` | Company (Connect) | Connect Boards | Links to Companies board |
| **ADD** | `text_password_hash` | Password Hash | Text (hidden) | Bcrypt-hashed passwords |

**Alternative Authentication Approach**:
- **Recommended**: Magic link authentication (backend code already exists)
- Backup: bcrypt hashed passwords in new hidden column
- Both methods avoid plain text storage

**Breaking Changes**:
- ⚠️ Deleting password column breaks current email/password login in `/api/auth/login/route.ts`
- ⚠️ Changing Company from dropdown to Connect Boards requires code changes in:
  - `/app/api/auth/login/route.ts` (company lookup logic)
  - Authentication flow that matches company by string name

**Code Changes Required After Approval**:
```typescript
// BEFORE (current):
const companyName = user.column_values.find(cv => cv.id === 'dropdown_mkxpsjwd')?.text;
const company = companies.find(c => c.name === companyName);

// AFTER (with Connect Boards):
const companyConnection = user.column_values.find(cv => cv.id === 'connect_boards_new')?.value;
const companyId = JSON.parse(companyConnection).linkedPulseIds[0].linkedPulseId;
const company = await fetchCompanyById(companyId);
```

**Migration Path**:
1. Add new Connect Boards column
2. Run migration script to populate Connect Boards from dropdown
3. Run in dual-column mode (code uses both during transition)
4. After validation, delete dropdown column
5. Update code to use Connect Boards only

**User Decision Required**:
- [ ] Approve password column deletion
- [ ] Approve dropdown → Connect Boards migration
- [ ] Approve deletion of First/Last Name dropdowns
- [ ] Choose authentication method (magic link recommended)

---

### B3. Project Creator Board [18379404757] → Rename to "Companies"

**BOARD RENAME + STRUCTURE OVERHAUL**

| Action | Details | Reason |
|--------|---------|--------|
| **RENAME BOARD** | "Project Creator" → **"Companies"** | Clarify purpose in multi-tenant architecture |

**Column Changes**:

| Action | Column ID | Column Name | Column Type | Reason |
|--------|-----------|-------------|-------------|--------|
| **KEEP** | `name` | Name | Name | Company name (primary identifier) |
| **KEEP** | `status` | Status | Status | Active/Deactivated status |
| **KEEP** | `date4` | Date | Date | Creation timestamp |
| **KEEP** | `text_mkxqv75c` | Main Contact Name | Text | Primary contact |
| **KEEP** | `email_mkxqs6z4` | Main Contact Email | Email | Primary contact email |
| **KEEP** | `phone_mkxqb808` | Main Contact Phone | Phone | Primary contact phone |
| **DELETE** | `dropdown_mkxpakmh` | Board ID | Dropdown | Replace with Connect Boards |
| **DELETE** | `button_mkxpx5k6` | Create Board | Button | No longer needed (manual board creation) |
| **DELETE** | `dropdown_mkxrwmpq` | Company | Dropdown | Redundant (board IS companies) |
| **ADD** | `text_company_id` | Company ID | Text | Unique identifier (optional) |
| **ADD** | `text_domain` | Domain | Text | Company website domain |
| **ADD** | `text_logo_url` | Logo URL | Link | Company logo for branding |
| **ADD** | `connect_boards_sites` | Sites | Connect Boards | Links to Sites board |
| **ADD** | `connect_boards_projects` | Projects | Connect Boards | Links to Projects board |
| **ADD** | `connect_boards_users` | Company Users | Connect Boards | Links to Users board |

**Breaking Changes**:
- ⚠️ Deleting `dropdown_mkxpakmh` (Board ID) breaks authentication flow
- ⚠️ Current auth logic in `/api/auth/login/route.ts` expects Board ID in dropdown
- ⚠️ Dashboard loads tickets using `localStorage.getItem('client_board_id')`

**Migration Path**:
1. Create new Connect Boards column for Projects
2. Create Projects board (see Section C1)
3. Projects board will store tickets (not company-specific boards)
4. Update auth flow to link User → Company → Projects → Tickets
5. After code updated, delete Board ID dropdown

**Impact on 5 Test Boards**:
- Board ID dropdown currently contains these test board IDs
- After board deletions, dropdown will have orphaned values
- New architecture won't use this dropdown at all (Connect Boards instead)

**User Decision Required**:
- [ ] Approve board rename to "Companies"
- [ ] Approve deletion of Board ID dropdown (breaking change)
- [ ] Approve deletion of Create Board button
- [ ] Approve new columns for multi-tenant architecture

---

### B4. Management Portal Board [18379040651] → Rename to "Tickets (Default)"

**BOARD RENAME + ADD RELATIONSHIPS**

| Action | Details | Reason |
|--------|---------|--------|
| **RENAME BOARD** | "Management Portal" → **"Tickets (Default)"** | Clarify this is default ticket board |

**Column Changes**:

| Action | Column ID | Column Name | Column Type | Reason |
|--------|-----------|-------------|-------------|--------|
| **KEEP ALL EXISTING** | - | - | - | Current structure is good |
| **ADD** | `connect_boards_company` | Company | Connect Boards | Link ticket to company |
| **ADD** | `connect_boards_project` | Project | Connect Boards | Link ticket to project |
| **ADD** | `connect_boards_site` | Site | Connect Boards | Link ticket to site |
| **ADD** | `connect_boards_assignee` | Assigned To | Connect Boards | Link to Service Providers board |
| **MODIFY** | `color_mkxp805g` | priority | Status → **Priority** | Use proper column type |

**Note**: This board serves as template/default. Future architecture will have per-project ticket boards.

**User Decision Required**:
- [ ] Approve board rename
- [ ] Approve new relationship columns

---

## SECTION C: NEW BOARDS TO CREATE

### C1. Companies Board Structure (Replaces Project Creator)

**NOTE**: This is the RENAMED Project Creator board with updated columns (see B3)

### C2. Sites Board [NEW]

**Purpose**: Track company locations (offices, warehouses, retail stores, etc.)

**Board Structure**:

| Column Name | Column Type | Required | Description |
|-------------|-------------|----------|-------------|
| Name | Name | ✅ | Site name/identifier (e.g., "NYC Headquarters") |
| Status | Status | ✅ | Active/Inactive/Under Construction |
| Company | Connect Boards | ✅ | Links to Companies board |
| Address | Text | ❌ | Street address |
| City | Text | ✅ | City |
| State/Province | Text | ❌ | State or province |
| Country | Dropdown | ✅ | Country selection |
| Site Type | Dropdown | ❌ | Office/Warehouse/Retail/Manufacturing/etc. |
| Contact Name | Text | ❌ | On-site contact person |
| Contact Email | Email | ❌ | On-site contact email |
| Contact Phone | Phone | ❌ | On-site contact phone |
| Projects | Connect Boards | ❌ | Links to Projects board (reverse relation) |

**Groups**:
- Active Sites
- Inactive Sites

**Use Cases**:
- Company has multiple office locations
- Tickets can be site-specific
- Service providers assigned to specific sites
- Equipment/machines tracked per site

**User Decision Required**:
- [ ] Approve Sites board creation
- [ ] Confirm column structure

---

### C3. Projects Board [NEW]

**Purpose**: Track work projects, installations, initiatives (distinct from support tickets)

**Board Structure**:

| Column Name | Column Type | Required | Description |
|-------------|-------------|----------|-------------|
| Name | Name | ✅ | Project name |
| Status | Status | ✅ | Planning/In Progress/On Hold/Completed |
| Company | Connect Boards | ✅ | Links to Companies board |
| Site | Connect Boards | ❌ | Links to Sites board (if project is site-specific) |
| Start Date | Date | ❌ | Project start date |
| End Date | Date | ❌ | Project completion date |
| Project Manager | People | ❌ | Internal project manager |
| Budget | Numbers | ❌ | Project budget |
| Description | Long Text | ❌ | Project description |
| Tickets | Connect Boards | ❌ | Links to Tickets board (support tickets for project) |
| Assigned Service Providers | Connect Boards | ❌ | Links to Service Providers board |

**Groups**:
- Active Projects
- Completed Projects
- On Hold

**Use Cases**:
- Track installation projects
- Link support tickets to specific projects
- Assign service providers to projects
- Budget tracking per project

**Alternative Architecture**:
Instead of a central "Tickets (Default)" board, each PROJECT could have its own ticket board:
- Projects board has "Ticket Board ID" column
- Tickets are project-specific (better isolation)
- Matches original "company-specific boards" concept

**User Decision Required**:
- [ ] Approve Projects board creation
- [ ] Choose ticket architecture:
  - Option A: Central tickets board with Project connect column
  - Option B: Per-project ticket boards (like current test boards)

---

## SECTION D: DATA MIGRATION STRATEGY

### D1. Existing Data Preservation

**Users Board**:
- 5 existing users: mikehabib@redsis.com, cgiraldo@redsis.com, nmartinez@redsis.com, bromero@redsis.com, soporte@redsis.com
- Company associations: Redsis (current dropdown values)

**Migration Steps**:
1. Export all user data before column changes
2. Create new Connect Boards column
3. Map existing company dropdown values to Companies board items
4. Populate Connect Boards relationships
5. Validate data integrity
6. Delete old dropdown column

**Project Creator → Companies**:
- 5 existing companies: Redsis, RSI, VOI, Chedraui, Chase
- Board ID mappings currently in dropdown

**Migration Steps**:
1. Rename board to "Companies"
2. Create Projects board
3. For each company, create a default project
4. Link users to companies via Connect Boards
5. Update authentication code
6. Delete Board ID dropdown

**Service Providers**:
- 3 existing providers in board
- Password column removal requires auth migration

**Migration Steps**:
1. Export provider data
2. Generate magic links for each provider
3. Send onboarding emails with magic links
4. Delete password column after migration complete

---

### D2. Test Board Data

**Question for User**: Do you want to preserve any data from the 5 test boards before deletion?

Options:
- [ ] Export all items to CSV before deletion (recommended)
- [ ] Move items to new Projects/Tickets boards
- [ ] Delete without backup (confirm test data only)

---

## SECTION E: CODE CHANGES REQUIRED

### Files Requiring Updates After Approval

**Authentication Flow** (`/app/api/auth/login/route.ts`):
- ❌ Remove password column references
- ✅ Add magic link verification
- ❌ Change company lookup from dropdown to Connect Boards
- ❌ Change board ID lookup to Projects → Tickets flow

**Dashboard** (`/app/client/dashboard/page.tsx`):
- ❌ Update ticket loading to use new relationships
- ❌ Update board ID resolution

**Management Portal** (`/app/embed/admin/page.tsx`):
- ❌ Update company creation to use new board structure
- ❌ Remove "Create Board" button functionality
- ✅ Add Projects board management
- ✅ Add Sites board management

**Column Mapping** (`/lib/board-columns.ts`):
- ❌ Update fallback column IDs for new structure
- ✅ Add Connect Boards column handling

**Hardcoded IDs**:
- Update `18379404757` references to "Companies" (renamed from Project Creator)
- Add new board IDs for Sites and Projects boards

---

## SECTION F: IMPLEMENTATION PHASES

### Phase 3A: Security Fixes (CRITICAL - Do First)

**Duration**: 1-2 hours  
**Risk**: HIGH - Breaking changes to authentication

**Steps**:
1. Deploy backend magic link functions to Monday Code
2. Test magic link generation and verification
3. Generate magic links for all existing users
4. Send onboarding emails to users
5. Delete password columns from Users and Service Providers boards
6. Update authentication code to use magic links only
7. Test login flow end-to-end

**Rollback Plan**: 
- Keep password columns for 1 week during migration
- Dual auth support (password OR magic link)
- Delete password columns only after all users migrated

---

### Phase 3B: Test Board Cleanup (Safe - Non-Breaking)

**Duration**: 30 minutes  
**Risk**: LOW - These are test boards

**Steps**:
1. Export data from 5 test boards (Chase, Chedraui, VOI, Redsis, RSI)
2. Verify exports are complete
3. Delete boards via Monday.com API or UI
4. Clean up orphaned dropdown values in Companies board (former Project Creator)

---

### Phase 3C: New Board Creation (Safe - Additive)

**Duration**: 1 hour  
**Risk**: LOW - No existing data affected

**Steps**:
1. Create Sites board with proposed structure
2. Create Projects board with proposed structure
3. Add Connect Boards columns to Companies board
4. Add Connect Boards columns to Tickets board
5. Document new board IDs in code

---

### Phase 3D: Data Migration (CRITICAL - Test Thoroughly)

**Duration**: 2-3 hours  
**Risk**: MEDIUM - Affects existing users and companies

**Steps**:
1. Create migration script to populate Connect Boards relationships
2. For each user, link to company via Connect Boards
3. For each company, create default project
4. Test authentication flow with new structure
5. Validate all relationships
6. Delete old dropdown columns

---

### Phase 3E: Code Updates (CRITICAL - Breaking Changes)

**Duration**: 3-4 hours  
**Risk**: HIGH - Application won't work without these changes

**Steps**:
1. Update authentication flow
2. Update dashboard ticket loading
3. Update management portal
4. Update column mapping
5. Add error handling for missing relationships
6. Full regression testing

---

## SECTION G: ROLLBACK PLAN

### If Things Go Wrong

**Board Deletions**:
- ❌ **Cannot rollback** - Deleted boards cannot be recovered
- ✅ **Prevention**: Export all data before deletion

**Column Deletions**:
- ❌ **Cannot rollback** - Deleted columns and data are permanent
- ✅ **Prevention**: Create new columns first, migrate data, then delete old columns

**Column Type Changes**:
- ❌ **Partial rollback** - Some data may be lost
- ✅ **Prevention**: Test on duplicate board first

**Recommended Safety Approach**:
1. Create duplicate workspace for testing
2. Apply all changes to test workspace first
3. Validate thoroughly
4. Then apply to production workspace

---

## SECTION H: APPROVAL CHECKLIST

### Required User Approvals

**Board Deletions** (Section A):
- [ ] Approve deletion of Chase board [18380268500]
- [ ] Approve deletion of Chedraui board [18380098330]
- [ ] Approve deletion of VOI board [18379880102]
- [ ] Approve deletion of Redsis board [18379873697]
- [ ] Approve deletion of RSI board [18379754041]
- [ ] Confirm these are test boards with no production data
- [ ] Confirm backup/export completed (or not needed)

**Security Changes** (Section B1, B2):
- [ ] Approve deletion of password column in Service Providers board
- [ ] Approve deletion of password column in Users board
- [ ] Approve magic link authentication as replacement
- [ ] Approve migration timeline (with downtime window)

**Relationship Changes** (Section B2, B3):
- [ ] Approve changing Users.Company from Dropdown to Connect Boards
- [ ] Approve changing Companies.Board_ID from Dropdown to Connect Boards
- [ ] Acknowledge this requires code changes
- [ ] Approve migration strategy

**Board Renames** (Section B3, B4):
- [ ] Approve "Project Creator" → "Companies"
- [ ] Approve "Management Portal" → "Tickets (Default)"

**New Boards** (Section C):
- [ ] Approve Sites board creation
- [ ] Approve Projects board creation
- [ ] Choose ticket architecture:
  - [ ] Option A: Central tickets board
  - [ ] Option B: Per-project ticket boards

**Redundant Column Deletions** (Section B2, B3):
- [ ] Approve deletion of Users.First_Name dropdown
- [ ] Approve deletion of Users.Last_Name dropdown
- [ ] Approve deletion of Companies.Company dropdown
- [ ] Approve deletion of Companies.Create_Board button

**Implementation Approach**:
- [ ] Approve phased implementation (3A → 3E)
- [ ] Approve testing in duplicate workspace first (recommended)
- [ ] OR approve direct production changes (not recommended)

---

## SECTION I: RISK SUMMARY

### HIGH RISK Changes (Require Careful Testing)

1. **Password column deletions** - Breaks authentication entirely
2. **Dropdown → Connect Boards migrations** - Changes data structure fundamentally
3. **Board ID column deletion** - Breaks current ticket loading

### MEDIUM RISK Changes (Breaking but Recoverable)

1. **Board renames** - May confuse users, but no data loss
2. **Column type changes** - May lose some data formatting

### LOW RISK Changes (Safe/Additive)

1. **New board creation** - No existing data affected
2. **New column additions** - No existing functionality broken
3. **Test board deletions** - No production data affected

---

## Next Steps

**USER ACTION REQUIRED**:

1. **Review this proposal carefully**
2. **Check the approval checklist** (Section H)
3. **Reply with**:
   - Specific approvals OR
   - Requested changes to proposal OR
   - Questions/clarifications needed

**AGENT WILL THEN**:
- Create implementation scripts for approved changes
- Execute Phase 3 changes in approved order
- Generate post-implementation validation report
- Update CURRENT_APPLICATION_ARCHITECTURE.md

---

## Questions for User

1. **Test Boards**: Confirm these 5 boards (Chase, Chedraui, VOI, Redsis, RSI) are test data and safe to delete?

2. **Authentication**: Approve magic link as primary authentication method (replacing passwords)?

3. **Ticket Architecture**: Prefer central tickets board (Option A) or per-project ticket boards (Option B)?

4. **Testing**: Create duplicate workspace for testing first, or apply changes directly to production?

5. **Migration Downtime**: Acceptable to have portal offline for 2-4 hours during migration?

6. **Data Backup**: Should we export ALL board data before any changes as safety measure?

---

**⚠️ CRITICAL REMINDER**: This is a PROPOSAL only. NO changes have been made to your Monday.com workspace. All changes require your explicit approval before execution.
