const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const BOARD_ID = '18379404757';

async function executeMutation(query, variables = {}) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_KEY
    },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  if (data.errors) {
    console.error('GraphQL Errors:', JSON.stringify(data.errors, null, 2));
  }
  return data;
}

async function setupCompanyBoard() {
  console.log('Setting up Company board with contact fields...\n');

  // Add contact fields
  const newColumns = [
    { title: 'Contact Name', type: 'text' },
    { title: 'Contact Email', type: 'email' },
    { title: 'Contact Phone', type: 'phone' }
  ];

  for (const column of newColumns) {
    console.log(`Creating column: ${column.title} (${column.type})`);
    const createColumnQuery = `
      mutation {
        create_column(
          board_id: ${BOARD_ID},
          title: "${column.title}",
          column_type: ${column.type}
        ) {
          id
          title
        }
      }
    `;
    const result = await executeMutation(createColumnQuery);
    const colId = result.data?.create_column?.id;
    console.log(`Created: ${colId || 'error'}\n`);
  }

  console.log('✅ Company board setup complete!\n');
  
  // Show final board structure
  console.log('Final board structure:');
  const finalBoardQuery = `
    query {
      boards(ids: [${BOARD_ID}]) {
        name
        columns {
          id
          title
          type
        }
      }
    }
  `;
  
  const finalData = await executeMutation(finalBoardQuery);
  if (finalData.data?.boards?.[0]) {
    const board = finalData.data.boards[0];
    console.log(`\n${board.name} Board Columns:\n`);
    board.columns.forEach(col => {
      console.log(`  ${col.title.padEnd(25)} | ${col.id.padEnd(20)} | ${col.type}`);
    });
  }
}

setupCompanyBoard().catch(console.error);
