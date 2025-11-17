const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');

// Monday.com API Configuration
const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const WORKSPACE_ID = '13302651';
const API_VERSION = '2023-10';

// Backup configuration
const BACKUP_DIR = path.join(__dirname, 'backups', `workspace-${WORKSPACE_ID}-backup-${new Date().toISOString().split('T')[0]}`);

// GraphQL query helper
async function mondayQuery(query, variables = {}) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY,
      'API-Version': API_VERSION
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
  }
  
  return result;
}

// Get all boards in workspace
async function getAllBoards() {
  console.log('📋 Fetching all boards in workspace...\n');
  
  const query = `
    query {
      boards(workspace_ids: [${WORKSPACE_ID}], limit: 50) {
        id
        name
        description
        board_kind
        state
        workspace {
          id
          name
        }
      }
    }
  `;

  const result = await mondayQuery(query);
  return result.data?.boards || [];
}

// Get complete board details
async function getBoardDetails(boardId) {
  console.log(`  📊 Fetching details for board ${boardId}...`);
  
  const query = `
    query {
      boards(ids: [${boardId}]) {
        id
        name
        description
        board_kind
        state
        workspace {
          id
          name
        }
        columns {
          id
          title
          type
          settings_str
        }
        groups {
          id
          title
          position
        }
      }
    }
  `;

  const result = await mondayQuery(query);
  return result.data?.boards?.[0] || null;
}

// Get all items for a board (paginated)
async function getBoardItems(boardId) {
  console.log(`  📦 Fetching items for board ${boardId}...`);
  
  let allItems = [];
  let cursor = null;
  let page = 1;
  
  do {
    const query = `
      query ($boardId: [ID!], $cursor: String) {
        boards(ids: $boardId) {
          items_page(limit: 100, cursor: $cursor) {
            cursor
            items {
              id
              name
              group {
                id
                title
              }
              column_values {
                id
                type
                text
                value
              }
            }
          }
        }
      }
    `;

    const result = await mondayQuery(query, { boardId: [boardId], cursor });
    const itemsPage = result.data?.boards?.[0]?.items_page;
    
    if (!itemsPage) break;
    
    allItems = allItems.concat(itemsPage.items);
    cursor = itemsPage.cursor;
    
    console.log(`    Page ${page}: ${itemsPage.items.length} items (Total: ${allItems.length})`);
    page++;
    
  } while (cursor);
  
  return allItems;
}

// Get board views (if API supports it)
async function getBoardViews(boardId) {
  console.log(`  👁️  Fetching views for board ${boardId}...`);
  
  const query = `
    query {
      boards(ids: [${boardId}]) {
        views {
          id
          name
          type
          settings_str
        }
      }
    }
  `;

  const result = await mondayQuery(query);
  
  // Views might not be available in all API versions
  if (result.errors) {
    console.log('    ⚠️  Views not available via API (this is normal)');
    return [];
  }
  
  return result.data?.boards?.[0]?.views || [];
}

// Create backup directory
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log(`✅ Backup directory created: ${BACKUP_DIR}\n`);
  } catch (error) {
    console.error('❌ Failed to create backup directory:', error.message);
    throw error;
  }
}

// Save JSON file
async function saveJSON(filename, data) {
  const filepath = path.join(BACKUP_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✅ Saved: ${filename}`);
}

// Main backup function
async function backupWorkspace() {
  console.log('🚀 MONDAY.COM WORKSPACE BACKUP STARTED');
  console.log('==========================================\n');
  console.log(`Workspace ID: ${WORKSPACE_ID}`);
  console.log(`Backup Date: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Create backup directory
    await ensureBackupDir();

    // Step 2: Get all boards
    const boards = await getAllBoards();
    console.log(`📋 Found ${boards.length} boards in workspace\n`);

    // Step 3: Backup board list
    await saveJSON('boards-list.json', {
      workspace_id: WORKSPACE_ID,
      backup_date: new Date().toISOString(),
      total_boards: boards.length,
      boards: boards.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        board_kind: b.board_kind,
        state: b.state
      }))
    });

    // Step 4: Backup each board in detail
    const fullBackup = {
      workspace_id: WORKSPACE_ID,
      workspace_name: boards[0]?.workspace?.name || 'Redix Central Hub',
      backup_date: new Date().toISOString(),
      total_boards: boards.length,
      boards: []
    };

    for (const board of boards) {
      console.log(`\n📂 Processing: ${board.name} [${board.id}]`);
      console.log('─'.repeat(50));

      // Get board details
      const details = await getBoardDetails(board.id);
      
      if (!details) {
        console.log('  ⚠️  Could not fetch board details, skipping...');
        continue;
      }

      // Get all items
      const items = await getBoardItems(board.id);

      // Get views (optional, may not be available)
      const views = await getBoardViews(board.id);

      // Compile complete board backup
      const boardBackup = {
        id: details.id,
        name: details.name,
        description: details.description,
        board_kind: details.board_kind,
        state: details.state,
        metadata: {
          total_columns: details.columns.length,
          total_groups: details.groups.length,
          total_items: items.length,
          total_views: views.length
        },
        columns: details.columns.map(col => ({
          id: col.id,
          title: col.title,
          type: col.type,
          settings: col.settings_str
        })),
        groups: details.groups,
        items: items,
        views: views
      };

      fullBackup.boards.push(boardBackup);

      // Save individual board backup
      const safeFileName = board.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      await saveJSON(`board_${board.id}_${safeFileName}.json`, boardBackup);

      console.log(`  ✅ Backed up: ${items.length} items, ${details.columns.length} columns, ${details.groups.length} groups`);
    }

    // Step 5: Save complete workspace backup
    console.log('\n📦 Saving complete workspace backup...');
    await saveJSON('full-workspace-backup.json', fullBackup);

    // Step 6: Create summary
    const summary = {
      workspace_id: WORKSPACE_ID,
      workspace_name: fullBackup.workspace_name,
      backup_date: fullBackup.backup_date,
      backup_directory: BACKUP_DIR,
      statistics: {
        total_boards: fullBackup.boards.length,
        total_items: fullBackup.boards.reduce((sum, b) => sum + b.items.length, 0),
        total_columns: fullBackup.boards.reduce((sum, b) => sum + b.columns.length, 0),
        total_groups: fullBackup.boards.reduce((sum, b) => sum + b.groups.length, 0)
      },
      boards: fullBackup.boards.map(b => ({
        id: b.id,
        name: b.name,
        items: b.metadata.total_items,
        columns: b.metadata.total_columns,
        groups: b.metadata.total_groups,
        backup_file: `board_${b.id}_${b.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      }))
    };

    await saveJSON('backup-summary.json', summary);

    // Step 7: Print summary
    console.log('\n');
    console.log('==========================================');
    console.log('✅ BACKUP COMPLETED SUCCESSFULLY');
    console.log('==========================================\n');
    console.log('📊 BACKUP SUMMARY:');
    console.log(`   Workspace: ${summary.workspace_name} (${summary.workspace_id})`);
    console.log(`   Total Boards: ${summary.statistics.total_boards}`);
    console.log(`   Total Items: ${summary.statistics.total_items}`);
    console.log(`   Total Columns: ${summary.statistics.total_columns}`);
    console.log(`   Total Groups: ${summary.statistics.total_groups}`);
    console.log(`   Backup Location: ${BACKUP_DIR}\n`);

    console.log('📋 BOARDS BACKED UP:');
    summary.boards.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.name} [${b.id}]`);
      console.log(`      Items: ${b.items} | Columns: ${b.columns} | Groups: ${b.groups}`);
    });

    console.log('\n📁 FILES CREATED:');
    console.log('   - backup-summary.json');
    console.log('   - boards-list.json');
    console.log('   - full-workspace-backup.json');
    summary.boards.forEach(b => {
      console.log(`   - ${b.backup_file}`);
    });

    console.log('\n✅ All data safely backed up. You can now proceed with Phase 3 changes.\n');

    return summary;

  } catch (error) {
    console.error('\n❌ BACKUP FAILED:', error.message);
    console.error('\nStack trace:', error.stack);
    throw error;
  }
}

// Run backup
backupWorkspace()
  .then(summary => {
    console.log('✅ Backup process completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Backup process failed:', error);
    process.exit(1);
  });
