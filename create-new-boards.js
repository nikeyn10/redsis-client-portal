const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Monday.com API Configuration
const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const API_VERSION = '2023-10';
const WORKSPACE_ID = '13302651';

// GraphQL helper
async function mondayMutation(query, variables = {}) {
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

// Create board
async function createBoard(name, description) {
  console.log(`\n📋 Creating board: "${name}"...`);
  
  const mutation = `
    mutation {
      create_board(
        board_name: "${name}",
        board_kind: public,
        workspace_id: ${WORKSPACE_ID},
        description: "${description}"
      ) {
        id
        name
        description
      }
    }
  `;

  const result = await mondayMutation(mutation);

  if (result.data?.create_board) {
    const board = result.data.create_board;
    console.log(`   ✅ Created: ${board.name} [${board.id}]`);
    return board;
  } else {
    console.log(`   ❌ Failed to create board "${name}"`);
    return null;
  }
}

// Add column to board
async function addColumn(boardId, title, columnType, settings = null) {
  console.log(`   Adding column: "${title}" (${columnType})...`);
  
  const mutation = `
    mutation {
      create_column(
        board_id: ${boardId},
        title: "${title}",
        column_type: ${columnType}
        ${settings ? `, defaults: ${JSON.stringify(JSON.stringify(settings))}` : ''}
      ) {
        id
        title
        type
      }
    }
  `;

  const result = await mondayMutation(mutation);

  if (result.data?.create_column) {
    const column = result.data.create_column;
    console.log(`      ✅ ${column.title} [${column.id}]`);
    return column;
  } else {
    console.log(`      ❌ Failed to create column "${title}"`);
    return null;
  }
}

// Create Sites board
async function createSitesBoard() {
  console.log('\n🏢 CREATING SITES BOARD');
  console.log('─'.repeat(70));

  const board = await createBoard(
    'Sites',
    'Centralized management of all client sites across organizations'
  );

  if (!board) {
    return null;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`\n   Adding columns to Sites board...`);

  const columns = [];

  // 1. Site Name (text) - already exists as item name
  
  // 2. Organization (text)
  columns.push(await addColumn(board.id, 'Organization', 'text'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 3. Site Address (text)
  columns.push(await addColumn(board.id, 'Site Address', 'text'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 4. Site Contact Name (text)
  columns.push(await addColumn(board.id, 'Site Contact Name', 'text'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 5. Site Contact Email (email)
  columns.push(await addColumn(board.id, 'Site Contact Email', 'email'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 6. Site Contact Phone (phone)
  columns.push(await addColumn(board.id, 'Site Contact Phone', 'phone'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 7. Active Projects (numbers)
  columns.push(await addColumn(board.id, 'Active Projects', 'numbers'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 8. Total Tickets (numbers)
  columns.push(await addColumn(board.id, 'Total Tickets', 'numbers'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 9. Primary Service Provider (connect boards)
  columns.push(await addColumn(board.id, 'Primary Service Provider', 'board_relation', {
    boardIds: [18379446736] // Service Providers board
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 10. Site Manager (connect boards)
  columns.push(await addColumn(board.id, 'Site Manager', 'board_relation', {
    boardIds: [18379351659] // Users board
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 11. Status (status)
  columns.push(await addColumn(board.id, 'Status', 'status', {
    labels: {
      0: 'Active',
      1: 'Inactive',
      2: 'Onboarding',
      3: 'Archived'
    },
    labels_colors: {
      0: { color: '#00c875', border: '#00c875', var_name: 'green-shadow' },
      1: { color: '#c4c4c4', border: '#c4c4c4', var_name: 'gray' },
      2: { color: '#fdab3d', border: '#fdab3d', var_name: 'orange' },
      3: { color: '#e2445c', border: '#e2445c', var_name: 'red-shadow' }
    }
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 12. Notes (long text)
  columns.push(await addColumn(board.id, 'Notes', 'long_text'));

  console.log(`\n   ✅ Added ${columns.filter(c => c).length} columns to Sites board`);

  return {
    board,
    columns: columns.filter(c => c)
  };
}

// Create Projects board
async function createProjectsBoard() {
  console.log('\n📂 CREATING PROJECTS BOARD');
  console.log('─'.repeat(70));

  const board = await createBoard(
    'Projects',
    'Individual projects within sites - maps to ticket boards and service scopes'
  );

  if (!board) {
    return null;
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`\n   Adding columns to Projects board...`);

  const columns = [];

  // 1. Project Name (text) - already exists as item name
  
  // 2. Site (connect boards) - Links to Sites board
  columns.push(await addColumn(board.id, 'Site', 'board_relation', {
    boardIds: [] // Will be populated with Sites board ID after creation
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 3. Organization (mirror from Site)
  // Note: Mirror columns need to be created after relationships are established
  
  // 4. Service Type (dropdown)
  columns.push(await addColumn(board.id, 'Service Type', 'dropdown', {
    labels: {
      0: 'Maintenance',
      1: 'Installation',
      2: 'Repair',
      3: 'Inspection',
      4: 'Emergency',
      5: 'Consultation'
    }
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 5. Assigned Service Provider (connect boards)
  columns.push(await addColumn(board.id, 'Assigned Service Provider', 'board_relation', {
    boardIds: [18379446736] // Service Providers board
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 6. Project Manager (connect boards)
  columns.push(await addColumn(board.id, 'Project Manager', 'board_relation', {
    boardIds: [18379351659] // Users board
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 7. Start Date (date)
  columns.push(await addColumn(board.id, 'Start Date', 'date'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 8. End Date (date)
  columns.push(await addColumn(board.id, 'End Date', 'date'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 9. Status (status)
  columns.push(await addColumn(board.id, 'Status', 'status', {
    labels: {
      0: 'Planning',
      1: 'Active',
      2: 'On Hold',
      3: 'Completed',
      4: 'Cancelled'
    },
    labels_colors: {
      0: { color: '#fdab3d', border: '#fdab3d', var_name: 'orange' },
      1: { color: '#00c875', border: '#00c875', var_name: 'green-shadow' },
      2: { color: '#ffcb00', border: '#ffcb00', var_name: 'yellow' },
      3: { color: '#0086c0', border: '#0086c0', var_name: 'blue' },
      4: { color: '#e2445c', border: '#e2445c', var_name: 'red-shadow' }
    }
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 10. Ticket Board Type (dropdown) - For hybrid ticket architecture
  columns.push(await addColumn(board.id, 'Ticket Board Type', 'dropdown', {
    labels: {
      0: 'Master Tickets',
      1: 'Dedicated Board'
    }
  }));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 11. Ticket Board ID (text) - Stores board ID if dedicated
  columns.push(await addColumn(board.id, 'Ticket Board ID', 'text'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 12. Total Tickets (numbers)
  columns.push(await addColumn(board.id, 'Total Tickets', 'numbers'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // 13. Notes (long text)
  columns.push(await addColumn(board.id, 'Notes', 'long_text'));

  console.log(`\n   ✅ Added ${columns.filter(c => c).length} columns to Projects board`);

  return {
    board,
    columns: columns.filter(c => c)
  };
}

// Main function
async function createNewBoards() {
  console.log('🚀 CREATING NEW BOARDS');
  console.log('='.repeat(70));
  console.log(`Workspace: ${WORKSPACE_ID}`);
  console.log('='.repeat(70));

  const results = {
    sites: null,
    projects: null
  };

  // Create Sites board
  results.sites = await createSitesBoard();

  if (!results.sites) {
    console.error('\n❌ Failed to create Sites board');
    process.exit(1);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Create Projects board
  results.projects = await createProjectsBoard();

  if (!results.projects) {
    console.error('\n❌ Failed to create Projects board');
    process.exit(1);
  }

  // Update Projects board Site column to link to Sites board
  console.log('\n🔗 Updating Projects → Sites relationship...');
  
  const siteColumn = results.projects.columns.find(c => c?.title === 'Site');
  if (siteColumn) {
    const updateMutation = `
      mutation {
        change_column_metadata(
          board_id: ${results.projects.board.id},
          column_id: "${siteColumn.id}",
          column_property: "boardIds",
          value: "${results.sites.board.id}"
        ) {
          id
        }
      }
    `;

    await mondayMutation(updateMutation);
    console.log('   ✅ Projects board now links to Sites board');
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(70));
  console.log('📊 BOARD CREATION SUMMARY');
  console.log('='.repeat(70));

  console.log('\n✅ Sites Board:');
  console.log(`   - Board ID: ${results.sites.board.id}`);
  console.log(`   - Columns: ${results.sites.columns.length}`);
  console.log(`   - Key Features:`);
  console.log(`     • Organization and address tracking`);
  console.log(`     • Contact information (name, email, phone)`);
  console.log(`     • Project and ticket metrics`);
  console.log(`     • Service provider and manager relationships`);
  console.log(`     • Status tracking (Active/Inactive/Onboarding/Archived)`);

  console.log('\n✅ Projects Board:');
  console.log(`   - Board ID: ${results.projects.board.id}`);
  console.log(`   - Columns: ${results.projects.columns.length}`);
  console.log(`   - Key Features:`);
  console.log(`     • Links to Sites board (multi-tenant structure)`);
  console.log(`     • Service type categorization`);
  console.log(`     • Service provider and manager assignments`);
  console.log(`     • Date tracking (start/end)`);
  console.log(`     • Status tracking (Planning/Active/On Hold/Completed/Cancelled)`);
  console.log(`     • Hybrid ticket architecture (Board Type + Board ID)`);

  console.log('\n📋 BOARD IDs FOR REFERENCE:');
  console.log(`   - Sites Board: ${results.sites.board.id}`);
  console.log(`   - Projects Board: ${results.projects.board.id}`);
  console.log(`   - Users Board: 18379351659`);
  console.log(`   - Service Providers Board: 18379446736`);

  console.log('\n🚀 NEXT STEPS:');
  console.log('   1. Data Migration (Step 4):');
  console.log('      - Migrate Management Portal data to Sites board');
  console.log('      - Create default projects from Project Creator data');
  console.log('      - Establish site-project relationships');
  console.log('   2. Code Updates (Step 5):');
  console.log(`      - Update board IDs in application code`);
  console.log(`      - Update dashboard to reference new boards`);
  console.log(`      - Implement multi-tenant project filtering`);
  console.log('   3. Automations (Step 6):');
  console.log('      - Setup ticket routing based on Ticket Board Type');
  console.log('      - Auto-sync project metrics to sites');
  console.log('      - Create default projects for new sites');

  console.log('\n✅ Board creation complete!\n');

  return results;
}

// Run
createNewBoards()
  .then(results => {
    console.log('✅ All boards created successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Board creation failed:', error);
    process.exit(1);
  });
