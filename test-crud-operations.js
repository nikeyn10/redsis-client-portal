const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MONDAY_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU1NTc2MDI1MywiYWFpIjoxMSwidWlkIjoxMjAxMzQ2LCJpYWQiOiIyMDI1LTA4LTI4VDE5OjEyOjIyLjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0OTQ2NjQsInJnbiI6InVzZTEifQ.cpWq8MCHJi-rYRPIB2T-UgD_SkJjQqsW0StEdWzSdjI';

const BOARDS = {
  COMPANY: '18379404757',
  USER: '18379351659',
  SERVICE_PROVIDER: '18379446736'
};

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
    console.error('❌ GraphQL Errors:', JSON.stringify(data.errors, null, 2));
    return null;
  }
  return data;
}

let testCompanyId = null;
let testUserId = null;
let testProviderId = null;

// ==================== COMPANY CRUD TESTS ====================
async function testCompanyCreate() {
  console.log('\n========== TESTING COMPANY CREATE ==========\n');
  
  const mutation = `
    mutation CreateCompany($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

  const result = await executeMutation(mutation, {
    boardId: BOARDS.COMPANY,
    itemName: 'Test Company CRUD',
    columnValues: JSON.stringify({
      text_mkxqv75c: 'John Doe',
      email_mkxqs6z4: { email: 'john@testcompany.com', text: 'john@testcompany.com' },
      phone_mkxqb808: { phone: '5551234567', countryShortName: 'US' }
    })
  });

  if (result?.data?.create_item) {
    testCompanyId = result.data.create_item.id;
    console.log('✅ Company Created:', result.data.create_item);
    return true;
  }
  return false;
}

async function testCompanyRead() {
  console.log('\n========== TESTING COMPANY READ ==========\n');
  
  const query = `
    query GetCompany($itemId: [ID!]!) {
      items(ids: $itemId) {
        id
        name
        column_values {
          id
          text
        }
      }
    }
  `;

  const result = await executeMutation(query, { itemId: [testCompanyId] });
  
  if (result?.data?.items?.[0]) {
    console.log('✅ Company Read:', result.data.items[0]);
    return true;
  }
  return false;
}

async function testCompanyUpdate() {
  console.log('\n========== TESTING COMPANY UPDATE ==========\n');
  
  const mutation = `
    mutation UpdateCompany($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId,
        item_id: $itemId,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

  const result = await executeMutation(mutation, {
    boardId: BOARDS.COMPANY,
    itemId: testCompanyId,
    columnValues: JSON.stringify({
      text_mkxqv75c: 'Jane Smith',
      email_mkxqs6z4: { email: 'jane@testcompany.com', text: 'jane@testcompany.com' },
      phone_mkxqb808: { phone: '5559998888', countryShortName: 'US' }
    })
  });

  if (result?.data?.change_multiple_column_values) {
    console.log('✅ Company Updated:', result.data.change_multiple_column_values);
    return true;
  }
  return false;
}

async function testCompanyDelete() {
  console.log('\n========== TESTING COMPANY DELETE ==========\n');
  
  const mutation = `
    mutation DeleteCompany($itemId: ID!) {
      delete_item(item_id: $itemId) {
        id
      }
    }
  `;

  const result = await executeMutation(mutation, { itemId: testCompanyId });
  
  if (result?.data?.delete_item) {
    console.log('✅ Company Deleted:', result.data.delete_item);
    return true;
  }
  return false;
}

// ==================== USER CRUD TESTS ====================
async function testUserCreate() {
  console.log('\n========== TESTING USER CREATE ==========\n');
  
  const mutation = `
    mutation CreateUser($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

  const result = await executeMutation(mutation, {
    boardId: BOARDS.USER,
    itemName: 'test@crudtest.com',
    columnValues: JSON.stringify({
      email_mkxpm2m0: { email: 'test@crudtest.com', text: 'test@crudtest.com' },
      text_mkxpxyrr: 'testpassword123'
    })
  });

  if (result?.data?.create_item) {
    testUserId = result.data.create_item.id;
    console.log('✅ User Created:', result.data.create_item);
    return true;
  }
  return false;
}

async function testUserRead() {
  console.log('\n========== TESTING USER READ ==========\n');
  
  const query = `
    query GetUser($itemId: [ID!]!) {
      items(ids: $itemId) {
        id
        name
        column_values {
          id
          text
        }
      }
    }
  `;

  const result = await executeMutation(query, { itemId: [testUserId] });
  
  if (result?.data?.items?.[0]) {
    console.log('✅ User Read:', result.data.items[0]);
    return true;
  }
  return false;
}

async function testUserUpdate() {
  console.log('\n========== TESTING USER UPDATE ==========\n');
  
  const mutation = `
    mutation UpdateUser($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId,
        item_id: $itemId,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

  const result = await executeMutation(mutation, {
    boardId: BOARDS.USER,
    itemId: testUserId,
    columnValues: JSON.stringify({
      email_mkxpm2m0: { email: 'updated@crudtest.com', text: 'updated@crudtest.com' },
      text_mkxpxyrr: 'updatedpassword456'
    })
  });

  if (result?.data?.change_multiple_column_values) {
    console.log('✅ User Updated:', result.data.change_multiple_column_values);
    return true;
  }
  return false;
}

async function testUserDelete() {
  console.log('\n========== TESTING USER DELETE ==========\n');
  
  const mutation = `
    mutation DeleteUser($itemId: ID!) {
      delete_item(item_id: $itemId) {
        id
      }
    }
  `;

  const result = await executeMutation(mutation, { itemId: testUserId });
  
  if (result?.data?.delete_item) {
    console.log('✅ User Deleted:', result.data.delete_item);
    return true;
  }
  return false;
}

// ==================== SERVICE PROVIDER CRUD TESTS ====================
async function testServiceProviderCreate() {
  console.log('\n========== TESTING SERVICE PROVIDER CREATE ==========\n');
  
  const mutation = `
    mutation CreateProvider($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

  const result = await executeMutation(mutation, {
    boardId: BOARDS.SERVICE_PROVIDER,
    itemName: 'Test Tech CRUD',
    columnValues: JSON.stringify({
      email_mkxpawg3: { email: 'tech@crudtest.com', text: 'tech@crudtest.com' },
      phone_mkxpec5j: { phone: '5557778888', countryShortName: 'US' },
      text_mkxpb7j4: 'techpassword123',
      dropdown_mkxpdbxw: { labels: ['General Support'] },
      numeric_mkxp72jc: 0
    })
  });

  if (result?.data?.create_item) {
    testProviderId = result.data.create_item.id;
    console.log('✅ Service Provider Created:', result.data.create_item);
    return true;
  }
  return false;
}

async function testServiceProviderRead() {
  console.log('\n========== TESTING SERVICE PROVIDER READ ==========\n');
  
  const query = `
    query GetProvider($itemId: [ID!]!) {
      items(ids: $itemId) {
        id
        name
        column_values {
          id
          text
        }
      }
    }
  `;

  const result = await executeMutation(query, { itemId: [testProviderId] });
  
  if (result?.data?.items?.[0]) {
    console.log('✅ Service Provider Read:', result.data.items[0]);
    return true;
  }
  return false;
}

async function testServiceProviderUpdate() {
  console.log('\n========== TESTING SERVICE PROVIDER UPDATE ==========\n');
  
  const mutation = `
    mutation UpdateProvider($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId,
        item_id: $itemId,
        column_values: $columnValues
      ) {
        id
        name
      }
    }
  `;

  const result = await executeMutation(mutation, {
    boardId: BOARDS.SERVICE_PROVIDER,
    itemId: testProviderId,
    columnValues: JSON.stringify({
      email_mkxpawg3: { email: 'updatedtech@crudtest.com', text: 'updatedtech@crudtest.com' },
      phone_mkxpec5j: { phone: '5551112222', countryShortName: 'US' },
      dropdown_mkxpdbxw: { labels: ['Network Specialist'] }
    })
  });

  if (result?.data?.change_multiple_column_values) {
    console.log('✅ Service Provider Updated:', result.data.change_multiple_column_values);
    return true;
  }
  return false;
}

async function testServiceProviderDelete() {
  console.log('\n========== TESTING SERVICE PROVIDER DELETE ==========\n');
  
  const mutation = `
    mutation DeleteProvider($itemId: ID!) {
      delete_item(item_id: $itemId) {
        id
      }
    }
  `;

  const result = await executeMutation(mutation, { itemId: testProviderId });
  
  if (result?.data?.delete_item) {
    console.log('✅ Service Provider Deleted:', result.data.delete_item);
    return true;
  }
  return false;
}

// ==================== RUN ALL TESTS ====================
async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       MANAGEMENT PORTAL CRUD OPERATION TESTS              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  const results = {
    company: { create: false, read: false, update: false, delete: false },
    user: { create: false, read: false, update: false, delete: false },
    provider: { create: false, read: false, update: false, delete: false }
  };

  // Company Tests
  results.company.create = await testCompanyCreate();
  if (results.company.create) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.company.read = await testCompanyRead();
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.company.update = await testCompanyUpdate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.company.delete = await testCompanyDelete();
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // User Tests
  results.user.create = await testUserCreate();
  if (results.user.create) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.user.read = await testUserRead();
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.user.update = await testUserUpdate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.user.delete = await testUserDelete();
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Service Provider Tests
  results.provider.create = await testServiceProviderCreate();
  if (results.provider.create) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.provider.read = await testServiceProviderRead();
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.provider.update = await testServiceProviderUpdate();
    await new Promise(resolve => setTimeout(resolve, 1000));
    results.provider.delete = await testServiceProviderDelete();
  }

  // Print Results Summary
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS SUMMARY                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  const printResult = (name, ops) => {
    console.log(`${name}:`);
    console.log(`  Create: ${ops.create ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Read:   ${ops.read ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Update: ${ops.update ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Delete: ${ops.delete ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  };

  printResult('COMPANY MANAGEMENT', results.company);
  printResult('USER MANAGEMENT', results.user);
  printResult('SERVICE PROVIDER MANAGEMENT', results.provider);

  const allPassed = 
    Object.values(results.company).every(v => v) &&
    Object.values(results.user).every(v => v) &&
    Object.values(results.provider).every(v => v);

  if (allPassed) {
    console.log('🎉 ALL CRUD TESTS PASSED! Management portal is fully functional!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('\n');
}

runAllTests().catch(console.error);
