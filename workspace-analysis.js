/**
 * PHASE 1 - Workspace Analysis Script
 * Workspace ID: 13302651
 * 
 * This script will analyze all boards and generate a comprehensive report
 * WITHOUT making any changes.
 */

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const WORKSPACE_ID = '13302651';

// Target boards to analyze
const TARGET_BOARDS = {
  SERVICE_PROVIDERS: '18379446736',
  PROJECT_CREATOR: '18379404757',
  USERS: '18379351659',
  MANAGEMENT_PORTAL: '18379040651'
};

async function callMondayAPI(query, variables = {}) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY,
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('❌ Monday API errors:', JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors[0]?.message || 'Monday API error');
  }
  
  return result.data;
}

async function getAllWorkspaceBoards() {
  console.log('📋 Fetching all boards in workspace', WORKSPACE_ID);
  
  const query = `
    query GetWorkspaceBoards($workspaceId: [ID!]!) {
      boards(workspace_ids: $workspaceId, limit: 100) {
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

  const data = await callMondayAPI(query, { workspaceId: [WORKSPACE_ID] });
  return data.boards || [];
}

async function getBoardDetails(boardId) {
  console.log(`\n🔍 Analyzing board ${boardId}...`);
  
  const query = `
    query GetBoardDetails($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        description
        board_kind
        state
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
        items_page(limit: 5) {
          items {
            id
            name
          }
        }
      }
    }
  `;

  const data = await callMondayAPI(query, { boardId: [boardId] });
  return data.boards?.[0] || null;
}

async function getBoardAutomations(boardId) {
  const query = `
    query GetAutomations($boardId: [ID!]!) {
      boards(ids: $boardId) {
        id
        name
        automations {
          id
          name
        }
      }
    }
  `;

  try {
    const data = await callMondayAPI(query, { boardId: [boardId] });
    return data.boards?.[0]?.automations || [];
  } catch (err) {
    console.warn(`⚠️  Could not fetch automations for board ${boardId}`);
    return [];
  }
}

function categorizeBoard(boardName, boardId) {
  const name = boardName.toLowerCase();
  
  if (name.includes('company') || name.includes('companies') || name.includes('project creator')) {
    return 'COMPANIES';
  }
  if (name.includes('site') || name.includes('location')) {
    return 'SITES';
  }
  if (name.includes('project') && !name.includes('creator')) {
    return 'PROJECTS';
  }
  if (name.includes('user')) {
    return 'USERS';
  }
  if (name.includes('service provider') || name.includes('provider') || name.includes('vendor')) {
    return 'SERVICE_PROVIDERS';
  }
  if (name.includes('ticket') || name.includes('service request') || name.includes('management portal')) {
    return 'TICKETS';
  }
  
  return 'OTHER';
}

function analyzeColumnUsage(column, itemCount) {
  const issues = [];
  
  // Check for potential duplicate columns
  if (column.title.toLowerCase().includes('name') && column.id !== 'name') {
    issues.push('Potential duplicate of standard "name" column');
  }
  
  // Check for status columns
  if (column.type === 'status' && column.title.toLowerCase() !== 'status') {
    issues.push('Custom status column - verify if needed');
  }
  
  // Check for dropdown columns that might be better as connections
  if (column.type === 'dropdown' && (
    column.title.toLowerCase().includes('company') ||
    column.title.toLowerCase().includes('project') ||
    column.title.toLowerCase().includes('user')
  )) {
    issues.push('Dropdown - consider using Connect Boards instead');
  }
  
  // Check for text columns used for IDs
  if (column.type === 'text' && column.title.toLowerCase().includes('id')) {
    issues.push('Text column for ID - consider using Connect Boards');
  }
  
  // Check for password storage
  if (column.title.toLowerCase().includes('password')) {
    issues.push('⚠️ SECURITY RISK - Plain text password storage');
  }
  
  return issues;
}

async function generatePhase1Report() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 1 — WORKSPACE ANALYSIS REPORT');
  console.log('Workspace ID:', WORKSPACE_ID);
  console.log('Date:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  // 1. Get all boards in workspace
  const allBoards = await getAllWorkspaceBoards();
  console.log(`\n📊 Total boards in workspace: ${allBoards.length}\n`);

  // 2. Categorize boards
  const categorized = {
    COMPANIES: [],
    SITES: [],
    PROJECTS: [],
    USERS: [],
    SERVICE_PROVIDERS: [],
    TICKETS: [],
    OTHER: []
  };

  for (const board of allBoards) {
    const category = categorizeBoard(board.name, board.id);
    categorized[category].push(board);
  }

  // 3. Detailed analysis of target boards
  const detailedBoards = {};
  for (const [key, boardId] of Object.entries(TARGET_BOARDS)) {
    const details = await getBoardDetails(boardId);
    const automations = await getBoardAutomations(boardId);
    detailedBoards[key] = { ...details, automations };
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Generate report
  console.log('\n' + '─'.repeat(80));
  console.log('1. BOARD CATEGORIZATION');
  console.log('─'.repeat(80));
  
  for (const [category, boards] of Object.entries(categorized)) {
    console.log(`\n${category}:`);
    if (boards.length === 0) {
      console.log('  (none found)');
    } else {
      boards.forEach(board => {
        console.log(`  - [${board.id}] ${board.name} (${board.board_kind}, ${board.state})`);
      });
    }
  }

  console.log('\n\n' + '─'.repeat(80));
  console.log('2. DETAILED BOARD ANALYSIS');
  console.log('─'.repeat(80));

  for (const [key, board] of Object.entries(detailedBoards)) {
    console.log(`\n\n${'═'.repeat(80)}`);
    console.log(`BOARD: ${board.name} [${board.id}]`);
    console.log(`${'═'.repeat(80)}`);
    
    console.log(`\nDescription: ${board.description || '(none)'}`);
    console.log(`Type: ${board.board_kind}`);
    console.log(`State: ${board.state}`);
    console.log(`Item count: ${board.items_page?.items?.length || 0} (showing first 5)`);
    console.log(`Automations: ${board.automations?.length || 0}`);
    
    if (board.automations && board.automations.length > 0) {
      console.log('\nAutomations:');
      board.automations.forEach(auto => {
        console.log(`  - ${auto.name || auto.id}`);
      });
    }

    console.log(`\n\nGROUPS (${board.groups?.length || 0}):`);
    if (board.groups && board.groups.length > 0) {
      board.groups.forEach(group => {
        console.log(`  ${group.position}. "${group.title}" [${group.id}]`);
      });
    }

    console.log(`\n\nCOLUMNS (${board.columns?.length || 0}):`);
    console.log('-'.repeat(80));
    console.log('ID                    | Title                        | Type            | Issues');
    console.log('-'.repeat(80));
    
    if (board.columns && board.columns.length > 0) {
      board.columns.forEach(col => {
        const issues = analyzeColumnUsage(col, board.items_page?.items?.length || 0);
        const issueStr = issues.length > 0 ? issues.join('; ') : '✓';
        console.log(
          `${col.id.padEnd(21)} | ${col.title.padEnd(28)} | ${col.type.padEnd(15)} | ${issueStr}`
        );
      });
    }
  }

  console.log('\n\n' + '─'.repeat(80));
  console.log('3. POTENTIAL ISSUES & RECOMMENDATIONS');
  console.log('─'.repeat(80));

  let issueCount = 0;

  // Analyze for duplicates and issues
  for (const [key, board] of Object.entries(detailedBoards)) {
    console.log(`\n${board.name}:`);
    
    const columnIssues = [];
    
    if (board.columns) {
      board.columns.forEach(col => {
        const issues = analyzeColumnUsage(col, board.items_page?.items?.length || 0);
        if (issues.length > 0) {
          columnIssues.push({ column: col, issues });
          issueCount++;
        }
      });
    }

    if (columnIssues.length === 0) {
      console.log('  ✓ No obvious issues detected');
    } else {
      columnIssues.forEach(({ column, issues }) => {
        console.log(`\n  Column: ${column.title} [${column.id}]`);
        issues.forEach(issue => {
          console.log(`    ⚠️  ${issue}`);
        });
      });
    }
  }

  console.log('\n\n' + '─'.repeat(80));
  console.log('4. SUMMARY');
  console.log('─'.repeat(80));
  console.log(`Total boards in workspace: ${allBoards.length}`);
  console.log(`Target boards analyzed: ${Object.keys(detailedBoards).length}`);
  console.log(`Potential issues found: ${issueCount}`);
  console.log('\n⚠️  NO CHANGES HAVE BEEN MADE - Analysis only');
  console.log('\n✅ Phase 1 complete. Awaiting approval to proceed to Phase 2.');
  console.log('─'.repeat(80) + '\n');

  // Write detailed JSON report
  const report = {
    workspace_id: WORKSPACE_ID,
    generated_at: new Date().toISOString(),
    all_boards: allBoards,
    categorized_boards: categorized,
    detailed_analysis: detailedBoards,
    summary: {
      total_boards: allBoards.length,
      analyzed_boards: Object.keys(detailedBoards).length,
      potential_issues: issueCount
    }
  };

  const fs = require('fs');
  const reportPath = './workspace-analysis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed JSON report saved to: ${reportPath}\n`);
}

// Run the analysis
generatePhase1Report().catch(err => {
  console.error('❌ Analysis failed:', err);
  process.exit(1);
});
