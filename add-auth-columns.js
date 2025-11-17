const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Monday.com API Configuration
const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';
const API_VERSION = '2023-10';

// Board IDs
const USERS_BOARD_ID = '18379351659';
const SERVICE_PROVIDERS_BOARD_ID = '18379446736';

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

// Add dropdown column
async function addDropdownColumn(boardId, title, labels) {
  console.log(`   Adding dropdown column: "${title}"...`);
  
  const mutation = `
    mutation ($boardId: ID!, $title: String!, $columnType: ColumnType!, $defaults: JSON) {
      create_column(
        board_id: $boardId,
        title: $title,
        column_type: $columnType,
        defaults: $defaults
      ) {
        id
        title
        type
      }
    }
  `;

  const defaults = JSON.stringify({
    labels: labels.reduce((acc, label, index) => {
      acc[index] = label;
      return acc;
    }, {}),
    label_limit_count: 1
  });

  const result = await mondayMutation(mutation, {
    boardId: boardId,
    title: title,
    columnType: 'dropdown',
    defaults: defaults
  });

  if (result.data?.create_column) {
    console.log(`   ✅ Created: ${result.data.create_column.title} [${result.data.create_column.id}]`);
    return result.data.create_column;
  } else {
    console.log(`   ❌ Failed to create column "${title}"`);
    return null;
  }
}

// Add text column
async function addTextColumn(boardId, title) {
  console.log(`   Adding text column: "${title}"...`);
  
  const mutation = `
    mutation ($boardId: ID!, $title: String!, $columnType: ColumnType!) {
      create_column(
        board_id: $boardId,
        title: $title,
        column_type: $columnType
      ) {
        id
        title
        type
      }
    }
  `;

  const result = await mondayMutation(mutation, {
    boardId: boardId,
    title: title,
    columnType: 'text'
  });

  if (result.data?.create_column) {
    console.log(`   ✅ Created: ${result.data.create_column.title} [${result.data.create_column.id}]`);
    return result.data.create_column;
  } else {
    console.log(`   ❌ Failed to create column "${title}"`);
    return null;
  }
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
          }
        }
      }
    }
  `;

  const result = await mondayMutation(query);
  return result.data?.boards?.[0]?.items_page?.items || [];
}

// Set default user type for all existing users
async function setDefaultUserType(boardId, columnId, items, boardName) {
  console.log(`\n   Setting default "Email User" type for ${items.length} existing ${boardName}...`);
  
  for (const item of items) {
    const mutation = `
      mutation {
        change_simple_column_value(
          board_id: ${boardId},
          item_id: ${item.id},
          column_id: "${columnId}",
          value: "Email User"
        ) {
          id
        }
      }
    `;

    const result = await mondayMutation(mutation);
    if (result.data?.change_simple_column_value) {
      console.log(`      ✅ ${item.name} → Email User`);
    } else {
      console.log(`      ⚠️  Failed to set type for ${item.name}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Main function
async function addAuthColumns() {
  console.log('🚀 ADDING AUTHENTICATION COLUMNS');
  console.log('==========================================\n');

  const results = {
    users: { userType: null, pin: null },
    serviceProviders: { userType: null, pin: null }
  };

  // ========== USERS BOARD ==========
  console.log('📋 Users Board [18379351659]');
  console.log('─'.repeat(50));

  // Add User Type dropdown
  const usersUserType = await addDropdownColumn(
    USERS_BOARD_ID,
    'User Type',
    ['Email User', 'PIN User']
  );
  results.users.userType = usersUserType;

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Add PIN column
  const usersPin = await addTextColumn(USERS_BOARD_ID, 'PIN');
  results.users.pin = usersPin;

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Set default user type for existing users
  if (usersUserType) {
    const userItems = await getBoardItems(USERS_BOARD_ID);
    if (userItems.length > 0) {
      await setDefaultUserType(USERS_BOARD_ID, usersUserType.id, userItems, 'users');
    }
  }

  // ========== SERVICE PROVIDERS BOARD ==========
  console.log('\n📋 Service Providers Board [18379446736]');
  console.log('─'.repeat(50));

  // Add User Type dropdown
  const spUserType = await addDropdownColumn(
    SERVICE_PROVIDERS_BOARD_ID,
    'User Type',
    ['Email User', 'PIN User']
  );
  results.serviceProviders.userType = spUserType;

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Add PIN column
  const spPin = await addTextColumn(SERVICE_PROVIDERS_BOARD_ID, 'PIN');
  results.serviceProviders.pin = spPin;

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Set default user type for existing service providers
  if (spUserType) {
    const spItems = await getBoardItems(SERVICE_PROVIDERS_BOARD_ID);
    if (spItems.length > 0) {
      await setDefaultUserType(SERVICE_PROVIDERS_BOARD_ID, spUserType.id, spItems, 'service providers');
    }
  }

  // ========== SUMMARY ==========
  console.log('\n');
  console.log('==========================================');
  console.log('📊 COLUMN ADDITION SUMMARY');
  console.log('==========================================\n');

  console.log('✅ Users Board:');
  console.log(`   - User Type column: ${results.users.userType ? results.users.userType.id : 'FAILED'}`);
  console.log(`   - PIN column: ${results.users.pin ? results.users.pin.id : 'FAILED'}`);

  console.log('\n✅ Service Providers Board:');
  console.log(`   - User Type column: ${results.serviceProviders.userType ? results.serviceProviders.userType.id : 'FAILED'}`);
  console.log(`   - PIN column: ${results.serviceProviders.pin ? results.serviceProviders.pin.id : 'FAILED'}`);

  console.log('\n📝 IMPORTANT NOTES:');
  console.log('   1. All existing users set to "Email User" type');
  console.log('   2. All existing service providers set to "Email User" type');
  console.log('   3. PIN column is empty (4-digit PINs can be set for PIN Users)');
  console.log('   4. Old password columns still exist (will be removed after auth testing)');

  console.log('\n✅ Authentication columns added successfully!');
  console.log('📋 Next step: Deploy magic link backend OR test PIN authentication\n');

  return results;
}

// Run
addAuthColumns()
  .then(results => {
    const allSuccess = results.users.userType && results.users.pin && 
                       results.serviceProviders.userType && results.serviceProviders.pin;
    
    if (allSuccess) {
      console.log('✅ All authentication columns added successfully.');
      process.exit(0);
    } else {
      console.error('⚠️  Some columns failed to create');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Column addition failed:', error);
    process.exit(1);
  });
