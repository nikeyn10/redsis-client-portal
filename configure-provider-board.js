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

async function configureDropdownAndStatus() {
  console.log('Configuring Specialization dropdown and Status labels...\n');

  // First, create a test item to update the dropdown values
  console.log('Creating test item to set dropdown values...');
  const createItemQuery = `
    mutation {
      create_item(
        board_id: ${BOARD_ID},
        item_name: "Test Provider - Delete Me",
        column_values: "{\\"dropdown_mkxpdbxw\\": {\\"labels\\": [\\"General Support\\"]}, \\"status\\": {\\"label\\": \\"Active\\"}}"
      ) {
        id
      }
    }
  `;
  
  const itemResult = await executeMutation(createItemQuery);
  const itemId = itemResult.data?.create_item?.id;
  console.log(`Created test item: ${itemId}\n`);

  // Now update it with different values to create all dropdown options
  const specializationOptions = [
    'General Support',
    'Network Specialist', 
    'Hardware Technician',
    'Software Developer',
    'Security Expert',
    'Database Admin'
  ];

  console.log('Setting up all specialization options...');
  for (const option of specializationOptions) {
    console.log(`  - ${option}`);
    const updateQuery = `
      mutation {
        change_column_value(
          board_id: ${BOARD_ID},
          item_id: ${itemId},
          column_id: "dropdown_mkxpdbxw",
          value: "{\\"labels\\": [\\"${option}\\"]}"
        ) {
          id
        }
      }
    `;
    await executeMutation(updateQuery);
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
  }

  console.log('\n✅ Specialization dropdown configured\n');

  // Update status labels
  const statusLabels = ['Active', 'On Leave', 'Inactive'];
  console.log('Setting up status labels...');
  for (const label of statusLabels) {
    console.log(`  - ${label}`);
    const updateStatusQuery = `
      mutation {
        change_column_value(
          board_id: ${BOARD_ID},
          item_id: ${itemId},
          column_id: "status",
          value: "{\\"label\\": \\"${label}\\"}"
        ) {
          id
        }
      }
    `;
    await executeMutation(updateStatusQuery);
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
  }

  console.log('\n✅ Status labels configured\n');

  // Delete the test item
  console.log('Deleting test item...');
  const deleteQuery = `
    mutation {
      delete_item(item_id: ${itemId}) {
        id
      }
    }
  `;
  await executeMutation(deleteQuery);
  console.log('✅ Test item deleted\n');

  console.log('🎉 Configuration complete!\n');
  console.log('Your Service Provider board now has:');
  console.log('  📋 Columns: Name, Email, Phone, Password, Specialization, Assigned Tickets, Status');
  console.log('  🏷️  Specialization options: General Support, Network Specialist, Hardware Technician, Software Developer, Security Expert, Database Admin');
  console.log('  ✅ Status options: Active, On Leave, Inactive');
}

configureDropdownAndStatus().catch(console.error);
