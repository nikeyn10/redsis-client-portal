const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const BOARD_ID = '18379446736';

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

async function setupBoard() {
  console.log('Setting up Service Provider board...\n');

  // Step 1: Delete unnecessary columns (keep name and status)
  const columnsToDelete = ['date4', 'color_mkxp805g', 'long_text_mkxpgg6q'];
  
  for (const columnId of columnsToDelete) {
    console.log(`Deleting column: ${columnId}`);
    const deleteQuery = `
      mutation {
        delete_column(board_id: ${BOARD_ID}, column_id: "${columnId}") {
          id
        }
      }
    `;
    await executeMutation(deleteQuery);
  }

  console.log('\n✅ Deleted unnecessary columns\n');

  // Step 2: Update status column labels
  console.log('Updating status column...');
  const updateStatusQuery = `
    mutation {
      change_column_metadata(
        board_id: ${BOARD_ID},
        column_id: "status",
        column_property: "labels",
        value: "{\\"0\\":\\"Active\\",\\"1\\":\\"On Leave\\",\\"2\\":\\"Inactive\\"}"
      ) {
        id
      }
    }
  `;
  await executeMutation(updateStatusQuery);
  console.log('✅ Updated status labels\n');

  // Step 3: Rename email column
  console.log('Renaming email column...');
  const renameEmailQuery = `
    mutation {
      change_column_title(board_id: ${BOARD_ID}, column_id: "email_mkxpawg3", title: "Email") {
        id
      }
    }
  `;
  await executeMutation(renameEmailQuery);
  console.log('✅ Renamed email column\n');

  // Step 4: Add new columns
  const newColumns = [
    { title: 'Phone', type: 'phone' },
    { title: 'Password', type: 'text' },
    { title: 'Specialization', type: 'dropdown' },
    { title: 'Assigned Tickets', type: 'numbers' }
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
    console.log(`Created: ${result.data?.create_column?.id || 'error'}`);
  }

  console.log('\n✅ Created new columns\n');

  // Step 5: Set up Specialization dropdown values
  console.log('Setting up Specialization dropdown values...');
  const getColumnsQuery = `
    query {
      boards(ids: [${BOARD_ID}]) {
        columns {
          id
          title
          type
        }
      }
    }
  `;
  
  const columnsData = await executeMutation(getColumnsQuery);
  const specializationColumn = columnsData.data?.boards[0]?.columns?.find(c => c.title === 'Specialization');
  
  if (specializationColumn) {
    const setupDropdownQuery = `
      mutation {
        change_column_metadata(
          board_id: ${BOARD_ID},
          column_id: "${specializationColumn.id}",
          column_property: "labels",
          value: "{\\"0\\":\\"General Support\\",\\"1\\":\\"Network Specialist\\",\\"2\\":\\"Hardware Technician\\",\\"3\\":\\"Software Developer\\",\\"4\\":\\"Security Expert\\",\\"5\\":\\"Database Admin\\"}"
        ) {
          id
        }
      }
    `;
    await executeMutation(setupDropdownQuery);
    console.log('✅ Set up specialization options\n');
  }

  console.log('🎉 Service Provider board setup complete!\n');
  
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
  console.log(JSON.stringify(finalData.data?.boards[0]?.columns, null, 2));
}

setupBoard().catch(console.error);
