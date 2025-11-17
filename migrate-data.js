const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

// Monday.com API Configuration
const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const API_VERSION = '2023-10';

// Board IDs
const PROJECT_CREATOR_BOARD = '18379404757';
const MANAGEMENT_PORTAL_BOARD = '18379040651';
const SITES_BOARD = '18380394514';
const PROJECTS_BOARD = '18380394647';

// Column IDs for Sites board (from creation)
const SITES_COLUMNS = {
  organization: 'text_mkxswbv',
  site_address: 'text_mkxsjsfx',
  site_contact_name: 'text_mkxst5ep',
  site_contact_email: 'email_mkxswdjv',
  site_contact_phone: 'phone_mkxs99q1',
  active_projects: 'numeric_mkxsa648',
  total_tickets: 'numeric_mkxs22sb',
  status: 'color_mkxsz2q7',
  notes: 'long_text_mkxsrza9'
};

// Column IDs for Projects board (from creation)
const PROJECTS_COLUMNS = {
  service_type: 'dropdown_mkxs1045',
  start_date: 'date_mkxsyjsw',
  end_date: 'date_mkxsx81j',
  status: 'color_mkxskekx',
  ticket_board_type: 'dropdown_mkxsejpm',
  ticket_board_id: 'text_mkxs9wde',
  total_tickets: 'numeric_mkxs4r9h',
  notes: 'long_text_mkxsycyz'
};

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

// Get all items from a board
async function getBoardItems(boardId) {
  const query = `
    query {
      boards(ids: [${boardId}]) {
        items_page(limit: 100) {
          items {
            id
            name
            group {
              id
              title
            }
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const result = await mondayMutation(query);
  return result.data?.boards?.[0]?.items_page?.items || [];
}

// Create item on board
async function createItem(boardId, itemName, columnValues = {}) {
  const columnValuesStr = JSON.stringify(JSON.stringify(columnValues));
  
  const mutation = `
    mutation {
      create_item(
        board_id: ${boardId},
        item_name: "${itemName.replace(/"/g, '\\"')}",
        column_values: ${columnValuesStr}
      ) {
        id
        name
      }
    }
  `;

  const result = await mondayMutation(mutation);
  return result.data?.create_item;
}

// Extract column value by column ID
function getColumnValue(item, columnId) {
  const column = item.column_values?.find(c => c.id === columnId);
  return column?.text || null;
}

// Migrate Project Creator data to Sites and Projects
async function migrateFromProjectCreator() {
  console.log('\n📂 MIGRATING PROJECT CREATOR DATA');
  console.log('─'.repeat(70));

  const projectCreatorItems = await getBoardItems(PROJECT_CREATOR_BOARD);
  console.log(`   Found ${projectCreatorItems.length} items in Project Creator board`);

  const results = {
    sites: [],
    projects: []
  };

  for (const item of projectCreatorItems) {
    console.log(`\n   Processing: ${item.name}...`);

    // Extract data
    const companyName = item.name;
    const contactName = getColumnValue(item, 'text_mkxqv75c');
    const contactEmail = getColumnValue(item, 'email_mkxqs6z4');
    const contactPhone = getColumnValue(item, 'phone_mkxqb808');
    const status = getColumnValue(item, 'status');
    const startDate = getColumnValue(item, 'date4');
    const boardId = getColumnValue(item, 'dropdown_mkxpakmh');

    // Create Site
    console.log(`      Creating site: ${companyName}...`);
    
    const siteData = {};
    if (contactName) siteData[SITES_COLUMNS.site_contact_name] = contactName;
    if (contactEmail) siteData[SITES_COLUMNS.site_contact_email] = { email: contactEmail, text: contactEmail };
    if (contactPhone) siteData[SITES_COLUMNS.site_contact_phone] = contactPhone;
    if (status === 'Active') {
      siteData[SITES_COLUMNS.status] = { index: 0 }; // Active
    } else {
      siteData[SITES_COLUMNS.status] = { index: 1 }; // Inactive
    }
    siteData[SITES_COLUMNS.active_projects] = 1; // Will have 1 default project

    const site = await createItem(SITES_BOARD, companyName, siteData);
    
    if (site) {
      console.log(`         ✅ Site created [${site.id}]`);
      results.sites.push({ ...site, originalName: companyName });
      
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create default Project for this Site
      console.log(`      Creating default project for ${companyName}...`);
      
      const projectName = `${companyName} - Main Project`;
      const projectData = {};
      
      if (startDate) {
        projectData[PROJECTS_COLUMNS.start_date] = { date: startDate };
      }
      
      // Set status based on original status
      if (status === 'Active') {
        projectData[PROJECTS_COLUMNS.status] = { index: 1 }; // Active
      } else {
        projectData[PROJECTS_COLUMNS.status] = { index: 0 }; // Planning
      }

      // Set ticket board configuration
      if (boardId && boardId !== '(empty)') {
        projectData[PROJECTS_COLUMNS.ticket_board_type] = { ids: [1] }; // Dedicated Board
        projectData[PROJECTS_COLUMNS.ticket_board_id] = boardId;
      } else {
        projectData[PROJECTS_COLUMNS.ticket_board_type] = { ids: [0] }; // Master Tickets
      }

      projectData[PROJECTS_COLUMNS.service_type] = { ids: [0] }; // Maintenance (default)

      const project = await createItem(PROJECTS_BOARD, projectName, projectData);
      
      if (project) {
        console.log(`         ✅ Project created [${project.id}]`);
        results.projects.push({ ...project, siteId: site.id, siteName: companyName });
      } else {
        console.log(`         ❌ Failed to create project`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log(`         ❌ Failed to create site`);
    }
  }

  console.log(`\n   ✅ Created ${results.sites.length} sites and ${results.projects.length} projects`);
  return results;
}

// Count tickets per company from Management Portal
async function countTicketsByCompany() {
  console.log('\n🎫 COUNTING TICKETS BY COMPANY');
  console.log('─'.repeat(70));

  const tickets = await getBoardItems(MANAGEMENT_PORTAL_BOARD);
  console.log(`   Found ${tickets.length} tickets in Management Portal`);

  const ticketCounts = {};

  for (const ticket of tickets) {
    // Try to extract company from ticket name or email
    const ticketId = ticket.name;
    const email = getColumnValue(ticket, 'email_mkxpawg3');
    
    // Extract company from email domain or ticket ID pattern
    let company = 'Unknown';
    
    if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      if (domain.includes('redsis')) company = 'Redsis';
      // Add more domain mappings as needed
    }

    ticketCounts[company] = (ticketCounts[company] || 0) + 1;
  }

  console.log('\n   Ticket counts by company:');
  Object.entries(ticketCounts).forEach(([company, count]) => {
    console.log(`      ${company}: ${count} tickets`);
  });

  return ticketCounts;
}

// Update site metrics (active projects, total tickets)
async function updateSiteMetrics(sites, ticketCounts) {
  console.log('\n📊 UPDATING SITE METRICS');
  console.log('─'.repeat(70));

  for (const site of sites) {
    console.log(`   Updating ${site.originalName}...`);

    const ticketCount = ticketCounts[site.originalName] || 0;

    const mutation = `
      mutation {
        change_multiple_column_values(
          board_id: ${SITES_BOARD},
          item_id: ${site.id},
          column_values: ${JSON.stringify(JSON.stringify({
            [SITES_COLUMNS.total_tickets]: ticketCount
          }))}
        ) {
          id
        }
      }
    `;

    await mondayMutation(mutation);
    console.log(`      ✅ Updated metrics (tickets: ${ticketCount})`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Generate migration report
function generateReport(results, ticketCounts) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      sites_created: results.sites.length,
      projects_created: results.projects.length,
      total_tickets_counted: Object.values(ticketCounts).reduce((a, b) => a + b, 0)
    },
    sites: results.sites.map(s => ({
      id: s.id,
      name: s.originalName,
      tickets: ticketCounts[s.originalName] || 0
    })),
    projects: results.projects.map(p => ({
      id: p.id,
      name: p.name,
      site_id: p.siteId,
      site_name: p.siteName
    })),
    ticket_distribution: ticketCounts,
    board_ids: {
      sites_board: SITES_BOARD,
      projects_board: PROJECTS_BOARD,
      project_creator_board: PROJECT_CREATOR_BOARD,
      management_portal_board: MANAGEMENT_PORTAL_BOARD
    }
  };

  fs.writeFileSync(
    'migration-report.json',
    JSON.stringify(report, null, 2)
  );

  return report;
}

// Main migration
async function runMigration() {
  console.log('🚀 DATA MIGRATION');
  console.log('='.repeat(70));
  console.log('Source Boards:');
  console.log(`   - Project Creator: ${PROJECT_CREATOR_BOARD}`);
  console.log(`   - Management Portal: ${MANAGEMENT_PORTAL_BOARD}`);
  console.log('\nTarget Boards:');
  console.log(`   - Sites: ${SITES_BOARD}`);
  console.log(`   - Projects: ${PROJECTS_BOARD}`);
  console.log('='.repeat(70));

  // Step 1: Migrate from Project Creator
  const migrationResults = await migrateFromProjectCreator();

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Count tickets by company
  const ticketCounts = await countTicketsByCompany();

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 3: Update site metrics
  await updateSiteMetrics(migrationResults.sites, ticketCounts);

  // Step 4: Generate report
  console.log('\n📄 GENERATING MIGRATION REPORT');
  console.log('─'.repeat(70));
  const report = generateReport(migrationResults, ticketCounts);
  console.log('   ✅ Report saved to: migration-report.json');

  // Summary
  console.log('\n');
  console.log('='.repeat(70));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ Sites Created: ${report.summary.sites_created}`);
  console.log(`✅ Projects Created: ${report.summary.projects_created}`);
  console.log(`✅ Tickets Counted: ${report.summary.total_tickets_counted}`);

  console.log('\n📋 Sites:');
  report.sites.forEach(site => {
    console.log(`   - ${site.name} [${site.id}] - ${site.tickets} tickets`);
  });

  console.log('\n📂 Projects:');
  report.projects.forEach(proj => {
    console.log(`   - ${proj.name} [${proj.id}]`);
  });

  console.log('\n⚠️  MANUAL STEPS STILL REQUIRED:');
  console.log('   1. Add Connect Boards columns (see MANUAL_BOARD_SETUP.md)');
  console.log('   2. Link Projects to Sites (Site column)');
  console.log('   3. Assign Service Providers to Sites/Projects');
  console.log('   4. Assign Site Managers and Project Managers');

  console.log('\n🚀 NEXT STEPS (Step 5):');
  console.log('   - Update application code with new board IDs');
  console.log('   - Update dashboard queries');
  console.log('   - Implement multi-tenant filtering');
  console.log('   - Update authentication flows');

  console.log('\n✅ Data migration complete!\n');

  return report;
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ Migration completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
