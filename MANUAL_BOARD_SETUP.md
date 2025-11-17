# Manual Board Relationship Setup Guide

## ⚠️ API Limitation

Monday.com's GraphQL API does not currently support creating `board_relation` (Connect Boards) columns programmatically. These columns must be added manually through the Monday.com UI.

## 📋 Required Manual Steps

### Sites Board [18380394514]

Add these Connect Boards columns:

1. **Primary Service Provider**
   - Column Type: Connect Boards
   - Link to Board: Service Providers [18379446736]
   - Settings: Allow selecting 1 item

2. **Site Manager**
   - Column Type: Connect Boards
   - Link to Board: Users [18379351659]
   - Settings: Allow selecting 1 item

### Projects Board [18380394647]

Add these Connect Boards columns:

1. **Site**
   - Column Type: Connect Boards
   - Link to Board: Sites [18380394514]
   - Settings: Allow selecting 1 item
   - ⚠️ CRITICAL: This establishes the multi-tenant site-project relationship

2. **Assigned Service Provider**
   - Column Type: Connect Boards
   - Link to Board: Service Providers [18379446736]
   - Settings: Allow selecting 1 item

3. **Project Manager**
   - Column Type: Connect Boards
   - Link to Board: Users [18379351659]
   - Settings: Allow selecting 1 item

## 🔧 How to Add Connect Boards Columns

1. Open Monday.com → Workspace 13302651
2. Navigate to the board (Sites or Projects)
3. Click the "+" button at the top right to add a new column
4. Select "Connect Boards" from the column type menu
5. Enter the column name (exactly as shown above)
6. Select the target board to connect to
7. Configure settings (typically allow 1 item)
8. Click "Add Column"

## ✅ Verification Checklist

After adding all columns manually, verify:

- [ ] Sites board has 11 total columns (9 created + 2 manual)
  - [x] Organization (text)
  - [x] Site Address (text)
  - [x] Site Contact Name (text)
  - [x] Site Contact Email (email)
  - [x] Site Contact Phone (phone)
  - [x] Active Projects (numbers)
  - [x] Total Tickets (numbers)
  - [ ] **Primary Service Provider (Connect Boards → Service Providers)**
  - [ ] **Site Manager (Connect Boards → Users)**
  - [x] Status (status)
  - [x] Notes (long text)

- [ ] Projects board has 11 total columns (8 created + 3 manual)
  - [ ] **Site (Connect Boards → Sites)** ← CRITICAL
  - [x] Service Type (dropdown)
  - [ ] **Assigned Service Provider (Connect Boards → Service Providers)**
  - [ ] **Project Manager (Connect Boards → Users)**
  - [x] Start Date (date)
  - [x] End Date (date)
  - [x] Status (status)
  - [x] Ticket Board Type (dropdown)
  - [x] Ticket Board ID (text)
  - [x] Total Tickets (numbers)
  - [x] Notes (long text)

## 📊 After Manual Setup

Once all Connect Boards columns are added:

1. Run data migration script to populate boards
2. Establish site-project relationships
3. Link service providers and managers
4. Update application code with new board structure

## 🔍 Finding Column IDs

After adding Connect Boards columns manually, you can get their IDs by running:

```bash
node get-board-columns.js 18380394514  # Sites board
node get-board-columns.js 18380394647  # Projects board
```

This will show all columns including the new Connect Boards columns with their IDs.

## ⏱️ Estimated Time

- Adding 2 columns to Sites board: ~2 minutes
- Adding 3 columns to Projects board: ~3 minutes
- Verification: ~1 minute
- **Total: ~6 minutes**

## 📝 Alternative: Continue Without Relationships

If you prefer to continue with automated steps first and add relationships later:

1. ✅ Proceed with data migration (can populate other fields)
2. ✅ Update application code
3. ✅ Setup automations
4. ⏸️  Come back and add Connect Boards columns
5. 🔄 Re-run relationship establishment script

The system will work without these columns, but you'll lose multi-tenant capabilities and cross-board relationships until they're added.

## 🚀 Recommended Next Step

**Option A (Recommended):** Pause automation, add Connect Boards columns manually (~6 min), then continue

**Option B:** Continue with automation, skip relationship fields, add manually later

Your choice! Let me know when the manual columns are added, or if you want to proceed with Option B.
